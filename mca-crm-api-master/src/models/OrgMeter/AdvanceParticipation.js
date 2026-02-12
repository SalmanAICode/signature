const mongoose = require('mongoose');
const AdvanceCommissionOrFeeSchema = require('./AdvanceCommissionOrFee');
const AdvanceFeeSchema = require('./AdvanceFee');
const PortfolioTeaserSchema = require('./PortfolioTeaser');
const CafsSchema = require('./Cafs');
const AdvanceSyndicatorSchema = require('./AdvanceSyndicator');

const AdvanceParticipationSchema = new mongoose.Schema({
    participation: {
        amount: Number,
        percent: Number,
        paybackAmount: Number,
        paidBackAmount: Number
    },
    paymentAmount: {
        type: mongoose.Schema.Types.Decimal128,
        default: null
    },
    discountAmount: {
        type: mongoose.Schema.Types.Decimal128,
        default: null
    },
    commission: AdvanceCommissionOrFeeSchema,
    fees: [AdvanceFeeSchema],
    portfolio: PortfolioTeaserSchema,
    cafs: CafsSchema,
    tcpAmount: {
        type: mongoose.Schema.Types.Decimal128,
        default: null
    },
    upfrontTcpAmount: {
        type: mongoose.Schema.Types.Decimal128,
        default: null
    },
    syndicators: [AdvanceSyndicatorSchema]
}, { _id: false });

module.exports = AdvanceParticipationSchema; 