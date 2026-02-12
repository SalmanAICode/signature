const FundingCredit = require('../models/FundingCredit');

const Validators = require('../utils/validators');
const { centsToDollars, dollarsToCents } = require('../utils/helpers');

/**
 * Format the funding credit data to apply setters manually (needed when using lean())
 * @param {Object} fundingCredit - The funding credit
 * @returns {Object} - The formatted funding credit
 */
const formatDataBeforeReturn = (fundingCredit) => {
    return {
        ...fundingCredit,
        amount: centsToDollars(fundingCredit.amount) || 0
    };
};

/**
 * Format the funding credit data to apply setters manually (needed when using lean())
 * @param {Object} fundingCredit - The funding credit
 * @returns {Object} - The formatted funding credit
 */
const formatDataBeforeSave = (fundingCredit) => {
    return {
        ...fundingCredit,
        amount: dollarsToCents(fundingCredit.amount) || undefined
    };
};

/**
 * Get all funding credits with filtering and pagination
 * @param {object} query - The query object
 * @param {number} page - The page number
 * @param {number} limit - The limit number
 * @param {object} sort - The sort object
 * @param {array} populate - The populate array
 * @param {string} select - The select string
 */
exports.getFundingCredits = async (query, sort = { credit_date: -1 }, page = 1, limit = 10, populate = [], select = '') => {
    const skip = (page - 1) * limit;

    const [fundingCredits, count] = await Promise.all([
        FundingCredit.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        FundingCredit.countDocuments(query)
    ]);

    return {
        docs: fundingCredits.map(formatDataBeforeReturn),
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};


/**
 * Get funding credit list (no pagination)
 * @param {object} query - The query object
 * @param {object} sort - The sort object
 * @param {array} populate - The populate array
 * @param {string} select - The select string
 */
exports.getFundingCreditList = async (query, sort = { created_date: -1 }, populate = [], select = '') => {
    const fundingCredits = await FundingCredit
        .find(query)
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();

    return fundingCredits.map(formatDataBeforeReturn);
};

/**
 * Get a single funding credit by ID
 * @param {string} id - The ID of the funding credit
 * @param {array} populate - The populate array
 * @param {string} select - The select string
 */
exports.getFundingCreditById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'funding credit ID');

    const fundingCredit = await FundingCredit.findById(id)
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(fundingCredit, 'Funding Credit');

    return formatDataBeforeReturn(fundingCredit);
};

/**
 * Create a new funding credit
 * @param {object} data - The data object
 * @param {array} populate - The populate array
 * @param {string} select - The select string
 */
exports.createFundingCredit = async (data, populate = [], select = '') => {
    const fundingCredit = await FundingCredit.create(formatDataBeforeSave(data));

    Validators.checkResourceCreated(fundingCredit, 'Funding Credit');
    
    return await this.getFundingCreditById(fundingCredit._id, populate, select);
};

/**
 * Update a funding credit
 * @param {string} id - The ID of the funding credit
 * @param {object} data - The data object
 * @param {array} populate - The populate array
 * @param {string} select - The select string
 */
exports.updateFundingCredit = async (id, data, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'funding credit ID');

    const fundingCredit = await FundingCredit.findByIdAndUpdate(id, formatDataBeforeSave(data), { new: true, runValidators: true });

    Validators.checkResourceNotFound(fundingCredit, 'Funding Credit');

    return await this.getFundingCreditById(fundingCredit._id, populate, select);
};

/**
 * delete funding credit by ID
 * @param {string} id - The ID of the funding credit
 * @param {array} populate - The populate array
 * @param {string} select - The select string
 */
exports.deleteFundingCredit = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'funding credit ID');

    const fundingCredit = await FundingCredit.findByIdAndUpdate(id, { inactive: true }, { new: true, runValidators: true });

    Validators.checkResourceNotFound(fundingCredit, 'Funding Credit');

    return await this.getFundingCreditById(fundingCredit._id, populate, select);
};
