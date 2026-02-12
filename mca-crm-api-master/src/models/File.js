// @todo information about where system stores a file and how frontend get file
const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        index: true
    },
    mimetype: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    storage_path: {
        type: String,
        required: true
    },
    created_date: {
        type: Date,
        default: Date.now,
        required: true,
        index: true
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const File = mongoose.model('File', FileSchema);

module.exports = File;
