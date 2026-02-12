const mongoose = require('mongoose');

const FundingStatusSchema = new mongoose.Schema({
    funder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funder',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    bgcolor: {
        type: String
    },
    idx: {
        type: Number,
        required: true,
        default: 0
    },
    initial: {
        type: Boolean,
        default: false
    },
    funded: {
        type: Boolean,
        default: false
    },
    performing: {
        type: Boolean,
        default: false
    },
    warning: {
        type: Boolean,
        default: false
    },
    closed: {
        type: Boolean,
        default: false
    },
    defaulted: {
        type: Boolean,
        default: false
    },
    system: {
        type: Boolean,
        default: false
    },
    inactive: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Collections that store application status data in embedded format
const across_collections = [
    { collection: 'Funding', field: 'status' }, 
    //{ collection: 'Application-History', field: 'status' }, // Historical statuses will not be synced
    // Add future collections that might store embedded status data
];

// Reusable function to synchronize funding status information across collections
FundingStatusSchema.statics.syncFundingStatusInfo = async function(ids, data = {}) {
    if (!ids) return { success: false, error: 'Missing required ids parameter' };
    
    try {
        let query = {};
        let updateData = {};
        
        // Handle different types of ids input
        if (Array.isArray(ids)) {
            // Array of status ids
            query = { $in: ids };
            updateData = data;
        } else if (typeof ids === 'object' && ids._id) {
            // Single status object
            query = ids._id;
            if (!data || Object.keys(data).length === 0) {
                updateData = { 
                    name: ids.name, 
                    bgcolor: ids.bgcolor,
                    initial: ids.initial,
                    funded: ids.funded,
                    performing: ids.performing,
                    warning: ids.warning,
                    defaulted: ids.defaulted,
                    closed: ids.closed
                };
            } else {
                updateData = data;
            }
        } else {
            // Single status ID
            query = ids;
            updateData = data;
        }

        if (!updateData || Object.keys(updateData).length === 0) {
            return { success: false, error: 'Missing required data parameter' };
        }
                
        const results = {
            success: true,
            collections: {}
        };

        // Update across collections
        for (const { collection, field } of across_collections) {
            const Model = mongoose.model(collection);

            // For embedded status data - update name and bgcolor fields
            const updateObject = {};
            for (const [key, value] of Object.entries(updateData)) {
                updateObject[`${field}.${key}`] = value;
            }

            const result = await Model.updateMany(
                { [`${field}.id`]: query },
                { $set: updateObject }
            );

            results.collections[collection] = {
                updatedCount: result.nModified || 0,
                matchedCount: result.n || 0
            };
        }
            
        return results;
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// When a new funding status is created, we need to set the idx of the new funding status to the highest idx + 1
FundingStatusSchema.pre('save', async function(next) {
    try {
        if(this.isNew) {
            const highestIdx = await this.constructor.findOne({ funder: this.funder }).sort({ idx: -1 });
            this.idx = highestIdx ? highestIdx.idx + 1 : 1;
        }
        
        // Sync changes to related collections if certain fields were modified
        if (!this.isNew) {
            const updateData = {};
            // Only sync when name or bgcolor fields change
            if (this.isModified('name')) updateData.name = this.name;
            if (this.isModified('bgcolor')) updateData.bgcolor = this.bgcolor;
            if (this.isModified('initial')) updateData.initial = this.initial;
            if (this.isModified('funded')) updateData.funded = this.funded;
            if (this.isModified('performing')) updateData.performing = this.performing;
            if (this.isModified('warning')) updateData.warning = this.warning;
            if (this.isModified('defaulted')) updateData.defaulted = this.defaulted;
            if (this.isModified('closed')) updateData.closed = this.closed;

            if (Object.keys(updateData).length > 0) {
                try {
                    await this.constructor.syncFundingStatusInfo(this._id, updateData);
                } catch (error) {
                    console.error('Error syncing funding status info:', error);
                    // Continue with save even if sync fails
                }
            }
        }
        
        next();
    } catch (err) {
        next(err);
    }
});

// Middleware for direct updateOne operations
FundingStatusSchema.pre('updateOne', { document: false, query: true }, async function(next) {
    const update = this.getUpdate();
    const updateData = {};
    
    // Only sync when name or bgcolor fields change
    if (update.name || (update.$set && update.$set.name)) {
        updateData.name = update.name || update.$set.name;
    }
    
    if (update.bgcolor || (update.$set && update.$set.bgcolor)) {
        updateData.bgcolor = update.bgcolor || update.$set.bgcolor;
    }

    if (update.initial || (update.$set && update.$set.initial)) {
        updateData.initial = update.initial || update.$set.initial;
    }

    if (update.funded || (update.$set && update.$set.funded)) {
        updateData.funded = update.funded || update.$set.funded;
    }

    if (update.performing || (update.$set && update.$set.performing)) {
        updateData.performing = update.performing || update.$set.performing;
    }

    if (update.warning || (update.$set && update.$set.warning)) {
        updateData.warning = update.warning || update.$set.warning;
    }

    if (update.defaulted || (update.$set && update.$set.defaulted)) {
        updateData.defaulted = update.defaulted || update.$set.defaulted;
    }

    if (update.closed || (update.$set && update.$set.closed)) {
        updateData.closed = update.closed || update.$set.closed;
    }
    
    if (Object.keys(updateData).length > 0) {
        const statusId = this.getQuery()._id;
        try {
            await mongoose.model('Funding-Status').syncFundingStatusInfo(statusId, updateData);
        } catch (error) {
            console.error('Error syncing funding status info:', error);
            // Continue with update even if sync fails
        }
    }
    
    next();
});

// Middleware for direct findOneAndUpdate operations
FundingStatusSchema.pre('findOneAndUpdate', { document: false, query: true }, async function(next) {
    const update = this.getUpdate();
    const updateData = {};
    
    // Only sync when name or bgcolor fields change
    if (update.name || (update.$set && update.$set.name)) {
        updateData.name = update.name || update.$set.name;
    }
    
    if (update.bgcolor || (update.$set && update.$set.bgcolor)) {
        updateData.bgcolor = update.bgcolor || update.$set.bgcolor;
    }

    if (update.initial || (update.$set && update.$set.initial)) {
        updateData.initial = update.initial || update.$set.initial;
    }

    if (update.funded || (update.$set && update.$set.funded)) {
        updateData.funded = update.funded || update.$set.funded;
    }

    if (update.performing || (update.$set && update.$set.performing)) {
        updateData.performing = update.performing || update.$set.performing;
    }

    if (update.warning || (update.$set && update.$set.warning)) {
        updateData.warning = update.warning || update.$set.warning;
    }

    if (update.defaulted || (update.$set && update.$set.defaulted)) {
        updateData.defaulted = update.defaulted || update.$set.defaulted;
    }

    if (update.closed || (update.$set && update.$set.closed)) {
        updateData.closed = update.closed || update.$set.closed;
    }
    
    if (Object.keys(updateData).length > 0) {
        const statusId = this.getQuery()._id;
        try {
            await mongoose.model('Funding-Status').syncFundingStatusInfo(statusId, updateData);
        } catch (error) {
            console.error('Error syncing funding status info:', error);
            // Continue with update even if sync fails
        }
    }
    
    next();
});

// Middleware for updateMany operations - requires special handling
FundingStatusSchema.pre('updateMany', { document: false, query: true }, async function(next) {
    const update = this.getUpdate();
    const updateData = {};
    
    // Only sync when name or bgcolor fields change
    if (update.name || (update.$set && update.$set.name)) {
        updateData.name = update.name || update.$set.name;
    }
    
    if (update.bgcolor || (update.$set && update.$set.bgcolor)) {
        updateData.bgcolor = update.bgcolor || update.$set.bgcolor;
    }

    if (update.initial || (update.$set && update.$set.initial)) {
        updateData.initial = update.initial || update.$set.initial;
    }

    if (update.funded || (update.$set && update.$set.funded)) {
        updateData.funded = update.funded || update.$set.funded;
    }

    if (update.performing || (update.$set && update.$set.performing)) {
        updateData.performing = update.performing || update.$set.performing;
    }

    if (update.warning || (update.$set && update.$set.warning)) {
        updateData.warning = update.warning || update.$set.warning;
    }

    if (update.defaulted || (update.$set && update.$set.defaulted)) {
        updateData.defaulted = update.defaulted || update.$set.defaulted;
    }

    if (update.closed || (update.$set && update.$set.closed)) {
        updateData.closed = update.closed || update.$set.closed;
    }
    
    if (Object.keys(updateData).length > 0) {
        const statusQuery = this.getQuery();
        try {
            // First find all statuses that match the query
            const FundingStatus = mongoose.model('Funding-Status');
            const statuses = await FundingStatus.find(statusQuery, '_id');
            const statusIds = statuses.map(status => status._id);
            
            if (statusIds.length > 0) {
                await FundingStatus.syncFundingStatusInfo(statusIds, updateData);
            }
        } catch (error) {
            console.error('Error syncing funding status info:', error);
            // Continue with update even if sync fails
        }
    }
    
    next();
});

// Static method to synchronize redundant data
FundingStatusSchema.statics.synchronizeRedundantData = async function(statusId = null, funderId = null) {
    try {
        let query = {};
        
        if (statusId) {
            query._id = statusId;
        } else if (funderId) {
            query.funder = funderId;
        }
        
        // Get all statuses (or just the specified one/funder's statuses)
        const statuses = await this.find(query);
        
        // For each status, update all related documents
        const results = {
            success: true,
            totalUpdated: 0,
            statusResults: []
        };
        
        for (const status of statuses) {
            // Create data object with only the fields that should be synchronized (name and bgcolor)
            const syncData = {
                name: status.name,
                bgcolor: status.bgcolor,
                initial: status.initial,
                funded: status.funded,
                performing: status.performing,
                warning: status.warning,
                closed: status.closed,
                defaulted: status.defaulted
            };
            
            const result = await this.syncFundingStatusInfo(status, syncData);
            
            let statusUpdated = 0;
            if (result.collections) {
                Object.values(result.collections).forEach(collection => {
                    statusUpdated += collection.updatedCount || 0;
                });
            }
            
            results.statusResults.push({
                statusId: status._id,
                name: status.name,
                funder: status.funder,
                updated: statusUpdated,
                collectionDetails: result.collections
            });
            
            results.totalUpdated += statusUpdated;
        }
        
        return results;
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Convert application status to proper object structure for embedding in other documents
 * @param {Object|string} status - ApplicationStatus object or ID
 * @returns {Promise<Object|undefined>} - Converted status object or undefined
 */
FundingStatusSchema.statics.convertToEmbeddedFormat = async function(status) {
    const statusId = (typeof status === 'string') ? status : (status._id || status.id);
    if (statusId) {
        try {
            const statusDoc = await this.findById(statusId);
            if (statusDoc) {
                return {
                    id: statusDoc._id,
                    name: statusDoc.name,
                    bgcolor: statusDoc.bgcolor,
                    initial: statusDoc.initial,
                    funded: statusDoc.funded,
                    performing: statusDoc.performing,
                    warning: statusDoc.warning,
                    closed: statusDoc.closed,
                    defaulted: statusDoc.defaulted
                };
            }
        } catch (error) {
            console.error('Error fetching funding status details:', error);
            // Continue with creation even if status details can't be fetched
        }
    }
    return undefined;
};

/**
 * Invalidate cache for status-related data (for future caching implementation)
 * @param {string} statusId - Status ID
 * @param {string} funderId - Funder ID
 */
FundingStatusSchema.statics.invalidateCache = function(statusId, funderId) {
    // Placeholder for future cache invalidation logic
    console.log(`Cache invalidation triggered for status: ${statusId}, funder: ${funderId}`);
    
    // Example cache keys that might need invalidation:
    // - `status_${statusId}`
    // - `funder_statuses_${funderId}`
    // - `initial_status_${funderId}`
    // - `application_statuses_${funderId}`
};

const FundingStatus = mongoose.model('Funding-Status', FundingStatusSchema);

module.exports = FundingStatus; 