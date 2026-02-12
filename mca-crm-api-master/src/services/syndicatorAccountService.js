const SyndicatorAccount = require('../models/SyndicatorAccount');
const Validators = require('../utils/validators');

/**
 * Create a new syndicator account
 */
exports.createSyndicatorAccount = async (data, populate = [], select = '') => { 
    const syndicatorAccount = await SyndicatorAccount.create(data);
    Validators.checkResourceCreated(syndicatorAccount, 'Syndicator account'); 

    return await this.getSyndicatorAccountById(syndicatorAccount._id, populate, select);
};

/**
 * Get syndicator account by ID
 */
exports.getSyndicatorAccountById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'Syndicator account ID');

    const syndicatorAccount = await SyndicatorAccount
        .findById(id)
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(syndicatorAccount, 'Syndicator account');

    return syndicatorAccount;
};

/**
 * Get all syndicator accounts
 */
exports.getSyndicatorAccounts = async (query, sort = { name: -1 }, page = 1, limit = 10, populate = [], select = '') => {
    const skip = (page - 1) * limit;

    const [syndicatorAccounts, count] = await Promise.all([
        SyndicatorAccount.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        SyndicatorAccount.countDocuments(query)
    ]);

    return {
        docs: syndicatorAccounts,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of syndicator accounts without pagination
 */
exports.getSyndicatorAccountList = async (query, sort = { name: -1 }, populate = [], select = '') => {
    return await SyndicatorAccount.find(query)
        .sort(sort)
        .populate(populate)
        .select(select)
        .lean();
};

/**
 * Update a syndicator account
 */
exports.updateSyndicatorAccount = async (id, updateData, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'Syndicator account ID');

    const syndicatorAccount = await SyndicatorAccount.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    Validators.checkResourceNotFound(syndicatorAccount, 'Syndicator account');

    return await this.getSyndicatorAccountById(syndicatorAccount._id, populate, select);
};

/**
 * Soft delete a syndicator account
 */
exports.deleteSyndicatorAccount = async (id) => {
    Validators.checkValidateObjectId(id, 'Syndicator account ID');

    const syndicatorAccount = await SyndicatorAccount.findById(id);
    
    Validators.checkResourceNotFound(syndicatorAccount, 'Syndicator account');

    syndicatorAccount.inactive = true;
    await syndicatorAccount.save();

    return syndicatorAccount;
}; 