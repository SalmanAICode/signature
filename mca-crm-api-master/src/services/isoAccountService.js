const ISOAccount = require('../models/ISOAccount');
const Validators = require('../utils/validators');

/**
 * Create a new ISO account
 */
exports.createISOAccount = async (data, populate = [], select = '') => { 
    const isoAccount = await ISOAccount.create(data);
    Validators.checkResourceCreated(isoAccount, 'ISO account'); 

    return await this.getISOAccountById(isoAccount._id, populate, select);
};

/**
 * Get ISO account by ID
 */
exports.getISOAccountById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'ISO account ID');

    const isoAccount = await ISOAccount
        .findById(id)
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(isoAccount, 'ISO account');

    return isoAccount;
};

/**
 * Get all ISO accounts
 */
exports.getISOAccounts = async (query, sort = { name: -1 }, page = 1, limit = 10, populate = [], select = '') => {
    const skip = (page - 1) * limit;

    const [isoAccounts, count] = await Promise.all([
        ISOAccount.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        ISOAccount.countDocuments(query)
    ]);

    return {
        docs: isoAccounts,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of ISO accounts without pagination
 */
exports.getISOAccountList = async (query, sort = { name: -1 }, populate = [], select = '') => {
    return await ISOAccount.find(query)
        .sort(sort)
        .populate(populate)
        .select(select)
        .lean();
};

/**
 * Update an ISO account
 */
exports.updateISOAccount = async (id, updateData, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'ISO account ID');

    const isoAccount = await ISOAccount.findByIdAndUpdate(id, updateData, { new: true });
    Validators.checkResourceNotFound(isoAccount, 'ISO account');

    return await this.getISOAccountById(isoAccount._id, populate, select);
};

/**
 * Soft delete an ISO account
 */
exports.deleteISOAccount = async (id) => {
    Validators.checkValidateObjectId(id, 'ISO account ID');

    const isoAccount = await ISOAccount.findById(id);
    
    Validators.checkResourceNotFound(isoAccount, 'ISO account');

    isoAccount.inactive = true;
    await isoAccount.save();

    return isoAccount;
};