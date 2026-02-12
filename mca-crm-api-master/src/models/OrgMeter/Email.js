const mongoose = require('mongoose');

const EmailSchema = new mongoose.Schema({
    id: {
        type: Number
    },
    email: {
        type: String,
        required: true
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

module.exports = EmailSchema; 