const mongoose = require('mongoose');

const AdvanceFeeSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['none', 'funded', 'payback', 'amount'],
        default: null
    },
    amount: {
        type: mongoose.Schema.Types.Decimal128,
        required: true,
        default: null
    },
    percent: {
        type: String,
        required: true,
        default: null
    },
    chargeMode: {
        type: String,
        required: true,
        enum: ['frontend', 'backend'],
        default: null
    },
    id: {
        type: Number,
        required: true,
        default: null
    },
    description: {
        type: String,
        default: null
    }
}, { _id: false });

module.exports = AdvanceFeeSchema; 