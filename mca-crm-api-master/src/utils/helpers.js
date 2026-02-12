const mongoose = require('mongoose');
const ErrorResponse = require('./errorResponse');
const { PORTAL_TYPES } = require('./constants');

const MerchantFunderService = require('../services/merchantFunderService');
const ISOMerchantService = require('../services/isoMerchantService');
const ISOFunderService = require('../services/isoFunderService');
const SyndicatorFunderService = require('../services/syndicatorFunderService');

/**
 * Get accessable funder ids according to different portal
 * @param {Object} req - The request object
 * @returns {Array} - The accessable funder ids
 */
exports.getAccessableFunderIds = async (req, session = null) => {
    let funderIds = [];

    switch (req.portal) {
    case PORTAL_TYPES.ADMIN:
        return null;
    case PORTAL_TYPES.BOOKKEEPER:
        return null;
    case PORTAL_TYPES.MERCHANT:
        if (req.filter?.merchant_list) {
            funderIds = await MerchantFunderService.getFundersByMerchantIds(req.filter.merchant_list, session);
        }
        break;
    case PORTAL_TYPES.FUNDER:
        funderIds = req.filter.funder_list || [];
        break;
    case PORTAL_TYPES.ISO:
        if (req.filter?.iso_list) {
            funderIds = await ISOFunderService.getFundersByISOIds(req.filter.iso_list, session);
        }
        break;
    case PORTAL_TYPES.SYNDICATOR:
        if (req.filter?.syndicator_list) {
            funderIds = await SyndicatorFunderService.getFundersBySyndicatorIds(req.filter.syndicator_list, session);
        }
        break;
    default:
        break;
    }

    return funderIds;
};

/**
 * Get accessable merchant ids according to different portal
 * @param {Object} req - The request object
 * @returns {Array} - The accessable merchant ids
 */
exports.getAccessableMerchantIds = async (req) => {
    let merchantIds = [];

    switch (req.portal) {
    case PORTAL_TYPES.ADMIN:
        return null;
    case PORTAL_TYPES.BOOKKEEPER:
        return null;
    case PORTAL_TYPES.MERCHANT:
        merchantIds = req.filter.merchant_list || [];
        break;
    case PORTAL_TYPES.FUNDER:
        if (req.filter?.funder) {
            merchantIds = await MerchantFunderService.getMerchantsByFunderId(req.filter.funder);
        } else if (req.filter?.funder_list) {
            merchantIds = await MerchantFunderService.getMerchantsByFunderIds(req.filter.funder_list);
        }
        break;
    case PORTAL_TYPES.ISO:
        if (req.filter?.iso_list) {
            merchantIds = await ISOMerchantService.getMerchantsByISOIds(req.filter.iso_list);
        }
        break;
    case PORTAL_TYPES.SYNDICATOR:
    default:
        break;
    }

    return merchantIds;
};


/**
 * Get accessable iso ids according to different portal
 * @param {Object} req - The request object
 * @returns {Array} - The accessable iso ids
 */
exports.getAccessableIsoIds = async (req) => {
    let isoIds = [];

    switch (req.portal) {
    case PORTAL_TYPES.ADMIN:
        return null;
    case PORTAL_TYPES.BOOKKEEPER:
        return null;
    case PORTAL_TYPES.MERCHANT:
        if (req.filter?.merchant_list) {
            isoIds = await ISOMerchantService.getISOsByMerchantIds(req.filter.merchant_list);
        }
        break;
    case PORTAL_TYPES.FUNDER:
        if (req.filter?.funder) {
            isoIds = await ISOFunderService.getISOsByFunderId(req.filter.funder);
        } else if (req.filter?.funder_list) {
            isoIds = await ISOFunderService.getISOsByFunderIds(req.filter.funder_list);
        }
        break;
    case PORTAL_TYPES.ISO:
        isoIds = req.filter?.iso_list || [];
        break;
    case PORTAL_TYPES.SYNDICATOR:
    default:
        break;
    }

    return isoIds;
};


/**
 * Get accessable syndicator ids according to different portal
 * @param {Object} req - The request object
 * @returns {Array} - The accessable syndicator ids
 */
exports.getAccessableSyndicatorIds = async (req, session = null) => {
    let syndicatorIds = [];

    switch (req.portal) {
    case PORTAL_TYPES.ADMIN:
        return null;
    case PORTAL_TYPES.BOOKKEEPER:
        return null;
    case PORTAL_TYPES.MERCHANT:
        break;
    case PORTAL_TYPES.FUNDER:
        if (req.filter?.funder) {
            syndicatorIds = await SyndicatorFunderService.getSyndicatorsByFunderId(req.filter.funder, session);
        } else if (req.filter?.funder_list) {
            syndicatorIds = await SyndicatorFunderService.getSyndicatorsByFunderIds(req.filter.funder_list, session);
        }
        break;
    case PORTAL_TYPES.ISO:
        break;
    case PORTAL_TYPES.SYNDICATOR:
        syndicatorIds = req.filter?.syndicator_list || [];
        break;
    default:
        break;
    }

    return syndicatorIds;
};

/**
 * Build a Sort Object with the given sort string, and the default sort
 * @param {string} sort - The sort string
 * @param {Object} [defaultSort={ _id: -1 }] - The default sort
 * @returns {Object} - The sort object
 */
exports.buildSort = (sort, defaultSort = { _id: -1 }) => {
    if (!sort) {
        return defaultSort;
    }
    return sort.split(',').map(item => item.startsWith('-') ? [item.slice(1), -1] : [item, 1]).reduce((acc, [field, direction]) => ({ ...acc, [field]: direction }), {});
};

/**
 * Build a Funder Filter Object with the given funder
 * @param {Object} req - The request object
 * @param {string} funder - The funder Id
 * @returns {Object} - The funder filter object
 */
exports.buildFunderFilter= (req, funder) => {
    if (req.filter?.funder) {
        if (funder) {
            if (req.filter.funder !== funder) {
                throw new ErrorResponse(`You do not have permission to access this funder: ${funder}`, 403);
            }
        } else {
            return req.filter.funder;
        }
    } else if (req.filter?.funder_list) {
        if (funder) {
            if (!req.filter.funder_list.includes(funder)) {
                throw new ErrorResponse(`You do not have permission to access this funder: ${funder}`, 403);
            }
        } else {
            return { $in: req.filter.funder_list };
        }
    }
    return funder;
};

/**
 * Build a Lender Filter Object with the given lender
 * @param {Object} req - The request object
 * @param {string} lender - The lender Id
 * @returns {Object} - The lender filter object
 */
exports.buildLenderFilter= (req, lender) => {
    if (req.filter?.lender_list) {
        if (lender) {
            if (!req.filter.lender_list.includes(lender)) {
                throw new ErrorResponse(`You do not have permission to access this lender: ${lender}`, 403);
            } else {
                return lender;
            }
        } else {
            return { $in: req.filter.lender_list };
        }

    }
    return lender;
};


/**
 * Build a Merchant Filter Object with the given merchant
 * @param {Object} req - The request object
 * @param {string} merchant - The merchant Id
 * @returns {Object} - The merchant filter object
 */
exports.buildMerchantFilter = (req, merchant) => {
    if (req.filter?.merchant_list) {
        if (merchant) {
            if (!req.filter.merchant_list.includes(merchant)) {
                throw new ErrorResponse(`You do not have permission to access this merchant: ${merchant}`, 403);
            } else {
                return merchant;
            }
        } else {
            return { $in: req.filter.merchant_list };
        }
    }
    return merchant;
};

/**
 * Build a Iso Filter Object with the given iso
 * @param {Object} req - The request object
 * @param {string} iso - The iso Id
 * @returns {Object} - The iso filter object
 */
exports.buildIsoFilter = (req, iso) => {
    if (req.filter?.iso_list) {
        if (iso) {
            if (!req.filter.iso_list.includes(iso)) {
                throw new ErrorResponse(`You do not have permission to access this iso: ${iso}`, 403);
            } else {
                return iso;
            }
        } else {
            return { $in: req.filter.iso_list };
        }
    }

    return iso;
};

/**
 * Build a Syndicator Filter Object with the given syndicator
 * @param {Object} req - The request object
 * @param {string} syndicator - The syndicator Id
 * @returns {Object} - The syndicator filter object
 */
exports.buildSyndicatorFilter = (req, syndicator) => {
    if (req.filter?.syndicator_list) {
        if (syndicator) {
            if (!req.filter.syndicator_list.includes(syndicator)) {
                throw new ErrorResponse(`You do not have permission to access this syndicator: ${syndicator}`, 403);
            } else {
                return syndicator;
            }
        } else {
            return { $in: req.filter.syndicator_list };
        }
    }
    return syndicator;
};

/**
 * Build a boolean filter object
 * @param {string} field - The field to search
 * @param {boolean} value - The value to search
 * @returns {Object} - The boolean filter object
 */
exports.buildBooleanFilter = (field, value) => {
    if (value !== undefined) {
        if (value) {
            return { [field]: { $eq: true } };
        } else {
            return { [field]: { $ne: true } };
        }
    }
    return {};
};

/**
 * Build a search filter object
 * @param {string|string[]} field - The field to search
 * @param {string} value - The value to search
 * @returns {Object} - The search filter object
 */
exports.buildSearchFilter = (field, value) => {
    let arrayField = [];
    if (!Array.isArray(field)) {
        if (field) {
            arrayField = [field];
        }
    } else {
        arrayField = field;
    }

    if (value && value.trim() !== '') {
        const arrayValues = value.split(' ');
        const excludeValues = arrayValues.filter(value => value.startsWith('-')).map(value => value.slice(1));
        const includeValues = arrayValues.filter(value => !value.startsWith('-'));

        let filter = {};
        if (excludeValues.length > 0) {
            filter.$and = [];
            for (const excludeValue of excludeValues) {
                if (excludeValue.trim() === 'EMPTY') {
                    arrayField.map(f => (filter.$and.push({ [f]: { $exists: true, $ne: null, $not: { $regex: '^\\s*$' } } })));
                } else {
                    arrayField.map(f => (filter.$and.push({ [f]: { $not: { $regex: excludeValue.trim(), $options: 'i' } } })));
                }
            }
        }

        if (includeValues.length > 0) {
            const includeFilter = { $or: [] };
            for (const includeValue of includeValues) {
                if (includeValue.trim() === 'EMPTY') {
                    arrayField.map(f => (includeFilter.$or.push({ $or: [{ [f]: { $exists: false } }, { [f]: { $eq: null } }, { [f]: { $regex: '^\\s*$' } }] })));
                } else {
                    arrayField.map(f => (includeFilter.$or.push({ [f]: { $regex: includeValue.trim(), $options: 'i' } })));
                }
            }

            if (filter.$and) {
                filter.$and.push(includeFilter);
            } else {
                filter = includeFilter;
            }
        }

        return filter;
    }

    return {};
};

/**
 * Build a greater than or equal to filter object
 * @param {string} field - The field to search
 * @param {string|Date|Number} value - The value to search
 * @returns {Object} - The greater than or equal to filter object
 */
exports.buildGTEFilter = (field, value, dollars = false) => {
    if (value) {
        if (typeof value === 'string') {
            if (value.trim() === '-EMPTY') {
                return { [field]: { $exists: true, $ne: null } };
            } else if (value.trim() === 'EMPTY') {
                return { $or: [{ [field]: { $exists: false } }, { [field]: { $eq: null } }] };
            }
        } else {
            return { [field]: { $gte: dollars ? this.dollarsToCents(value) : value } };
        }
    }
    return {};
};

/**
 * Build a less than or equal to filter object
 * @param {string} field - The field to search
 * @param {string|Date|Number} value - The value to search
 * @returns {Object} - The less than or equal to filter object
 */
exports.buildLTEFilter = (field, value, dollars = false) => {
    if (value) {
        if (typeof value === 'string') {
            if (value.trim() === '-EMPTY') {
                return { [field]: { $exists: true, $ne: null } };
            } else if (value.trim() === 'EMPTY') {
                return { $or: [{ [field]: { $exists: false } }, { [field]: { $eq: null } }] };
            }
        } else {
            return { [field]: { $lte: dollars ? this.dollarsToCents(value) : value } };
        }
    }
    return {};
};

/**
 * Build an array filter for the given field
 * @param {string} field - The field to search
 * @param {string[]||string} value - The value to search
 * @param {boolean} id - Whether the field is an id
 * @param {boolean} array - Whether the field is an array
 * @returns {Object} - The id filter object
 */
exports.buildArrayFilter = (field, value, id=false, array = false) => {
    let arrayValue = [];
    if (!Array.isArray(value)) {
        if (value) {
            arrayValue = [value];
        }
    } else {
        arrayValue = value;
    }

    // Handle the field name with dot
    const fieldArray = field.split('.');
    const fieldObject = fieldArray.length > 1 ? fieldArray.slice(0, -1).join('.') : field;

    let filter = {};

    if (arrayValue && arrayValue.length > 0) {
        const excludeValues = arrayValue.filter(value => value.startsWith('-')).map(value => value.slice(1));
        const includeValues = arrayValue.filter(value => !value.startsWith('-'));
        
        if (excludeValues.length > 0) {
            filter.$and = [];

            if (excludeValues.includes('EMPTY')) {
                filter.$and.push({ [fieldObject]: { $exists: true } });
                filter.$and.push({ [fieldObject]: { $ne: null } });
        
                if (!id) filter.$and.push({ [fieldObject]: { $not: { $regex: '^\\s*$' } } });
                if (array) filter.$and.push({ [fieldObject]: { $ne: [] } });

                const excludeValuesWithoutEmpty = excludeValues.filter(value => value !== 'EMPTY');
                if (excludeValuesWithoutEmpty.length > 0) {
                    filter.$and.push({ [field]: { $nin: excludeValuesWithoutEmpty } });
                }
            } else {
                filter.$and.push({ [field]: { $nin: excludeValues } });
            }
        }

        if (includeValues.length > 0) {
            const includeFilter = { $or: [] };
            
            if (includeValues.includes('EMPTY')) {
                includeFilter.$or.push({ [fieldObject]: { $exists: false } });
                includeFilter.$or.push({ [fieldObject]: { $eq: null } });

                if (!id) includeFilter.$or.push({ [fieldObject]: { $regex: '^\\s*$' } });
                if (array) includeFilter.$or.push({ [fieldObject]: { $size: 0 } });

                const includeValuesWithoutEmpty = includeValues.filter(value => value !== 'EMPTY');
                if (includeValuesWithoutEmpty.length > 0) {
                    includeFilter.$or.push({ [field]: { $in: includeValuesWithoutEmpty } });
                }
            } else {
                includeFilter.$or.push({ [field]: { $in: includeValues } });
            }

            if (filter.$and) {
                filter.$and.push(includeFilter);
            } else {
                filter = includeFilter;
            }
        }
    }

    return filter;
};

/**
 * Check if the field is an ObjectId
 * @param {any} field - The field to check
 * @returns {boolean} - True if the field is an ObjectId, false otherwise
 */
exports.isObjectId = (field) => {
    return typeof field === 'string' || 
           (field && typeof field === 'object' && field.constructor.name === 'ObjectId');
};

/**
 * Extract the string representation of the ObjectId from the given id object
 * @param {Object} obj - The Mongo ObjectId, could be a string or an ObjectId, or even a Document with id or _id property
 * @returns {String} - The string representation of the ObjectId
 */
exports.extractIdString = (obj) => {
    let str = null;

    if (typeof obj === 'string') {
        str = obj;
    } else if (obj instanceof mongoose.Types.ObjectId) {
        str = obj.toString();
    } else if (typeof obj === 'object' && obj !== null && (obj.id || obj._id)) {
        if (obj.id) {
            str = obj.id.toString();
        } else if (obj._id) {
            str = obj._id.toString();
        }
    }

    if (!str) {
        return null;
    }

    if (str.length === 24) {
        return str;
    } else {
        console.error('Invalid ObjectId:', obj);
        console.error('String length:', str.length);
        console.error('Converted string:', str);
        const result = str.replace(/^new ObjectId\("(.*)"\)$/, '$1');
        console.error('Returned Result:', result);
        return result;
    }
};

/**
 * Convert the cents to dollars and round to 2 decimal places
 * @param {number} cents - The cents
 * @returns {number} - The dollars
 */
exports.centsToDollars = (cents) => {
    if (cents == null || isNaN(cents)) {
        return null;
    }
    return Math.round((cents / 100) * 100) / 100; // Round to 2 decimal places but return as number
};

/**
 * Convert the dollars to cents and round to integer
 * @param {number} dollars - The dollars
 * @returns {number} - The cents
 */
exports.dollarsToCents = (dollars) => {
    if (dollars == null || isNaN(dollars)) {
        return null;
    }
    return Math.round(dollars * 100);
};

/**
 * Run a transaction with retry mechanism and proper error handling
 * @param {Function} txnFunc - The transaction function that receives session as parameter
 * @returns {Promise} - The result of the transaction
 */
exports.withTransaction = async (txnFunc) => {
    const session = await mongoose.startSession();
    
    // Retry commit function for UnknownTransactionCommitResult errors
    async function commitWithRetry(session) {
        try {
            await session.commitTransaction();
        } catch (error) {
            if (error.hasErrorLabel && error.hasErrorLabel('UnknownTransactionCommitResult')) {
                await commitWithRetry(session);
            } else {
                throw error;
            }
        }
    }

    // Retry transaction function for TransientTransactionError errors
    async function runTransactionWithRetry(txnFunc, session) {
        try {
            // Start the transaction
            await session.startTransaction({
                readConcern: { level: 'snapshot' },
                writeConcern: { w: 'majority' },
                readPreference: 'primary'
            });

            // Execute the transaction function
            const result = await txnFunc(session);

            // If successful, commit the transaction
            await commitWithRetry(session);
            
            return result;
        } catch (error) {

            // If transient error, retry the whole transaction
            if (error.hasErrorLabel && error.hasErrorLabel('TransientTransactionError')) {
                // Abort current transaction before retrying
                try {
                    await session.abortTransaction();
                } catch (abortError) {
                    console.error('Error aborting transaction before retry:', abortError.message);
                }
                // Retry with the same session
                return await runTransactionWithRetry(txnFunc, session);
            } else {
                // For non-transient errors, abort the transaction
                try {
                    await session.abortTransaction();
                } catch (abortError) {
                    console.error('Error aborting transaction:', abortError.message);
                }
                throw error;
            }
        }
    }

    try {
        // Run the transaction with retry mechanism
        return await runTransactionWithRetry(txnFunc, session);
    } finally {
        // Always end the session
        try {
            await session.endSession();
        } catch (endError) {
            console.error('Error ending session:', endError.message);
        }
    }
};
