const mongoose = require('mongoose');

const Helpers = require('../utils/helpers');

const StipulationTypeSchema = new mongoose.Schema({
    funder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funder',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    required: {
        type: Boolean,
        default: false,
        index: true
    },
    inactive: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    timestamps: true
});

// Define collections that contain embedded stipulation type data
const across_collections = [
    { collection: 'Application-Stipulation', field: 'stipulation'}
    // Add other collections that store stipulation type data in this format
];

// Reusable function to synchronize stipulation type information across collections
StipulationTypeSchema.statics.syncStipulationTypeInfo = async function(ids, data = {}) {
    if (!ids) return { success: false, error: 'Missing required ids parameter' };
    
    try {
        let query = {};
        let updateData = {};
        
        // Handle different types of ids input
        if (Array.isArray(ids)) {
            // Array of stipulation type ids
            query = { $in: ids };
            updateData = data;
        } else if (typeof ids === 'object' && ids._id) {
            // Single stipulation type object
            query = ids._id;
            if (!data || Object.keys(data).length === 0) {
                updateData = { name: ids.name, required: ids.required };
            } else {
                updateData = data;
            }
        } else {
            // Single stipulation type ID
            query = ids;
            updateData = data;
        }

        if (!updateData || Object.keys(updateData).length === 0) return { success: false, error: 'Missing required data parameter' };
                
        const results = {
            success: true,
            collections: {}
        };

        // Update across collections
        for (const { collection, field } of across_collections) {
            const Model = mongoose.model(collection);

            // Create update object with stipulation.fieldname format
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

// Middleware to update redundant data in related collections
StipulationTypeSchema.pre('save', async function(next) {
    // Only run this middleware if certain fields were modified
    const updateData = {};
    if (this.isModified('name')) updateData.name = this.name;
    if (this.isModified('required')) updateData.required = this.required;

    if (Object.keys(updateData).length > 0) {
        try {
            await this.constructor.syncStipulationTypeInfo(this._id, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for direct updateOne operations
StipulationTypeSchema.pre('updateOne', { document: false, query: true }, async function(next) {
    const update = this.getUpdate();
    const updateData = {};
    
    // Check for fields that need syncing in both direct and $set updates
    if (update.name || (update.$set && update.$set.name)) {
        updateData.name = update.name || update.$set.name;
    }
    
    if (update.required !== undefined || (update.$set && update.$set.required !== undefined)) {
        updateData.required = update.required !== undefined ? update.required : update.$set.required;
    }
    
    if (Object.keys(updateData).length > 0) {
        const stipulationTypeId = this.getQuery()._id;
        try {
            await mongoose.model('Stipulation-Type').syncStipulationTypeInfo(stipulationTypeId, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for direct findOneAndUpdate operations
StipulationTypeSchema.pre('findOneAndUpdate', { document: false, query: true }, async function(next) {
    const update = this.getUpdate();
    const updateData = {};
    
    // Check for fields that need syncing in both direct and $set updates
    if (update.name || (update.$set && update.$set.name)) {
        updateData.name = update.name || update.$set.name;
    }
    
    if (update.required !== undefined || (update.$set && update.$set.required !== undefined)) {
        updateData.required = update.required !== undefined ? update.required : update.$set.required;
    }
    
    if (Object.keys(updateData).length > 0) {
        const stipulationTypeId = this.getQuery()._id;
        try {
            await mongoose.model('Stipulation-Type').syncStipulationTypeInfo(stipulationTypeId, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for updateMany operations - requires special handling
StipulationTypeSchema.pre('updateMany', { document: false, query: true }, async function(next) {
    const update = this.getUpdate();
    const updateData = {};
    
    // Check for fields that need syncing in both direct and $set updates
    if (update.name || (update.$set && update.$set.name)) {
        updateData.name = update.name || update.$set.name;
    }
    
    if (update.required !== undefined || (update.$set && update.$set.required !== undefined)) {
        updateData.required = update.required !== undefined ? update.required : update.$set.required;
    }
    
    if (Object.keys(updateData).length > 0) {
        const stipulationTypeQuery = this.getQuery();
        try {
            // First find all stipulation types that match the query
            const StipulationType = mongoose.model('Stipulation-Type');
            const stipulationTypes = await StipulationType.find(stipulationTypeQuery, '_id');
            const stipulationTypeIds = stipulationTypes.map(st => st._id);
            
            if (stipulationTypeIds.length > 0) {
                await StipulationType.syncStipulationTypeInfo(stipulationTypeIds, updateData);
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
 * Convert stipulation to proper object structure for embedding in other documents
 * @param {Object|string} stipulation - Stipulation object or ID
 * @returns {Promise<Object|undefined>} - Converted stipulation object or undefined
 */
StipulationTypeSchema.statics.convertToEmbeddedFormat = async function(stipulation) {
    const stipulationTypeId = Helpers.extractIdString(stipulation);
    if (stipulationTypeId) {
        try {
            const stipulationTypeDoc = await this.findById(stipulationTypeId);
            if (stipulationTypeDoc) {
                return {
                    id: stipulationTypeDoc._id,
                    name: stipulationTypeDoc.name,
                    required: stipulationTypeDoc.required
                };
            }
        } catch (error) {
            console.error('Error fetching stipulation details:', error);
            // Continue with creation even if stipulation details can't be fetched
        }
    }
    return undefined;
};

const StipulationType = mongoose.model('Stipulation-Type', StipulationTypeSchema);

module.exports = StipulationType; 