const mongoose = require('mongoose');

const CreditCardLimitPercentRangeSchema = new mongoose.Schema({
    min: {
        type: Number
    },
    avg: {
        type: Number
    },
    max: {
        type: Number
    }
}, { _id: false });

module.exports = CreditCardLimitPercentRangeSchema; 