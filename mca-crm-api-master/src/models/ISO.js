const mongoose = require('mongoose');

const RepresentativeISO = require('./RepresentativeISO');
const ISOFunder = require('./ISOFunder');
const ISOMerchant = require('./ISOMerchant');
const ISOAccount = require('./ISOAccount');
const Application = require('./Application');
const Funding = require('./Funding');
const CommissionIntent = require('./CommissionIntent');

const AddressSchema = require('./Common/Address');
const BusinessDetailSchema = require('./Common/BusinessDetail');
const { INTENT_STATUS } = require('../utils/constants');

const Helpers = require('../utils/helpers');

const ISOSchema = new mongoose.Schema({
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
    address_list: [AddressSchema],
    primary_representative: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Representative'
        },
        first_name: { type: String, index: true },
        last_name: { type: String, index: true },
        email: { type: String, index: true },
        phone_mobile: { type: String, index: true }
    },
    type: {
        type: String,
        enum: ['internal', 'external'],
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
    { collection: 'Document', field: 'iso'},
    { collection: 'Application', field: 'iso'},
    { collection: 'Application-Offer', field: 'iso'},
    { collection: 'Funding', field: 'iso'},
    { collection: 'Transaction', field: 'sender'},
    { collection: 'Transaction', field: 'receiver'},
    // Add other collections that store iso data in this format
];

// Reusable function to synchronize iso information across collections
ISOSchema.statics.syncISOInfo = async function(ids, data = {}) {
    if (!ids) return { success: false, error: 'Missing required ids parameter' };
    
    try {
        let query = {};
        let updateData = {};
        
        // Handle different types of ids input
        if (Array.isArray(ids)) {
            // Array of iso ids
            query = { $in: ids };
            updateData = data;
        } else if (typeof ids === 'object' && ids._id) {
            // Single iso object
            query = ids._id;
            if (!data || Object.keys(data).length === 0) {
                updateData = { name: ids.name, email: ids.email, phone: ids.phone };
            } else {
                updateData = data;
            }
        } else {
            // Single iso ID
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

            // Create update object with iso.fieldname format
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
ISOSchema.pre('save', async function(next) {
    // Only run this middleware if certain fields were modified
    const updateData = {};
    if (this.isModified('name')) updateData.name = this.name;
    if (this.isModified('email')) updateData.email = this.email;
    if (this.isModified('phone')) updateData.phone = this.phone;

    if (Object.keys(updateData).length > 0) {
        try {
            await this.constructor.syncISOInfo(this._id, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for direct updateOne operations
ISOSchema.pre('updateOne', { document: false, query: true }, async function(next) {
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
        const isoId = this.getQuery()._id;
        try {
            await mongoose.model('ISO').syncISOInfo(isoId, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for direct findOneAndUpdate operations
ISOSchema.pre('findOneAndUpdate', { document: false, query: true }, async function(next) {
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
        const isoId = this.getQuery()._id;
        try {
            await mongoose.model('ISO').syncISOInfo(isoId, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for updateMany operations - requires special handling
ISOSchema.pre('updateMany', { document: false, query: true }, async function(next) {
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
        const isoQuery = this.getQuery();
        try {
            // First find all isos that match the query
            const ISO = mongoose.model('ISO');
            const isos = await ISO.find(isoQuery, '_id');
            const isoIds = isos.map(iso => iso._id);
            
            if (isoIds.length > 0) {
                await ISO.syncISOInfo(isoIds, updateData);
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
 * Convert ISO to proper object structure for embedding in other documents
 * @param {Object|string} iso - ISO object or ID
 * @returns {Promise<Object|undefined>} - Converted ISO object or undefined
 */
ISOSchema.statics.convertToEmbeddedFormat = async function(iso) {
    const isoId = Helpers.extractIdString(iso);
    if (isoId) {
        try {
            const isoDoc = await this.findById(isoId);
            if (isoDoc) {
                return {
                    id: isoDoc._id,
                    name: isoDoc.name,
                    email: isoDoc.email,
                    phone: isoDoc.phone
                };
            }
        } catch (error) {
            console.error('Error fetching ISO details:', error);
            // Continue with creation even if ISO details can't be fetched
        }
    }
    return undefined;
};


/**
 * Helper function to calculate statistics for ISO documents
 * @param {Array} docs - The array of ISO documents to calculate statistics for
 * @returns {Array} The array of ISO documents with statistics
 */
const calculateStatistics = async function(docs) {
    if (!docs || docs.length === 0) return;
    
    // Get all ISO IDs
    const isoIds = docs.map(doc => doc._id);
    
    // Initialize stats for each funder to make sure we have stats for all funders, even if there are no paybacks for that funder
    const statsByISO = {};

    for (const isoId of isoIds) {
        statsByISO[isoId] = {
            representative_count: 0,
            funder_count: 0,
            merchant_count: 0,
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

            commission_count: 0,
            pending_commission_count: 0,
            paid_commission_count: 0,
            cancelled_commission_count: 0,

            commission_amount: 0,
            pending_commission_amount: 0,
            paid_commission_amount: 0,
            cancelled_commission_amount: 0
        };
    }

    // Get all representative-isos with stats
    const representativeISOs = await RepresentativeISO.aggregate([
        { $match: { iso: { $in: isoIds } } },
        { $group: { _id: '$iso', representative_count: { $sum: 1 } } }
    ]);
    for (const representativeISO of representativeISOs) {
        statsByISO[representativeISO._id].representative_count = representativeISO.representative_count;
    }

    // Get all ISO-funders with stats
    const isoFunders = await ISOFunder.aggregate([
        { $match: { iso: { $in: isoIds }, inactive: { $ne: true } } },
        { $group: { _id: '$iso', funder_count: { $sum: 1 } } }
    ]);
    for (const isoFunder of isoFunders) {
        statsByISO[isoFunder._id].funder_count = isoFunder.funder_count;
    }

    // Get all ISO-merchants with stats
    const isoMerchants = await ISOMerchant.aggregate([
        { $match: { iso: { $in: isoIds } } },
        { $group: { _id: '$iso', merchant_count: { $sum: 1 } } }
    ]);
    for (const isoMerchant of isoMerchants) {
        statsByISO[isoMerchant._id].merchant_count = isoMerchant.merchant_count;
    }

    // Get all ISO-accounts with stats
    const isoAccounts = await ISOAccount.aggregate([
        { $match: { iso: { $in: isoIds }, inactive: { $ne: true } } },
        { $group: { _id: '$iso', account_count: { $sum: 1 } } }
    ]);
    for (const isoAccount of isoAccounts) {
        statsByISO[isoAccount._id].account_count = isoAccount.account_count;
    }
    
    // Get all applications with stats
    const applications = await Application.find({ 'iso.id': { $in: isoIds }, inactive: { $ne: true } }, '_id iso.id request_amount closed');
    for (const application of applications) {
        if (application.iso && application.iso.id) {
            const isoId = application.iso.id.toString();
            if (statsByISO[isoId]) {
                statsByISO[isoId].application_count += 1;
                statsByISO[isoId].application_request_amount += application.request_amount;
                if (!application.closed) {
                    statsByISO[isoId].pending_application_count += 1;
                    statsByISO[isoId].pending_application_request_amount += application.request_amount;
                }
            }
        }
    }

    // Get all fundings with stats
    const fundings = await Funding.find({ 'iso_list.id': { $in: isoIds }, inactive: { $ne: true } }, '_id iso_list funded_amount status');
    for (const funding of fundings) {
        // Handle multiple ISOs in iso_list
        if (funding.iso_list && Array.isArray(funding.iso_list)) {
            funding.iso_list.forEach(iso => {
                if (iso && iso.id) {
                    const isoId = iso.id.toString();
                    if (statsByISO[isoId]) {
                        statsByISO[isoId].funding_count += 1;
                        statsByISO[isoId].funding_amount += funding.funded_amount;
                        
                        if (funding.status?.closed) {
                            statsByISO[isoId].completed_funding_count += 1;
                            statsByISO[isoId].completed_funding_amount += funding.funded_amount;
                        } else {
                            statsByISO[isoId].active_funding_count += 1;
                            statsByISO[isoId].active_funding_amount += funding.funded_amount;
                        }

                        if (funding.status?.warning) {
                            statsByISO[isoId].warning_funding_count += 1;
                            statsByISO[isoId].warning_funding_amount += funding.funded_amount;
                        }
                        if (funding.status?.defaulted) {
                            statsByISO[isoId].default_funding_count += 1;
                            statsByISO[isoId].default_funding_amount += funding.funded_amount;
                        }
                    }
                }
            });
        }
    }
    
    
    // Get all commission intents with stats
    const commissionIntents = await CommissionIntent.find({ 'iso.id': { $in: isoIds } }, '_id iso.id amount status');
    for (const commissionIntent of commissionIntents) {
        if (commissionIntent.iso && commissionIntent.iso.id) {
            const isoId = commissionIntent.iso.id.toString();
            if (statsByISO[isoId]) {
                statsByISO[isoId].commission_count += 1;
                statsByISO[isoId].commission_amount += commissionIntent.amount;

                switch (commissionIntent.status) {
                case INTENT_STATUS.SCHEDULED:
                case INTENT_STATUS.SUBMITTED:
                case INTENT_STATUS.FAILED:
                    statsByISO[isoId].pending_commission_count += 1;
                    statsByISO[isoId].pending_commission_amount += commissionIntent.amount;
                    break;
                case INTENT_STATUS.SUCCEED:
                    statsByISO[isoId].paid_commission_count += 1;
                    statsByISO[isoId].paid_commission_amount += commissionIntent.amount;
                    break;
                case INTENT_STATUS.CANCELLED:
                    statsByISO[isoId].cancelled_commission_count += 1;
                    statsByISO[isoId].cancelled_commission_amount += commissionIntent.amount;
                    break;
                }
            }
        }
    }

    // Add calculated fields to each document
    docs.forEach(doc => {
        const isoId = doc._id.toString();
        const stats = statsByISO[isoId];

        doc.representative_count = stats.representative_count;
        doc.funder_count = stats.funder_count;
        doc.merchant_count = stats.merchant_count;
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

        doc.commission_count = stats.commission_count;
        doc.pending_commission_count = stats.pending_commission_count;
        doc.paid_commission_count = stats.paid_commission_count;
        doc.cancelled_commission_count = stats.cancelled_commission_count;

        doc.commission_amount = stats.commission_amount;
        doc.pending_commission_amount = stats.pending_commission_amount;
        doc.paid_commission_amount = stats.paid_commission_amount;
        doc.cancelled_commission_amount = stats.cancelled_commission_amount;

        // Set a flag to indicate that statistics have been calculated
        doc._calculatedStatsComplete = true;
    });

    return docs;
};

// Middleware to automatically add statistics to query results
ISOSchema.post('find', async function(docs) {
    if (this.getOptions()?.calculate) {
        await calculateStatistics(docs);
    }
});

ISOSchema.post('findOne', async function(doc) {
    if (doc && this.getOptions()?.calculate) {
        await calculateStatistics([doc]);
    }
});

const ISO = mongoose.model('ISO', ISOSchema);

module.exports = ISO; 