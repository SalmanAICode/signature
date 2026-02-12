const PaybackLog = require('../models/PaybackLog');

/**
 * Get all payback logs
 * @param {object} query - The query object
 * @param {number} page - The page number
 * @param {number} limit - The limit number
 * @param {object} sort - The sort object
 * @param {array} populate - The populate array
 * @param {string} select - The select string
 */
exports.getPaybackLogs = async (query, page = 1, limit = 10, sort = { created_date: -1 }, populate = [], select = '') => {
    const skip = (page - 1) * limit;

    const [paybackLogs, count] = await Promise.all([
        PaybackLog.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        PaybackLog.countDocuments(query)
    ]);
    return {
        docs: paybackLogs,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalDocs: count
        }
    };
};

/** 
 * Get a list of payback logs without pagination
 * @param {object} query - The query object
 * @param {object} sort - The sort object
 * @param {array} populate - The populate array
 * @param {string} select - The select string
 */
exports.getPaybackLogList = async (query, sort = { created_date: -1 }, populate = [], select = '') => {
    return await PaybackLog.find(query)
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();
};

/**
 * Get a payback log by id
 * @param {string} paybackLogId - The id of the payback log
 * @param {array} populate - The populate array
 * @param {string} select - The select string
 */
exports.getPaybackLogById = async (paybackLogId, populate = [], select = '') => {
    const paybackLog = await PaybackLog.findById(paybackLogId)
        .populate(populate)
        .select(select)
        .lean();
    return paybackLog;
};

/**
 * Create a new payback log
 * @param {object} data - The payback log data
 */
exports.createPaybackLog = async (data) => {
    try {
        const paybackLog = await PaybackLog.create(data);
        return paybackLog;
    } catch (error) {
        // Will log the error to the console, not throw an error
        console.error(error);
        return null;
    }
};

