const mongoose = require('mongoose');

const { ACCOUNT_TYPES } = require('../utils/constants');

const ISOAccountSchema = new mongoose.Schema({
    iso: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ISO',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    bank_name: {
        type: String,
        trim: true,
        index: true
    },
    routing_number: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    account_number: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    account_type: {
        type: String,
        enum: Object.values(ACCOUNT_TYPES),
        index: true
    },
    branch: {
        type: String,
        trim: true,
        index: true
    },
    dda: {
        type: String,
        trim: true,
        index: true
    },
    inactive: {
        type: Boolean,
        default: false,
        index: true
    }
}, { timestamps: true });

const ISOAccount = mongoose.model('ISO-Account', ISOAccountSchema);

module.exports = ISOAccount; 