const mongoose = require('mongoose');

const AdvanceReferrerSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['lender', 'iso']
    },
    amount: {
        type: mongoose.Schema.Types.Decimal128,
        required: true
    },
    description: {
        type: String,
        default: null
    }
}, { _id: false });

module.exports = AdvanceReferrerSchema; 