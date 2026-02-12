const mongoose = require('mongoose');

// Import all the separate schema files
const StakeholderSchema = require('./Stakeholder');
const UserTeaserSchema = require('./UserTeaser');
const AdvanceMerchantContactSchema = require('./AdvanceMerchantContact');
const RenewedAdvanceSchema = require('./RenewedAdvance');
const AdvanceFundingSchema = require('./AdvanceFunding');
const AdvanceParticipationSchema = require('./AdvanceParticipation');
const AssigneeSchema = require('./Assignee');
const CustomFieldSchema = require('./CustomField');
const StakeholderDocumentSchema = require('./StakeholderDocument');
const IsoCommissionClassTeaserSchema = require('./IsoCommissionClassTeaser');
const IsoOfferTeaserSchema = require('./IsoOfferTeaser');
const AdvanceUnderwritingTeaserSchema = require('./AdvanceUnderwritingTeaser');
const NoteSchema = require('./Note');
const AdvanceStatsSchema = require('./AdvanceStats');

// Main OrgMeterAdvanceSchema following exact AdvanceDTO structure
const OrgMeterAdvanceSchema = new mongoose.Schema({
    // Required fields from AdvanceDTO
    id: {
        type: Number,
        required: true
    },
    merchantId: {
        type: Number,
        required: false,
        index: true
    },
    companyId: {
        type: Number,
        required: false
    },
    idText: {
        type: String,
        required: false
    },
    
    // Standard AdvanceDTO fields
    deleted: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date
    },
    updatedAt: {
        type: Date
    },
    name: {
        type: String,
        default: null
    },
    
    // StakeholderDTO - lender
    lender: StakeholderSchema,
    
    // UserTeaserDTO - underwriter
    underwriter: UserTeaserSchema,
    
    // StakeholderDTO - iso
    iso: StakeholderSchema,
    
    // Enums from AdvanceDTO
    type: {
        type: String,
        enum: ['new', 'renewal', 'refinance', 'buyout']
    },
    state: {
        type: String,
        enum: ['submitted', 'prefunded', 'funded', 'defaulted', 'closed']
    },
    status: {
        type: String
    },
    
    // Nullable date fields
    defaultedAt: {
        type: Date,
        default: null
    },
    
    // Nullable integer references
    delegatedTo: {
        type: Number,
        default: null
    },
    createdBy: {
        type: Number,
        default: null
    },
    updatedBy: {
        type: Number,
        default: null
    },
    
    // External reference fields
    externalReferenceId: {
        type: String,
        default: null
    },
    ocroFormJobId: {
        type: String,
        default: null
    },
    bankStatementGroupId: {
        type: String,
        default: null
    },
    
    // Merchant business name
    merchantBusinessName: {
        type: String
    },
    
    // AdvanceMerchantContactDTO array
    selectedContacts: [AdvanceMerchantContactSchema],
    
    // RenewedAdvanceDTO array
    renewedAdvances: [RenewedAdvanceSchema],
    
    // Nullable decimal amount
    renewedAmount: {
        type: mongoose.Schema.Types.Decimal128,
        default: null
    },
    
    // UserTeaserDTO - salesRep
    salesRep: UserTeaserSchema,
    
    // Simple arrays
    tags: [String],
    aliases: [String],
    
    // State and status tracking
    stateChangedAt: {
        type: Date,
        default: null
    },
    statusId: {
        type: Number
    },
    statusName: {
        type: String
    },
    parentStatusName: {
        type: String,
        default: null
    },
    statusChangedAt: {
        type: Date,
        default: null
    },
    previousStatusName: {
        type: String,
        default: null
    },
    
    // Deal flow enum
    dealFlow: {
        type: String,
        enum: ['funded', 'inception']
    },
    
    // Integer array
    submissions: [Number],
    
    // AdvanceFundingDTO - simplified version with key fields
    funding: AdvanceFundingSchema,
    
    // Participation
    participationEnabled: {
        type: Boolean,
        default: null
    },

    participation: AdvanceParticipationSchema,
    
    // Activation tracking
    activatedAt: {
        type: Date,
        default: null
    },
    activatedBy: {
        type: Number,
        default: null
    },
    
    // Assignment
    assignedTo: [AssigneeSchema],
    assignedBy: UserTeaserSchema,
    
    // Priority enum
    priority: {
        type: String,
        enum: ['Normal', 'High', 'Highest']
    },
    
    // Source and ACH fields
    sourceChannel: {
        type: String,
        enum: [null, 'api', 'manual', 'web', 'mobile'],
        default: null
    },
    achGuid: {
        type: String,
        default: null
    },
    achType: {
        type: String,
        enum: [null, 'service', 'subscription'],
        default: null
    },
    achStatus: {
        type: String,
        enum: [null, 'active', 'paused'],
        default: null
    },
    
    // CustomFieldDTO array
    customFields: [CustomFieldSchema],
    
    // AdvanceUnderwritingTeaserDTO
    underwriting: AdvanceUnderwritingTeaserSchema,
    
    // NoteDTO array
    notes: [NoteSchema],
    
    // AdvanceStatsDTO
    stats: AdvanceStatsSchema,
    
    // StakeholderDocumentDTO array
    documents: [StakeholderDocumentSchema],
    
    // IsoCommissionClassTeaserDTO
    isoCommissionClass: IsoCommissionClassTeaserSchema,
    
    // IsoOfferTeaserDTO
    isoOffer: IsoOfferTeaserSchema,
    
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
            ref: 'Funding',
            default: null,
            index: true
        }
    }
}, {
    timestamps: false, // We use createdAt/updatedAt from AdvanceDTO
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
OrgMeterAdvanceSchema.index({ id: 1, 'importMetadata.funder': 1 });
OrgMeterAdvanceSchema.index({ merchantId: 1 });
OrgMeterAdvanceSchema.index({ companyId: 1 });
OrgMeterAdvanceSchema.index({ 'lender.id': 1 });
OrgMeterAdvanceSchema.index({ 'iso.id': 1 });
OrgMeterAdvanceSchema.index({ state: 1 });
OrgMeterAdvanceSchema.index({ status: 1 });
OrgMeterAdvanceSchema.index({ deleted: 1 });
OrgMeterAdvanceSchema.index({ idText: 1 });
OrgMeterAdvanceSchema.index({ 'importMetadata.importedAt': 1 });
OrgMeterAdvanceSchema.index({ 'importMetadata.source': 1 });
OrgMeterAdvanceSchema.index({ 'syncMetadata.needsSync': 1 });
OrgMeterAdvanceSchema.index({ 'syncMetadata.lastSyncedAt': 1 });
OrgMeterAdvanceSchema.index({ 'syncMetadata.syncId': 1 });

// Static methods for common queries
OrgMeterAdvanceSchema.statics.findByMerchant = function(merchantId) {
    return this.find({ merchantId: merchantId, deleted: false });
};

OrgMeterAdvanceSchema.statics.findByLender = function(lenderId) {
    return this.find({ 'lender.id': lenderId, deleted: false });
};

OrgMeterAdvanceSchema.statics.findByState = function(state) {
    return this.find({ state: state, deleted: false });
};

// Instance methods
OrgMeterAdvanceSchema.methods.softDelete = function() {
    this.deleted = true;
    this.updatedAt = new Date();
    return this.save();
};

module.exports = mongoose.model('OrgMeter-Advance', OrgMeterAdvanceSchema); 