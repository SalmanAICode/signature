const mongoose = require('mongoose');

const FundingFeeSchema = new mongoose.Schema({
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
    fee_type: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Fee-Type',
    },
    amount: {
        type: Number,
        required: true
    },
    upfront: {
        type: Boolean,
        required: true,
        default: false
    },
    syndication: {
        type: Boolean,
        default: true
    },
    fee_date: {
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

const FundingFee = mongoose.model('Funding-Fee', FundingFeeSchema);

module.exports = FundingFee; 