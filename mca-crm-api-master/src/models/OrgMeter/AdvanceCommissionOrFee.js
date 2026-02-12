const mongoose = require('mongoose');

const AdvanceCommissionOrFeeSchema = new mongoose.Schema({
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
        required: false,
        default: null
    },
    chargeMode: {
        type: String,
        required: true,
        enum: ['frontend', 'backend'],
        default: null
    }
}, { _id: false });

module.exports = AdvanceCommissionOrFeeSchema; 