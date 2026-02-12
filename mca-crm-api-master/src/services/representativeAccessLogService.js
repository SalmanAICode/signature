const RepresentativeAccessLog = require('../models/RepresentativeAccessLog');
const mongoose = require('mongoose');

const ErrorResponse = require('../utils/errorResponse');
const Validators = require('../utils/validators');
const { PORTAL_OPERATIONS } = require('../utils/constants');

/**
 * Get all representative access logs with filtering and pagination
 */
exports.getRepresentativeAccessLogs = async (query, page = 1, limit = 10, sort = { access_date: -1 }, populate = [], select = '') => {
    const skip = (page - 1) * limit;
    
    const [representativeAccessLogs, count] = await Promise.all([
        RepresentativeAccessLog.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        RepresentativeAccessLog.countDocuments(query)
    ]);
    
    return {
        docs: representativeAccessLogs,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of representative access logs without pagination
 */
exports.getRepresentativeAccessLogList = async (query, sort = { access_date: -1 }, populate = [], select = '') => {
    return await RepresentativeAccessLog.find(query)
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();
};

/**
 * Get a representative access log by id
 */
exports.getRepresentativeAccessLogById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'Representative Access Log ID');

    const representativeAccessLog = await RepresentativeAccessLog.findById(id)
        .populate(populate)
        .select(select)
        .lean();

    if (!representativeAccessLog) {
        throw new ErrorResponse(`Representative access log not found with id of ${id}`, 404);
    }

    return representativeAccessLog;
};

/**
 * Create a representative access log entry
 */
exports.createRepresentativeAccessLog = async (data) => {
    try {
        const representativeAccessLog = await RepresentativeAccessLog.create(data);
        return representativeAccessLog;
    } catch (error) {
        // Log the error but don't throw to prevent breaking the main operation
        console.error('Error creating representative access log:', error);
        return null;
    }
};

/**
 * Log representative login
 */
exports.logRepresentativeLogin = async (representativeId, ipAddress) => {
    Validators.checkValidateObjectId(representativeId, 'Representative ID');

    return await this.createRepresentativeAccessLog({
        representative: representativeId,
        operation: PORTAL_OPERATIONS.LOGIN,
        access_date: Date.now(),
        ip_address: ipAddress
    });
};

/**
 * Log representative logout
 */
exports.logRepresentativeLogout = async (representativeId, ipAddress) => {
    Validators.checkValidateObjectId(representativeId, 'Representative ID');

    return await this.createRepresentativeAccessLog({
        representative: representativeId,
        operation: PORTAL_OPERATIONS.LOGOUT,
        access_date: Date.now(),
        ip_address: ipAddress
    });
};

/**
 * Log representative session timeout
 */
exports.logRepresentativeSessionTimeout = async (representativeId, ipAddress) => {
    Validators.checkValidateObjectId(representativeId, 'Representative ID');

    return await this.createRepresentativeAccessLog({
        representative: representativeId,
        operation: PORTAL_OPERATIONS.SESSION_TIMEOUT,
        access_date: Date.now(),
        ip_address: ipAddress
    });
};

/**
 * Get representative access logs by representative ID
 */
exports.getRepresentativeAccessLogsByRepresentativeId = async (representativeId, page = 1, limit = 10, sort = { access_date: -1 }, populate = [], select = '') => {
    Validators.checkValidateObjectId(representativeId, 'Representative ID');

    const query = { representative: representativeId };
    return await this.getRepresentativeAccessLogs(query, page, limit, sort, populate, select);
};

/**
 * Get representative access logs by operation type
 */
exports.getRepresentativeAccessLogsByOperation = async (operation, page = 1, limit = 10, sort = { access_date: -1 }, populate = [], select = '') => {
    if (!Object.values(PORTAL_OPERATIONS).includes(operation)) {
        throw new ErrorResponse(`Invalid operation: ${operation}`, 400);
    }

    const query = { operation };
    return await this.getRepresentativeAccessLogs(query, page, limit, sort, populate, select);
};

/**
 * Get representative access logs within a date range
 */
exports.getRepresentativeAccessLogsByDateRange = async (startDate, endDate, page = 1, limit = 10, sort = { access_date: -1 }, populate = [], select = '') => {
    const query = {
        access_date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    };
    
    return await this.getRepresentativeAccessLogs(query, page, limit, sort, populate, select);
};

/**
 * Get recent representative activity (last login/logout for each representative)
 */
exports.getRecentRepresentativeActivity = async (limit = 50, populate = ['representative']) => {
    return await RepresentativeAccessLog.aggregate([
        {
            $sort: { access_date: -1 }
        },
        {
            $group: {
                _id: '$representative',
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
        ...(populate.includes('representative') ? [
            {
                $lookup: {
                    from: 'representatives',
                    localField: 'representative',
                    foreignField: '_id',
                    as: 'representative'
                }
            },
            {
                $unwind: '$representative'
            }
        ] : [])
    ]);
};

/**
 * Get representative login statistics
 */
exports.getRepresentativeLoginStats = async (representativeId, days = 30) => {
    Validators.checkValidateObjectId(representativeId, 'Representative ID');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await RepresentativeAccessLog.aggregate([
        {
            $match: {
                representative: new mongoose.Types.ObjectId(representativeId),
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
 * Delete old representative access logs (cleanup)
 */
exports.deleteOldRepresentativeAccessLogs = async (daysToKeep = 365) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await RepresentativeAccessLog.deleteMany({
        access_date: { $lt: cutoffDate }
    });

    return result;
}; 