const mongoose = require('mongoose');

const FundingExpenseSchema = new mongoose.Schema({
    funding: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funding',
        required: true,
        index: true
    },
    funder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funder',
        index: true
    },
    lender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lender',
        index: true
    },
    merchant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Merchant',
        index: true
    },
    iso: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ISO',
        index: true
    },
    name: {
        type: String,
    },
    expense_type: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Expense-Type',
        index: true
    },
    amount: {
        type: Number,
        required: true
    },
    commission: {
        type: Boolean,
        required: true,
        default: false
    },
    syndication: {
        type: Boolean,
        required: true,
        default: false
    },
    expense_date: {
        type: Date,
        required: true,
        default: Date.now
    },
    created_by_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updated_by_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    note: {
        type: String
    },
    inactive: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

const FundingExpense = mongoose.model('Funding-Expense', FundingExpenseSchema);

module.exports = FundingExpense; 