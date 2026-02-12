const FundingFee = require('../models/FundingFee');

const Validators = require('../utils/validators');
const { centsToDollars, dollarsToCents } = require('../utils/helpers');

/**
 * Format the funding fee data to apply setters manually (needed when using lean())
 * @param {Object} fundingFee - The funding fee
 * @returns {Object} - The formatted funding fee
 */
const formatDataBeforeReturn = (fundingFee) => {
    return {
        ...fundingFee,

        amount: centsToDollars(fundingFee.amount) || 0
    };
};

/**
 * Format the funding fee data to apply setters manually (needed when using lean())
 * @param {Object} fundingFee - The funding fee
 * @returns {Object} - The formatted funding fee
 */
const formatDataBeforeSave = (fundingFee) => {
    return {
        ...fundingFee,
        amount: dollarsToCents(fundingFee.amount) || undefined
    };
};

/**
 * Get all funding fees with filtering and pagination
 * @param {Object} query - The query object
 * @param {number} page - The page number
 * @param {number} limit - The limit number
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 */
exports.getFundingFees = async (query, sort = { fee_date: -1 }, page = 1, limit = 10, populate = [], select = '') => {
    const skip = (page - 1) * limit;

    const [fundingFees, count] = await Promise.all([
        FundingFee.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        FundingFee.countDocuments(query)
    ]);

    return {
        docs: fundingFees.map(formatDataBeforeReturn),
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
exports.getFundingFeeList = async (query, sort = { fee_date: -1 }, populate = [], select = '') => {
    const fundingFees = await FundingFee
        .find(query)
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();

    return fundingFees.map(formatDataBeforeReturn);
};

/**
 * Get a single funding fee by ID
 * @param {string} id - The funding fee ID
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 */
exports.getFundingFeeById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'funding fee ID');

    const fundingFee = await FundingFee.findById(id)
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(fundingFee, 'Funding Fee');

    return formatDataBeforeReturn(fundingFee);
};

/**
 * Create a new funding fee
 * @param {Object} data - The data object
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 */
exports.createFundingFee = async (data, populate = [], select = '') => { 
    const fundingFee = await FundingFee.create(formatDataBeforeSave(data));
    Validators.checkResourceCreated(fundingFee, 'Funding Fee');

    return await this.getFundingFeeById(fundingFee._id, populate, select);
};

/**
 * Update a funding fee
 * @param {string} id - The funding fee ID
 * @param {Object} data - The data object
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 */
exports.updateFundingFee = async (id, data, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'funding fee ID');

    const updatedFundingFee = await FundingFee.findByIdAndUpdate(id, formatDataBeforeSave(data), { new: true, runValidators: true });

    Validators.checkResourceNotFound(updatedFundingFee, 'Funding Fee');

    return await this.getFundingFeeById(updatedFundingFee._id, populate, select);
};

/**
 * delete funding fee by ID
 */
exports.deleteFundingFee = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'funding fee ID');

    const deletedFundingFee = await FundingFee.findByIdAndUpdate(id, { inactive: true }, { new: true, runValidators: true });

    Validators.checkResourceNotFound(deletedFundingFee, 'Funding Fee');

    return await this.getFundingFeeById(deletedFundingFee._id, populate, select);
};
