const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date
    },
    createdBy: {
        type: Number,
        default: null
    }
}, { _id: false });

module.exports = NoteSchema; 