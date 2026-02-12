const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const { PORTAL_TYPES } = require('../utils/constants');
const Helpers = require('../utils/helpers');

const DocumentSchema = new mongoose.Schema({
    merchant: {
        id: {
            type: Schema.Types.ObjectId,
            ref: 'Merchant',
            index: true
        },
        name: { type: String, index: true },
        dba_name: { type: String, index: true },
        email: { type: String, index: true },
        phone: { type: String, index: true }
    },
    funder: {
        id: {
            type: Schema.Types.ObjectId,
            ref: 'Funder',
            index: true
        },
        name: { type: String, index: true },
        email: { type: String, index: true },
        phone: { type: String, index: true }
    },
    iso: {
        id: {
            type: Schema.Types.ObjectId,
            ref: 'ISO',
            index: true
        },
        name: { type: String, index: true },
        email: { type: String, index: true },
        phone: { type: String, index: true }
    },
    syndicator: {
        id: {
            type: Schema.Types.ObjectId,
            ref: 'Syndicator',
            index: true
        },
        name: { type: String, index: true },
        first_name: { type: String, index: true },
        last_name: { type: String, index: true },
        email: { type: String, index: true },
        phone_mobile: { type: String, index: true }
    },
    file: {
        type: Schema.Types.ObjectId,
        unique: true,
        sparse: true, // Allows null/undefined values in unique index, preventing validation errors for docs without file
        index: true
    },
    file_name: {
        type: String,
        required: true,
        index: true
    },
    file_type: {
        type: String,
        index: true
    },
    file_size: {
        type: Number,
        index: true
    },
    fileHtml: {
        value: { type: String },
        messages: [{
            type: {
                type: String,
                enum: ['error', 'warning'] // Use enum to restrict values
            },
            message: { type: String },
            error: { type: String }
        }]
    },
    portal: {
        type: String,
        enum: Object.values(PORTAL_TYPES),
        index: true
    },
    upload_contact: {
        id: {
            type: Schema.Types.ObjectId,
            ref: 'Contact',
            index: true
        },
        first_name: { type: String, index: true },
        last_name: { type: String, index: true },
        email: { type: String, index: true },
        phone_mobile: { type: String, index: true }
    },
    upload_representative: {
        id: {
            type: Schema.Types.ObjectId,
            ref: 'Representative',
            index: true
        },
        first_name: { type: String, index: true },
        last_name: { type: String, index: true },
        email: { type: String, index: true },
        phone_mobile: { type: String, index: true }
    },
    upload_user: {
        id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            index: true
        },
        first_name: { type: String, index: true },
        last_name: { type: String, index: true },
        email: { type: String, index: true },
        phone_mobile: { type: String, index: true }
    },
    upload_syndicator: {
        id: {
            type: Schema.Types.ObjectId,
            ref: 'Syndicator',
            index: true
        },
        name: { type: String, index: true },
        first_name: { type: String, index: true },
        last_name: { type: String, index: true },
        email: { type: String, index: true },
        phone_mobile: { type: String, index: true }
    },
    upload_admin: {
        id: {
            type: Schema.Types.ObjectId,
            ref: 'Admin',
            index: true
        },
        first_name: { type: String, index: true },
        last_name: { type: String, index: true },
        email: { type: String, index: true },
        phone_mobile: { type: String, index: true }
    },
    upload_bookkeeper: {
        id: {
            type: Schema.Types.ObjectId,
            ref: 'Bookkeeper',
            index: true
        },
        first_name: { type: String, index: true },
        last_name: { type: String, index: true },
        email: { type: String, index: true },
        phone_mobile: { type: String, index: true }
    },
    archived: {
        type: Boolean,
        default: false,
        index: true
    },
    source: {
        type: String,
        enum: ['template', 'upload', 'word_template'],
        default: null
    },
    signature_data: {
        signature_request_id: { type: String },
        signature_status: {
            type: String,
            enum: ['not_initiated', 'pending', 'completed', 'declined', 'cancelled'],
            default: 'not_initiated'
        },
        signers: [{
            email: { type: String },
            name: { type: String },
            role: { type: String },
            status: {
                type: String,
                enum: ['pending', 'completed', 'declined'],
                default: 'pending'
            },
            signed_at: { type: Date }
        }],
        initiated_at: { type: Date },
        last_event: { type: String },
        last_event_at: { type: Date }
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Define collections that contain embedded document data
const across_collections = [
    { collection: 'Application-Document', field: 'document' },
    { collection: 'ApplicationOffer-Document', field: 'document' }
    // Add other collections that store document data in this format
];

// Reusable function to synchronize document information across collections
DocumentSchema.statics.syncDocumentInfo = async function (ids, data = {}) {
    if (!ids) return { success: false, error: 'Missing required ids parameter' };

    try {
        let query = {};
        let updateData = {};

        // Handle different types of ids input
        if (Array.isArray(ids)) {
            // Array of document ids
            query = { $in: ids };
            updateData = data;
        } else if (typeof ids === 'object' && ids._id) {
            // Single document object
            query = ids._id;
            if (!data || Object.keys(data).length === 0) {
                updateData = {
                    file_name: ids.file_name,
                    file_type: ids.file_type,
                    file_size: ids.file_size,
                    last_modified: ids.updatedAt
                };
            } else {
                updateData = data;
            }
        } else {
            // Single document ID
            query = ids;
            updateData = data;
        }

        if (!updateData || Object.keys(updateData).length === 0) return { success: false, error: 'Missing required data parameter' };

        const results = {
            success: true,
            collections: {}
        };

        // Update across collections
        for (const { collection, field } of across_collections) {
            const Model = mongoose.model(collection);

            // Create update object with document.fieldname format
            // MongoDB $set can handle nested objects directly
            const updateObject = {};
            for (const [key, value] of Object.entries(updateData)) {
                updateObject[`${field}.${key}`] = value;
            }

            const result = await Model.updateMany(
                { [`${field}.id`]: query },
                { $set: updateObject }
            );

            results.collections[collection] = {
                updatedCount: result.nModified || 0,
                matchedCount: result.n || 0
            };
        }

        return results;
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Middleware to update redundant data in related collections
DocumentSchema.pre('save', async function (next) {
    // Only run this middleware if certain fields were modified
    const updateData = {};
    if (this.isModified('file_name')) updateData.file_name = this.file_name;
    if (this.isModified('file_type')) updateData.file_type = this.file_type;
    if (this.isModified('file_size')) updateData.file_size = this.file_size;
    updateData.last_modified = this.updatedAt;

    if (Object.keys(updateData).length > 0) {
        try {
            await this.constructor.syncDocumentInfo(this._id, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for direct updateOne operations
DocumentSchema.pre('updateOne', { document: false, query: true }, async function (next) {
    const update = this.getUpdate();
    const updateData = {};

    // Check for fields that need syncing in both direct and $set updates
    if (update.file_name || (update.$set && update.$set.file_name)) {
        updateData.file_name = update.file_name || update.$set.file_name;
    }

    if (update.file_type || (update.$set && update.$set.file_type)) {
        updateData.file_type = update.file_type || update.$set.file_type;
    }

    if (update.file_size !== undefined || (update.$set && update.$set.file_size !== undefined)) {
        updateData.file_size = update.file_size !== undefined ? update.file_size : update.$set.file_size;
    }

    updateData.last_modified = new Date();

    if (Object.keys(updateData).length > 0) {
        const documentId = this.getQuery()._id;
        try {
            await mongoose.model('Document').syncDocumentInfo(documentId, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for direct findOneAndUpdate operations
DocumentSchema.pre('findOneAndUpdate', { document: false, query: true }, async function (next) {
    const update = this.getUpdate();
    const updateData = {};

    // Check for fields that need syncing in both direct and $set updates
    if (update.file_name || (update.$set && update.$set.file_name)) {
        updateData.file_name = update.file_name || update.$set.file_name;
    }

    if (update.file_type || (update.$set && update.$set.file_type)) {
        updateData.file_type = update.file_type || update.$set.file_type;
    }

    if (update.file_size !== undefined || (update.$set && update.$set.file_size !== undefined)) {
        updateData.file_size = update.file_size !== undefined ? update.file_size : update.$set.file_size;
    }

    updateData.last_modified = new Date();

    if (Object.keys(updateData).length > 0) {
        const documentId = this.getQuery()._id;
        try {
            await mongoose.model('Document').syncDocumentInfo(documentId, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for updateMany operations - requires special handling
DocumentSchema.pre('updateMany', { document: false, query: true }, async function (next) {
    const update = this.getUpdate();
    const updateData = {};

    // Check for fields that need syncing in both direct and $set updates
    if (update.file_name || (update.$set && update.$set.file_name)) {
        updateData.file_name = update.file_name || update.$set.file_name;
    }

    if (update.file_type || (update.$set && update.$set.file_type)) {
        updateData.file_type = update.file_type || update.$set.file_type;
    }

    if (update.file_size !== undefined || (update.$set && update.$set.file_size !== undefined)) {
        updateData.file_size = update.file_size !== undefined ? update.file_size : update.$set.file_size;
    }

    updateData.last_modified = new Date();

    if (Object.keys(updateData).length > 0) {
        const documentQuery = this.getQuery();
        try {
            // First find all documents that match the query
            const Document = mongoose.model('Document');
            const documents = await Document.find(documentQuery, '_id');
            const documentIds = documents.map(doc => doc._id);

            if (documentIds.length > 0) {
                await Document.syncDocumentInfo(documentIds, updateData);
            }

            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

/**
 * Convert document to proper object structure for embedding in other documents
 * @param {Object|string} document - Document object or ID
 * @returns {Promise<Object|undefined>} - Converted document object or undefined
 */
DocumentSchema.statics.convertToEmbeddedFormat = async function (document) {
    const documentId = Helpers.extractIdString(document);
    if (documentId) {
        try {
            // Add .lean() to get a plain JavaScript object instead of a Mongoose document
            const documentDoc = await this.findById(documentId).lean();
            if (documentDoc) {
                return {
                    id: documentDoc._id,
                    file_name: documentDoc.file_name,
                    file_type: documentDoc.file_type,
                    file_size: documentDoc.file_size,
                    last_modified: documentDoc.updatedAt,
                    signature_data: documentDoc.signature_data || null
                };
            }
        } catch (error) {
            console.error('Error fetching document details:', error);
            // Continue with creation even if document details can't be fetched
        }
    }
    return undefined;
};

// Virtual for number of uploads
DocumentSchema.virtual('upload_count', {
    ref: 'Upload',
    localField: '_id',
    foreignField: 'document',
    count: true
});

// Virtual for upload histories
DocumentSchema.virtual('upload_history_list', {
    ref: 'Upload',
    localField: '_id',
    foreignField: 'document',
    sort: { createdAt: -1 }
});

module.exports = mongoose.model('Document', DocumentSchema);
