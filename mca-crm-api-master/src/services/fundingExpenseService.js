const FundingExpense = require('../models/FundingExpense');

const Validators = require('../utils/validators');
const { centsToDollars, dollarsToCents } = require('../utils/helpers');

/**
 * Format the funding expense data to apply setters manually (needed when using lean())
 * @param {Object} fundingExpense - The funding expense
 * @returns {Object} - The formatted funding expense
 */
const formatDataBeforeReturn = (fundingExpense) => {
    return {
        ...fundingExpense,

        amount: centsToDollars(fundingExpense.amount) || 0
    };
};

/**
 * Format the funding expense data to apply setters manually (needed when using lean())
 * @param {Object} fundingExpense - The funding expense
 * @returns {Object} - The formatted funding expense
 */
const formatDataBeforeSave = (fundingExpense) => {
    return {
        ...fundingExpense,
        amount: dollarsToCents(fundingExpense.amount) || undefined
    };
};

/**
 * Get all funding expenses with filtering and pagination
 * @param {Object} query - The query object
 * @param {number} page - The page number
 * @param {number} limit - The limit number
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 */
exports.getFundingExpenses = async (query, page = 1, limit = 10, sort = { expense_date: -1 }, populate = [], select = '') => {
    const skip = (page - 1) * limit;

    const [fundingExpenses, count] = await Promise.all([
        FundingExpense.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        FundingExpense.countDocuments(query)
    ]);

    return {
        docs: fundingExpenses.map(formatDataBeforeReturn),
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};


/**
 * Get funding list (no pagination)
 * @param {Object} query - The query object
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 */
exports.getFundingExpenseList = async (query, sort = { expense_date: -1 }, populate = [], select = '') => {
    const fundingExpenses = await FundingExpense
        .find(query)
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();

    return fundingExpenses.map(formatDataBeforeReturn);
};

/**
 * Get a single funding expense by ID
 * @param {string} id - The funding expense ID
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 */
exports.getFundingExpenseById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'funding expense ID');

    const fundingExpense = await FundingExpense.findById(id)
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(fundingExpense, 'Funding Expense');

    return formatDataBeforeReturn(fundingExpense);
};

/**
 * Create a new funding expense
 * @param {Object} data - The data object
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 */
exports.createFundingExpense = async (data, populate = [], select = '') => { 
    const fundingExpense = await FundingExpense.create(formatDataBeforeSave(data));
    Validators.checkResourceCreated(fundingExpense, 'Funding Expense');

    return await this.getFundingExpenseById(fundingExpense._id, populate, select);
};

/**
 * Update a funding expense
 * @param {string} id - The funding expense ID
 * @param {Object} data - The data object
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 */
exports.updateFundingExpense = async (id, data, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'funding expense ID');

    const updatedFundingExpense = await FundingExpense.findByIdAndUpdate(id, formatDataBeforeSave(data), { new: true, runValidators: true });

    Validators.checkResourceNotFound(updatedFundingExpense, 'Funding Expense');

    return await this.getFundingExpenseById(updatedFundingExpense._id, populate, select);
};

/**
 * delete funding expense by ID
 */
exports.deleteFundingExpense = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'funding expense ID');

    const deletedFundingExpense = await FundingExpense.findByIdAndUpdate(id, { inactive: true }, { new: true, runValidators: true });

    Validators.checkResourceNotFound(deletedFundingExpense, 'Funding Expense');

    return await this.getFundingExpenseById(deletedFundingExpense._id, populate, select);
};
