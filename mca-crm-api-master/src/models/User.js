const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const AddressSchema = require('./Common/Address');

const { ROLES } = require('../utils/permissions');
const Helpers = require('../utils/helpers');

const UserSchema = new mongoose.Schema({
    first_name: {
        type: String,
        trim: true,
        index: true
    },
    last_name: {
        type: String,
        trim: true,
        index: true
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true,
        index: true
    },
    phone_mobile: {
        type: String,
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
    type: {
        type: String,
        enum: [ROLES.FUNDER_MANAGER, ROLES.FUNDER_USER],
        default: ROLES.FUNDER_USER,
        required: true,
    },
    permission_list: [{
        type: String,
        trim: true
    }],
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
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for access_log_count
UserSchema.virtual('access_log_count', {
    ref: 'User-Access-Log',
    localField: '_id',
    foreignField: 'user',
    count: true
});

// Virtual for funder_count
UserSchema.virtual('funder_count', {
    ref: 'User-Funder',
    localField: '_id',
    foreignField: 'user',
    count: true
});

// Define collections that contain user info
const across_collections = [
    { collection: 'Document', field: 'upload_user'},
    { collection: 'Upload', field: 'upload_user'},
    { collection: 'Application', field: 'assigned_manager'},
    { collection: 'Application', field: 'assigned_user'},
    { collection: 'Application-History', field: 'assigned_manager'},
    { collection: 'Application-History', field: 'assigned_user'},
    { collection: 'Funding', field: 'assigned_manager'},
    { collection: 'Funding', field: 'assigned_user'}
    // Add other collections that store user data in this format
];

// Reusable function to synchronize user information across collections
UserSchema.statics.syncUserInfo = async function(ids, data = {}) {
    if (!ids) return { success: false, error: 'Missing required ids parameter' };
    
    try {
        let query = {};
        let updateData = {};
        
        // Handle different types of ids input
        if (Array.isArray(ids)) {
            // Array of user ids
            query = { $in: ids };
            updateData = data;
        } else if (typeof ids === 'object' && ids._id) {
            // Single user object
            query = ids._id;
            if (!data || Object.keys(data).length === 0) {
                updateData = { first_name: ids.first_name, last_name: ids.last_name, email: ids.email, phone_mobile: ids.phone_mobile };
            } else {
                updateData = data;
            }
        } else {
            // Single user ID
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

            // Create update object with user.fieldname format
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
UserSchema.pre('save', async function(next) {
    // Only run this middleware if certain fields were modified
    const updateData = {};
    if (this.isModified('first_name')) updateData.first_name = this.first_name;
    if (this.isModified('last_name')) updateData.last_name = this.last_name;
    if (this.isModified('email')) updateData.email = this.email;
    if (this.isModified('phone_mobile')) updateData.phone_mobile = this.phone_mobile;

    if (Object.keys(updateData).length > 0) {
        try {
            await this.constructor.syncUserInfo(this._id, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for direct updateOne operations
UserSchema.pre('updateOne', { document: false, query: true }, async function(next) {
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
        const userId = this.getQuery()._id;
        try {
            await mongoose.model('User').syncUserInfo(userId, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for direct findOneAndUpdate operations
UserSchema.pre('findOneAndUpdate', { document: false, query: true }, async function(next) {
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
        const userId = this.getQuery()._id;
        try {
            await mongoose.model('User').syncUserInfo(userId, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for updateMany operations - requires special handling
UserSchema.pre('updateMany', { document: false, query: true }, async function(next) {
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
        const userQuery = this.getQuery();
        try {
            // First find all users that match the query
            const User = mongoose.model('User');
            const users = await User.find(userQuery, '_id');
            const userIds = users.map(user => user._id);
            
            if (userIds.length > 0) {
                await User.syncUserInfo(userIds, updateData);
            }
            
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
    try {
        if (this.isModified('password')) {    
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        }

        next();
    } catch (err) {
        next(err);
    }
});

// Match password
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Convert User to proper object structure for embedding in other documents
 * @param {Object|string} user - User object or ID
 * @returns {Promise<Object|undefined>} - Converted User object or undefined
 */
UserSchema.statics.convertToEmbeddedFormat = async function(user) {
    const userId = Helpers.extractIdString(user);
    if (userId) {
        try {
            const userDoc = await this.findById(userId);
            if (userDoc) {
                return {
                    id: userDoc._id,
                    first_name: userDoc.first_name,
                    last_name: userDoc.last_name,
                    email: userDoc.email,
                    phone_mobile: userDoc.phone_mobile
                };
            }
        } catch (error) {
            console.error('Error fetching User details:', error);
            // Continue with creation even if User details can't be fetched
        }
    }
    return undefined;
};

const User = mongoose.model('User', UserSchema);

module.exports = User; 