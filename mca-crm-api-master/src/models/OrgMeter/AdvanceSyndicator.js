const mongoose = require('mongoose');
const AdvanceCommissionOrFeeSchema = require('./AdvanceCommissionOrFee');
const AdvanceFeeSchema = require('./AdvanceFee');
const CafsSchema = require('./Cafs');

const AdvanceSyndicatorSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    pendingSyndicator: {
        type: Boolean
    },
    syndicationAmount: {
        type: mongoose.Schema.Types.Decimal128,
        required: true
    },
    principalSyndicationPercent: {
        type: mongoose.Schema.Types.Decimal128
    },
    createdAt: {
        type: Date
    },
    paymentAmount: {
        type: mongoose.Schema.Types.Decimal128,
        default: null
    },
    paybackAmount: {
        type: mongoose.Schema.Types.Decimal128
    },
    paidBackAmount: {
        type: mongoose.Schema.Types.Decimal128
    },
    commission: {
        type: AdvanceCommissionOrFeeSchema
    },
    fees: [AdvanceFeeSchema],
    discountAmount: {
        type: mongoose.Schema.Types.Decimal128,
        default: null
    },
    name: {
        type: String,
        required: true
    },
    syndicationPercent: {
        type: mongoose.Schema.Types.Decimal128,
        required: true
    },
    participationSyndicationPercent: {
        type: mongoose.Schema.Types.Decimal128
    },
    midstream: {
        type: Boolean
    },
    cafs: CafsSchema,
    tcpAmount: {
        type: mongoose.Schema.Types.Decimal128,
        default: null
    },
    upfrontTcpAmount: {
        type: mongoose.Schema.Types.Decimal128,
        default: null
    }
}, { _id: false });

module.exports = AdvanceSyndicatorSchema; 