const mongoose = require('mongoose');

const { FORMULA_CALCULATE_TYPES, FORMULA_BASE_ITEMS, FORMULA_TIER_TYPES } = require('../utils/constants');

const TierSchema = new mongoose.Schema({
    min_number: Number,
    max_number: Number,
    amount: Number,
    percent: Number
}, { _id: false });

const FormulaSchema = new mongoose.Schema({
    funder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funder',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    calculate_type: {
        type: String,
        required: true,
        enum: Object.values(FORMULA_CALCULATE_TYPES)
    },
    base_item: {
        type: String,
        enum: [...Object.values(FORMULA_BASE_ITEMS), null],
        default: null
    },
    tier_type: {
        type: String,
        enum: [...Object.values(FORMULA_TIER_TYPES), null],
        default: null
    },
    tier_list: [TierSchema],
    shared: {
        type: Boolean,
        default: false
    },
    inactive: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Formula = mongoose.model('Formula', FormulaSchema);

module.exports = Formula; 