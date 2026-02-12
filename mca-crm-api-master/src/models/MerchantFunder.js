const mongoose = require('mongoose');

const MerchantFunderSchema = new mongoose.Schema({
    merchant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Merchant',
        required: true,
        index: true
    },
    funder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funder',
        required: true,
        index: true
    },
    assigned_manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    assigned_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
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

const MerchantFunder = mongoose.model('Merchant-Funder', MerchantFunderSchema);

module.exports = MerchantFunder; 