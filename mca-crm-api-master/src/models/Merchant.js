const mongoose = require('mongoose');

const ContactMerchant = require('./ContactMerchant');
const ISOMerchant = require('./ISOMerchant');
const MerchantFunder = require('./MerchantFunder');
const MerchantAccount = require('./MerchantAccount');
const Application = require('./Application');
const Funding = require('./Funding');


const AddressSchema = require('./Common/Address');
const BusinessDetailSchema = require('./Common/BusinessDetail');
const Helpers = require('../utils/helpers');

const MerchantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    dba_name: {
        type: String,
        trim: true,
        index: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        index: true
    },
    phone: {
        type: String,
        trim: true,
        index: true
    },
    website: {
        type: String,
        trim: true
    },
    sic_detail: {
        code: String,
        description: String
    },
    naics_detail: {
        code: String,
        title: String,
        description: String
    },
    business_detail: BusinessDetailSchema,
    address_list: [AddressSchema],
    primary_contact: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Contact',
            index: true
        },
        first_name: { type: String, index: true },
        last_name: { type: String, index: true },
        email: { type: String, index: true },
        phone_mobile: { type: String, index: true },
    },
    primary_owner: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Contact',
            index: true
        },
        first_name: { type: String, index: true },
        last_name: { type: String, index: true },
        email: { type: String, index: true },
        phone_mobile: { type: String, index: true },
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

const across_collections = [
    { collection: 'Document', field: 'merchant'},
    { collection: 'Application', field: 'merchant'},
    { collection: 'Application-Offer', field: 'merchant'},
    { collection: 'Funding', field: 'merchant'},
    { collection: 'Transaction', field: 'sender'},
    { collection: 'Transaction', field: 'receiver'},
    // Add other collections that store merchant data in this format
];

// Reusable function to synchronize merchant information across collections
MerchantSchema.statics.syncMerchantInfo = async function(ids, data = {}) {
    if (!ids) return { success: false, error: 'Missing required ids parameter' };
    
    try {
        let query = {};
        let updateData = {};
        
        // Handle different types of ids input
        if (Array.isArray(ids)) {
            // Array of merchant ids
            query = { $in: ids };
            updateData = data;
        } else if (typeof ids === 'object' && ids._id) {
            // Single merchant object
            query = ids._id;
            if (!data || Object.keys(data).length === 0) {
                updateData = { name: ids.name, email: ids.email, phone: ids.phone };
            } else {
                updateData = data;
            }
        } else {
            // Single merchant ID
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

            // Create update object with merchant.fieldname format
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
MerchantSchema.pre('save', async function(next) {
    // Only run this middleware if certain fields were modified
    const updateData = {};
    if (this.isModified('name')) updateData.name = this.name;
    if (this.isModified('dba_name')) updateData.dba_name = this.dba_name;
    if (this.isModified('email')) updateData.email = this.email;
    if (this.isModified('phone')) updateData.phone = this.phone;

    if (Object.keys(updateData).length > 0) {
        try {
            await this.constructor.syncMerchantInfo(this._id, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for direct updateOne operations
MerchantSchema.pre('updateOne', { document: false, query: true }, async function(next) {
    const update = this.getUpdate();
    const updateData = {};
    
    // Check for fields that need syncing in both direct and $set updates
    if (update.name || (update.$set && update.$set.name)) {
        updateData.name = update.name || update.$set.name;
    }

    if (update.dba_name || (update.$set && update.$set.dba_name)) {
        updateData.dba_name = update.dba_name || update.$set.dba_name;
    }

    if (update.email || (update.$set && update.$set.email)) {
        updateData.email = update.email || update.$set.email;
    }

    if (update.phone || (update.$set && update.$set.phone)) {
        updateData.phone = update.phone || update.$set.phone;
    }
    
    if (Object.keys(updateData).length > 0) {
        const merchantId = this.getQuery()._id;
        try {
            await mongoose.model('Merchant').syncMerchantInfo(merchantId, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for direct findOneAndUpdate operations
MerchantSchema.pre('findOneAndUpdate', { document: false, query: true }, async function(next) {
    const update = this.getUpdate();
    const updateData = {};
    
    // Check for fields that need syncing in both direct and $set updates
    if (update.name || (update.$set && update.$set.name)) {
        updateData.name = update.name || update.$set.name;
    }

    if (update.dba_name || (update.$set && update.$set.dba_name)) {
        updateData.dba_name = update.dba_name || update.$set.dba_name;
    }
    
    if (update.email || (update.$set && update.$set.email)) {
        updateData.email = update.email || update.$set.email;
    }

    if (update.phone || (update.$set && update.$set.phone)) {
        updateData.phone = update.phone || update.$set.phone;
    }
    
    if (Object.keys(updateData).length > 0) {
        const merchantId = this.getQuery()._id;
        try {
            await mongoose.model('Merchant').syncMerchantInfo(merchantId, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for updateMany operations - requires special handling
MerchantSchema.pre('updateMany', { document: false, query: true }, async function(next) {
    const update = this.getUpdate();
    const updateData = {};
    
    // Check for fields that need syncing in both direct and $set updates
    if (update.name || (update.$set && update.$set.name)) {
        updateData.name = update.name || update.$set.name;
    }

    if (update.dba_name || (update.$set && update.$set.dba_name)) {
        updateData.dba_name = update.dba_name || update.$set.dba_name;
    }
    
    if (update.email || (update.$set && update.$set.email)) {
        updateData.email = update.email || update.$set.email;
    }

    if (update.phone || (update.$set && update.$set.phone)) {
        updateData.phone = update.phone || update.$set.phone;
    }
    
    if (Object.keys(updateData).length > 0) {
        const merchantQuery = this.getQuery();
        try {
            // First find all merchants that match the query
            const Merchant = mongoose.model('Merchant');
            const merchants = await Merchant.find(merchantQuery, '_id');
            const merchantIds = merchants.map(merchant => merchant._id);
            
            if (merchantIds.length > 0) {
                await Merchant.syncMerchantInfo(merchantIds, updateData);
            }
            
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Update the updated_date
MerchantSchema.pre('save', function(next) {
    this.updated_date = Date.now();
    next();
});

/**
 * Convert merchant to proper object structure for embedding in other documents
 * @param {Object|string} merchant - Merchant object or ID
 * @returns {Promise<Object|undefined>} - Converted merchant object or undefined
 */
MerchantSchema.statics.convertToEmbeddedFormat = async function(merchant) {
    const merchantId = Helpers.extractIdString(merchant);
    if (merchantId) {
        try {
            const merchantDoc = await this.findById(merchantId);
            if (merchantDoc) {
                return {
                    id: merchantDoc._id,
                    name: merchantDoc.name,
                    dba_name: merchantDoc.dba_name,
                    email: merchantDoc.email,
                    phone: merchantDoc.phone
                };
            }
        } catch (error) {
            console.error('Error fetching merchant details:', error);
            // Continue with creation even if merchant details can't be fetched
        }
    }
    return undefined;
};


/**
 * Helper function to calculate statistics for Merchant documents
 * @param {Array} docs - The array of Merchant documents to calculate statistics for
 * @returns {Array} The array of Merchant documents with statistics
 */
const calculateStatistics = async function(docs) {
    if (!docs || docs.length === 0) return;
    
    // Get all Merchant IDs
    const merchantIds = docs.map(doc => doc._id);
    
    // Initialize stats for each merchant to make sure we have stats for all merchants, even if there are no paybacks for that merchant
    const statsByMerchant = {};

    for (const merchantId of merchantIds) {
        statsByMerchant[merchantId] = {
            contact_count: 0,
            funder_count: 0,
            iso_count: 0,
            account_count: 0,

            application_count: 0,
            pending_application_count: 0,
            funding_count: 0,
            active_funding_count: 0,
            warning_funding_count: 0,
            completed_funding_count: 0,
            default_funding_count: 0,

            application_request_amount: 0,
            pending_application_request_amount: 0,
            funding_amount: 0,
            active_funding_amount: 0,
            warning_funding_amount: 0,
            completed_funding_amount: 0,
            default_funding_amount: 0,
        };
    }

    // Get all contact-merchants with stats
    const contactMerchants = await ContactMerchant.aggregate([
        { $match: { merchant: { $in: merchantIds } } },
        { $group: { _id: '$merchant', contact_count: { $sum: 1 } } }
    ]);
    for (const contactMerchant of contactMerchants) {
        statsByMerchant[contactMerchant._id].contact_count = contactMerchant.contact_count;
    }

    // Get all Merchant-Funders with stats
    const merchantFunders = await MerchantFunder.aggregate([
        { $match: { merchant: { $in: merchantIds }, inactive: { $ne: true } } },
        { $group: { _id: '$merchant', funder_count: { $sum: 1 } } }
    ]);
    for (const merchantFunder of merchantFunders) {
        statsByMerchant[merchantFunder._id].funder_count = merchantFunder.funder_count;
    }

    // Get all ISO-merchants with stats
    const isoMerchants = await ISOMerchant.aggregate([
        { $match: { merchant: { $in: merchantIds } } },
        { $group: { _id: '$merchant', iso_count: { $sum: 1 } } }
    ]);
    for (const isoMerchant of isoMerchants) {
        statsByMerchant[isoMerchant._id].iso_count = isoMerchant.iso_count;
    }

    // Get all Merchant-Accounts with stats
    const merchantAccounts = await MerchantAccount.aggregate([
        { $match: { merchant: { $in: merchantIds }, inactive: { $ne: true } } },
        { $group: { _id: '$merchant', account_count: { $sum: 1 } } }
    ]);
    for (const merchantAccount of merchantAccounts) {
        statsByMerchant[merchantAccount._id].account_count = merchantAccount.account_count;
    }
    
    // Get all applications with stats
    const applications = await Application.find({ 'merchant.id': { $in: merchantIds }, inactive: { $ne: true } }, '_id merchant.id request_amount closed');
    for (const application of applications) {
        statsByMerchant[application.merchant.id].application_count += 1;
        statsByMerchant[application.merchant.id].application_request_amount += application.request_amount;
        if (!application.closed) {
            statsByMerchant[application.merchant.id].pending_application_count += 1;
            statsByMerchant[application.merchant.id].pending_application_request_amount += application.request_amount;
        }
    }

    // Get all fundings with stats
    const fundings = await Funding.find({ 'merchant.id': { $in: merchantIds }, inactive: { $ne: true } }, '_id merchant.id funded_amount status');
    for (const funding of fundings) {
        statsByMerchant[funding.merchant.id].funding_count += 1;
        statsByMerchant[funding.merchant.id].funding_amount += funding.funded_amount;

        if (funding.status?.closed) {
            statsByMerchant[funding.merchant.id].completed_funding_count += 1;
            statsByMerchant[funding.merchant.id].completed_funding_amount += funding.funded_amount;
        } else {
            statsByMerchant[funding.merchant.id].active_funding_count += 1;
            statsByMerchant[funding.merchant.id].active_funding_amount += funding.funded_amount;
        }

        if (funding.status?.warning) {
            statsByMerchant[funding.merchant.id].warning_funding_count += 1;
            statsByMerchant[funding.merchant.id].warning_funding_amount += funding.funded_amount;
        }
        if (funding.status?.defaulted) {
            statsByMerchant[funding.merchant.id].default_funding_count += 1;
            statsByMerchant[funding.merchant.id].default_funding_amount += funding.funded_amount;
        }
    }
    
    // Add calculated fields to each document
    docs.forEach(doc => {
        const merchantId = doc._id.toString();
        const stats = statsByMerchant[merchantId];

        doc.contact_count = stats.contact_count;
        doc.funder_count = stats.funder_count;
        doc.iso_count = stats.iso_count;
        doc.account_count = stats.account_count;

        doc.application_count = stats.application_count;
        doc.pending_application_count = stats.pending_application_count;
        doc.funding_count = stats.funding_count;
        doc.active_funding_count = stats.active_funding_count;
        doc.warning_funding_count = stats.warning_funding_count;
        doc.completed_funding_count = stats.completed_funding_count;
        doc.default_funding_count = stats.default_funding_count;

        doc.application_request_amount = stats.application_request_amount;
        doc.pending_application_request_amount = stats.pending_application_request_amount;
        doc.funding_amount = stats.funding_amount;
        doc.active_funding_amount = stats.active_funding_amount;
        doc.warning_funding_amount = stats.warning_funding_amount;
        doc.completed_funding_amount = stats.completed_funding_amount;
        doc.default_funding_amount = stats.default_funding_amount;

        // Set a flag to indicate that statistics have been calculated
        doc._calculatedStatsComplete = true;
    });

    return docs;
};

// Middleware to automatically add statistics to query results
MerchantSchema.post('find', async function(docs) {
    if (this.getOptions()?.calculate) {
        await calculateStatistics(docs);
    }
});

MerchantSchema.post('findOne', async function(doc) {
    if (doc && this.getOptions()?.calculate) {
        await calculateStatistics([doc]);
    }
});

const Merchant = mongoose.model('Merchant', MerchantSchema);

module.exports = Merchant; 