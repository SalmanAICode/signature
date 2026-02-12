const SyndicatorAccessLog = require('../models/SyndicatorAccessLog');
const mongoose = require('mongoose');

const ErrorResponse = require('../utils/errorResponse');
const Validators = require('../utils/validators');
const { PORTAL_OPERATIONS } = require('../utils/constants');

/**
 * Get all syndicator access logs with filtering and pagination
 */
exports.getSyndicatorAccessLogs = async (query, page = 1, limit = 10, sort = { access_date: -1 }, populate = [], select = '') => {
    const skip = (page - 1) * limit;
    
    const [syndicatorAccessLogs, count] = await Promise.all([
        SyndicatorAccessLog.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        SyndicatorAccessLog.countDocuments(query)
    ]);
    
    return {
        docs: syndicatorAccessLogs,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of syndicator access logs without pagination
 */
exports.getSyndicatorAccessLogList = async (query, sort = { access_date: -1 }, populate = [], select = '') => {
    return await SyndicatorAccessLog.find(query)
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();
};

/**
 * Get a syndicator access log by id
 */
exports.getSyndicatorAccessLogById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'Syndicator Access Log ID');

    const syndicatorAccessLog = await SyndicatorAccessLog.findById(id)
        .populate(populate)
        .select(select)
        .lean();

    if (!syndicatorAccessLog) {
        throw new ErrorResponse(`Syndicator access log not found with id of ${id}`, 404);
    }

    return syndicatorAccessLog;
};

/**
 * Create a syndicator access log entry
 */
exports.createSyndicatorAccessLog = async (data) => {
    try {
        const syndicatorAccessLog = await SyndicatorAccessLog.create(data);
        return syndicatorAccessLog;
    } catch (error) {
        // Log the error but don't throw to prevent breaking the main operation
        console.error('Error creating syndicator access log:', error);
        return null;
    }
};

/**
 * Log syndicator login
 */
exports.logSyndicatorLogin = async (syndicatorId, ipAddress) => {
    Validators.checkValidateObjectId(syndicatorId, 'Syndicator ID');

    return await this.createSyndicatorAccessLog({
        syndicator: syndicatorId,
        operation: PORTAL_OPERATIONS.LOGIN,
        access_date: Date.now(),
        ip_address: ipAddress
    });
};

/**
 * Log syndicator logout
 */
exports.logSyndicatorLogout = async (syndicatorId, ipAddress) => {
    Validators.checkValidateObjectId(syndicatorId, 'Syndicator ID');

    return await this.createSyndicatorAccessLog({
        syndicator: syndicatorId,
        operation: PORTAL_OPERATIONS.LOGOUT,
        access_date: Date.now(),
        ip_address: ipAddress
    });
};

/**
 * Log syndicator session timeout
 */
exports.logSyndicatorSessionTimeout = async (syndicatorId, ipAddress) => {
    Validators.checkValidateObjectId(syndicatorId, 'Syndicator ID');

    return await this.createSyndicatorAccessLog({
        syndicator: syndicatorId,
        operation: PORTAL_OPERATIONS.SESSION_TIMEOUT,
        access_date: Date.now(),
        ip_address: ipAddress
    });
};

/**
 * Get syndicator access logs by syndicator ID
 */
exports.getSyndicatorAccessLogsBySyndicatorId = async (syndicatorId, page = 1, limit = 10, sort = { access_date: -1 }, populate = [], select = '') => {
    Validators.checkValidateObjectId(syndicatorId, 'Syndicator ID');

    const query = { syndicator: syndicatorId };
    return await this.getSyndicatorAccessLogs(query, page, limit, sort, populate, select);
};

/**
 * Get syndicator access logs by operation type
 */
exports.getSyndicatorAccessLogsByOperation = async (operation, page = 1, limit = 10, sort = { access_date: -1 }, populate = [], select = '') => {
    if (!Object.values(PORTAL_OPERATIONS).includes(operation)) {
        throw new ErrorResponse(`Invalid operation: ${operation}`, 400);
    }

    const query = { operation };
    return await this.getSyndicatorAccessLogs(query, page, limit, sort, populate, select);
};

/**
 * Get syndicator access logs within a date range
 */
exports.getSyndicatorAccessLogsByDateRange = async (startDate, endDate, page = 1, limit = 10, sort = { access_date: -1 }, populate = [], select = '') => {
    const query = {
        access_date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    };
    
    return await this.getSyndicatorAccessLogs(query, page, limit, sort, populate, select);
};

/**
 * Get recent syndicator activity (last login/logout for each syndicator)
 */
exports.getRecentSyndicatorActivity = async (limit = 50, populate = ['syndicator']) => {
    return await SyndicatorAccessLog.aggregate([
        {
            $sort: { access_date: -1 }
        },
        {
            $group: {
                _id: '$syndicator',
                lastActivity: { $first: '$$ROOT' }
            }
        },
        {
            $replaceRoot: { newRoot: '$lastActivity' }
        },
        {
            $sort: { access_date: -1 }
        },
        {
            $limit: limit
        },
        ...(populate.includes('syndicator') ? [
            {
                $lookup: {
                    from: 'syndicators',
                    localField: 'syndicator',
                    foreignField: '_id',
                    as: 'syndicator'
                }
            },
            {
                $unwind: '$syndicator'
            }
        ] : [])
    ]);
};

/**
 * Get syndicator login statistics
 */
exports.getSyndicatorLoginStats = async (syndicatorId, days = 30) => {
    Validators.checkValidateObjectId(syndicatorId, 'Syndicator ID');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await SyndicatorAccessLog.aggregate([
        {
            $match: {
                syndicator: new mongoose.Types.ObjectId(syndicatorId),
                operation: PORTAL_OPERATIONS.LOGIN,
                access_date: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: '%Y-%m-%d',
                        date: '$access_date'
                    }
                },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { '_id': 1 }
        }
    ]);

    return stats;
};

/**
 * Delete old syndicator access logs (cleanup)
 */
exports.deleteOldSyndicatorAccessLogs = async (daysToKeep = 365) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await SyndicatorAccessLog.deleteMany({
        access_date: { $lt: cutoffDate }
    });

    return result;
}; 