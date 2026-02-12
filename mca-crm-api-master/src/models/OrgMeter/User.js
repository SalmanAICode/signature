const mongoose = require('mongoose');
const UserTeamTeaserSchema = require('./UserTeamTeaser');
const UserEntitySchema = require('./UserEntity');
const { model: UnderwriterUser } = require('./UnderwriterUser');

const UserSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    permissionProfileId: {
        type: Number
    },
    permissionProfileName: {
        type: String
    },
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    username: {
        type: String
    },
    email: {
        type: String
    },
    phone: {
        type: String
    },
    roles: {
        type: [String] // Array of role strings like "ROLE_OPERATOR", "ROLE_USER"
    },
    teams: [UserTeamTeaserSchema],
    entity: UserEntitySchema,
    updatedAt: {
        type: Date,
        required: false
    },
    enabled: {
        type: Boolean
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
        },
        type: {
            type: String,
            enum: ['user', 'contact', 'representative', 'syndicator']
        }
    }
}, {
    timestamps: false,
});

// Create indexes for performance
UserSchema.index({ id: 1, 'importMetadata.funder': 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ permissionProfileId: 1 });
UserSchema.index({ 'entity.id': 1 });
UserSchema.index({ 'entity.type': 1 });
UserSchema.index({ enabled: 1 });
UserSchema.index({ 'importMetadata.importedAt': 1 });
UserSchema.index({ 'importMetadata.source': 1 });
UserSchema.index({ updatedAt: 1 });
UserSchema.index({ 'syncMetadata.needsSync': 1 });
UserSchema.index({ 'syncMetadata.lastSyncedAt': 1 });
UserSchema.index({ 'syncMetadata.syncId': 1 });
UserSchema.index({ 'syncMetadata.type': 1 });

// Helper function to update UnderwriterUser records for a user
async function updateUnderwriterUsersForUser(email, syncId) {
    try {
        if (!email) return;
        
        // Find all UnderwriterUser records with the same email
        const underwriterUsers = await UnderwriterUser.find({ email: email });
        
        if (underwriterUsers.length > 0) {
            // Update syncId and lastSyncedAt for all matching records
            await UnderwriterUser.updateMany(
                { email: email },
                {
                    $set: {
                        'syncMetadata.syncId': syncId,
                        'syncMetadata.lastSyncedAt': new Date(),
                        'syncMetadata.needsSync': false
                    }
                }
            );
            
            console.log(`Updated ${underwriterUsers.length} UnderwriterUser records for email: ${email}`);
        }
    } catch (error) {
        console.error(`Error updating UnderwriterUser records for email ${email}:`, error);
        throw error;
    }
}

// Middleware to update UnderwriterUser when syncId changes
UserSchema.pre('save', async function(next) {
    try {
        // Check if syncMetadata.syncId has been modified, email exists, and type is 'user'
        if (this.isModified('syncMetadata.syncId') && this.email && this.syncMetadata.type === 'user') {
            await updateUnderwriterUsersForUser(this.email, this.syncMetadata.syncId);
        }
        next();
    } catch (error) {
        console.error('Error updating UnderwriterUser records:', error);
        next(error);
    }
});

// Middleware for findOneAndUpdate operations
UserSchema.pre('findOneAndUpdate', async function(next) {
    try {
        const update = this.getUpdate();
        
        // Check if syncMetadata.syncId is being updated
        const syncIdUpdate = update['syncMetadata.syncId'] || 
                           (update.$set && update.$set['syncMetadata.syncId']);
        
        if (syncIdUpdate) {
            // Get the document being updated to access its email and type
            const doc = await this.model.findOne(this.getQuery());
            
            if (doc && doc.email && doc.syncMetadata.type === 'user') {
                await updateUnderwriterUsersForUser(doc.email, syncIdUpdate);
            }
        }
        next();
    } catch (error) {
        console.error('Error updating UnderwriterUser records in findOneAndUpdate:', error);
        next(error);
    }
});

// Middleware for updateOne operations
UserSchema.pre('updateOne', async function(next) {
    try {
        const update = this.getUpdate();
        
        // Check if syncMetadata.syncId is being updated
        const syncIdUpdate = update['syncMetadata.syncId'] || 
                           (update.$set && update.$set['syncMetadata.syncId']);
        
        if (syncIdUpdate) {
            // Get the document being updated to access its email and type
            const doc = await this.model.findOne(this.getQuery());
            
            if (doc && doc.email && doc.syncMetadata.type === 'user') {
                await updateUnderwriterUsersForUser(doc.email, syncIdUpdate);
            }
        }
        next();
    } catch (error) {
        console.error('Error updating UnderwriterUser records in updateOne:', error);
        next(error);
    }
});

module.exports = mongoose.model('OrgMeter-User', UserSchema); 