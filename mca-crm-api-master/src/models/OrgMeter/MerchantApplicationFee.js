const mongoose = require('mongoose');

const MerchantApplicationFeeSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['none', 'funded', 'payback', 'amount'],
        default: null
    },
    amount: {
        type: mongoose.Schema.Types.Decimal128,
        required: false,
        default: null
    },
    percent: {
        type: String,
        default: null
    },
    stakeholderType: {
        type: String,
        required: true,
        enum: ['lender', 'company'],
        default: null
    }
}, { _id: false });

module.exports = MerchantApplicationFeeSchema; 