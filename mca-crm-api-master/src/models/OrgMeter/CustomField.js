const mongoose = require('mongoose');

const CustomFieldSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    value: {
        type: String,
        required: true,
        default: null
    }
}, { _id: false });

module.exports = CustomFieldSchema; 