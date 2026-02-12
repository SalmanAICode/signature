const mongoose = require('mongoose');

const ExpenseItemSchema = new mongoose.Schema({
    name: {
        type: String
    },
    expense_type: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Expense-Type'
    },
    amount: Number,
    commission: {
        type: Boolean,
        default: false
    },
    syndication: {
        type: Boolean,
        default: false
    }
}, { _id: false });

module.exports = ExpenseItemSchema;