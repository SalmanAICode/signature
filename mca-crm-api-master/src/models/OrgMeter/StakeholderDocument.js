const mongoose = require('mongoose');

const StakeholderDocumentSchema = new mongoose.Schema({
    id: {
        type: Number,
        default: null
    },
    type: {
        type: String,
        default: null
    },
    name: {
        type: String,
        default: null
    },
    title: {
        type: String,
        default: null
    },
    downloadLink: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: null
    },
    createdBy: {
        type: Number,
        default: null
    }
}, { _id: false });

module.exports = StakeholderDocumentSchema; 