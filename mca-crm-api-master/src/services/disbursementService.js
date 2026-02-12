const Disbursement = require('../models/Disbursement');

const { DISBURSEMENT_STATUS } = require('../utils/constants');
const Validators = require('../utils/validators');
const Helpers = require('../utils/helpers');
const { centsToDollars, dollarsToCents } = require('../utils/helpers');


/**
 * Format the disbursement data to apply setters manually (needed when using lean())
 * @param {Object} disbursement - The disbursement
 * @returns {Object} - The formatted disbursement
 */
const formatDataBeforeReturn = (disbursement) => {
    return {
        ...disbursement,
        amount: centsToDollars(disbursement.amount) || 0,

        disbursement_intent: Helpers.isObjectId(disbursement.disbursement_intent) ? disbursement.disbursement_intent : {
            ...disbursement.disbursement_intent,
            amount: centsToDollars(disbursement.disbursement_intent.amount) || 0
        }
    };
};

/**
 * Format the disbursement data to apply setters manually (needed when using lean())
 * @param {Object} disbursement - The disbursement
 * @returns {Object} - The formatted disbursement
 */
const formatDataBeforeSave = (disbursement) => {
    return {
        ...disbursement,
        amount: dollarsToCents(disbursement.amount) || undefined
    };
};

/**
 * Create a new disbursement
 * @param {Object} data - The data object
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
*/
exports.createDisbursement = async (data, populate = [], select = '') => {
    // The middleware in Disbursement schema will handle:
    // - Updating disbursement intent status for SUCCEED/FAILED
    // - Creating transaction for SUCCEED status
    const disbursement = await Disbursement.create(formatDataBeforeSave(data));
    
    Validators.checkResourceCreated(disbursement, 'disbursement');

    return await this.getDisbursementById(disbursement._id, populate, select);
};

/**
 * get disbursement by ID
 * @param {string} id - The disbursement ID
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 */
exports.getDisbursementById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'disbursement ID');

    const disbursement = await Disbursement
        .findById(id)
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(disbursement, 'disbursement');

    return formatDataBeforeReturn(disbursement);
};

/**
 * get all disbursements
 * @param {Object} query - The query object
 * @param {number} page - The page number
 * @param {number} limit - The limit number
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 */
exports.getDisbursements = async (query, page = 1, limit = 10, sort = { submitted_date: -1 }, populate = [], select = '') => {
    const skip = (page - 1) * limit;
    const [disbursements, count] = await Promise.all([
        Disbursement.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        Disbursement.countDocuments(query)
    ]);
    return {
        docs: disbursements.map(formatDataBeforeReturn),
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * get list of disbursements without pagination
 * @param {Object} query - The query object
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 */
exports.getDisbursementList = async (query, sort = { submitted_date: -1 }, populate = [], select = '') => {
    const disbursements = await Disbursement.find(query)
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();

    return disbursements.map(formatDataBeforeReturn);
};

/**
 * Update a disbursement
 * @param {string} id - The disbursement ID
 * @param {Object} data - The data object
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 */
exports.updateDisbursement = async (id, data, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'disbursement ID');

    const disbursement = await Disbursement.findById(id);
    
    Validators.checkResourceNotFound(disbursement, 'disbursement');

    // The middleware in Disbursement schema will handle:
    // - Updating disbursement intent status for SUCCEED/FAILED
    // - Creating transaction for SUCCEED status
    await Disbursement.findByIdAndUpdate(id, formatDataBeforeSave(data), { new: true, runValidators: true });

    return await this.getDisbursementById(id, populate, select);
};

/**
 * A disbursement processed by the bank
 * @param {string} id - The disbursement ID
 * @param {string} userId - The user ID
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 */
exports.processed = async (id, userId = null, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'disbursement ID');

    const disbursement = await Disbursement.findByIdAndUpdate(id, 
        { status: DISBURSEMENT_STATUS.PROCESSING, processed_date: Date.now(), updated_by_user: userId },
        { new: true, runValidators: true }
    );

    Validators.checkResourceNotFound(disbursement, 'disbursement');

    return await this.getDisbursementById(id, populate, select);
};

/**
 * A disbursement is successfully processed by the bank
 * @param {string} id - The disbursement ID
 * @param {string} userId - The user ID
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 */
exports.succeed = async (id, userId = null, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'disbursement ID');

    // The middleware in Disbursement schema will handle:
    // - Updating disbursement intent status to SUCCEED
    // - Creating transaction if it doesn't exist
    const disbursement = await this.updateDisbursement(id, { 
        status: DISBURSEMENT_STATUS.SUCCEED, 
        responsed_date: Date.now(), 
        updated_by_user: userId 
    });

    Validators.checkResourceNotFound(disbursement, 'disbursement');

    return await this.getDisbursementById(id, populate, select);
};

/**
 * A disbursement is failed to be processed by the bank
 * @param {string} id - The disbursement ID
 * @param {string} userId - The user ID
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 */
exports.failed = async (id, userId = null, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'disbursement ID');

    // The middleware in Disbursement schema will handle:
    // - Updating disbursement intent status to FAILED
    const disbursement = await Disbursement.findByIdAndUpdate(id, { 
        status: DISBURSEMENT_STATUS.FAILED, 
        responsed_date: Date.now(), 
        updated_by_user: userId 
    }, { new: true, runValidators: true });

    Validators.checkResourceNotFound(disbursement, 'disbursement');

    return await this.getDisbursementById(id, populate, select);
};

/**
 * A disbursement is reconciled
 */
exports.reconcile = async (id, userId = null, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'disbursement ID');

    const disbursement = await Disbursement.findByIdAndUpdate(id, 
        { reconciled: true, updated_by_user: userId },
        { new: true, runValidators: true }
    );

    Validators.checkResourceNotFound(disbursement, 'disbursement');

    return await this.getDisbursementById(id, populate, select);
};