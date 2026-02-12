const mongoose = require('mongoose');

const ISOMerchantSchema = new mongoose.Schema({
    iso: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ISO',
        required: true,
        index: true
    },
    merchant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Merchant',
        required: true,
        index: true
    },
    inactive: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const ISOMerchant = mongoose.model('ISO-Merchant', ISOMerchantSchema);

module.exports = ISOMerchant; 