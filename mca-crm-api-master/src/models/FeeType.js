const mongoose = require('mongoose');

const Helpers = require('../utils/helpers');

const FeeTypeSchema = new mongoose.Schema({
    funder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funder',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    formula: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Formula',
        default: null
    },
    upfront: {
        type: Boolean,
        default: false
    },
    syndication: {
        type: Boolean,
        default: true
    },
    default: {
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

// Define collections that contain embedded fee type data
const across_collections = [
    //{ collection: 'Application-Offer', field: 'fee_list', nestedField: 'fee_type'},
    //{ collection: 'Funding', field: 'upfront_fee_list', nestedField: 'fee_type'},
    //{ collection: 'Funding-Fee', field: 'fee_type'},
    // Add other collections that store fee type data in this format
];

// Reusable function to synchronize fee type information across collections
FeeTypeSchema.statics.syncFeeTypeInfo = async function(ids, data = {}) {
    if (!ids) return { success: false, error: 'Missing required ids parameter' };
    
    try {
        let query = {};
        let updateData = {};
        
        // Handle different types of ids input
        if (Array.isArray(ids)) {
            // Array of fee type ids
            query = { $in: ids };
            updateData = data;
        } else if (typeof ids === 'object' && ids._id) {
            // Single fee type object
            query = ids._id;
            if (!data || Object.keys(data).length === 0) {
                updateData = { 
                    name: ids.name,
                    formula: ids.formula,
                    syndication: ids.syndication
                };
            } else {
                updateData = data;
            }
        } else {
            // Single fee type ID
            query = ids;
            updateData = data;
        }

        if (!updateData || Object.keys(updateData).length === 0) return { success: false, error: 'Missing required data parameter' };
                
        const results = {
            success: true,
            collections: {}
        };

        // Update across collections
        for (const { collection, field, nestedField } of across_collections) {
            const Model = mongoose.model(collection);

            // Create update object for nested array fields (like fee_list.$.fee_type.name)
            const updateObject = {};
            for (const [key, value] of Object.entries(updateData)) {
                if (nestedField) {
                    updateObject[`${field}.$.${nestedField}.${key}`] = value;
                } else {
                    updateObject[`${field}.${key}`] = value;
                }
            }

            const result = await Model.updateMany(
                nestedField ? { [ `${field}.${nestedField}.id`]: query } : { [ `${field}.id`]: query },
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

// Middleware to update redundant data in related collections
FeeTypeSchema.pre('save', async function(next) {
    // Only run this middleware if certain fields were modified
    const updateData = {};
    if (this.isModified('name')) updateData.name = this.name;
    if (this.isModified('formula')) updateData.formula = this.formula;

    if (Object.keys(updateData).length > 0) {
        try {
            await this.constructor.syncFeeTypeInfo(this._id, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for direct updateOne operations
FeeTypeSchema.pre('updateOne', { document: false, query: true }, async function(next) {
    const update = this.getUpdate();
    const updateData = {};
    
    // Check for fields that need syncing in both direct and $set updates
    if (update.name || (update.$set && update.$set.name)) {
        updateData.name = update.name || update.$set.name;
    }

    if (update.formula || (update.$set && update.$set.formula)) {
        updateData.formula = update.formula || update.$set.formula;
    }
    
    if (Object.keys(updateData).length > 0) {
        const feeTypeId = this.getQuery()._id;
        try {
            await mongoose.model('Fee-Type').syncFeeTypeInfo(feeTypeId, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for direct findOneAndUpdate operations
FeeTypeSchema.pre('findOneAndUpdate', { document: false, query: true }, async function(next) {
    const update = this.getUpdate();
    const updateData = {};
    
    // Check for fields that need syncing in both direct and $set updates
    if (update.name || (update.$set && update.$set.name)) {
        updateData.name = update.name || update.$set.name;
    }

    if (update.formula || (update.$set && update.$set.formula)) {
        updateData.formula = update.formula || update.$set.formula;
    }
    
    if (Object.keys(updateData).length > 0) {
        const feeTypeId = this.getQuery()._id;
        try {
            await mongoose.model('Fee-Type').syncFeeTypeInfo(feeTypeId, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for updateMany operations - requires special handling
FeeTypeSchema.pre('updateMany', { document: false, query: true }, async function(next) {
    const update = this.getUpdate();
    const updateData = {};
    
    // Check for fields that need syncing in both direct and $set updates
    if (update.name || (update.$set && update.$set.name)) {
        updateData.name = update.name || update.$set.name;
    }

    if (update.formula || (update.$set && update.$set.formula)) {
        updateData.formula = update.formula || update.$set.formula;
    }
    
    if (Object.keys(updateData).length > 0) {
        const feeTypeQuery = this.getQuery();
        try {
            // First find all fee types that match the query
            const FeeType = mongoose.model('Fee-Type');
            const feeTypes = await FeeType.find(feeTypeQuery, '_id');
            const feeTypeIds = feeTypes.map(ft => ft._id);
            
            if (feeTypeIds.length > 0) {
                await FeeType.syncFeeTypeInfo(feeTypeIds, updateData);
            }
            
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

/**
 * Convert fee type to proper object structure for embedding in other documents
 * @param {Object|string} feeType - Fee type object or ID
 * @returns {Promise<Object|undefined>} - Converted fee type object or undefined
 */
FeeTypeSchema.statics.convertToEmbeddedFormat = async function(feeType) {
    const feeTypeId = Helpers.extractIdString(feeType);
    if (feeTypeId) {
        try {
            const feeTypeDoc = await this.findById(feeTypeId).lean();
            if (feeTypeDoc) {
                return {
                    id: feeTypeDoc._id,
                    name: feeTypeDoc.name,
                    formula: feeTypeDoc.formula,
                    syndication: feeTypeDoc.syndication
                };
            }
        } catch (error) {
            console.error('Error fetching fee type details:', error);
            // Continue with creation even if fee type details can't be fetched
        }
    }
    return undefined;
};

const FeeType = mongoose.model('Fee-Type', FeeTypeSchema);

module.exports = FeeType; 