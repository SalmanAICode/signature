const mongoose = require('mongoose');

const { ACCOUNT_TYPES } = require('../utils/constants');

const LenderAccountSchema = new mongoose.Schema({
    lender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lender',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    bank_name: {
        type: String,
        trim: true
    },
    routing_number: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    account_number: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    account_type: {
        type: String,
        enum: Object.values(ACCOUNT_TYPES),
        index: true
    },
    branch: {
        type: String,
        trim: true,
        index: true
    },
    dda: {
        type: String,
        trim: true,
        index: true
    },
    available_balance: {
        type: Number,
        default: 0
    },
    inactive: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for transaction_list (combined from various transactions)
LenderAccountSchema.virtual('transaction_list').get(async function() {
    // This would need to combine disbursements, paybacks, syndicator transactions, etc.
    // Implementation would depend on more detailed requirements and related models
    return [];
});

const LenderAccount = mongoose.model('Lender-Account', LenderAccountSchema);

module.exports = LenderAccount; 