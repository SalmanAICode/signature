const mongoose = require('mongoose');

const Helpers = require('../utils/helpers');

const ExpenseTypeSchema = new mongoose.Schema({
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
    commission: {
        type: Boolean,
        default: false
    },
    syndication: {
        type: Boolean,
        default: false
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

// Reusable function to synchronize expense type information across collections
ExpenseTypeSchema.statics.syncExpenseTypeInfo = async function(ids, data = {}) {
    if (!ids) return { success: false, error: 'Missing required ids parameter' };
    
    try {
        let query = {};
        let updateData = {};
        
        // Handle different types of ids input
        if (Array.isArray(ids)) {
            // Array of expense type ids
            query = { $in: ids };
            updateData = data;
        } else if (typeof ids === 'object' && ids._id) {
            // Single expense type object
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
            // Single expense type ID
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
ExpenseTypeSchema.pre('save', async function(next) {
    // Only run this middleware if certain fields were modified
    const updateData = {};
    if (this.isModified('name')) updateData.name = this.name;
    if (this.isModified('formula')) updateData.formula = this.formula;

    if (Object.keys(updateData).length > 0) {
        try {
            await this.constructor.syncExpenseTypeInfo(this._id, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for direct updateOne operations
ExpenseTypeSchema.pre('updateOne', { document: false, query: true }, async function(next) {
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
        const expenseTypeId = this.getQuery()._id;
        try {
            await mongoose.model('Expense-Type').syncExpenseTypeInfo(expenseTypeId, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for direct findOneAndUpdate operations
ExpenseTypeSchema.pre('findOneAndUpdate', { document: false, query: true }, async function(next) {
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
        const expenseTypeId = this.getQuery()._id;
        try {
            await mongoose.model('Expense-Type').syncExpenseTypeInfo(expenseTypeId, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for updateMany operations - requires special handling
ExpenseTypeSchema.pre('updateMany', { document: false, query: true }, async function(next) {
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
        const expenseTypeQuery = this.getQuery();
        try {
            // First find all expense types that match the query
            const ExpenseType = mongoose.model('Expense-Type');
            const expenseTypes = await ExpenseType.find(expenseTypeQuery, '_id');
            const expenseTypeIds = expenseTypes.map(et => et._id);
            
            if (expenseTypeIds.length > 0) {
                await ExpenseType.syncExpenseTypeInfo(expenseTypeIds, updateData);
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
ExpenseTypeSchema.statics.convertToEmbeddedFormat = async function(expenseType) {
    const expenseTypeId = Helpers.extractIdString(expenseType);
    if (expenseTypeId) {
        try {
            const expenseTypeDoc = await this.findById(expenseTypeId).lean();
            if (expenseTypeDoc) {
                return {
                    id: expenseTypeDoc._id,
                    name: expenseTypeDoc.name,
                    formula: expenseTypeDoc.formula,
                    syndication: expenseTypeDoc.syndication
                };
            }
        } catch (error) {
            console.error('Error fetching expense type details:', error);
            // Continue with creation even if expense type details can't be fetched
        }
    }
    return undefined;
};

const ExpenseType = mongoose.model('Expense-Type', ExpenseTypeSchema);

module.exports = ExpenseType; 