const mongoose = require('mongoose');

const AdvanceMerchantContactSchema = new mongoose.Schema({
    id: {
        type: Number,
        default: null
    },
    name: {
        type: String,
        default: null
    },
    creditScore: {
        type: Number,
        required: true,
        default: null
    },
    creditCardLimitPercent: {
        type: Number,
        default: null
    }
}, { _id: false });

module.exports = AdvanceMerchantContactSchema;