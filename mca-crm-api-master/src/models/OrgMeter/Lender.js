const mongoose = require('mongoose');

// Import the UnderwriterUser schema
const { UnderwriterUserSchema } = require('./UnderwriterUser');

// Main Lender schema following the LenderDTO structure
const LenderSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['internal', 'external']
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        default: null
    },
    underwriterUsers: [UnderwriterUserSchema],
    deleted: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: null
    },
    createdBy: {
        type: Number,
        default: null
    },
    updatedAt: {
        type: Date,
        default: null
    },
    updatedBy: {
        type: Number,
        default: null
    },

    
    // Import metadata for our system
    importMetadata: {
        funder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Funder',
            default: null
        },
        source: {
            type: String,
            default: 'orgmeter_api'
        },
        importedAt: {
            type: Date,
            default: Date.now
        },
        importedBy: String,
        lastUpdatedAt: {
            type: Date,
            default: null
        },
        lastUpdatedBy: {
            type: String,
            default: null
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
            ref: 'Lender',
            default: null,
            index: true
        }
    }
}, {
    timestamps: false, // We use createdAt/updatedAt from LenderDTO
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            // Keep the numeric id as per OrgMeter API spec
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    },
    toObject: { virtuals: true }
});

// Indexes for performance
LenderSchema.index({ id: 1, 'importMetadata.funder': 1 });
LenderSchema.index({ type: 1 });
LenderSchema.index({ name: 1 });
LenderSchema.index({ email: 1 });
LenderSchema.index({ deleted: 1 });
LenderSchema.index({ createdAt: 1 });
LenderSchema.index({ updatedAt: 1 });
LenderSchema.index({ 'importMetadata.importedAt': 1 });
LenderSchema.index({ 'importMetadata.source': 1 });
LenderSchema.index({ 'syncMetadata.needsSync': 1 });
LenderSchema.index({ 'syncMetadata.lastSyncedAt': 1 });
LenderSchema.index({ 'syncMetadata.syncId': 1 });

module.exports = mongoose.model('OrgMeter-Lender', LenderSchema); 