const DisbursementIntent = require('../models/DisbursementIntent');
const Funder = require('../models/Funder');
const Lender = require('../models/Lender');
const Merchant = require('../models/Merchant');

const Validators = require('../utils/validators');
const { centsToDollars, dollarsToCents } = require('../utils/helpers');

/**
 * Format the disbursement intent data to apply setters manually (needed when using lean())
 * @param {Object} disbursementIntent - The disbursement intent
 * @returns {Object} - The formatted disbursement intent
 */
const formatDataBeforeReturn = (disbursementIntent) => {
    return {
        ...disbursementIntent,
        amount: centsToDollars(disbursementIntent.amount) || 0,

        submitted_amount: centsToDollars(disbursementIntent.submitted_amount) || 0,
        processing_amount: centsToDollars(disbursementIntent.processing_amount) || 0,
        succeed_amount: centsToDollars(disbursementIntent.succeed_amount) || 0,
        failed_amount: centsToDollars(disbursementIntent.failed_amount) || 0,
        paid_amount: centsToDollars(disbursementIntent.paid_amount) || 0,
        pending_amount: centsToDollars(disbursementIntent.pending_amount) || 0,
        remaining_balance: centsToDollars(disbursementIntent.remaining_balance) || 0    
    };
};

/**
 * Format the disbursement intent data to apply setters manually (needed when using lean())
 * @param {Object} disbursementIntent - The disbursement intent
 * @returns {Object} - The formatted disbursement intent
 */
const formatDataBeforeSave = (disbursementIntent) => {
    return {
        ...disbursementIntent,
        amount: dollarsToCents(disbursementIntent.amount) || undefined
    };
};

/**
 * Create a new disbursement intent
 * @param {Object} data - The data object
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 * @param {boolean} calculate - The calculate boolean
 */
exports.createDisbursementIntent = async (data, populate = [], select = '', calculate = false) => {
    // Convert all embedded fields in parallel
    const conversions = await Promise.all([
        data.funder ? Funder.convertToEmbeddedFormat(data.funder) : Promise.resolve(null),
        data.lender ? Lender.convertToEmbeddedFormat(data.lender) : Promise.resolve(null),
        data.merchant ? Merchant.convertToEmbeddedFormat(data.merchant) : Promise.resolve(null),
    ]);

    // Assign converted values back to disbursementIntentData
    if (data.funder) data.funder = conversions[0];
    if (data.lender) data.lender = conversions[1];
    if (data.merchant) data.merchant = conversions[2];
    
    const disbursementIntent = await DisbursementIntent.create(formatDataBeforeSave(data));
    Validators.checkResourceCreated(disbursementIntent, 'disbursement intent');

    return await this.getDisbursementIntentById(disbursementIntent._id, populate, select, calculate);
};

/**
 * Get disbursement intent by ID
 * @param {string} id - The disbursement intent ID
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 * @param {boolean} calculate - The calculate boolean
 */
exports.getDisbursementIntentById = async (id, populate = [], select = '', calculate = false) => {
    Validators.checkValidateObjectId(id, 'disbursement intent ID');

    const disbursementIntent = await DisbursementIntent
        .findById(id, null, { calculate })
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(disbursementIntent, 'disbursement intent');
    return formatDataBeforeReturn(disbursementIntent);
};

/**
 * Get all disbursement intents
 * @param {Object} query - The query object
 * @param {number} page - The page number
 * @param {number} limit - The limit number
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 */
exports.getDisbursementIntents = async (query, page = 1, limit = 10, sort = { disbursement_date: -1 }, populate = [], select = '', calculate = false) => {
    const skip = (page - 1) * limit;
    const [disbursementIntents, count] = await Promise.all([
        DisbursementIntent.find(query, null, {calculate})
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        DisbursementIntent.countDocuments(query)
    ]);
    return {
        docs: disbursementIntents.map(formatDataBeforeReturn),
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of disbursement intents without pagination
 * @param {Object} query - The query object
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 * @param {boolean} calculate - The calculate boolean
 */
exports.getDisbursementIntentList = async (query, sort = { disbursement_date: -1 }, populate = [], select = '', calculate = false) => {
    const disbursementIntents = await DisbursementIntent.find(query, null, {calculate})
        .select(select)
        .sort(sort)
        .populate(populate)
        .lean();

    return disbursementIntents.map(formatDataBeforeReturn);
};

/**
 * Update a disbursement intent
 * @param {string} id - The disbursement intent ID
 * @param {Object} data - The data object
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 * @param {boolean} calculate - The calculate boolean
 */
exports.updateDisbursementIntent = async (id, data, populate = [], select = '', calculate = false) => {
    Validators.checkValidateObjectId(id, 'disbursement intent ID');
    
    const updatedDisbursementIntent = await DisbursementIntent.findByIdAndUpdate(id, formatDataBeforeSave(data), { new: true });

    Validators.checkResourceNotFound(updatedDisbursementIntent, 'disbursement intent');
    
    return await this.getDisbursementIntentById(updatedDisbursementIntent._id, populate, select, calculate);
};