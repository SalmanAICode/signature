const mongoose = require('mongoose');

// Import nested schemas
const FactorRateTierSchema = require('./FactorRateTier');
const FundedTierSchema = require('./FundedTier');

const SyndicatorInternalLenderFeeSchema = new mongoose.Schema({
    percent: {
        type: String,
        default: null
    },
    amount: {
        type: String,
        default: null
    },
    tierBase: {
        type: String,
        default: null,
        enum: ['Funded', 'Payback', 'Amount', null]
    },
    chargeMode: {
        type: String,
        default: null,
        enum: ['frontend', 'backend', null]
    },
    description: {
        type: String,
        default: null
    },
    factorRateTiers: [FactorRateTierSchema],
    fundedTiers: [FundedTierSchema],
    type: {
        type: String,
        default: null,
        enum: ['Funded', 'Tiered by Funded', 'Payback', 'Tiered by Factor Rate', 'Amount', null]
    }
}, { _id: false });

module.exports = SyndicatorInternalLenderFeeSchema; 