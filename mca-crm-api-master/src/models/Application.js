const mongoose = require('mongoose');
const { APPLICATION_TYPES, APPLICATION_DOCUMENT_TYPES, APPLICATION_STIPULATION_STATUS } = require('../utils/constants');

const ApplicationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        index: true
    },
    identifier: {
        type: String,
        trim: true,
        index: true
    },
    merchant: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Merchant',
            required: true,
            index: true
        },
        name: { type: String, index: true },
        email: { type: String, index: true },
        phone: { type: String, index: true }
    },
    contact: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Contact',
            index: true
        },
        first_name: { type: String, index: true },
        last_name: { type: String, index: true },
        email: { type: String, index: true },
        phone_mobile: { type: String, index: true }
    },
    funder: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Funder',
            required: true,
            index: true
        },
        name: { type: String, index: true },
        email: { type: String, index: true },
        phone: { type: String, index: true }
    },
    iso: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ISO',
            index: true
        },
        name: { type: String, index: true },
        email: { type: String, index: true },
        phone: { type: String, index: true }
    },
    representative: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Representative',
            index: true
        },
        first_name: { type: String, index: true },
        last_name: { type: String, index: true },
        email: { type: String, index: true },
        phone_mobile: { type: String, index: true }
    },
    priority: {
        type: Boolean,
        required: true,
        default: false,
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: Object.values(APPLICATION_TYPES),
        index: true
    },
    assigned_manager: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true
        },
        first_name: { type: String, index: true },
        last_name: { type: String, index: true },
        email: { type: String, index: true },
        phone_mobile: { type: String, index: true }
    },
    assigned_user: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true
        },
        first_name: { type: String, index: true },
        last_name: { type: String, index: true },
        email: { type: String, index: true },
        phone_mobile: { type: String, index: true }
    },
    follower_list: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    internal: {
        type: Boolean,
        default: false
    },
    request_amount: {
        type: Number,
        required: true
    },
    request_date: {
        type: Date,
        required: true,
        default: Date.now
    },
    status: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Application-Status',
            required: true,
            index: true
        },
        name: { type: String, index: true },
        bgcolor: { type: String, index: true },
        initial: { type: Boolean, index: true },
        closed: { type: Boolean, index: true }
    },
    status_date: {
        type: Date,
        required: true,
        default: Date.now,
        index: true
    },
    declined_reason: {
        type: String
    },
    closed: {
        type: Boolean,
        default: false,
        index: true
    },
    inactive: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for number of stipulations
ApplicationSchema.virtual('stipulation_count', {
    ref: 'Application-Stipulation',
    localField: '_id',
    foreignField: 'application',
    count: true
});

// Virtual for number of requested stipulations
ApplicationSchema.virtual('requested_stipulation_count', {
    ref: 'Application-Stipulation',
    localField: '_id',
    foreignField: 'application',
    match: {
        status: APPLICATION_STIPULATION_STATUS.REQUESTED
    },
    count: true
});

// Virtual for number of received stipulations
ApplicationSchema.virtual('received_stipulation_count', {
    ref: 'Application-Stipulation',
    localField: '_id',
    foreignField: 'application',
    match: {
        status: APPLICATION_STIPULATION_STATUS.RECEIVED
    },
    count: true
});

// Virtual for number of verified or waived stipulations
ApplicationSchema.virtual('checked_stipulation_count', {
    ref: 'Application-Stipulation',
    localField: '_id',
    foreignField: 'application',
    match: {
        status: { $in: [APPLICATION_STIPULATION_STATUS.VERIFIED, APPLICATION_STIPULATION_STATUS.WAIVED] }
    },
    count: true
});

// Virtual for number of documents
ApplicationSchema.virtual('document_count', {
    ref: 'Application-Document',
    localField: '_id',
    foreignField: 'application',
    count: true
});

// Virtual for number of uploaded documents
ApplicationSchema.virtual('uploaded_document_count', {
    ref: 'Application-Document',
    localField: '_id',
    foreignField: 'application',
    match: {
        type: APPLICATION_DOCUMENT_TYPES.UPLOADED
    },
    count: true
});

// Virtual for number of generated documents
ApplicationSchema.virtual('generated_document_count', {
    ref: 'Application-Document',
    localField: '_id',
    foreignField: 'application',
    match: {
        type: APPLICATION_DOCUMENT_TYPES.GENERATED 
    },
    count: true
});

// Virtual for number of offers
ApplicationSchema.virtual('offer_count', {
    ref: 'Application-Offer',
    localField: '_id',
    foreignField: 'application',
    count: true
});

// Virtual for number of history
ApplicationSchema.virtual('history_count', {
    ref: 'Application-History',
    localField: '_id',
    foreignField: 'application',
    count: true
});

// Create compound unique index for id and funder (partial to exclude null values)
ApplicationSchema.index(
    { identifier: 1, 'funder.id': 1 }, 
    { 
        unique: true, 
        partialFilterExpression: { identifier: { $exists: true } }
    }
);

const Application = mongoose.model('Application', ApplicationSchema);

module.exports = Application; 