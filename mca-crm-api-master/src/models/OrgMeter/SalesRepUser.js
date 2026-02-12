const mongoose = require('mongoose');

const SalesRepUserSchema = new mongoose.Schema({
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
}, { _id: false });

// Create indexes for performance
SalesRepUserSchema.index({ id: 1, 'importMetadata.funder': 1 });
SalesRepUserSchema.index({ 'importMetadata.importedAt': 1 });
SalesRepUserSchema.index({ 'importMetadata.source': 1 });
SalesRepUserSchema.index({ 'syncMetadata.needsSync': 1 });
SalesRepUserSchema.index({ 'syncMetadata.lastSyncedAt': 1 });
SalesRepUserSchema.index({ 'syncMetadata.syncId': 1 });

module.exports = {
    SalesRepUserSchema,
    model: mongoose.model('OrgMeter-Sales-Rep-User', SalesRepUserSchema)
};