const mongoose = require('mongoose');


const TransactionBreakdownSchema = new mongoose.Schema({
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        required: true
    },
    funder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funder',
        required: true
    },
    funding: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funding'
    },
    amount: {
        type: Number,
        required: true,
        default: 0
    },
    description: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Transaction-Breakdown', TransactionBreakdownSchema);