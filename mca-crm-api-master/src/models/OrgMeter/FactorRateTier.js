const mongoose = require('mongoose');

const FactorRateTierSchema = new mongoose.Schema({
    min: {
        type: String,
        default: null
    },
    max: {
        type: String,
        default: null
    },
    amount: {
        type: String,
        default: null
    },
    percent: {
        type: String,
        default: null
    }
}, { _id: false });

module.exports = FactorRateTierSchema; 