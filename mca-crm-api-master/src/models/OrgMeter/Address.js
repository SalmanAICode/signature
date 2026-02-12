const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['mailing', 'physical']
    },
    address1: {
        type: String,
        default: null
    },
    address2: {
        type: String,
        default: null
    },
    city: {
        type: String,
        default: null
    },
    state: {
        type: String,
        default: null
    },
    zip: {
        type: String,
        default: null
    },
    primary: {
        type: Boolean
    },
    verified: {
        type: Boolean
    }
}, { _id: false });

module.exports = AddressSchema; 