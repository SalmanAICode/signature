const mongoose = require('mongoose');

const UnderwriterUserSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    firstName: {
        type: String,
        default: null
    },
    lastName: {
        type: String,
        default: null
    },
    email: {
        type: String,
        default: null
    },

    // Import metadata for tracking data source and modifications
    importMetadata: {
        funder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Funder',
            default: null
        },
        source: {
            type: String,
            default: 'orgmeter'
        },
        importedAt: {
            type: Date,
            default: Date.now
        },
        importedBy: {
            type: String // User ID or system identifier
        },
        lastUpdatedAt: {
            type: Date,
            default: Date.now
        },
        lastUpdatedBy: {
            type: String // User ID or system identifier
        }
    },

    // Synchronization data for our system
    syncMetadata: {
        needsSync: {
            type: Boolean,
            default: true,
            index: true
        },
        lastSyncedAt: {
            type: Date,
            default: null,
            index: true
        },
        lastSyncedBy: {
            type: String,
            default: null
        },
        syncId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            index: true
        }
    }
});

// Create indexes for performance
UnderwriterUserSchema.index({ id: 1, 'importMetadata.funder': 1 });
UnderwriterUserSchema.index({ 'importMetadata.importedAt': 1 });
UnderwriterUserSchema.index({ 'importMetadata.source': 1 });
UnderwriterUserSchema.index({ 'syncMetadata.needsSync': 1 });
UnderwriterUserSchema.index({ 'syncMetadata.lastSyncedAt': 1 });
UnderwriterUserSchema.index({ 'syncMetadata.syncId': 1 });

module.exports = {
    UnderwriterUserSchema,
    model: mongoose.model('OrgMeter-Underwriter-User', UnderwriterUserSchema)
};
