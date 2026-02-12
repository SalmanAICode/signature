const mongoose = require('mongoose');

const CommissionOrFeeSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: [null, 'none', 'funded', 'payback', 'amount'],
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
    }
}, { _id: false });

module.exports = CommissionOrFeeSchema; 