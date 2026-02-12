const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
    name: String,
    bank_name: String,
    routing_number: String,
    account_number: String,
    account_type: String,
    branch: String,
    dda: String,
    available_balance: Number
}, { _id: false });

module.exports = AccountSchema;