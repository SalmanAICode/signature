const MerchantAccount = require('../models/MerchantAccount');
const Validators = require('../utils/validators');

/**
 * Create a new merchant account
 * @param {Object} data - The merchant account data
 * @param {Array} populate - The populate of the merchant account
 * @param {string} select - The select of the merchant account
 * @returns {Promise<Object>} - The merchant account
 */
exports.createMerchantAccount = async (data, populate = [], select = '') => {
    const merchantAccount = await MerchantAccount.create(data);
    Validators.checkResourceCreated(merchantAccount, 'merchant account');

    return await this.getMerchantAccountById(merchantAccount._id, populate, select);
};

/**
 * Get merchant account by ID
 * @param {string} id - The ID of the merchant account
 * @param {Array} populate - The populate of the merchant account
 * @param {string} select - The select of the merchant account
 * @returns {Promise<Object>} - The merchant account
 */
exports.getMerchantAccountById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'merchant account ID');

    const merchantAccount = await MerchantAccount
        .findById(id)
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(merchantAccount, 'Merchant account');

    return merchantAccount;
};

/**
 * Get all merchant accounts
 * @param {Object} query - The query of the merchant accounts
 * @param {number} page - The page of the merchant accounts
 * @param {number} limit - The limit of the merchant accounts
 * @param {Object} sort - The sort of the merchant accounts
 * @param {Array} populate - The populate of the merchant accounts
 * @param {string} select - The select of the merchant accounts
 * @returns {Promise<Object>} - The merchant accounts
 */
exports.getMerchantAccounts = async (query, sort = { name: -1 }, page = 1, limit = 10, populate = [], select = '') => {
    const skip = (page - 1) * limit;

    const [merchantAccounts, count] = await Promise.all([
        MerchantAccount.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        MerchantAccount.countDocuments(query)
    ]);

    return {
        docs: merchantAccounts,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of merchant accounts without pagination
 * @param {Object} query - The query of the merchant accounts
 * @param {Object} sort - The sort of the merchant accounts
 * @param {Array} populate - The populate of the merchant accounts
 * @param {string} select - The select of the merchant accounts
 * @returns {Promise<Object>} - The merchant accounts
 */
exports.getMerchantAccountList = async (query, sort = { name: -1 }, populate = [], select = '') => {
    return await MerchantAccount.find(query)
        .sort(sort)
        .populate(populate)
        .select(select)
        .lean();
};

/**
 * Update a merchant account
 * @param {string} id - The ID of the merchant account
 * @param {Object} data - The update data of the merchant account
 * @param {Array} populate - The populate of the merchant account
 * @param {string} select - The select of the merchant account
 * @returns {Promise<Object>} - The merchant account
 */
exports.updateMerchantAccount = async (id, data, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'merchant account ID');

    const updatedMerchantAccount = await MerchantAccount.findByIdAndUpdate(id, data, { new: true });

    Validators.checkResourceNotFound(updatedMerchantAccount, 'Merchant account');

    return await this.getMerchantAccountById(updatedMerchantAccount._id, populate, select);
};

/**
 * Soft delete a merchant account
 * @param {string} id - The ID of the merchant account
 * @param {Array} populate - The populate of the merchant account
 * @param {string} select - The select of the merchant account
 * @returns {Promise<Object>} - The merchant account
 */
exports.deleteMerchantAccount = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'merchant account ID');

    const deletedMerchantAccount = await MerchantAccount.findByIdAndUpdate(id, { inactive: true }, { new: true });

    Validators.checkResourceNotFound(deletedMerchantAccount, 'Merchant account');

    return await this.getMerchantAccountById(deletedMerchantAccount._id, populate, select);
};
