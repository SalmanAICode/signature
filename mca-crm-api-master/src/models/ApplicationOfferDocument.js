const mongoose = require('mongoose');

const { APPLICATION_DOCUMENT_TYPES } = require('../utils/constants');

const ApplicationDocumentSchema = new mongoose.Schema({
    application: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application-Offer',
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
    },
    // Stipulation type name when not linked to application_stipulation (e.g. "Bank Draft", "Driving License")
    document_type: {
        type: String,
        index: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strictPopulate: false
});

const ApplicationOfferDocument = mongoose.model('Application-Offer-Document', ApplicationDocumentSchema);

module.exports = ApplicationOfferDocument; 