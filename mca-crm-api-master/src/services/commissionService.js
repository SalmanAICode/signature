const Commission = require('../models/Commission');
const CommissionIntent = require('../models/CommissionIntent');

const { COMMISSION_STATUS, INTENT_STATUS } = require('../utils/constants');
const Validators = require('../utils/validators');
const Helpers = require('../utils/helpers');
const { centsToDollars, dollarsToCents } = require('../utils/helpers');

/**
 * Format the commission data to apply setters manually (needed when using lean())
 * @param {Object} commission - The commission
 * @returns {Object} - The formatted commission
 */
const formatDataBeforeReturn = (commission) => {
    return {
        ...commission,
        amount: centsToDollars(commission.amount) || 0,

        commission_intent: Helpers.isObjectId(commission.commission_intent) ? commission.commission_intent : {
            ...commission.commission_intent,
            amount: centsToDollars(commission.commission_intent.amount) || 0
        }
    };
};

/**
 * Format the commission data to apply setters manually (needed when using lean())
 * @param {Object} commission - The commission
 * @returns {Object} - The formatted commission
 */
const formatDataBeforeSave = (commission) => {
    return {
        ...commission,
        amount: dollarsToCents(commission.amount) || undefined
    };
};

/**
 * Create a new commission
 * @param {Object} data - The data of the commission
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 */
exports.createCommission = async (data, populate = [], select = '') => {
    const commission = await Commission.create(formatDataBeforeSave(data));
    
    Validators.checkResourceCreated(commission, 'commission');

    if (commission.status === COMMISSION_STATUS.SUCCEED) {
        // Update the commission intent status to SUCCEED
        await CommissionIntent.findByIdAndUpdate(commission.commission_intent, { status: INTENT_STATUS.SUCCEED });
    } else if (commission.status === COMMISSION_STATUS.FAILED) {
        // Update the commission intent status to FAILED
        await CommissionIntent.findByIdAndUpdate(commission.commission_intent, { status: INTENT_STATUS.FAILED });
    }

    return await this.getCommissionById(commission._id, populate, select);
};

/**
 * get commission by ID
 * @param {string} id - The ID of the commission
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 */
exports.getCommissionById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'commission ID');

    const commission = await Commission
        .findById(id)
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(commission, 'commission');

    return formatDataBeforeReturn(commission);
};

/**
 * get all commissions  
 * @param {Object} query - The query object
 * @param {number} page - The page number
 * @param {number} limit - The limit number
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 */
exports.getCommissions = async (query, page = 1, limit = 10, sort = { submitted_date: -1 }, populate = [], select = '') => {
    const skip = (page - 1) * limit;
    const [commissions, count] = await Promise.all([
        Commission.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        Commission.countDocuments(query)
    ]);
    return {
        docs: commissions.map(formatDataBeforeReturn),
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * get list of commissions without pagination
 * @param {Object} query - The query object
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 */
exports.getCommissionList = async (query, sort = { submitted_date: -1 }, populate = [], select = '') => {
    const commissions = await Commission.find(query)
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();

    return commissions.map(formatDataBeforeReturn);
};

/**
 * Update a commission
 * @param {string} id - The ID of the commission
 * @param {Object} data - The data of the commission
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 */
exports.updateCommission = async (id, data, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'commission ID');

    const commission = await Commission.findByIdAndUpdate(id, formatDataBeforeSave(data), { new: true, runValidators: true });

    Validators.checkResourceNotFound(commission, 'commission');

    if (commission.status === COMMISSION_STATUS.SUCCEED) {
        // Update the commission intent status to SUCCEED
        await CommissionIntent.findByIdAndUpdate(commission.commission_intent, { status: INTENT_STATUS.SUCCEED });
    } else if (commission.status === COMMISSION_STATUS.FAILED) {
        // Update the commission intent status to FAILED
        await CommissionIntent.findByIdAndUpdate(commission.commission_intent, { status: INTENT_STATUS.FAILED });
    }

    return await this.getCommissionById(commission._id, populate, select);
};

/**
 * A commission processed by the bank
 * @param {string} id - The ID of the commission
 * @param {string} userId - The ID of the user
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 */
exports.processed = async (id, userId = null, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'commission ID');

    const commission = await Commission.findByIdAndUpdate(id, { status: COMMISSION_STATUS.PROCESSING, hit_date: Date.now(), updated_by_user: userId });

    Validators.checkResourceNotFound(commission, 'commission');

    return await this.getCommissionById(id, populate, select);
};

/**
 * A commission is successfully processed by the bank
 * @param {string} id - The ID of the commission
 * @param {string} userId - The ID of the user
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 */
exports.succeed = async (id, userId = null, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'commission ID');

    // The middleware in Commission schema will handle:
    // - Updating commission intent status to SUCCEED
    // - Creating transaction if it doesn't exist
    const commission = await this.updateCommission(id, { 
        status: COMMISSION_STATUS.SUCCEED, 
        response_date: Date.now(), 
        updated_by_user: userId 
    });

    Validators.checkResourceNotFound(commission, 'commission');

    return await this.getCommissionById(id, populate, select);
};

/**
 * A commission is failed to be processed by the bank
 * @param {string} id - The ID of the commission
 * @param {string} userId - The ID of the user
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 */
exports.failed = async (id, userId = null, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'commission ID');

    // The middleware in Commission schema will handle:
    // - Updating commission intent status to FAILED
    const commission = await Commission.findByIdAndUpdate(id, { 
        status: COMMISSION_STATUS.FAILED, 
        response_date: Date.now(), 
        updated_by_user: userId 
    });

    Validators.checkResourceNotFound(commission, 'commission');

    return await this.getCommissionById(id, populate, select);
};

/**
 * A commission is reconciled
 * @param {string} id - The ID of the commission
 * @param {string} userId - The ID of the user
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 */
exports.reconcile = async (id, userId = null, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'commission ID');

    const commission = await Commission.findByIdAndUpdate(id, { reconciled: true, updated_by_user: userId });

    Validators.checkResourceNotFound(commission, 'commission');

    return await this.getCommissionById(id, populate, select);
};