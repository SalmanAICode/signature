const mongoose = require('mongoose');

const IsoCommissionOrFeeSchema = new mongoose.Schema({
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
    mode: {
        type: String,
        required: true,
        enum: ['single', 'multiple'],
        default: null
    }
}, { _id: false });

module.exports = IsoCommissionOrFeeSchema; 