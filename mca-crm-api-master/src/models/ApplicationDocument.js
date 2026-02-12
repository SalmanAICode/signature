const mongoose = require('mongoose');

const { APPLICATION_DOCUMENT_TYPES } = require('../utils/constants');

const ApplicationDocumentSchema = new mongoose.Schema({
    application: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application',
        required: true,
        index: true
    },
    application_stipulation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application-Stipulation',
        index: true
    },
    document: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Document',
            required: true,
            index: true
        },
        file_name: { type: String, index: true },
        file_type: { type: String, index: true },
        file_size: { type: Number, index: true },
        last_modified: { type: Date, index: true }
    },
    type: {
        type: String,
        enum: Object.values(APPLICATION_DOCUMENT_TYPES),
        default: APPLICATION_DOCUMENT_TYPES.UPLOADED,
        index: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const ApplicationDocument = mongoose.model('Application-Document', ApplicationDocumentSchema);

module.exports = ApplicationDocument; 