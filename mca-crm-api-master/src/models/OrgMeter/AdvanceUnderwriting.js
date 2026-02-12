const mongoose = require('mongoose');
const MerchantRequestInfoSchema = require('./MerchantRequestInfo');
const AdvanceUnderwritingPositionSchema = require('./AdvanceUnderwritingPosition');
const WorksheetSummarySchema = require('./WorksheetSummary');
const CreditScoreRangeSchema = require('./CreditScoreRange');
const CreditCardLimitPercentRangeSchema = require('./CreditCardLimitPercentRange');
const Note = require('./Note');
const CustomField = require('./CustomField');

const AdvanceUnderwritingSchema = new mongoose.Schema({
    advanceId: {
        type: Number,
        required: true
    },
    merchantRequestInfo: MerchantRequestInfoSchema,
    positionNumber: {
        type: Number
    },
    positions: [AdvanceUnderwritingPositionSchema],
    pendingStipCount: {
        type: Number
    },
    totalStipCount: {
        type: Number
    },
    worksheetSummaryTotal: WorksheetSummarySchema,
    worksheetSummaryAverage: WorksheetSummarySchema,
    otherCreditScore: {
        type: Number
    },
    otherCreditCardLimitPercent: {
        type: Number
    },
    overallCreditScore: CreditScoreRangeSchema,
    overallCreditCardLimitPercent: CreditCardLimitPercentRangeSchema,
    publicRecordCount: {
        type: Number
    },
    notes: [Note],
    customFields: [CustomField],
    createdAt: {
        type: Date,
        required: false
    },
    createdBy: {
        type: Number
    },
    updatedAt: {
        type: Date,
        required: false
    },
    updatedBy: {
        type: Number
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
            default: null,
            index: true
        }
    }
}, {
    timestamps: false,
    toJSON: {
        transform: function(doc, ret) {
            // Convert Decimal128 to numbers for JSON serialization
            Object.keys(ret).forEach(key => {
                if (ret[key] && ret[key].constructor && ret[key].constructor.name === 'Decimal128') {
                    ret[key] = parseFloat(ret[key].toString());
                }
                // Handle nested objects
                if (typeof ret[key] === 'object' && ret[key] !== null && !Array.isArray(ret[key])) {
                    Object.keys(ret[key]).forEach(nestedKey => {
                        if (ret[key][nestedKey] && ret[key][nestedKey].constructor && ret[key][nestedKey].constructor.name === 'Decimal128') {
                            ret[key][nestedKey] = parseFloat(ret[key][nestedKey].toString());
                        }
                    });
                }
                // Handle arrays
                if (Array.isArray(ret[key])) {
                    ret[key].forEach(item => {
                        if (typeof item === 'object' && item !== null) {
                            Object.keys(item).forEach(itemKey => {
                                if (item[itemKey] && item[itemKey].constructor && item[itemKey].constructor.name === 'Decimal128') {
                                    item[itemKey] = parseFloat(item[itemKey].toString());
                                }
                            });
                        }
                    });
                }
            });
            return ret;
        }
    }
});

// Create indexes for performance
AdvanceUnderwritingSchema.index({ advanceId: 1, 'importMetadata.funder': 1 });
AdvanceUnderwritingSchema.index({ createdAt: 1 });
AdvanceUnderwritingSchema.index({ updatedAt: 1 });
AdvanceUnderwritingSchema.index({ 'importMetadata.importedAt': 1 });
AdvanceUnderwritingSchema.index({ 'importMetadata.source': 1 });
AdvanceUnderwritingSchema.index({ 'syncMetadata.needsSync': 1 });
AdvanceUnderwritingSchema.index({ 'syncMetadata.lastSyncedAt': 1 });
AdvanceUnderwritingSchema.index({ 'syncMetadata.syncId': 1 });

module.exports = mongoose.model('OrgMeter-Advance-Underwriting', AdvanceUnderwritingSchema); 