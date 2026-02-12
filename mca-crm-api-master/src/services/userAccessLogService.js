const UserAccessLog = require('../models/UserAccessLog');
const mongoose = require('mongoose');

const ErrorResponse = require('../utils/errorResponse');
const Validators = require('../utils/validators');
const { PORTAL_OPERATIONS } = require('../utils/constants');

/**
 * Get all user access logs with filtering and pagination
 */
exports.getUserAccessLogs = async (query, page = 1, limit = 10, sort = { access_date: -1 }, populate = [], select = '') => {
    const skip = (page - 1) * limit;
    
    const [userAccessLogs, count] = await Promise.all([
        UserAccessLog.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        UserAccessLog.countDocuments(query)
    ]);
    
    return {
        docs: userAccessLogs,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of user access logs without pagination
 */
exports.getUserAccessLogList = async (query, sort = { access_date: -1 }, populate = [], select = '') => {
    return await UserAccessLog.find(query)
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();
};

/**
 * Get a user access log by id
 */
exports.getUserAccessLogById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'User Access Log ID');

    const userAccessLog = await UserAccessLog.findById(id)
        .populate(populate)
        .select(select)
        .lean();

    if (!userAccessLog) {
        throw new ErrorResponse(`User access log not found with id of ${id}`, 404);
    }

    return userAccessLog;
};

/**
 * Create a user access log entry
 */
exports.createUserAccessLog = async (data) => {
    try {
        const userAccessLog = await UserAccessLog.create(data);
        return userAccessLog;
    } catch (error) {
        // Log the error but don't throw to prevent breaking the main operation
        console.error('Error creating user access log:', error);
        return null;
    }
};

/**
 * Log user login
 */
exports.logUserLogin = async (userId, ipAddress) => {
    Validators.checkValidateObjectId(userId, 'User ID');

    return await this.createUserAccessLog({
        user: userId,
        operation: PORTAL_OPERATIONS.LOGIN,
        access_date: Date.now(),
        ip_address: ipAddress
    });
};

/**
 * Log user logout
 */
exports.logUserLogout = async (userId, ipAddress) => {
    Validators.checkValidateObjectId(userId, 'User ID');

    return await this.createUserAccessLog({
        user: userId,
        operation: PORTAL_OPERATIONS.LOGOUT,
        access_date: Date.now(),
        ip_address: ipAddress
    });
};

/**
 * Log user session timeout
 */
exports.logUserSessionTimeout = async (userId, ipAddress) => {
    Validators.checkValidateObjectId(userId, 'User ID');

    return await this.createUserAccessLog({
        user: userId,
        operation: PORTAL_OPERATIONS.SESSION_TIMEOUT,
        access_date: Date.now(),
        ip_address: ipAddress
    });
};

/**
 * Get user access logs by user ID
 */
exports.getUserAccessLogsByUserId = async (userId, page = 1, limit = 10, sort = { access_date: -1 }, populate = [], select = '') => {
    Validators.checkValidateObjectId(userId, 'User ID');

    const query = { user: userId };
    return await this.getUserAccessLogs(query, page, limit, sort, populate, select);
};

/**
 * Get user access logs by operation type
 */
exports.getUserAccessLogsByOperation = async (operation, page = 1, limit = 10, sort = { access_date: -1 }, populate = [], select = '') => {
    if (!Object.values(PORTAL_OPERATIONS).includes(operation)) {
        throw new ErrorResponse(`Invalid operation: ${operation}`, 400);
    }

    const query = { operation };
    return await this.getUserAccessLogs(query, page, limit, sort, populate, select);
};

/**
 * Get user access logs within a date range
 */
exports.getUserAccessLogsByDateRange = async (startDate, endDate, page = 1, limit = 10, sort = { access_date: -1 }, populate = [], select = '') => {
    const query = {
        access_date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    };
    
    return await this.getUserAccessLogs(query, page, limit, sort, populate, select);
};

/**
 * Get recent user activity (last login/logout for each user)
 */
exports.getRecentUserActivity = async (limit = 50, populate = ['user']) => {
    return await UserAccessLog.aggregate([
        {
            $sort: { access_date: -1 }
        },
        {
            $group: {
                _id: '$user',
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
        ...(populate.includes('user') ? [
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            }
        ] : [])
    ]);
};

/**
 * Get user login statistics
 */
exports.getUserLoginStats = async (userId, days = 30) => {
    Validators.checkValidateObjectId(userId, 'User ID');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await UserAccessLog.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId),
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
 * Delete old user access logs (cleanup)
 */
exports.deleteOldUserAccessLogs = async (daysToKeep = 365) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await UserAccessLog.deleteMany({
        access_date: { $lt: cutoffDate }
    });

    return result;
};
