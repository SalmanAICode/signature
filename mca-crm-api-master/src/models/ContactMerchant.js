const mongoose = require('mongoose');

const ContactMerchantSchema = new mongoose.Schema({
    merchant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Merchant',
        required: true,
        index: true
    },
    contact: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact',
        required: true,
        index: true
    },
    owner: {
        type: Boolean,
        default: false
    },
    ownership_percentage: {
        type: Number,
        min: 0,
        max: 100
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

const ContactMerchant = mongoose.model('Contact-Merchant', ContactMerchantSchema);

module.exports = ContactMerchant; 