const mongoose = require('mongoose');
const AccountSchema = require('./Account');

const AdvanceAccountSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['origination', 'remittance', 'participation', 'syndication', 'portfolio']
    },
    account: {
        type: AccountSchema,
        required: true
    }
}, { _id: false });

module.exports = AdvanceAccountSchema; 