const mongoose = require('mongoose');

// Main Upload Payment schema based on the payment csv file downloaded from OrgMeter
const UploadPaymentSchema = new mongoose.Schema({
    paymentId: {
        type: Number,
        required: true,
    },
    advanceId: {
        type: Number
    },
    from: {
        type: String,
        required: true
    },
    to: {
        type: String,
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    senderType: {
        type: String,
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    receiverType: {
        type: String,
    },
    type: {
        type: String,
        required: true
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
    timestamps: true,
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
UploadPaymentSchema.index({ paymentId: 1 });
UploadPaymentSchema.index({ advanceId: 1 });
UploadPaymentSchema.index({ type: 1 });
UploadPaymentSchema.index({ paid: 1 });
UploadPaymentSchema.index({ dueAt: 1 });
UploadPaymentSchema.index({ paidAt: 1 });

module.exports = mongoose.model('OrgMeter-Upload-Payment', UploadPaymentSchema); 