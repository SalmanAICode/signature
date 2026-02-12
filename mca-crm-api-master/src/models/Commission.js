const mongoose = require('mongoose');
const AccountSchema = require('./Common/Account');
const CommissionIntentService = require('../services/commissionIntentService');
const TransactionService = require('../services/transactionService');
const Helpers = require('../utils/helpers');

const { COMMISSION_STATUS, PAYMENT_METHOD, INTENT_STATUS, TRANSACTION_TYPES, TRANSACTION_SENDER_TYPES, TRANSACTION_RECEIVER_TYPES } = require('../utils/constants');

const CommissionSchema = new mongoose.Schema({
    commission_intent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Commission-Intent',
        index: true
    },
    funder_account: AccountSchema, 
    iso_account: AccountSchema,
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
        enum: Object.values(COMMISSION_STATUS),
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
async function handleStatusSucceed(commission, setTransactionCallback) {
    // Update commission intent status to SUCCEED
    const commissionIntent = await CommissionIntentService.updateCommissionIntent(commission.commission_intent, { status: INTENT_STATUS.SUCCEED });
    
    // Create transaction if it doesn't exist
    if (!commission.transaction && commissionIntent) {
        try {
            const transaction = await TransactionService.createTransaction({
                funder: Helpers.extractIdString(commissionIntent.funder),
                sender: Helpers.extractIdString(commissionIntent.funder),
                receiver: Helpers.extractIdString(commissionIntent.iso),
                sender_type: TRANSACTION_SENDER_TYPES.FUNDER,
                receiver_type: TRANSACTION_RECEIVER_TYPES.ISO,
                sender_account: commission.funder_account,
                receiver_account: commission.iso_account,
                amount: Helpers.centsToDollars(commission.amount),
                transaction_date: commission.processed_date || Date.now(),
                funding: Helpers.extractIdString(commissionIntent.funding),
                type: TRANSACTION_TYPES.COMMISSION,
                source: commission._id,
                reconciled: commission.reconciled
            });
            
            // Set transaction reference using the callback
            if (setTransactionCallback) {
                setTransactionCallback(Helpers.extractIdString(transaction._id));
            }
        } catch (error) {
            console.error('Error creating transaction in commission middleware:', error);
        }
    }
}

// Helper function to handle status change to FAILED
async function handleStatusFailed(commission) {
    // Update commission intent status to FAILED
    await CommissionIntentService.updateCommissionIntent(commission.commission_intent, { status: INTENT_STATUS.FAILED });
}

// Middleware to handle status changes for findOneAndUpdate operations
CommissionSchema.pre('findOneAndUpdate', async function() {
    const update = this.getUpdate();
    
    // Check if status is being updated
    if (update.status && (update.status === COMMISSION_STATUS.SUCCEED || update.status === COMMISSION_STATUS.FAILED)) {
        const commission = await this.model.findOne(this.getQuery());
        
        if (commission) {
            if (update.status === COMMISSION_STATUS.SUCCEED) {
                await handleStatusSucceed(commission, (transactionId) => {
                    update.transaction = transactionId;
                });
            } else if (update.status === COMMISSION_STATUS.FAILED) {
                await handleStatusFailed(commission);
            }
        }
    }
});

// Middleware for direct save operations
CommissionSchema.pre('save', async function() {
    // Only run on status changes
    if (this.isModified('status') && (this.status === COMMISSION_STATUS.SUCCEED || this.status === COMMISSION_STATUS.FAILED)) {
        const self = this;
        
        if (this.status === COMMISSION_STATUS.SUCCEED) {
            await handleStatusSucceed(this, (transactionId) => {
                self.transaction = transactionId;
            });
        } else if (this.status === COMMISSION_STATUS.FAILED) {
            await handleStatusFailed(this);
        }
    }
});

const Commission = mongoose.model('Commission', CommissionSchema);

module.exports = Commission;