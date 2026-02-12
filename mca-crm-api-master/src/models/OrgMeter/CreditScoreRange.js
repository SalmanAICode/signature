const mongoose = require('mongoose');

const CreditScoreRangeSchema = new mongoose.Schema({
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

module.exports = CreditScoreRangeSchema; 