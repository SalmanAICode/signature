const mongoose = require('mongoose');

const MerchantAccountSchema = new mongoose.Schema({
    merchant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Merchant',
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
        trim: true
    },
    branch: {
        type: String,
        trim: true
    },
    dda: {
        type: String,
        trim: true
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

const MerchantAccount = mongoose.model('Merchant-Account', MerchantAccountSchema);

module.exports = MerchantAccount; 