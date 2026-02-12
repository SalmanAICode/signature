const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const AddressSchema = require('./Common/Address');
const Helpers = require('../utils/helpers');

const AdminSchema = new mongoose.Schema({
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
        type: Date,
        trim: true,
        index: true
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
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual field for access_log_count
AdminSchema.virtual('access_log_count', {
    ref: 'Admin-Access-Log',
    localField: '_id',
    foreignField: 'admin',
    count: true
});

// Define collections that contain admin info
const across_collections = [
    { collection: 'Document', field: 'upload_admin'},
    { collection: 'Upload', field: 'upload_admin'},
    // Add other collections that store admin data in this format
];

// Reusable function to synchronize admin information across collections
AdminSchema.statics.syncAdminInfo = async function(ids, data = {}) {
    if (!ids) return { success: false, error: 'Missing required ids parameter' };
    
    try {
        let query = {};
        let updateData = {};
        
        // Handle different types of ids input
        if (Array.isArray(ids)) {
            // Array of admin ids
            query = { $in: ids };
            updateData = data;
        } else if (typeof ids === 'object' && ids._id) {
            // Single admin object
            query = ids._id;
            if (!data || Object.keys(data).length === 0) {
                updateData = { first_name: ids.first_name, last_name: ids.last_name, email: ids.email, phone_mobile: ids.phone_mobile };
            } else {
                updateData = data;
            }
        } else {
            // Single admin ID
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

            // Create update object with admin.fieldname format
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
AdminSchema.pre('save', async function(next) {
    // Only run this middleware if certain fields were modified
    const updateData = {};
    if (this.isModified('first_name')) updateData.first_name = this.first_name;
    if (this.isModified('last_name')) updateData.last_name = this.last_name;
    if (this.isModified('email')) updateData.email = this.email;
    if (this.isModified('phone_mobile')) updateData.phone_mobile = this.phone_mobile;

    if (Object.keys(updateData).length > 0) {
        try {
            await this.constructor.syncAdminInfo(this._id, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for direct updateOne operations
AdminSchema.pre('updateOne', { document: false, query: true }, async function(next) {
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
        const adminId = this.getQuery()._id;
        try {
            await mongoose.model('Admin').syncAdminInfo(adminId, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for direct findOneAndUpdate operations
AdminSchema.pre('findOneAndUpdate', { document: false, query: true }, async function(next) {
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
        const adminId = this.getQuery()._id;
        try {
            await mongoose.model('Admin').syncAdminInfo(adminId, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for updateMany operations - requires special handling
AdminSchema.pre('updateMany', { document: false, query: true }, async function(next) {
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
        const adminQuery = this.getQuery();
        try {
            // First find all admins that match the query
            const Admin = mongoose.model('Admin');
            const admins = await Admin.find(adminQuery, '_id');
            const adminIds = admins.map(admin => admin._id);
            
            if (adminIds.length > 0) {
                await Admin.syncAdminInfo(adminIds, updateData);
            }
            
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Virtual for access_log_list
AdminSchema.virtual('access_log_list', {
    ref: 'Admin-Access-Log',
    localField: '_id',
    foreignField: 'admin'
});

// Pre-save middleware for password hashing and updated_date
AdminSchema.pre('save', async function(next) {
    try {
        // Hash password if it's modified
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
AdminSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Convert Admin to proper object structure for embedding in other documents
 * @param {Object|string} admin - Admin object or ID
 * @returns {Promise<Object|undefined>} - Converted Admin object or undefined
 */
AdminSchema.statics.convertToEmbeddedFormat = async function(admin) {
    const adminId = Helpers.extractIdString(admin);
    if (adminId) {
        try {
            const adminDoc = await this.findById(adminId).lean();
            if (adminDoc) {
                return {
                    id: adminDoc._id,
                    first_name: adminDoc.first_name,
                    last_name: adminDoc.last_name,
                    email: adminDoc.email,
                    phone_mobile: adminDoc.phone_mobile
                };
            }
        } catch (error) {
            console.error('Error fetching Admin details:', error);
            // Continue with creation even if Admin details can't be fetched
        }
    }
    return undefined;
};

const Admin = mongoose.model('Admin', AdminSchema);

module.exports = Admin; 