const LenderAccount = require('../models/LenderAccount');

const Validators = require('../utils/validators');
const { centsToDollars, dollarsToCents } = require('../utils/helpers');

/**
 * Format the lender account data to apply setters manually (needed when using lean())
 * @param {Object} lenderAccount - The lender account
 * @returns {Object} - The formatted lender account
 */
const formatDataBeforeReturn = (lenderAccount) => {
    return {
        ...lenderAccount,
        available_balance: centsToDollars(lenderAccount.available_balance) || 0
    };
};

/**
 * Format the lender account data to apply setters manually (needed when using lean())
 * @param {Object} lenderAccount - The lender account
 * @returns {Object} - The formatted lender account
 */
const formatDataBeforeSave = (lenderAccount) => {
    return {
        ...lenderAccount,
        available_balance: dollarsToCents(lenderAccount.available_balance) || undefined
    };
};

/**
 * Create a new lender account
 * @param {Object} data - The lender account data
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Object} The lender account
 */
exports.createLenderAccount = async (data, populate = [], select = '') => {
    const lenderAccount = await LenderAccount.create(formatDataBeforeSave(data));

    Validators.checkResourceNotFound(lenderAccount, 'LenderAccount');

    return this.getLenderAccountById(lenderAccount._id, populate, select);
};

/**
 * Get lender account by ID
 * @param {String} id - The lender account ID
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Object} The lender account
 */
exports.getLenderAccountById = async (id, populate = [], select = '', session = null) => {
    Validators.checkValidateObjectId(id, 'lender account ID');

    const lenderAccount = await LenderAccount
        .findById(id, null, { session })
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(lenderAccount, 'LenderAccount');

    return formatDataBeforeReturn(lenderAccount);
};

/**
 * Get all lender accounts
 * @param {Object} query - The query object
 * @param {Number} page - The page number
 * @param {Number} limit - The limit number
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Object} The lender accounts
 */
exports.getLenderAccounts = async (query, page = 1, limit = 10, sort = { name: -1 }, populate = [], select = '') => {
    const skip = (page - 1) * limit;

    const [lenderAccounts, count] = await Promise.all([
        LenderAccount.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        LenderAccount.countDocuments(query)
    ]);

    return {
        docs: lenderAccounts.map(formatDataBeforeReturn),
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of lender accounts without pagination
 * @param {Object} query - The query object
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Array} The lender accounts
 */
exports.getLenderAccountList = async (query, sort = { name: -1 }, populate = [], select = '', session = null) => {
    const lenderAccounts = await LenderAccount.find(query, null, { session })
        .sort(sort)
        .populate(populate)
        .select(select)
        .lean();

    return lenderAccounts.map(formatDataBeforeReturn);
};

/**
 * Update a lender account
 * @param {String} id - The lender account ID
 * @param {Object} data - The lender account data
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Object} The lender account
 */
exports.updateLenderAccount = async (id, data, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'lender account ID');

    const updatedLenderAccount = await LenderAccount.findByIdAndUpdate(id, formatDataBeforeSave(data), { new: true });

    Validators.checkResourceNotFound(updatedLenderAccount, 'LenderAccount');

    return this.getLenderAccountById(updatedLenderAccount._id, populate, select);
};

/**
 * Soft delete a lender account
 * @param {String} id - The lender account ID
 * @returns {Object} The lender account
 */
exports.deleteLenderAccount = async (id) => {
    Validators.checkValidateObjectId(id, 'lender account ID');

    const lenderAccount = await LenderAccount.findByIdAndUpdate(id, { inactive: true }, { new: true });

    Validators.checkResourceNotFound(lenderAccount, 'LenderAccount');

    return lenderAccount;
};