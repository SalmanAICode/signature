const mongoose = require('mongoose');

const RenewedAdvanceSchema = new mongoose.Schema({
    id: {
        type: Number,
        default: null
    },
    renewedAmount: {
        type: String,
        default: null
    }
}, { _id: false });

module.exports = RenewedAdvanceSchema;