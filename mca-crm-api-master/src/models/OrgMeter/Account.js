const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    }
}, { _id: false });

module.exports = AccountSchema; 