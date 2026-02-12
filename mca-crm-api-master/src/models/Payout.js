const mongoose = require('mongoose');
const { TRANSACTION_TYPES, TRANSACTION_SENDER_TYPES, TRANSACTION_RECEIVER_TYPES } = require('../utils/constants');

const PayoutSchema = new mongoose.Schema({
    payback: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payback',
        required: true,
        index: true
    },
    syndication: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Syndication',
        required: true,
        index: true
    },
    funding: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funding',
        required: true,
        index: true
    },
    funder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funder',
        required: true,
        index: true
    },
    lender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lender',
        required: true,
        index: true
    },
    syndicator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Syndicator',
        required: true,
        index: true
    },
    payout_amount: {
        type: Number,
        required: true,
        default: 0
    },
    fee_amount: {
        type: Number,
        required: true,
        default: 0
    },
    credit_amount: {
        type: Number,
        required: true,
        default: 0
    },
    created_date: {
        type: Date,
        required: true,
        default: Date.now
    },
    created_by_user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    redeemed_date: {
        type: Date
    },
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    },
    pending: {
        type: Boolean,
        default: true
    },
    inactive: {
        type: Boolean,
        default: false
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Calculate total amount
const calculateStatistics = async function(docs) {
    docs.forEach(doc => {
        doc.available_amount = (doc.payout_amount || 0) - (doc.fee_amount || 0) + (doc.credit_amount || 0);
    });

    return docs;
};

// Middleware to automatically add statistics to query results
PayoutSchema.post('find', async function(docs) {
    await calculateStatistics(docs);
});

PayoutSchema.post('findOne', async function(doc) {
    await calculateStatistics([doc]);
});

// Helper function to handle payout creation and transaction generation
async function handlePayoutCreation(payout, setTransactionCallback) {
    // Create transaction if it doesn't exist
    if (!payout.transaction) {
        try {
            // Use dynamic imports to avoid circular dependency
            const TransactionService = require('../services/transactionService');
            const Helpers = require('../utils/helpers');
            
            // Calculate available_amount manually since it's not available in post-save
            const available_amount = (payout.payout_amount || 0) - (payout.fee_amount || 0) + (payout.credit_amount || 0);
            
            const transaction = await TransactionService.createTransaction({
                funder: Helpers.extractIdString(payout.funder),
                sender: Helpers.extractIdString(payout.funder),
                receiver: Helpers.extractIdString(payout.syndicator),
                sender_type: TRANSACTION_SENDER_TYPES.FUNDER,
                receiver_type: TRANSACTION_RECEIVER_TYPES.SYNDICATOR,
                sender_account: null, // VIRTUAL transaction as noted in constants
                receiver_account: null, // VIRTUAL transaction as noted in constants
                amount: Helpers.centsToDollars(available_amount),
                transaction_date: payout.created_date || Date.now(),
                funding: Helpers.extractIdString(payout.funding),
                type: TRANSACTION_TYPES.PAYOUT,
                source: payout._id,
                reconciled: false // Virtual transaction don't need to be reconciled
            });
            
            // Set transaction reference using the callback
            if (setTransactionCallback) {
                setTransactionCallback(Helpers.extractIdString(transaction._id));
            }
        } catch (error) {
            console.error('Error creating transaction in payout middleware:', error);
        }
    }
}

// Middleware for payout creation via save operations
PayoutSchema.post('save', async function() {
    // Create transaction for any payout that doesn't have one yet
    if (!this.transaction) {
        const self = this;
        console.log('Creating payout transaction for:', this._id);
        
        await handlePayoutCreation(this, async (transactionId) => {
            // Update the document with the transaction reference
            await self.constructor.updateOne(
                { _id: self._id },
                { $set: { transaction: transactionId } }
            );
        });
    } else {
        console.log('Payout already has transaction:', this._id, 'Transaction ID:', this.transaction);
    }
});

// Middleware for payout creation via create/insertMany operations
PayoutSchema.post('insertMany', async function(docs) {
    // Handle multiple payouts created at once
    for (const payout of docs) {
        if (!payout.transaction) {
            await handlePayoutCreation(payout, async (transactionId) => {
                // Update the document with the transaction reference
                await this.model.updateOne(
                    { _id: payout._id },
                    { $set: { transaction: transactionId } }
                );
            });
        }
    }
});

const Payout = mongoose.model('Payout', PayoutSchema);

module.exports = Payout;