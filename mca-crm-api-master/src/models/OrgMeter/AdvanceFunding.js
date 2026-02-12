const mongoose = require('mongoose');
const CommissionOrFeeSchema = require('./CommissionOrFee');
const MerchantApplicationFeeSchema = require('./MerchantApplicationFee');
const IsoCommissionOrFeeSchema = require('./IsoCommissionOrFee');
const BaseAdvanceStakeholderReferrerSchema = require('./BaseAdvanceStakeholderReferrer');
const AdvanceReferrerSchema = require('./AdvanceReferrer');
const AdvanceAccountSchema = require('./AdvanceAccount');

// Create a simple AccountSchema for this file to avoid circular dependency
const SimpleAccountSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    }
}, { _id: false });

const AdvanceFundingSchema = new mongoose.Schema({
    principalAmount: {
        type: mongoose.Schema.Types.Decimal128,
        default: null
    },
    factorRate: {
        type: mongoose.Schema.Types.Decimal128,
        default: null
    },
    paybackAmount: {
        type: mongoose.Schema.Types.Decimal128,
        default: null
    },
    monthlyHoldbackPercent: {
        type: mongoose.Schema.Types.Decimal128,
        default: null
    },
    collectionFrequencyText: {
        type: String,
        default: null
    },
    collectionFrequencyType: {
        type: String,
        enum: [null, 'daily', 'weekly', 'monthly'],
        default: null
    },
    collectionFrequencyDailySchedule: {
        type: String,
        enum: [null, 'banking_days', 'weekdays', 'every_day', 'custom_days'],
        default: null
    },
    collectionFrequencyDailyCustom: [Number],
    collectionFrequencyWeeklyCustom: {
        type: Number,
        min: 0,
        max: 7,
        default: null
    },
    collectionFrequencyMonthlyCustom: {
        type: Number,
        min: 1,
        max: 28,
        default: null
    },
    termDays: {
        type: Number,
        default: null
    },
    termMonths: {
        type: mongoose.Schema.Types.Decimal128,
        default: null
    },
    paymentCount: {
        type: Number,
        default: null
    },
    paymentAmount: {
        type: mongoose.Schema.Types.Decimal128,
        default: null
    },
    fundedAt: {
        type: Date,
        default: null
    },
    lenderMerchantBankFee: CommissionOrFeeSchema,
    lenderCompanyBankFee: CommissionOrFeeSchema,
    merchantApplicationFee: MerchantApplicationFeeSchema,
    lenderApplicationFee: CommissionOrFeeSchema,
    isoApplicationFee: IsoCommissionOrFeeSchema,
    lenderOriginationCommission: CommissionOrFeeSchema,
    isoOriginationCommission: IsoCommissionOrFeeSchema,
    isoOriginationCommissionReferrers: [BaseAdvanceStakeholderReferrerSchema],
    isoApplicationFeeReferrers: [BaseAdvanceStakeholderReferrerSchema],
    originalExpectedEndedAt: {
        type: Date,
        default: null
    },
    expectedEndedAt: {
        type: Date,
        default: null
    },
    actualEndedAt: {
        type: Date,
        default: null
    },
    referrers: [AdvanceReferrerSchema],
    accountMode: {
        type: String,
        enum: ['single', 'multiple']
    },
    account: SimpleAccountSchema,
    accounts: [AdvanceAccountSchema]
}, { _id: false });

module.exports = AdvanceFundingSchema; 