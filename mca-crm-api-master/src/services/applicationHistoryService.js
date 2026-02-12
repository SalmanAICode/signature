const ApplicationHistory = require('../models/ApplicationHistory');
const User = require('../models/User');

const Validators = require('../utils/validators');

/**
 * Create a new application history
 * @param {Object} data - The application history data
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Object} The application history object
*/
exports.createApplicationHistory = async (data, populate = [], select = '') => {
    // Convert the accross-related fields to the proper object structure
    if (data.assigned_user) data.assigned_user = await User.convertToEmbeddedFormat(data.assigned_user);
    if (data.assigned_manager) data.assigned_manager = await User.convertToEmbeddedFormat(data.assigned_manager);
    
    const applicationHistory = await ApplicationHistory.create(data);
    
    return await this.getApplicationHistoryById(applicationHistory._id, populate, select);
};

/**
 * get application history by ID
 * @param {String} id - The application history ID
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Object} The application history object
*/
exports.getApplicationHistoryById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'application history ID');

    const applicationHistory = await ApplicationHistory.findById(id)
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(applicationHistory, 'Application history');

    return applicationHistory;
};

/**
 * get all application histories
 * @param {Object} query - The query object
 * @param {Number} page - The page number
 * @param {Number} limit - The limit number
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Object} The application history object
 */
exports.getApplicationHistories = async (query, page = 1, limit = 10, sort = { assigned_timestamp: -1 }, populate = [], select = '') => {
    const skip = (page - 1) * limit;

    const [applicationHistories, count] = await Promise.all([
        ApplicationHistory.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate(populate)
            .select(select)
            .lean(),
        ApplicationHistory.countDocuments(query)
    ]);

    return {
        docs: applicationHistories,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * get all application histories list
 * @param {Object} query - The query object
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Object} The application history object
 */
exports.getApplicationHistoriesList = async (query, sort = { assigned_timestamp: -1 }, populate = [], select = '') => {
    return await ApplicationHistory.find(query)
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();
};