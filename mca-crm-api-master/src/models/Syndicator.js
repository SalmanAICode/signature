const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const AddressSchema = require('./Common/Address');
const BusinessDetailSchema = require('./Common/BusinessDetail');

const { SYNDICATION_OFFER_STATUS, SYNDICATION_STATUS } = require('../utils/constants');
const Helpers = require('../utils/helpers');

const SyndicatorFunder = require('./SyndicatorFunder');
const SyndicatorAccount = require('./SyndicatorAccount');
const SyndicationOffer = require('./SyndicationOffer');
const Syndication = require('./Syndication');


const SyndicatorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
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
        trim: true
    },
    phone_home: {
        type: String,
        trim: true
    },
    ssn: {
        type: String,
        trim: true,
        select: false // Protect sensitive data
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
    business_detail: BusinessDetailSchema,
    password: {
        type: String,
        select: false
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
    { collection: 'Document', field: 'syndicator'},
    { collection: 'Document', field: 'upload_syndicator'},
    { collection: 'Upload', field: 'upload_syndicator'},
    { collection: 'Funding', field: 'syndicator_list'},
    { collection: 'Transaction', field: 'sender'},
    { collection: 'Transaction', field: 'receiver'},
    // Add other collections that store syndicator data in this format
];

// Reusable function to synchronize syndicator information across collections
SyndicatorSchema.statics.syncSyndicatorInfo = async function(ids, data = {}) {
    if (!ids) return { success: false, error: 'Missing required ids parameter' };
    
    try {
        let query = {};
        let updateData = {};
        
        // Handle different types of ids input
        if (Array.isArray(ids)) {
            // Array of syndicator ids
            query = { $in: ids };
            updateData = data;
        } else if (typeof ids === 'object' && ids._id) {
            // Single syndicator object
            query = ids._id;
            if (!data || Object.keys(data).length === 0) {
                updateData = { 
                    name: ids.name, 
                    first_name: ids.first_name, 
                    last_name: ids.last_name, 
                    email: ids.email, 
                    phone_mobile: ids.phone_mobile 
                };
            } else {
                updateData = data;
            }
        } else {
            // Single syndicator ID
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
            let result;

            // Check if field is an array type (like syndicator_list)
            const isArrayField = field.includes('_list') || field.endsWith('[]');
            
            if (isArrayField) {
                // For array fields, use positional operators to update matching elements
                const updateObject = {};
                for (const [key, value] of Object.entries(updateData)) {
                    updateObject[`${field}.$.${key}`] = value;
                }

                result = await Model.updateMany(
                    { [`${field}.id`]: query },
                    { $set: updateObject }
                );
            } else {
                // For regular object fields, use dot notation
                const updateObject = {};
                for (const [key, value] of Object.entries(updateData)) {
                    updateObject[`${field}.${key}`] = value;
                }

                result = await Model.updateMany(
                    { [`${field}.id`]: query },
                    { $set: updateObject }
                );
            }

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
SyndicatorSchema.pre('save', async function(next) {
    // Only run this middleware if certain fields were modified
    const updateData = {};
    if (this.isModified('name')) updateData.name = this.name;
    if (this.isModified('first_name')) updateData.first_name = this.first_name;
    if (this.isModified('last_name')) updateData.last_name = this.last_name;
    if (this.isModified('email')) updateData.email = this.email;
    if (this.isModified('phone_mobile')) updateData.phone_mobile = this.phone_mobile;

    if (Object.keys(updateData).length > 0) {
        try {
            await this.constructor.syncSyndicatorInfo(this._id, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for direct updateOne operations
SyndicatorSchema.pre('updateOne', { document: false, query: true }, async function(next) {
    const update = this.getUpdate();
    const updateData = {};
    
    // Check for fields that need syncing in both direct and $set updates
    if (update.name || (update.$set && update.$set.name)) {
        updateData.name = update.name || update.$set.name;
    }

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
        const syndicatorId = this.getQuery()._id;
        try {
            await mongoose.model('Syndicator').syncSyndicatorInfo(syndicatorId, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for direct findOneAndUpdate operations
SyndicatorSchema.pre('findOneAndUpdate', { document: false, query: true }, async function(next) {
    const update = this.getUpdate();
    const updateData = {};
    
    // Check for fields that need syncing in both direct and $set updates
    if (update.name || (update.$set && update.$set.name)) {
        updateData.name = update.name || update.$set.name;
    }
    
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
        const syndicatorId = this.getQuery()._id;
        try {
            await mongoose.model('Syndicator').syncSyndicatorInfo(syndicatorId, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for updateMany operations - requires special handling
SyndicatorSchema.pre('updateMany', { document: false, query: true }, async function(next) {
    const update = this.getUpdate();
    const updateData = {};
    
    // Check for fields that need syncing in both direct and $set updates
    if (update.name || (update.$set && update.$set.name)) {
        updateData.name = update.name || update.$set.name;
    }
    
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
        const syndicatorQuery = this.getQuery();
        try {
            // First find all syndicators that match the query
            const Syndicator = mongoose.model('Syndicator');
            const syndicators = await Syndicator.find(syndicatorQuery, '_id');
            const syndicatorIds = syndicators.map(syndicator => syndicator._id);
            
            if (syndicatorIds.length > 0) {
                await Syndicator.syncSyndicatorInfo(syndicatorIds, updateData);
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
SyndicatorSchema.virtual('access_log_count', {
    ref: 'Syndicator-Access-Log',
    localField: '_id',
    foreignField: 'syndicator',
    count: true
});

// Hash password before saving
SyndicatorSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
  
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match password
SyndicatorSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Convert Syndicator to proper object structure for embedding in other documents
 * @param {Object|string} syndicator - Syndicator object or ID
 * @returns {Promise<Object|undefined>} - Converted Syndicator object or undefined
 */
SyndicatorSchema.statics.convertToEmbeddedFormat = async function(syndicator) {
    const syndicatorId = Helpers.extractIdString(syndicator);
    if (syndicatorId) {
        try {
            const syndicatorDoc = await this.findById(syndicatorId);
            if (syndicatorDoc) {
                return {
                    id: syndicatorDoc._id,
                    name: syndicatorDoc.name,
                    first_name: syndicatorDoc.first_name,
                    last_name: syndicatorDoc.last_name,
                    email: syndicatorDoc.email,
                    phone_mobile: syndicatorDoc.phone_mobile
                };
            }
        } catch (error) {
            console.error('Error fetching Syndicator details:', error);
            // Continue with creation even if Syndicator details can't be fetched
        }
    }
    return undefined;
};



/**
 * Helper function to calculate statistics for Syndicator documents
 * @param {Array} docs - The array of Syndicator documents to calculate statistics for
 * @returns {Array} The array of Syndicator documents with statistics
 */
const calculateStatistics = async function(docs) {
    if (!docs || docs.length === 0) return;
    
    // Get all Syndicator IDs
    const syndicatorIds = docs.map(doc => doc._id);
    
    // Initialize stats for each syndicator to make sure we have stats for all syndicators, even if there are no paybacks for that syndicator
    const statsBySyndicator = {};

    for (const syndicatorId of syndicatorIds) {
        statsBySyndicator[syndicatorId] = {
            funder_count: 0,
            account_count: 0,

            total_available_balance: 0,

            syndication_offer_count: 0,
            pending_syndication_offer_count: 0,
            accepted_syndication_offer_count: 0,
            declined_syndication_offer_count: 0,
            cancelled_syndication_offer_count: 0,

            syndication_offer_amount: 0,
            pending_syndication_offer_amount: 0,
            accepted_syndication_offer_amount: 0,
            declined_syndication_offer_amount: 0,
            cancelled_syndication_offer_amount: 0,
            
            syndication_count: 0,
            active_syndication_count: 0,
            closed_syndication_count: 0,

            syndication_amount: 0,
            active_syndication_amount: 0,
            closed_syndication_amount: 0,
        };
    }

    // Get all Syndicator-Funders with stats
    const syndicatorFunders = await SyndicatorFunder.aggregate([
        { $match: { syndicator: { $in: syndicatorIds }, inactive: { $ne: true } } },
        { $group: { _id: '$syndicator', funder_count: { $sum: 1 }, total_available_balance: { $sum: '$available_balance' } } }
    ]);

    for (const syndicatorFunder of syndicatorFunders) {
        statsBySyndicator[syndicatorFunder._id].funder_count = syndicatorFunder.funder_count;
        statsBySyndicator[syndicatorFunder._id].total_available_balance = syndicatorFunder.total_available_balance;
    }

    // Get all Syndicator-Accounts with stats
    const syndicatorAccounts = await SyndicatorAccount.aggregate([
        { $match: { syndicator: { $in: syndicatorIds }, inactive: { $ne: true } } },
        { $group: { _id: '$syndicator', account_count: { $sum: 1 } } }
    ]);

    for (const syndicatorAccount of syndicatorAccounts) {
        statsBySyndicator[syndicatorAccount._id].account_count = syndicatorAccount.account_count;
    }
    
    // Get all syndication offers with stats
    const syndicationOffers = await SyndicationOffer.find({ syndicator: { $in: syndicatorIds }, inactive: { $ne: true } }, '_id syndicator status participate_amount');
    for (const syndicationOffer of syndicationOffers) {
        statsBySyndicator[syndicationOffer.syndicator].syndication_offer_count += 1;
        statsBySyndicator[syndicationOffer.syndicator].syndication_offer_amount += syndicationOffer.participate_amount;
        switch (syndicationOffer.status) {
        case SYNDICATION_OFFER_STATUS.SUBMITTED:
            statsBySyndicator[syndicationOffer.syndicator].pending_syndication_offer_count += 1;
            statsBySyndicator[syndicationOffer.syndicator].pending_syndication_offer_amount += syndicationOffer.participate_amount;
            break;
        case SYNDICATION_OFFER_STATUS.ACCEPTED:
            statsBySyndicator[syndicationOffer.syndicator].accepted_syndication_offer_count += 1;
            statsBySyndicator[syndicationOffer.syndicator].accepted_syndication_offer_amount += syndicationOffer.participate_amount;
            break;
        case SYNDICATION_OFFER_STATUS.DECLINED:
            statsBySyndicator[syndicationOffer.syndicator].declined_syndication_offer_count += 1;
            statsBySyndicator[syndicationOffer.syndicator].declined_syndication_offer_amount += syndicationOffer.participate_amount;
            break;
        case SYNDICATION_OFFER_STATUS.CANCELLED:
        case SYNDICATION_OFFER_STATUS.EXPIRED:
            statsBySyndicator[syndicationOffer.syndicator].cancelled_syndication_offer_count += 1;
            statsBySyndicator[syndicationOffer.syndicator].cancelled_syndication_offer_amount += syndicationOffer.participate_amount;
            break;
        }
    }

    // Get all syndications with stats
    const syndications = await Syndication.find({ syndicator: { $in: syndicatorIds }, inactive: { $ne: true } }, '_id syndicator participate_amount commission_amount status');
    for (const syndication of syndications) {
        statsBySyndicator[syndication.syndicator].syndication_count += 1;
        statsBySyndicator[syndication.syndicator].syndication_amount += syndication.participate_amount;
        switch (syndication.status) {
        case SYNDICATION_STATUS.ACTIVE:
            statsBySyndicator[syndication.syndicator].active_syndication_count += 1;
            statsBySyndicator[syndication.syndicator].active_syndication_amount += syndication.participate_amount;
            break;
        case SYNDICATION_STATUS.CLOSED:
            statsBySyndicator[syndication.syndicator].closed_syndication_count += 1;
            statsBySyndicator[syndication.syndicator].closed_syndication_amount += syndication.participate_amount;
            break;
        }
    }
    
    // Add calculated fields to each document
    docs.forEach(doc => {
        const syndicatorId = doc._id.toString();
        const stats = statsBySyndicator[syndicatorId];
    
        doc.funder_count = stats.funder_count;
        doc.account_count = stats.account_count;

        doc.total_available_balance = stats.total_available_balance;

        doc.syndication_offer_count = stats.syndication_offer_count;
        doc.pending_syndication_offer_count = stats.pending_syndication_offer_count;
        doc.accepted_syndication_offer_count = stats.accepted_syndication_offer_count;
        doc.declined_syndication_offer_count = stats.declined_syndication_offer_count;
        doc.cancelled_syndication_offer_count = stats.cancelled_syndication_offer_count;

        doc.syndication_offer_amount = stats.syndication_offer_amount;
        doc.pending_syndication_offer_amount = stats.pending_syndication_offer_amount;
        doc.accepted_syndication_offer_amount = stats.accepted_syndication_offer_amount;
        doc.declined_syndication_offer_amount = stats.declined_syndication_offer_amount;
        doc.cancelled_syndication_offer_amount = stats.cancelled_syndication_offer_amount;

        doc.syndication_count = stats.syndication_count;
        doc.active_syndication_count = stats.active_syndication_count;
        doc.closed_syndication_count = stats.closed_syndication_count;

        doc.syndication_amount = stats.syndication_amount;
        doc.active_syndication_amount = stats.active_syndication_amount;
        doc.closed_syndication_amount = stats.closed_syndication_amount;

        // Set a flag to indicate that statistics have been calculated
        doc._calculatedStatsComplete = true;
    });

    return docs;
};

// Middleware to automatically add statistics to query results
SyndicatorSchema.post('find', async function(docs) {
    if (this.getOptions()?.calculate) {
        await calculateStatistics(docs);
    }
});

SyndicatorSchema.post('findOne', async function(doc) {
    if (doc && this.getOptions()?.calculate) {
        await calculateStatistics([doc]);
    }
});

const Syndicator = mongoose.model('Syndicator', SyndicatorSchema);

module.exports = Syndicator;