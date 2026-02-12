const mongoose = require('mongoose');

const Lender = require('./Lender');
const UserFunder = require('./UserFunder');
const ISOFunder = require('./ISOFunder');
const MerchantFunder = require('./MerchantFunder');
const SyndicatorFunder = require('./SyndicatorFunder');
const Application = require('./Application');
const Funding = require('./Funding');
const FunderAccount = require('./FunderAccount');

const AddressSchema = require('./Common/Address');
const BusinessDetailSchema = require('./Common/BusinessDetail');
const Helpers = require('../utils/helpers');


const FunderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
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
    business_detail: BusinessDetailSchema,
    address_detail: AddressSchema,
    bgcolor: {
        type: String,
        trim: true
    },
    import: {
        source: {
            type: String,
            enum: ['OrgMeter', 'LendSaaS', 'OnyxIQ'],
            trim: true
        },
        api_key: {
            type: String,
            trim: true
        },
        client_name: {
            type: String,
            trim: true
        }
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

const across_collections = [
    { collection: 'Document', field: 'funder'},
    { collection: 'Application', field: 'funder'},
    { collection: 'Application-Offer', field: 'funder'},
    { collection: 'Funding', field: 'funder'},
    { collection: 'Transaction', field: 'sender'},
    { collection: 'Transaction', field: 'receiver'},
    // Add other collections that store funder data in this format
];

// Reusable function to synchronize funder information across collections
FunderSchema.statics.syncFunderInfo = async function(ids, data = {}) {
    if (!ids) return { success: false, error: 'Missing required ids parameter' };
    
    try {
        let query = {};
        let updateData = {};
        
        // Handle different types of ids input
        if (Array.isArray(ids)) {
            // Array of funder ids
            query = { $in: ids };
            updateData = data;
        } else if (typeof ids === 'object' && ids._id) {
            // Single funder object
            query = ids._id;
            if (!data || Object.keys(data).length === 0) {
                updateData = { name: ids.name, email: ids.email, phone: ids.phone };
            } else {
                updateData = data;
            }
        } else {
            // Single funder ID
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

            // Create update object with funder.fieldname format
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
FunderSchema.pre('save', async function(next) {
    // Only run this middleware if certain fields were modified
    const updateData = {};
    if (this.isModified('name')) updateData.name = this.name;
    if (this.isModified('email')) updateData.email = this.email;
    if (this.isModified('phone')) updateData.phone = this.phone;

    if (Object.keys(updateData).length > 0) {
        try {
            await this.constructor.syncFunderInfo(this._id, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for direct updateOne operations
FunderSchema.pre('updateOne', { document: false, query: true }, async function(next) {
    const update = this.getUpdate();
    const updateData = {};
    
    // Check for fields that need syncing in both direct and $set updates
    if (update.name || (update.$set && update.$set.name)) {
        updateData.name = update.name || update.$set.name;
    }
    
    if (update.email || (update.$set && update.$set.email)) {
        updateData.email = update.email || update.$set.email;
    }

    if (update.phone || (update.$set && update.$set.phone)) {
        updateData.phone = update.phone || update.$set.phone;
    }
    
    if (Object.keys(updateData).length > 0) {
        const funderId = this.getQuery()._id;
        try {
            await mongoose.model('Funder').syncFunderInfo(funderId, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for direct findOneAndUpdate operations
FunderSchema.pre('findOneAndUpdate', { document: false, query: true }, async function(next) {
    const update = this.getUpdate();
    const updateData = {};
    
    // Check for fields that need syncing in both direct and $set updates
    if (update.name || (update.$set && update.$set.name)) {
        updateData.name = update.name || update.$set.name;
    }
    
    if (update.email || (update.$set && update.$set.email)) {
        updateData.email = update.email || update.$set.email;
    }

    if (update.phone || (update.$set && update.$set.phone)) {
        updateData.phone = update.phone || update.$set.phone;
    }
    
    if (Object.keys(updateData).length > 0) {
        const funderId = this.getQuery()._id;
        try {
            await mongoose.model('Funder').syncFunderInfo(funderId, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for updateMany operations - requires special handling
FunderSchema.pre('updateMany', { document: false, query: true }, async function(next) {
    const update = this.getUpdate();
    const updateData = {};
    
    // Check for fields that need syncing in both direct and $set updates
    if (update.name || (update.$set && update.$set.name)) {
        updateData.name = update.name || update.$set.name;
    }
    
    if (update.email || (update.$set && update.$set.email)) {
        updateData.email = update.email || update.$set.email;
    }

    if (update.phone || (update.$set && update.$set.phone)) {
        updateData.phone = update.phone || update.$set.phone;
    }
    
    if (Object.keys(updateData).length > 0) {
        const funderQuery = this.getQuery();
        try {
            // First find all funders that match the query
            const Funder = mongoose.model('Funder');
            const funders = await Funder.find(funderQuery, '_id');
            const funderIds = funders.map(funder => funder._id);
            
            if (funderIds.length > 0) {
                await Funder.syncFunderInfo(funderIds, updateData);
            }
            
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Static method to synchronize redundant data
FunderSchema.statics.synchronizeRedundantData = async function(funderId = null) {
    try {
        const query = funderId ? { _id: funderId } : {};
        
        // Get all funders (or just the specified one)
        const funders = await this.find(query);
        
        // For each funder, update all related documents
        const results = {
            success: true,
            totalUpdated: 0,
            funderResults: []
        };
        
        for (const funder of funders) {
            // Create data object with all fields that should be synchronized
            const syncData = {
                name: funder.name,
                email: funder.email,
                phone: funder.phone
            };
            
            const result = await this.syncFunderInfo(funder, syncData);
            
            let funderUpdated = 0;
            if (result.collections) {
                Object.values(result.collections).forEach(collection => {
                    funderUpdated += collection.updatedCount || 0;
                });
            }
            
            results.funderResults.push({
                funderId: funder._id,
                name: funder.name,
                email: funder.email,
                phone: funder.phone,
                updated: funderUpdated,
                collectionDetails: result.collections
            });
            
            results.totalUpdated += funderUpdated;
        }
        
        return results;
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Convert funder to proper object structure for embedding in other documents
 * @param {Object|string} funder - Funder object or ID
 * @returns {Promise<Object|undefined>} - Converted funder object or undefined
 */
FunderSchema.statics.convertToEmbeddedFormat = async function(funder) {
    const funderId = Helpers.extractIdString(funder);
    if (funderId) {
        try {
            const funderDoc = await this.findById(funderId);
            if (funderDoc) {
                return {
                    id: funderDoc._id,
                    name: funderDoc.name,
                    email: funderDoc.email,
                    phone: funderDoc.phone
                };
            }
        } catch (error) {
            console.error('Error fetching funder details:', error);
            // Continue with creation even if funder details can't be fetched
        }
    }
    return undefined;
};


/**
 * Helper function to calculate statistics for Funder documents
 * @param {Array} docs - The array of Funder documents to calculate statistics for
 * @returns {Array} The array of Funder documents with statistics
 */
const calculateStatistics = async function(docs) {
    if (!docs || docs.length === 0) return;
    
    // Get all funder IDs
    const funderIds = docs.map(doc => doc._id);
    
    // Initialize stats for each funder to make sure we have stats for all funders, even if there are no paybacks for that funder
    const statsByFunder = {};

    for (const funderId of funderIds) {
        statsByFunder[funderId] = {
            lender_count: 0,
            user_count: 0,
            iso_count: 0,
            merchant_count: 0,
            syndicator_count: 0,
            application_count: 0,
            pending_application_count: 0,
            funding_count: 0,
            account_count: 0,
            available_balance: 0,
            
            // New calculated fields for investment overview
            pending_syndication_offer_amount: 0,
            active_syndication_amount: 0,
            active_syndication_count: 0,
            closed_syndication_count: 0,
            syndication_count: 0,
        };
    }


    // Get all lender belong to this funder with stats
    const lenders = await Lender.aggregate([
        { $match: { funder: { $in: funderIds }, inactive: { $ne: true } } }
    ]);
    for (const lender of lenders) {
        statsByFunder[lender.funder].lender_count += 1;
    }

    // Get all user-funders with stats
    const userFunders = await UserFunder.aggregate([
        { $match: { funder: { $in: funderIds } } },
        { $group: { _id: '$funder', user_count: { $sum: 1 } } }
    ]);
    for (const userFunder of userFunders) {
        statsByFunder[userFunder._id].user_count = userFunder.user_count;
    }

    // Get all ISO-funders with stats
    const isoFunders = await ISOFunder.aggregate([
        { $match: { funders: { $in: funderIds }, inactive: { $ne: true } } },
        { $group: { _id: '$funder', iso_count: { $sum: 1 } } }
    ]);
    for (const isoFunder of isoFunders) {
        statsByFunder[isoFunder._id].iso_count = isoFunder.iso_count;
    }

    // Get all merchant-funders with stats
    const merchantFunders = await MerchantFunder.aggregate([
        { $match: { funder: { $in: funderIds }, inactive: { $ne: true } } },
        { $group: { _id: '$funder', merchant_count: { $sum: 1 } } }
    ]);
    for (const merchantFunder of merchantFunders) {
        statsByFunder[merchantFunder._id].merchant_count = merchantFunder.merchant_count;
    }

    // Get all syndicator-funders with stats
    const syndicatorFunders = await SyndicatorFunder.aggregate([
        { $match: { funder: { $in: funderIds }, inactive: { $ne: true } } },
        { $group: { _id: '$funder', syndicator_count: { $sum: 1 } } }
    ]);
    for (const syndicatorFunder of syndicatorFunders) {
        statsByFunder[syndicatorFunder._id].syndicator_count = syndicatorFunder.syndicator_count;
    }
    
    // Get all applications with stats
    const applications = await Application.aggregate([
        { $match: { 'funder.id': { $in: funderIds }, inactive: { $ne: true } } },
        { $group: { _id: '$funder.id', application_count: { $sum: 1 } } }
    ]);
    for (const application of applications) {
        statsByFunder[application._id].application_count = application.application_count;
    }

    // Get all fundings with stats
    const fundings = await Funding.aggregate([
        { $match: { 'funder.id': { $in: funderIds }, inactive: { $ne: true } } },
        { $group: { _id: '$funder.id', funding_count: { $sum: 1 } } }
    ]);
    for (const funding of fundings) {
        statsByFunder[funding._id].funding_count = funding.funding_count;
    }
    
    // Get all pending applications with stats
    const pendingApplications = await Application.aggregate([
        { $match: { 'funder.id': { $in: funderIds }, closed: { $ne: true }, inactive: { $ne: true } } },
        { $group: { _id: '$funder.id', pending_application_count: { $sum: 1 } } }
    ]);
    for (const pendingApplication of pendingApplications) {
        statsByFunder[pendingApplication._id].pending_application_count = pendingApplication.pending_application_count;
    }

    // Get all funder accounts with stats
    const funderAccounts = await FunderAccount.find({ funder: { $in: funderIds }, inactive: { $ne: true } }, '_id funder available_balance');
    for (const funderAccount of funderAccounts) {
        statsByFunder[funderAccount.funder].account_count += 1;
        statsByFunder[funderAccount.funder].available_balance += funderAccount.available_balance;
    }

    // Get syndication offers for pending amount calculation
    const SyndicationOffer = mongoose.model('Syndication-Offer');
    const syndicationOffers = await SyndicationOffer.find({ 
        funder: { $in: funderIds }, 
        status: 'SUBMITTED', 
        inactive: { $ne: true } 
    }, '_id funder participate_amount');
    
    for (const offer of syndicationOffers) {
        statsByFunder[offer.funder].pending_syndication_offer_amount += offer.participate_amount || 0;
    }

    // Get syndications for investment amount and count calculations
    const Syndication = mongoose.model('Syndication');
    const syndications = await Syndication.find({ 
        funder: { $in: funderIds }, 
        inactive: { $ne: true } 
    }, '_id funder participate_amount status');
    
    for (const syndication of syndications) {
        const funderId = syndication.funder.toString();
        const funderIdObj = funderIds.find(id => id.toString() === funderId);
        
        if (funderIdObj) {
            statsByFunder[funderIdObj].syndication_count += 1;
            
            if (syndication.status === 'ACTIVE') {
                statsByFunder[funderIdObj].active_syndication_count += 1;
                statsByFunder[funderIdObj].active_syndication_amount += syndication.participate_amount || 0;
            } else if (syndication.status === 'CLOSED') {
                statsByFunder[funderIdObj].closed_syndication_count += 1;
            }
        }
    }

    // Add calculated fields to each document
    docs.forEach(doc => {
        const funderId = doc._id.toString();
        const stats = statsByFunder[funderId];

        doc.lender_count = stats.lender_count;
        doc.user_count = stats.user_count;
        doc.iso_count = stats.iso_count;
        doc.merchant_count = stats.merchant_count;
        doc.syndicator_count = stats.syndicator_count;
        doc.application_count = stats.application_count;
        doc.funding_count = stats.funding_count;
        doc.pending_application_count = stats.pending_application_count;
        doc.account_count = stats.account_count;
        doc.available_balance = stats.available_balance;
        
        // New calculated fields for investment overview
        doc.pending_syndication_offer_amount = stats.pending_syndication_offer_amount;
        doc.active_syndication_amount = stats.active_syndication_amount;
        doc.active_syndication_count = stats.active_syndication_count;
        doc.closed_syndication_count = stats.closed_syndication_count;
        doc.syndication_count = stats.syndication_count;
        
        // Set a flag to indicate that statistics have been calculated
        doc._calculatedStatsComplete = true;
    });

    return docs;
};

// Middleware to automatically add statistics to query results
FunderSchema.post('find', async function(docs) {
    if (this.getOptions()?.calculate) {
        await calculateStatistics(docs);
    }
});

FunderSchema.post('findOne', async function(doc) {
    if (doc && this.getOptions()?.calculate) {
        await calculateStatistics([doc]);
    }
});

const Funder = mongoose.model('Funder', FunderSchema);

module.exports = Funder; 