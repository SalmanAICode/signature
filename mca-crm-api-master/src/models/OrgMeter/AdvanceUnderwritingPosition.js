const mongoose = require('mongoose');

const AdvanceUnderwritingPositionSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    lender: {
        type: String
    },
    fundedAt: {
        type: Date
    },
    paybackAmount: {
        type: mongoose.Schema.Types.Decimal128
    },
    fundedAmount: {
        type: mongoose.Schema.Types.Decimal128
    },
    frequency: {
        type: String,
        enum: [null, '', 'daily', 'weekly', 'monthly', 'quarterly']
    },
    buyout: {
        type: Boolean
    },
    currentBalance: {
        type: mongoose.Schema.Types.Decimal128
    },
    dailyPaymentAmount: {
        type: mongoose.Schema.Types.Decimal128
    },
    endedAt: {
        type: Date
    },
    monthlyHoldbackPercent: {
        type: mongoose.Schema.Types.Decimal128
    }
}, { _id: false });

module.exports = AdvanceUnderwritingPositionSchema; 