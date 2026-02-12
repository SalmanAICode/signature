const mongoose = require('mongoose');

const ApplicationOffer = require('./ApplicationOffer');
const Funding = require('./Funding');
const LenderAccount = require('./LenderAccount');
const UserLender = require('./UserLender');

const AddressSchema = require('./Common/Address');
const BusinessDetailSchema = require('./Common/BusinessDetail');
const Helpers = require('../utils/helpers');


const LenderSchema = new mongoose.Schema({
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
    type: {
        type: String,
        enum: ['internal', 'external'],
        required: true,
        default: 'external'
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
    { collection: 'Application-Offer', field: 'lender'},
    { collection: 'Funding', field: 'lender'},
    { collection: 'Disbursement-Intent', field: 'lender'},
    { collection: 'Commission-Intent', field: 'lender'},
    { collection: 'Transaction', field: 'sender'},
    { collection: 'Transaction', field: 'receiver'},
    // Add other collections that store lender data in this format
];

// Reusable function to synchronize lender information across collections
LenderSchema.statics.syncLenderInfo = async function(ids, data = {}) {
    if (!ids) return { success: false, error: 'Missing required ids parameter' };
    
    try {
        let query = {};
        let updateData = {};
        
        // Handle different types of ids input
        if (Array.isArray(ids)) {
            // Array of lender ids
            query = { $in: ids };
            updateData = data;
        } else if (typeof ids === 'object' && ids._id) {
            // Single lender object
            query = ids._id;
            if (!data || Object.keys(data).length === 0) {
                updateData = { name: ids.name, email: ids.email, phone: ids.phone };
            } else {
                updateData = data;
            }
        } else {
            // Single lender ID
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

            // Create update object with lender.fieldname format
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
LenderSchema.pre('save', async function(next) {
    // Only run this middleware if certain fields were modified
    const updateData = {};
    if (this.isModified('name')) updateData.name = this.name;
    if (this.isModified('email')) updateData.email = this.email;
    if (this.isModified('phone')) updateData.phone = this.phone;

    if (Object.keys(updateData).length > 0) {
        try {
            await this.constructor.syncLenderInfo(this._id, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for direct updateOne operations
LenderSchema.pre('updateOne', { document: false, query: true }, async function(next) {
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
        const lenderId = this.getQuery()._id;
        try {
            await mongoose.model('Lender').syncLenderInfo(lenderId, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for direct findOneAndUpdate operations
LenderSchema.pre('findOneAndUpdate', { document: false, query: true }, async function(next) {
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
        const lenderId = this.getQuery()._id;
        try {
            await mongoose.model('Lender').syncLenderInfo(lenderId, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for updateMany operations - requires special handling
LenderSchema.pre('updateMany', { document: false, query: true }, async function(next) {
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
        const lenderQuery = this.getQuery();
        try {
            // First find all funders that match the query
            const Lender = mongoose.model('Lender');
            const lenders = await Lender.find(lenderQuery, '_id');
            const lenderIds = lenders.map(lender => lender._id);
            
            if (lenderIds.length > 0) {
                await Lender.syncLenderInfo(lenderIds, updateData);
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
LenderSchema.statics.synchronizeRedundantData = async function(lenderId = null) {
    try {
        const query = lenderId ? { _id: lenderId } : {};
        
        // Get all funders (or just the specified one)
        const lenders = await this.find(query);
        
        // For each funder, update all related documents
        const results = {
            success: true,
            totalUpdated: 0,
            lenderResults: []
        };
        
        for (const lender of lenders) {
            // Create data object with all fields that should be synchronized
            const syncData = {
                name: lender.name,
                email: lender.email,
                phone: lender.phone
            };
            
            const result = await this.syncLenderInfo(lender, syncData);
            
            let lenderUpdated = 0;
            if (result.collections) {
                Object.values(result.collections).forEach(collection => {
                    lenderUpdated += collection.updatedCount || 0;
                });
            }
            
            results.lenderResults.push({
                lenderId: lender._id,
                name: lender.name,
                email: lender.email,
                phone: lender.phone,
                updated: lenderUpdated,
                collectionDetails: result.collections
            });
            
            results.totalUpdated += lenderUpdated;
        }
        
        return results;
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Convert lender to proper object structure for embedding in other documents
 * @param {Object|string} lender - Lender object or ID
 * @returns {Promise<Object|undefined>} - Converted lender object or undefined
 */
LenderSchema.statics.convertToEmbeddedFormat = async function(lender) {
    const lenderId = Helpers.extractIdString(lender);
    if (lenderId) {
        try {
            const lenderDoc = await this.findById(lenderId);
            if (lenderDoc) {
                return {
                    id: lenderDoc._id,
                    name: lenderDoc.name,
                    email: lenderDoc.email,
                    phone: lenderDoc.phone
                };
            }
        } catch (error) {
            console.error('Error fetching lender details:', error);
            // Continue with creation even if lender details can't be fetched
        }
    }
    return undefined;
};


/**
 * Helper function to calculate statistics for Lender documents
 * @param {Array} docs - The array of Lender documents to calculate statistics for
 * @returns {Array} The array of Lender documents with statistics
 */
const calculateStatistics = async function(docs) {
    if (!docs || docs.length === 0) return;
    
    // Get all lender IDs
    const lenderIds = docs.map(doc => doc._id);
    
    // Initialize stats for each lender to make sure we have stats for all lenders, even if there are no paybacks for that lender
    const statsByLender = {};

    for (const lenderId of lenderIds) {
        statsByLender[lenderId] = {
            application_offer_count: 0,
            funding_count: 0,
        };
    }

    // Get all application-offers with stats
    const applicationOffers = await ApplicationOffer.aggregate([
        { $match: { lender: { $in: lenderIds } } },
        { $group: { _id: '$lender', application_offer_count: { $sum: 1 } } }
    ]);
    for (const applicationOffer of applicationOffers) {
        statsByLender[applicationOffer._id].application_offer_count = applicationOffer.application_offer_count;
    }

    // Get all fundings with stats
    const fundings = await Funding.aggregate([
        { $match: { lender: { $in: lenderIds } } },
        { $group: { _id: '$lender', funding_count: { $sum: 1 } } }
    ]);
    for (const funding of fundings) {
        statsByLender[funding._id].funding_count = funding.funding_count;
    }

    // Get all lender-accounts with stats
    const lenderAccounts = await LenderAccount.aggregate([
        { $match: { lender: { $in: lenderIds } } },
        { $group: { _id: '$lender', account_count: { $sum: 1 } } }
    ]);
    for (const lenderAccount of lenderAccounts) {
        statsByLender[lenderAccount._id].account_count = lenderAccount.account_count;
    }

    // Get all user-lenders with stats
    const userLenders = await UserLender.aggregate([
        { $match: { lender: { $in: lenderIds } } },
        { $group: { _id: '$lender', user_count: { $sum: 1 } } }
    ]);
    for (const userLender of userLenders) {
        statsByLender[userLender._id].user_count = userLender.user_count;
    }

    // Add calculated fields to each document
    docs.forEach(doc => {
        const lenderId = doc._id.toString();
        const stats = statsByLender[lenderId];

        doc.application_offer_count = stats.application_offer_count;
        doc.funding_count = stats.funding_count;
        
        // Set a flag to indicate that statistics have been calculated
        doc._calculatedStatsComplete = true;
    });

    return docs;
};

// Middleware to automatically add statistics to query results
LenderSchema.post('find', async function(docs) {
    if (this.getOptions()?.calculate) {
        await calculateStatistics(docs);
    }
});

LenderSchema.post('findOne', async function(doc) {
    if (doc && this.getOptions()?.calculate) {
        await calculateStatistics([doc]);
    }
});

const Lender = mongoose.model('Lender', LenderSchema);

module.exports = Lender; 