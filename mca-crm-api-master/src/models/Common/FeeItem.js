const mongoose = require('mongoose');

const FeeItemSchema = new mongoose.Schema({
    name: {
        type: String
    },
    fee_type: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Fee-Type'
    },
    amount: Number,
    upfront: {
        type: Boolean,
        default: false
    },
    syndication: {
        type: Boolean,
        default: true
    }
}, { _id: false });

module.exports = FeeItemSchema;