const mongoose = require('mongoose');

const FederalIdSchema = new mongoose.Schema({
    id: {
        type: Number
    },
    number: {
        type: String,
        required: true
    },
    primary: {
        type: Boolean,
        required: true
    },
    verified: {
        type: Boolean,
        required: true
    }
}, { _id: false });

module.exports = FederalIdSchema; 