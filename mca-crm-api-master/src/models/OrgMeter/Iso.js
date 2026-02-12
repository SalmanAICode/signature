const mongoose = require('mongoose');

// Import all the separate schema files
const { SalesRepUserSchema } = require('./SalesRepUser');
const StakeholderContactSchema = require('./StakeholderContact');
const AssigneeSchema = require('./Assignee');
const UserTeaserSchema = require('./UserTeaser');
const CustomFieldSchema = require('./CustomField');
const NoteSchema = require('./Note');

// Main Iso schema following the IsoDTO structure
const IsoSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['Internal', 'External']
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        default: null
    },
    salesRepUsers: [SalesRepUserSchema],
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
    status: {
        type: String,
        required: true
    },
    statusChangedAt: {
        type: Date
    },
    entityType: {
        type: String
    },
    federalId: {
        type: String,
        default: null
    },
    tags: [String],
    contacts: [StakeholderContactSchema],
    assignedTo: [AssigneeSchema],
    assignedBy: UserTeaserSchema,
    customFields: [CustomFieldSchema],
    notes: [NoteSchema],

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
            ref: 'ISO',
            default: null,
            index: true
        }
    }
}, {
    timestamps: false, // We use createdAt/updatedAt from IsoDTO
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
IsoSchema.index({ id: 1, 'importMetadata.funder': 1 });
IsoSchema.index({ type: 1 });
IsoSchema.index({ name: 1 });
IsoSchema.index({ email: 1 });
IsoSchema.index({ deleted: 1 });
IsoSchema.index({ createdAt: 1 });
IsoSchema.index({ updatedAt: 1 });
IsoSchema.index({ status: 1 });
IsoSchema.index({ 'importMetadata.importedAt': 1 });
IsoSchema.index({ 'importMetadata.source': 1 });
IsoSchema.index({ 'syncMetadata.needsSync': 1 });
IsoSchema.index({ 'syncMetadata.lastSyncedAt': 1 });
IsoSchema.index({ 'syncMetadata.syncId': 1 });

module.exports = mongoose.model('OrgMeter-Iso', IsoSchema); 