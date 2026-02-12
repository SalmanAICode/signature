const mongoose = require('mongoose');

// Import all the separate schema files
const SyndicatorExternalLenderFeeSchema = require('./SyndicatorExternalLenderFee');
const SyndicatorInternalLenderFeeSchema = require('./SyndicatorInternalLenderFee');
const BaseSyndicatorAccountBalanceSchema = require('./BaseSyndicatorAccountBalance');
const OrgMeterUser = require('./User');

// Main Syndicator schema following the SyndicatorDTO structure
const SyndicatorSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        default: null
    },
    paymentSchedule: {
        type: String,
        default: null,
        enum: ['Upfront', 'As they go', null]
    },
    email: {
        type: String,
        default: null
    },
    isExternalLenderCommissionPassThru: {
        type: Boolean
    },
    isInternalLenderCommissionPassThru: {
        type: Boolean
    },
    externalLenderFees: [SyndicatorExternalLenderFeeSchema],
    internalLenderFees: [SyndicatorInternalLenderFeeSchema],
    availableBalanceAmount: {
        type: String,
        default: null
    },
    frozenBalanceAmount: {
        type: String,
        default: null
    },
    pendingBalanceAmount: {
        type: String,
        default: null
    },
    outstandingPurchaseAmount: {
        type: String,
        default: null
    },
    accountBalances: [BaseSyndicatorAccountBalanceSchema],
    tags: [String],
    deleted: {
        type: Boolean
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
            ref: 'Syndicator',
            default: null,
            index: true
        }
    }
}, {
    timestamps: false, // We don't have createdAt/updatedAt in this DTO
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
SyndicatorSchema.index({ id: 1, 'importMetadata.funder': 1 });
SyndicatorSchema.index({ name: 1 });
SyndicatorSchema.index({ email: 1 });
SyndicatorSchema.index({ deleted: 1 });
SyndicatorSchema.index({ paymentSchedule: 1 });
SyndicatorSchema.index({ 'importMetadata.importedAt': 1 });
SyndicatorSchema.index({ 'importMetadata.source': 1 });
SyndicatorSchema.index({ 'syncMetadata.needsSync': 1 });
SyndicatorSchema.index({ 'syncMetadata.lastSyncedAt': 1 });
SyndicatorSchema.index({ 'syncMetadata.syncId': 1 });

// Helper function to update OrgMeter User records for a syndicator
async function updateOrgMeterUsersForSyndicator(syndicatorId, syncId) {
    try {
        // Find OrgMeter User records where entity.type is 'syndicator' and entity.id matches this syndicator's id
        const orgMeterUsers = await OrgMeterUser.find({
            'entity.type': 'syndicator',
            'entity.id': syndicatorId
        });
        
        if (orgMeterUsers.length > 0) {
            // Update syncId and lastSyncedAt for all matching records
            await OrgMeterUser.updateMany(
                {
                    'entity.type': 'syndicator',
                    'entity.id': syndicatorId
                },
                {
                    $set: {
                        'syncMetadata.syncId': syncId,
                        'syncMetadata.lastSyncedAt': new Date(),
                        'syncMetadata.needsSync': false,
                        'syncMetadata.type': 'syndicator'
                    }
                }
            );
            
            console.log(`Updated ${orgMeterUsers.length} OrgMeter User records for syndicator ID: ${syndicatorId}`);
        }
    } catch (error) {
        console.error(`Error updating OrgMeter User records for syndicator ${syndicatorId}:`, error);
        throw error;
    }
}

// Middleware to update OrgMeter User when syncId changes
SyndicatorSchema.pre('save', async function(next) {
    try {
        // Check if syncMetadata.syncId has been modified
        if (this.isModified('syncMetadata.syncId')) {
            await updateOrgMeterUsersForSyndicator(this.id, this.syncMetadata.syncId);
        }
        next();
    } catch (error) {
        console.error('Error updating OrgMeter User records from syndicator:', error);
        next(error);
    }
});

// Middleware for findOneAndUpdate operations
SyndicatorSchema.pre('findOneAndUpdate', async function(next) {
    try {
        const update = this.getUpdate();
        
        // Check if syncMetadata.syncId is being updated
        const syncIdUpdate = update['syncMetadata.syncId'] || 
                           (update.$set && update.$set['syncMetadata.syncId']);
        
        if (syncIdUpdate) {
            // Get the document being updated to access its id
            const doc = await this.model.findOne(this.getQuery());
            
            if (doc) {
                await updateOrgMeterUsersForSyndicator(doc.id, syncIdUpdate);
            }
        }
        next();
    } catch (error) {
        console.error('Error updating OrgMeter User records from syndicator findOneAndUpdate:', error);
        next(error);
    }
});

// Middleware for updateOne operations
SyndicatorSchema.pre('updateOne', async function(next) {
    try {
        const update = this.getUpdate();
        
        // Check if syncMetadata.syncId is being updated
        const syncIdUpdate = update['syncMetadata.syncId'] || 
                           (update.$set && update.$set['syncMetadata.syncId']);
        
        if (syncIdUpdate) {
            // Get the document being updated to access its id
            const doc = await this.model.findOne(this.getQuery());
            
            if (doc) {
                await updateOrgMeterUsersForSyndicator(doc.id, syncIdUpdate);
            }
        }
        next();
    } catch (error) {
        console.error('Error updating OrgMeter User records from syndicator updateOne:', error);
        next(error);
    }
});

module.exports = mongoose.model('OrgMeter-Syndicator', SyndicatorSchema); 