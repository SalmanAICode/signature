const mongoose = require('mongoose');

const AdvanceStatsSchema = new mongoose.Schema({
    paidBackAmount: {
        type: mongoose.Schema.Types.Decimal128
    },
    paidBackPercent: {
        type: mongoose.Schema.Types.Decimal128
    },
    paidBackAllocatedToFeeAmount: {
        type: mongoose.Schema.Types.Decimal128
    },
    paidBackBalance: {
        amount: Number,
        percent: Number
    },
    totalBouncedPaymentAmount: {
        type: mongoose.Schema.Types.Decimal128
    },
    totalBouncedPaymentCount: {
        type: Number
    },
    outstandingAmount: {
        type: mongoose.Schema.Types.Decimal128
    },
    outstandingFeeAmount: {
        type: mongoose.Schema.Types.Decimal128
    },
    totalOutstandingAmount: {
        type: mongoose.Schema.Types.Decimal128
    },
    discountAmount: {
        type: mongoose.Schema.Types.Decimal128
    },
    performance: {
        type: Number
    },
    achActivated: {
        type: Boolean
    },
    pendingPaybackAmount: {
        type: mongoose.Schema.Types.Decimal128
    }
}, { _id: false });

module.exports = AdvanceStatsSchema; 