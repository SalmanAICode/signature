const CommissionIntent = require('../models/CommissionIntent');
const Funder = require('../models/Funder');
const Lender = require('../models/Lender');
const ISO = require('../models/ISO');

const Validators = require('../utils/validators');
const { centsToDollars, dollarsToCents } = require('../utils/helpers');

/**
 * Format the commission intent data to apply setters manually (needed when using lean())
 * @param {Object} commissionIntent - The commission intent
 * @returns {Object} - The formatted commission intent
 */
const formatDataBeforeReturn = (commissionIntent) => {
    return {
        ...commissionIntent,
        amount: centsToDollars(commissionIntent.amount) || 0,

        submitted_amount: centsToDollars(commissionIntent.submitted_amount) || 0,
        processing_amount: centsToDollars(commissionIntent.processing_amount) || 0,
        succeed_amount: centsToDollars(commissionIntent.succeed_amount) || 0,
        failed_amount: centsToDollars(commissionIntent.failed_amount) || 0,
        paid_amount: centsToDollars(commissionIntent.paid_amount) || 0,
        pending_amount: centsToDollars(commissionIntent.pending_amount) || 0,
        remaining_balance: centsToDollars(commissionIntent.remaining_balance) || 0
    };
};

/**
 * Format the commission intent data to apply setters manually (needed when using lean())
 * @param {Object} commissionIntent - The commission intent
 * @returns {Object} - The formatted commission intent
 */
const formatDataBeforeSave = (commissionIntent) => {
    return {
        ...commissionIntent,
        amount: dollarsToCents(commissionIntent.amount) || undefined
    };
};

/**
 * Create a new commission intent
 * @param {Object} data - The data to create the commission intent
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 * @param {boolean} calculate - The calculate boolean
 */
exports.createCommissionIntent = async (data, populate = [], select = '', calculate = false) => {
    // Convert all embedded fields in parallel
    const conversions = await Promise.all([
        data.funder ? Funder.convertToEmbeddedFormat(data.funder) : Promise.resolve(null),
        data.lender ? Lender.convertToEmbeddedFormat(data.lender) : Promise.resolve(null),
        data.iso ? ISO.convertToEmbeddedFormat(data.iso) : Promise.resolve(null),
    ]);

    // Assign converted values back to disbursementIntentData
    if (data.funder) data.funder = conversions[0];
    if (data.lender) data.lender = conversions[1];
    if (data.iso) data.iso = conversions[2];

    const commissionIntent = await CommissionIntent.create(formatDataBeforeSave(data));
    Validators.checkResourceCreated(commissionIntent, 'commission intent');

    return await this.getCommissionIntentById(commissionIntent._id, populate, select, calculate);
};

/**
 * Get commission intent by ID
 * @param {string} id - The ID of the commission intent
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 * @param {boolean} calculate - The calculate boolean
 */
exports.getCommissionIntentById = async (id, populate = [], select = '', calculate = false) => {
    Validators.checkValidateObjectId(id, 'commission intent ID');

    const commissionIntent = await CommissionIntent
        .findById(id, null, { calculate })
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(commissionIntent, 'commission intent');
    return formatDataBeforeReturn(commissionIntent);
};

/**
 * Get all commission intents
 * @param {Object} query - The query object
 * @param {number} page - The page number
 * @param {number} limit - The limit number
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 */
exports.getCommissionIntents = async (query, page = 1, limit = 10, sort = { commission_date: -1 }, populate = [], select = '', calculate = false) => {
    const skip = (page - 1) * limit;

    const [commissionIntents, count] = await Promise.all([
        CommissionIntent.find(query, null, { calculate })
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        CommissionIntent.countDocuments(query)
    ]);
    return {
        docs: commissionIntents.map(formatDataBeforeReturn),
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of commission intents without pagination
 * @param {Object} query - The query object
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 * @param {boolean} calculate - The calculate boolean
 */
exports.getCommissionIntentList = async (query, sort = { commission_date: -1 }, populate = [], select = '', calculate = false) => {
    const commissionIntents = await CommissionIntent.find(query, null, { calculate })
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();

    return commissionIntents.map(formatDataBeforeReturn);
};

/**
 * Update a commission intent
 * @param {string} id - The ID of the commission intent
 * @param {Object} updateData - The update data
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 * @param {boolean} calculate - The calculate boolean
 */
exports.updateCommissionIntent = async (id, updateData, populate = [], select = '', calculate = false) => {
    Validators.checkValidateObjectId(id, 'commission intent ID');
    
    const updatedCommissionIntent = await CommissionIntent.findByIdAndUpdate(id, formatDataBeforeSave(updateData), { new: true });
    
    return await this.getCommissionIntentById(updatedCommissionIntent._id, populate, select, calculate);
};
