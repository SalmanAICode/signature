const mongoose = require('mongoose');

const PhoneSchema = new mongoose.Schema({
    id: {
        type: Number
    },
    number: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['Work', 'Mobile']
    },
    primary: {
        type: Boolean
    },
    verified: {
        type: Boolean
    },
    doNotDisturb: {
        type: Boolean
    }
}, { _id: false });

module.exports = PhoneSchema; 