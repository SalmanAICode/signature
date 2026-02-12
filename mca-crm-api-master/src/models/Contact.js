const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const AddressSchema = require('./Common/Address');
const Helpers = require('../utils/helpers');

const ContactSchema = new mongoose.Schema({
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
    ssn: {
        type: String,
        trim: true,
        select: false // Protect sensitive data
    },
    fico_score: {
        type: Number
    },
    birthday: {
        type: Date
    },
    drivers_license_number: {
        type: String,
        trim: true,
        select: false // Protect sensitive data
    },
    dln_issue_date: {
        type: Date
    },
    dln_issue_state: {
        type: String,
        trim: true
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
        default: false,
        index: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Define collections that contain contact info
const across_collections = [
    { collection: 'Document', field: 'upload_contact'},
    { collection: 'Upload', field: 'upload_contact'},
    { collection: 'Application', field: 'contact'},
    { collection: 'Merchant', field: 'primary_contact'},
    { collection: 'Merchant', field: 'primary_owner'},
    // Add other collections that store contact data in this format
];

// Reusable function to synchronize contact information across collections
ContactSchema.statics.syncContactInfo = async function(ids, data = {}) {
    if (!ids) return { success: false, error: 'Missing required ids parameter' };
    
    try {
        let query = {};
        let updateData = {};
        
        // Handle different types of ids input
        if (Array.isArray(ids)) {
            // Array of contact ids
            query = { $in: ids };
            updateData = data;
        } else if (typeof ids === 'object' && ids._id) {
            // Single contact object
            query = ids._id;
            if (!data || Object.keys(data).length === 0) {
                updateData = { first_name: ids.first_name, last_name: ids.last_name, email: ids.email, phone_mobile: ids.phone_mobile };
            } else {
                updateData = data;
            }
        } else {
            // Single contact ID
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

            // Create update object with contact.fieldname format
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
ContactSchema.pre('save', async function(next) {
    // Only run this middleware if certain fields were modified
    const updateData = {};
    if (this.isModified('first_name')) updateData.first_name = this.first_name;
    if (this.isModified('last_name')) updateData.last_name = this.last_name;
    if (this.isModified('email')) updateData.email = this.email;
    if (this.isModified('phone_mobile')) updateData.phone_mobile = this.phone_mobile;

    if (Object.keys(updateData).length > 0) {
        try {
            await this.constructor.syncContactInfo(this._id, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for direct updateOne operations
ContactSchema.pre('updateOne', { document: false, query: true }, async function(next) {
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
        const contactId = this.getQuery()._id;
        try {
            await mongoose.model('Contact').syncContactInfo(contactId, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for direct findOneAndUpdate operations
ContactSchema.pre('findOneAndUpdate', { document: false, query: true }, async function(next) {
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
        const contactId = this.getQuery()._id;
        try {
            await mongoose.model('Contact').syncContactInfo(contactId, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for updateMany operations - requires special handling
ContactSchema.pre('updateMany', { document: false, query: true }, async function(next) {
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
        const contactQuery = this.getQuery();
        try {
            // First find all contacts that match the query
            const Contact = mongoose.model('Contact');
            const contacts = await Contact.find(contactQuery, '_id');
            const contactIds = contacts.map(contact => contact._id);
            
            if (contactIds.length > 0) {
                await Contact.syncContactInfo(contactIds, updateData);
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
ContactSchema.virtual('access_log_count', {
    ref: 'Contact-Access-Log',
    localField: '_id',
    foreignField: 'contact',
    count: true
});

// Virtual for merchant_count
ContactSchema.virtual('merchant_count', {
    ref: 'Contact-Merchant',
    localField: '_id',
    foreignField: 'contact',
    count: true
});

// Hash password before saving
ContactSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
  
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match password
ContactSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Update the updated_date
ContactSchema.pre('save', function(next) {
    this.updated_date = Date.now();
    next();
});

/**
 * Convert Contact to proper object structure for embedding in other documents
 * @param {Object|string} contact - Contact object or ID
 * @returns {Promise<Object|undefined>} - Converted Contact object or undefined
 */
ContactSchema.statics.convertToEmbeddedFormat = async function(contact) {
    const contactId = Helpers.extractIdString(contact);
    if (contactId) {
        try {
            const contactDoc = await this.findById(contactId).lean();
            if (contactDoc) {
                return {
                    id: contactDoc._id,
                    first_name: contactDoc.first_name,
                    last_name: contactDoc.last_name,
                    email: contactDoc.email,
                    phone_mobile: contactDoc.phone_mobile
                };
            }
        } catch (error) {
            console.error('Error fetching Contact details:', error);
            // Continue with creation even if Contact details can't be fetched
        }
    }
    return undefined;
};

const Contact = mongoose.model('Contact', ContactSchema);

module.exports = Contact; 