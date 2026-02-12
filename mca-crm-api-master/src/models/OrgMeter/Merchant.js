const mongoose = require('mongoose');

// Import all the separate schema files
const FederalIdSchema = require('./FederalId');
const AddressSchema = require('./Address');
const PhoneSchema = require('./Phone');
const EmailSchema = require('./Email');
const BusinessTypeExtraSchema = require('./BusinessTypeExtra');
const AssigneeSchema = require('./Assignee');
const UserTeaserSchema = require('./UserTeaser');
const CustomFieldSchema = require('./CustomField');
const NoteSchema = require('./Note');

// Main Merchant schema following the MerchantDTO structure
const MerchantSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
    },
    businessName: {
        type: String,
        required: true
    },
    businessDba: {
        type: String,
        default: null
    },
    state: {
        type: String,
        required: true,
        enum: ['new', 'bad_actor', 'active', 'paid_off', 'in_progress', 'declined']
    },
    status: {
        type: String,
        default: null
    },
    deleted: {
        type: Boolean,
        required: true,
        default: false
    },
    createdAt: {
        type: Date,
        required: true
    },
    updatedAt: {
        type: Date,
        required: true
    },
    businessType: {
        type: String,
        default: null
    },
    businessTypeExtra: BusinessTypeExtraSchema,
    federalIds: [FederalIdSchema],
    businessStartDate: {
        type: Date,
        default: null
    },
    businessOwnershipDate: {
        type: Date,
        default: null
    },
    tags: [String],
    industryCategory: {
        type: String,
        default: null
    },
    industry: {
        type: String,
        default: null
    },
    sicCode: {
        type: String,
        default: null
    },
    naicsCode: {
        type: String,
        default: null
    },
    businessAddresses: [AddressSchema],
    businessPhones: [PhoneSchema],
    businessEmails: [EmailSchema],
    businessWebsite: {
        type: String,
        default: null
    },
    source: {
        type: String,
        default: null
    },
    primaryContact: {
        type: Number,
        default: null
    },
    contacts: [Number],
    assignedTo: [AssigneeSchema],
    assignedBy: UserTeaserSchema,
    lastAppFormSentAt: {
        type: Date,
        default: null
    },
    lastAppFormReceivedAt: {
        type: Date,
        default: null
    },
    lastAppSubmittedAt: {
        type: Date,
        default: null
    },
    stateChangedAt: {
        type: Date,
        default: null
    },
    plaidStatus: {
        type: String,
        enum: ['Not Setup', 'Active', 'Outdated', 'Waiting for response', 'Request Expired', 'Disconnected', 'Terminated']
    },
    statusChangedAt: {
        type: Date,
        default: null
    },
    customFields: [CustomFieldSchema],
    requestedCapitalAmount: {
        type: mongoose.Schema.Types.Decimal128,
        default: null
    },
    useOfProceeds: {
        type: String,
        default: null
    },
    location: {
        type: String,
        default: null,
        enum: [null, '', 'rent', 'mortgage']
    },
    rentOrMortgageAmount: {
        type: mongoose.Schema.Types.Decimal128,
        default: null
    },
    annualSalesAmount: {
        type: mongoose.Schema.Types.Decimal128,
        default: null
    },
    monthlySalesAmount: {
        type: mongoose.Schema.Types.Decimal128,
        default: null
    },
    advances: [Number],
    submissions: [Number],
    notes: [NoteSchema],
    createdBy: {
        type: Number,
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
            ref: 'Merchant',
            default: null,
            index: true
        }
    }
}, {
    timestamps: false, // We use createdAt/updatedAt from MerchantDTO
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
MerchantSchema.index({ id: 1, 'importMetadata.funder': 1 });
MerchantSchema.index({ businessName: 1 });
MerchantSchema.index({ businessDba: 1 });
MerchantSchema.index({ state: 1 });
MerchantSchema.index({ status: 1 });
MerchantSchema.index({ createdAt: 1 });
MerchantSchema.index({ updatedAt: 1 });
MerchantSchema.index({ deleted: 1 });
MerchantSchema.index({ 'importMetadata.importedAt': 1 });
MerchantSchema.index({ 'importMetadata.source': 1 });
MerchantSchema.index({ 'syncMetadata.needsSync': 1 });
MerchantSchema.index({ 'syncMetadata.lastSyncedAt': 1 });
MerchantSchema.index({ 'syncMetadata.syncId': 1 });

module.exports = mongoose.model('OrgMeter-Merchant', MerchantSchema); 