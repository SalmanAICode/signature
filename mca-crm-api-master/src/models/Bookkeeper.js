const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const AddressSchema = require('./Common/Address');
const Helpers = require('../utils/helpers');

const BookkeeperSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    last_name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    phone_mobile: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    phone_work: {
        type: String,
        trim: true,
        index: true
    },
    phone_home: {
        type: String,
        trim: true,
        index: true
    },
    birthday: {
        type: Date
    },
    address_detail: AddressSchema,
    password: {
        type: String,
        select: false
    },
    last_login: {
        type: Date
    },
    online: {
        type: Boolean,
        default: false
    },
    inactive: {
        type: Boolean,
        default: false
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Define collections that contain bookkeeper info
const across_collections = [
    { collection: 'Document', field: 'upload_bookkeeper'},
    { collection: 'Upload', field: 'upload_bookkeeper'},
    // Add other collections that store bookkeeper data in this format
];

// Reusable function to synchronize bookkeeper information across collections
BookkeeperSchema.statics.syncBookkeeperInfo = async function(ids, data = {}) {
    if (!ids) return { success: false, error: 'Missing required ids parameter' };
    
    try {
        let query = {};
        let updateData = {};
        
        // Handle different types of ids input
        if (Array.isArray(ids)) {
            // Array of bookkeeper ids
            query = { $in: ids };
            updateData = data;
        } else if (typeof ids === 'object' && ids._id) {
            // Single bookkeeper object
            query = ids._id;
            if (!data || Object.keys(data).length === 0) {
                updateData = { first_name: ids.first_name, last_name: ids.last_name, email: ids.email, phone_mobile: ids.phone_mobile };
            } else {
                updateData = data;
            }
        } else {
            // Single bookkeeper ID
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

            // Create update object with bookkeeper.fieldname format
            const updateObject = {};
            for (const [key, value] of Object.entries(data)) {
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
BookkeeperSchema.pre('save', async function(next) {
    // Only run this middleware if certain fields were modified
    const updateData = {};
    if (this.isModified('first_name')) updateData.first_name = this.first_name;
    if (this.isModified('last_name')) updateData.last_name = this.last_name;
    if (this.isModified('email')) updateData.email = this.email;
    if (this.isModified('phone_mobile')) updateData.phone_mobile = this.phone_mobile;

    if (Object.keys(updateData).length > 0) {
        try {
            await this.constructor.syncBookkeeperInfo(this._id, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for direct updateOne operations
BookkeeperSchema.pre('updateOne', { document: false, query: true }, async function(next) {
    const update = this.getUpdate();
    const updateData = {};
    
    // Check for fields that need syncing in both direct and $set updates
    if (update.first_name || (update.$set && update.$set.first_name)) {
        updateData.first_name = update.first_name || update.$set.first_name;
    }
    
    if (update.last_name || (update.$set && update.$set.last_name)) {
        updateData.last_name = update.last_name || update.$set.last_name;
    }

    if (update.email || (update.$set && update.$set.email)) {
        updateData.email = update.email || update.$set.email;
    }

    if (update.phone_mobile || (update.$set && update.$set.phone_mobile)) {
        updateData.phone_mobile = update.phone_mobile || update.$set.phone_mobile;
    }
    
    if (Object.keys(updateData).length > 0) {
        const bookkeeperId = this.getQuery()._id;
        try {
            await mongoose.model('Bookkeeper').syncBookkeeperInfo(bookkeeperId, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for direct findOneAndUpdate operations
BookkeeperSchema.pre('findOneAndUpdate', { document: false, query: true }, async function(next) {
    const update = this.getUpdate();
    const updateData = {};
    
    // Check for fields that need syncing in both direct and $set updates
    if (update.first_name || (update.$set && update.$set.first_name)) {
        updateData.first_name = update.first_name || update.$set.first_name;
    }

    if (update.last_name || (update.$set && update.$set.last_name)) {
        updateData.last_name = update.last_name || update.$set.last_name;
    }
    
    if (update.email || (update.$set && update.$set.email)) {
        updateData.email = update.email || update.$set.email;
    }

    if (update.phone_mobile || (update.$set && update.$set.phone_mobile)) {
        updateData.phone_mobile = update.phone_mobile || update.$set.phone_mobile;
    }
    
    if (Object.keys(updateData).length > 0) {
        const bookkeeperId = this.getQuery()._id;
        try {
            await mongoose.model('Bookkeeper').syncBookkeeperInfo(bookkeeperId, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for updateMany operations - requires special handling
BookkeeperSchema.pre('updateMany', { document: false, query: true }, async function(next) {
    const update = this.getUpdate();
    const updateData = {};
    
    // Check for fields that need syncing in both direct and $set updates
    if (update.first_name || (update.$set && update.$set.first_name)) {
        updateData.first_name = update.first_name || update.$set.first_name;
    }

    if (update.last_name || (update.$set && update.$set.last_name)) {
        updateData.last_name = update.last_name || update.$set.last_name;
    }
    
    if (update.email || (update.$set && update.$set.email)) {
        updateData.email = update.email || update.$set.email;
    }

    if (update.phone_mobile || (update.$set && update.$set.phone_mobile)) {
        updateData.phone_mobile = update.phone_mobile || update.$set.phone_mobile;
    }
    
    if (Object.keys(updateData).length > 0) {
        const bookkeeperQuery = this.getQuery();
        try {
            // First find all bookkeepers that match the query
            const Bookkeeper = mongoose.model('Bookkeeper');
            const bookkeepers = await Bookkeeper.find(bookkeeperQuery, '_id');
            const bookkeeperIds = bookkeepers.map(bookkeeper => bookkeeper._id);
            
            if (bookkeeperIds.length > 0) {
                await Bookkeeper.syncBookkeeperInfo(bookkeeperIds, updateData);
            }
            
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Virtual for funder_list
BookkeeperSchema.virtual('funder_list', {
    ref: 'Bookkeeper-Funder',
    localField: '_id',
    foreignField: 'bookkeeper'
});

// Virtual for access_log_list
BookkeeperSchema.virtual('access_log_list', {
    ref: 'Bookkeeper-Access-Log',
    localField: '_id',
    foreignField: 'bookkeeper'
});

// Hash password before saving
BookkeeperSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
  
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match password
BookkeeperSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Convert Bookkeeper to proper object structure for embedding in other documents
 * @param {Object|string} bookkeeper - Bookkeeper object or ID
 * @returns {Promise<Object|undefined>} - Converted Bookkeeper object or undefined
 */
BookkeeperSchema.statics.convertToEmbeddedFormat = async function(bookkeeper) {
    const bookkeeperId = Helpers.extractIdString(bookkeeper);
    if (bookkeeperId) {
        try {
            const bookkeeperDoc = await this.findById(bookkeeperId).lean();
            if (bookkeeperDoc) {
                return {
                    id: bookkeeperDoc._id,
                    first_name: bookkeeperDoc.first_name,
                    last_name: bookkeeperDoc.last_name,
                    email: bookkeeperDoc.email,
                    phone_mobile: bookkeeperDoc.phone_mobile
                };
            }
        } catch (error) {
            console.error('Error fetching Bookkeeper details:', error);
            // Continue with creation even if Bookkeeper details can't be fetched
        }
    }
    return undefined;
};

const Bookkeeper = mongoose.model('Bookkeeper', BookkeeperSchema);

module.exports = Bookkeeper; 