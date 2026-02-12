const mongoose = require('mongoose');

// Import the existing Note schema
const NoteSchema = require('./Note');

// Main Payment schema following the PaymentDTO structure
const PaymentSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
    },
    companyId: {
        type: Number
    },
    advanceId: {
        type: Number
    },
    amount: {
        type: mongoose.Schema.Types.Decimal128,
        required: false
    },
    dueAt: {
        type: Date
    },
    paid: {
        type: Boolean
    },
    paidAt: {
        type: Date,
        default: null
    },
    bounced: {
        type: Boolean,
        default: false
    },
    bouncedAt: {
        type: Date,
        default: null
    },
    bouncedReasonCode: {
        type: String,
        default: null
    },
    bouncedReason: {
        type: String,
        default: null
    },
    ignored: {
        type: Boolean,
        default: false
    },
    deleted: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        required: false
    },
    updatedAt: {
        type: Date,
        default: null
    },
    type: {
        type: String,
        required: false,
        enum: [null, '', 'original_advance_payback', 'advance_payback', 'participation_payout', 'bounce_fee', 'other_fee', 'adjustment']
    },
    feeAmount: {
        type: mongoose.Schema.Types.Decimal128,
        default: null
    },
    notes: [NoteSchema],
    achGuid: {
        type: String,
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
    parentPaymentId: {
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
            default: null,
            index: true
        }
    }
    
}, {
    timestamps: false, // We use createdAt/updatedAt from PaymentDTO
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
PaymentSchema.index({ id: 1, 'importMetadata.funder': 1 });
PaymentSchema.index({ companyId: 1 });
PaymentSchema.index({ advanceId: 1 });
PaymentSchema.index({ type: 1 });
PaymentSchema.index({ paid: 1 });
PaymentSchema.index({ bounced: 1 });
PaymentSchema.index({ ignored: 1 });
PaymentSchema.index({ deleted: 1 });
PaymentSchema.index({ createdAt: 1 });
PaymentSchema.index({ updatedAt: 1 });
PaymentSchema.index({ dueAt: 1 });
PaymentSchema.index({ paidAt: 1 });
PaymentSchema.index({ bouncedAt: 1 });
PaymentSchema.index({ parentPaymentId: 1 });
PaymentSchema.index({ achGuid: 1 });

module.exports = mongoose.model('OrgMeter-Payment', PaymentSchema); 