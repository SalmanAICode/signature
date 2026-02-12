const mongoose = require('mongoose');
const AccountSchema = require('./Common/Account');
const DisbursementIntentService = require('../services/disbursementIntentService');
const TransactionService = require('../services/transactionService');
const Helpers = require('../utils/helpers');

const { DISBURSEMENT_STATUS, PAYMENT_METHOD, INTENT_STATUS, TRANSACTION_TYPES, TRANSACTION_SENDER_TYPES, TRANSACTION_RECEIVER_TYPES } = require('../utils/constants');

const DisbursementSchema = new mongoose.Schema({
    disbursement_intent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Disbursement-Intent',
        index: true
    },
    funder_account: AccountSchema,
    merchant_account: AccountSchema,
    payment_method: {
        type: String,
        enum: [...Object.values(PAYMENT_METHOD), null],
        default: null
    },
    ach_processor: {
        type: String,
        enum: ['ACHWorks', 'Actum', 'Manual', 'Other', null],
        default: null
    },
    submitted_date: {
        type: Date,
        default: Date.now
    },
    processed_date:{
        type: Date
    },
    responsed_date:{
        type: Date 
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: Object.values(DISBURSEMENT_STATUS),
    },
    created_by_user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updated_by_user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    },
    reconciled: {
        type: Boolean
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Helper function to handle status change to SUCCEED
async function handleStatusSucceed(disbursement, setTransactionCallback) {
    // Update disbursement intent status to SUCCEED
    const disbursementIntent = await DisbursementIntentService.updateDisbursementIntent(disbursement.disbursement_intent, { status: INTENT_STATUS.SUCCEED });
    
    // Create transaction if it doesn't exist
    if (!disbursement.transaction && disbursementIntent) {
        try {
            const transaction = await TransactionService.createTransaction({
                funder: Helpers.extractIdString(disbursementIntent.funder),
                sender: Helpers.extractIdString(disbursementIntent.funder),
                receiver: Helpers.extractIdString(disbursementIntent.merchant),
                sender_type: TRANSACTION_SENDER_TYPES.FUNDER,
                receiver_type: TRANSACTION_RECEIVER_TYPES.MERCHANT,
                sender_account: disbursement.funder_account,
                receiver_account: disbursement.merchant_account,
                amount: Helpers.centsToDollars(disbursement.amount),
                transaction_date: disbursement.processed_date || Date.now(),
                funding: Helpers.extractIdString(disbursementIntent.funding),
                type: TRANSACTION_TYPES.DISBURSEMENT,
                source: disbursement._id,
                reconciled: disbursement.reconciled
            });
            
            // Set transaction reference using the callback
            if (setTransactionCallback) {
                setTransactionCallback(Helpers.extractIdString(transaction._id));
            }
        } catch (error) {
            console.error('Error creating transaction in disbursement middleware:', error);
        }
    }
}

// Helper function to handle status change to FAILED
async function handleStatusFailed(disbursement) {
    // Update disbursement intent status to FAILED
    await DisbursementIntentService.updateDisbursementIntent(disbursement.disbursement_intent, { status: INTENT_STATUS.FAILED });
}

// Middleware to handle status changes for findOneAndUpdate operations
DisbursementSchema.pre('findOneAndUpdate', async function() {
    const update = this.getUpdate();
    
    // Check if status is being updated
    if (update.status && (update.status === DISBURSEMENT_STATUS.SUCCEED || update.status === DISBURSEMENT_STATUS.FAILED)) {
        const disbursement = await this.model.findOne(this.getQuery());
        
        if (disbursement) {
            if (update.status === DISBURSEMENT_STATUS.SUCCEED) {
                await handleStatusSucceed(disbursement, (transactionId) => {
                    update.transaction = transactionId;
                });
            } else if (update.status === DISBURSEMENT_STATUS.FAILED) {
                await handleStatusFailed(disbursement);
            }
        }
    }
});

// Middleware for direct save operations
DisbursementSchema.pre('save', async function() {
    // Only run on status changes
    if (this.isModified('status') && (this.status === DISBURSEMENT_STATUS.SUCCEED || this.status === DISBURSEMENT_STATUS.FAILED)) {
        const self = this;
        
        if (this.status === DISBURSEMENT_STATUS.SUCCEED) {
            await handleStatusSucceed(this, (transactionId) => {
                self.transaction = transactionId;
            });
        } else if (this.status === DISBURSEMENT_STATUS.FAILED) {
            await handleStatusFailed(this);
        }
    }
});

// Helper function to handle disbursement deletion
async function handleDisbursementDeletion(disbursement) {
    try {
        // Hard delete related transaction if it exists
        if (disbursement.transaction) {
            await TransactionService.hardDeleteTransaction(disbursement.transaction);
            console.log(`Deleted transaction ${disbursement.transaction} for disbursement ${disbursement._id}`);
        }
    } catch (error) {
        console.error(`Error deleting transaction for disbursement ${disbursement._id}:`, error.message);
        // Don't throw error to avoid blocking the disbursement deletion
    }
}

// Middleware for deleteOne operations
DisbursementSchema.pre('deleteOne', { document: true, query: false }, async function() {
    await handleDisbursementDeletion(this);
});

// Middleware for findOneAndDelete operations
DisbursementSchema.pre('findOneAndDelete', async function() {
    const disbursement = await this.model.findOne(this.getQuery());
    if (disbursement) {
        await handleDisbursementDeletion(disbursement);
    }
});

// Middleware for deleteMany operations
DisbursementSchema.pre('deleteMany', async function() {
    // Find all disbursements that will be deleted
    const disbursements = await this.model.find(this.getQuery(), 'transaction');
    
    // Delete related transactions for each disbursement
    for (const disbursement of disbursements) {
        await handleDisbursementDeletion(disbursement);
    }
});

// Middleware for findOneAndRemove operations (deprecated but still used)
DisbursementSchema.pre('findOneAndRemove', async function() {
    const disbursement = await this.model.findOne(this.getQuery());
    if (disbursement) {
        await handleDisbursementDeletion(disbursement);
    }
});

// Middleware for remove operations (deprecated but still used)
DisbursementSchema.pre('remove', { document: true, query: false }, async function() {
    await handleDisbursementDeletion(this);
});

const Disbursement = mongoose.model('Disbursement', DisbursementSchema);

module.exports = Disbursement;