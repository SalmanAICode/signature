const FunderAccount = require('../models/FunderAccount');

const Validators = require('../utils/validators');
const { centsToDollars, dollarsToCents } = require('../utils/helpers');

/**
 * Format the funder account data to apply setters manually (needed when using lean())
 * @param {Object} funderAccount - The funder account
 * @returns {Object} - The formatted funder account
 */
const formatDataBeforeReturn = (funderAccount) => {
    return {
        ...funderAccount,
        available_balance: centsToDollars(funderAccount.available_balance) || 0
    };
};

/**
 * Format the funder account data to apply setters manually (needed when using lean())
 * @param {Object} funderAccount - The funder account
 * @returns {Object} - The formatted funder account
 */
const formatDataBeforeSave = (funderAccount) => {
    return {
        ...funderAccount,
        available_balance: dollarsToCents(funderAccount.available_balance) || undefined
    };
};

/**
 * Create a new funder account
 * @param {Object} data - The funder account data
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Object} The funder account
 */
exports.createFunderAccount = async (data, populate = [], select = '') => {
    const funderAccount = await FunderAccount.create(formatDataBeforeSave(data));

    Validators.checkResourceNotFound(funderAccount, 'FunderAccount');

    return this.getFunderAccountById(funderAccount._id, populate, select);
};

/**
 * Get funder account by ID
 * @param {String} id - The funder account ID
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @param {Object} session - MongoDB session for transaction support
 * @returns {Object} The funder account
 */
exports.getFunderAccountById = async (id, populate = [], select = '', session = null) => {
    Validators.checkValidateObjectId(id, 'funder account ID');

    const funderAccount = await FunderAccount
        .findById(id, null, { session })
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(funderAccount, 'FunderAccount');

    return formatDataBeforeReturn(funderAccount);
};

/**
 * Get all funder accounts
 * @param {Object} query - The query object
 * @param {Number} page - The page number
 * @param {Number} limit - The limit number
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Object} The funder accounts
 */
exports.getFunderAccounts = async (query, page = 1, limit = 10, sort = { name: -1 }, populate = [], select = '') => {
    const skip = (page - 1) * limit;

    const [funderAccounts, count] = await Promise.all([
        FunderAccount.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        FunderAccount.countDocuments(query)
    ]);

    return {
        docs: funderAccounts.map(formatDataBeforeReturn),
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of funder accounts without pagination
 * @param {Object} query - The query object
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Array} The funder accounts
 */
exports.getFunderAccountList = async (query, sort = { name: -1 }, populate = [], select = '') => {
    const funderAccounts = await FunderAccount.find(query)
        .sort(sort)
        .populate(populate)
        .select(select)
        .lean();

    return funderAccounts.map(formatDataBeforeReturn);
};

/**
 * Update a funder account
 * @param {String} id - The funder account ID
 * @param {Object} data - The funder account data
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Object} The funder account
 */
exports.updateFunderAccount = async (id, data, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'funder account ID');

    const updatedFunderAccount = await FunderAccount.findByIdAndUpdate(id, formatDataBeforeSave(data), { new: true });

    Validators.checkResourceNotFound(updatedFunderAccount, 'FunderAccount');

    return this.getFunderAccountById(updatedFunderAccount._id, populate, select);
};

/**
 * Soft delete a funder account
 * @param {String} id - The funder account ID
 * @returns {Object} The funder account
 */
exports.deleteFunderAccount = async (id) => {
    Validators.checkValidateObjectId(id, 'funder account ID');

    const funderAccount = await FunderAccount.findByIdAndUpdate(id, { inactive: true }, { new: true });

    Validators.checkResourceNotFound(funderAccount, 'FunderAccount');

    return funderAccount;
};