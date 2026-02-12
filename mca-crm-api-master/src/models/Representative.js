const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const AddressSchema = require('./Common/Address');

const { ROLES } = require('../utils/permissions');
const Helpers = require('../utils/helpers');


const RepresentativeSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true
    },
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
        enum: [ROLES.ISO_MANAGER, ROLES.ISO_SALES],
        default: ROLES.ISO_SALES,
        required: true,
    },
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

// Define collections that contain representative info
const across_collections = [
    { collection: 'ISO', field: 'primary_representative'},
    { collection: 'Document', field: 'upload_representative'},
    { collection: 'Upload', field: 'upload_representative'},
    { collection: 'Application', field: 'representative'},
    // Add other collections that store representative data in this format
];

// Reusable function to synchronize representative information across collections
RepresentativeSchema.statics.syncRepresentativeInfo = async function(ids, data = {}) {
    if (!ids) return { success: false, error: 'Missing required ids parameter' };
    
    try {
        let query = {};
        let updateData = {};
        
        // Handle different types of ids input
        if (Array.isArray(ids)) {
            // Array of representative ids
            query = { $in: ids };
            updateData = data;
        } else if (typeof ids === 'object' && ids._id) {
            // Single representative object
            query = ids._id;
            if (!data || Object.keys(data).length === 0) {
                updateData = { first_name: ids.first_name, last_name: ids.last_name, email: ids.email, phone_mobile: ids.phone_mobile };
            } else {
                updateData = data;
            }
        } else {
            // Single representative ID
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

            // Create update object with representative.fieldname format
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
RepresentativeSchema.pre('save', async function(next) {
    // Only run this middleware if certain fields were modified
    const updateData = {};
    if (this.isModified('first_name')) updateData.first_name = this.first_name;
    if (this.isModified('last_name')) updateData.last_name = this.last_name;
    if (this.isModified('email')) updateData.email = this.email;
    if (this.isModified('phone_mobile')) updateData.phone_mobile = this.phone_mobile;

    if (Object.keys(updateData).length > 0) {
        try {
            await this.constructor.syncRepresentativeInfo(this._id, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for direct updateOne operations
RepresentativeSchema.pre('updateOne', { document: false, query: true }, async function(next) {
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
        const representativeId = this.getQuery()._id;
        try {
            await mongoose.model('Representative').syncRepresentativeInfo(representativeId, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for direct findOneAndUpdate operations
RepresentativeSchema.pre('findOneAndUpdate', { document: false, query: true }, async function(next) {
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
        const representativeId = this.getQuery()._id;
        try {
            await mongoose.model('Representative').syncRepresentativeInfo(representativeId, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for updateMany operations - requires special handling
RepresentativeSchema.pre('updateMany', { document: false, query: true }, async function(next) {
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
        const representativeQuery = this.getQuery();
        try {
            // First find all representatives that match the query
            const Representative = mongoose.model('Representative');
            const representatives = await Representative.find(representativeQuery, '_id');
            const representativeIds = representatives.map(representative => representative._id);
            
            if (representativeIds.length > 0) {
                await Representative.syncRepresentativeInfo(representativeIds, updateData);
            }
            
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Virtual for access_log_count
RepresentativeSchema.virtual('access_log_count', {
    ref: 'Representative-Access-Log',
    localField: '_id',
    foreignField: 'representative',
    count: true
});

// Virtual for iso_count
RepresentativeSchema.virtual('iso_count', {
    ref: 'Representative-ISO',
    localField: '_id',
    foreignField: 'representative',
    count: true
});

// Hash password before saving
RepresentativeSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
  
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match password
RepresentativeSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Update the updated_date
RepresentativeSchema.pre('save', function(next) {
    this.updated_date = Date.now();
    next();
});

/**
 * Convert Representative to proper object structure for embedding in other documents
 * @param {Object|string} representative - Representative object or ID
 * @returns {Promise<Object|undefined>} - Converted Representative object or undefined
 */
RepresentativeSchema.statics.convertToEmbeddedFormat = async function(representative) {
    const representativeId = Helpers.extractIdString(representative);
    if (representativeId) {
        try {
            const representativeDoc = await this.findById(representativeId);
            if (representativeDoc) {
                return {
                    id: representativeDoc._id,
                    first_name: representativeDoc.first_name,
                    last_name: representativeDoc.last_name,
                    email: representativeDoc.email,
                    phone_mobile: representativeDoc.phone_mobile
                };
            }
        } catch (error) {
            console.error('Error fetching Representative details:', error);
            // Continue with creation even if Representative details can't be fetched
        }
    }
    return undefined;
};

const Representative = mongoose.model('Representative', RepresentativeSchema);

module.exports = Representative; 