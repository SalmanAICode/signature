const Payout = require('../models/Payout');

const Validators = require('../utils/validators');
const Helpers = require('../utils/helpers');
const { centsToDollars, dollarsToCents } = require('../utils/helpers');

/**
 * Format the payout data to apply setters manually (needed when using lean())
 * @param {Object} payout - The payout
 * @returns {Object} - The formatted payout
 */
const formatDataBeforeReturn = (payout) => {
    return {
        ...payout,
        payout_amount: centsToDollars(payout.payout_amount) || 0,
        fee_amount: centsToDollars(payout.fee_amount) || 0,
        credit_amount: centsToDollars(payout.credit_amount) || 0,
        available_amount: centsToDollars(payout.available_amount) || 0,

        payback: payout.payback ? Helpers.isObjectId(payout.payback) ? payout.payback : {
            ...payout.payback,
            payback_amount: centsToDollars(payout.payback.payback_amount) || undefined,
            funded_amount: centsToDollars(payout.payback.funded_amount) || undefined,
            fee_amount: centsToDollars(payout.payback.fee_amount) || undefined,
            credit_amount: centsToDollars(payout.payback.credit_amount) || undefined
        } : null,

        syndication: payout.syndication ? Helpers.isObjectId(payout.syndication) ? payout.syndication : {
            ...payout.syndication,
            participate_amount: centsToDollars(payout.syndication.participate_amount) || undefined,
            payback_amount: centsToDollars(payout.syndication.payback_amount) || undefined
        } : null,

        funding: payout.funding ? Helpers.isObjectId(payout.funding) ? payout.funding : {
            ...payout.funding,
            funded_amount: centsToDollars(payout.funding.funded_amount) || undefined,
            payback_amount: centsToDollars(payout.funding.payback_amount) || undefined,
            commission_amount: centsToDollars(payout.funding.commission_amount) || undefined
        } : null
    };
};

/**
 * Format the payout data to apply setters manually (needed when using lean())
 * @param {Object} payout - The payout
 * @returns {Object} - The formatted payout
 */
const formatDataBeforeSave = (payout) => {
    return {
        ...payout,
        payout_amount: dollarsToCents(payout.payout_amount) || undefined,
        fee_amount: dollarsToCents(payout.fee_amount) || undefined,
        credit_amount: dollarsToCents(payout.credit_amount) || undefined
    };
};

/**
 * Get payout by id
 * @param {string} id - The ID of the payout
 * @param {array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @returns {Promise<Object>} The payout
 */
exports.getPayoutById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'Payout ID');

    const payout = await Payout.findById(id)
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(payout, `Payout with id of ${id}`);
    return formatDataBeforeReturn(payout);
};

/**
 * Create a new payout
 * @param {object} data - The data to create the payout
 * @param {array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @returns {Promise<Object>} The payout
 */
exports.createPayout = async (data, populate = [], select = '') => {
    if (!data.created_date) data.created_date = Date.now();

    const payout = await Payout.create(formatDataBeforeSave(data));
    
    Validators.checkResourceCreated(payout, 'payout');
    
    return await this.getPayoutById(payout._id, populate, select);
};

/**
 * Get paginated payouts
 * @param {object} query - The query to get the payouts
 * @param {number} page - The page number
 * @param {number} limit - The limit of the payouts
 * @param {object} sort - The sort of the payouts
 * @param {array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @returns {Promise<Object>} The payouts
 */
exports.getPayouts = async (query, sort = { created_date: -1 }, page = 1, limit = 10, populate = [], select = '') => {
    const skip = (page - 1) * limit;

    const [payouts, count] = await Promise.all([
        Payout.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        Payout.countDocuments(query)
    ]);

    return {
        docs: payouts.map(formatDataBeforeReturn),
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of payouts without pagination
 * @param {object} query - The query to get the payouts
 * @param {object} sort - The sort of the payouts
 * @param {array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @returns {Promise<Object>} The payouts
 */
exports.getPayoutList = async (query, sort = { created_date: -1 },populate = [], select = '') => {
    const payouts = await Payout.find(query)
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();

    return payouts.map(formatDataBeforeReturn);
};

/**
 * Update a payout
 * @param {string} id - The ID of the payout
 * @param {object} data - The data to update the payout
 * @param {array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @returns {Promise<Object>} The payout
 */
exports.updatePayout = async (id, data, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'Payout ID');

    const updatedPayout = await Payout.findByIdAndUpdate(id, formatDataBeforeSave(data), { new: true, runValidators: true });

    Validators.checkResourceNotFound(updatedPayout, 'payout');
    
    return await this.getPayoutById(updatedPayout._id, populate, select);
};

/**
 * Delete a payout
 * @param {string} id - The ID of the payout
 * @param {array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @returns {Promise<Object>} The payout
 */
exports.deletePayout = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'Payout ID');

    const deletedPayout = await Payout.findByIdAndUpdate(id, { inactive: true }, { new: true, runValidators: true });

    Validators.checkResourceNotFound(deletedPayout, 'payout');
    
    return await this.getPayoutById(deletedPayout._id, populate, select);
};



