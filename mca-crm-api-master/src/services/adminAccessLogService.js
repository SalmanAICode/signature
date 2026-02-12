const AdminAccessLog = require('../models/AdminAccessLog');
const mongoose = require('mongoose');

const ErrorResponse = require('../utils/errorResponse');
const Validators = require('../utils/validators');
const { PORTAL_OPERATIONS } = require('../utils/constants');

/**
 * Get all admin access logs with filtering and pagination
 */
exports.getAdminAccessLogs = async (query, page = 1, limit = 10, sort = { access_date: -1 }, populate = [], select = '') => {
    const skip = (page - 1) * limit;
    
    const [adminAccessLogs, count] = await Promise.all([
        AdminAccessLog.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        AdminAccessLog.countDocuments(query)
    ]);
    
    return {
        docs: adminAccessLogs,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of admin access logs without pagination
 */
exports.getAdminAccessLogList = async (query, sort = { access_date: -1 }, populate = [], select = '') => {
    return await AdminAccessLog.find(query)
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();
};

/**
 * Get a admin access log by id
 */
exports.getAdminAccessLogById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'Admin Access Log ID');

    const adminAccessLog = await AdminAccessLog.findById(id)
        .populate(populate)
        .select(select)
        .lean();

    if (!adminAccessLog) {
        throw new ErrorResponse(`Admin access log not found with id of ${id}`, 404);
    }

    return adminAccessLog;
};

/**
 * Create a admin access log entry
 */
exports.createAdminAccessLog = async (data) => {
    try {
        const adminAccessLog = await AdminAccessLog.create(data);
        return adminAccessLog;
    } catch (error) {
        // Log the error but don't throw to prevent breaking the main operation
        console.error('Error creating admin access log:', error);
        return null;
    }
};

/**
 * Log admin login
 */
exports.logAdminLogin = async (adminId, ipAddress) => {
    Validators.checkValidateObjectId(adminId, 'Admin ID');

    return await this.createAdminAccessLog({
        admin: adminId,
        operation: PORTAL_OPERATIONS.LOGIN,
        access_date: Date.now(),
        ip_address: ipAddress
    });
};

/**
 * Log admin logout
 */
exports.logAdminLogout = async (adminId, ipAddress) => {
    Validators.checkValidateObjectId(adminId, 'Admin ID');

    return await this.createAdminAccessLog({
        admin: adminId,
        operation: PORTAL_OPERATIONS.LOGOUT,
        access_date: Date.now(),
        ip_address: ipAddress
    });
};

/**
 * Log admin session timeout
 */
exports.logAdminSessionTimeout = async (adminId, ipAddress) => {
    Validators.checkValidateObjectId(adminId, 'Admin ID');

    return await this.createAdminAccessLog({
        admin: adminId,
        operation: PORTAL_OPERATIONS.SESSION_TIMEOUT,
        access_date: Date.now(),
        ip_address: ipAddress
    });
};

/**
 * Get admin access logs by admin ID
 */
exports.getAdminAccessLogsByAdminId = async (adminId, page = 1, limit = 10, sort = { access_date: -1 }, populate = [], select = '') => {
    Validators.checkValidateObjectId(adminId, 'Admin ID');

    const query = { admin: adminId };
    return await this.getAdminAccessLogs(query, page, limit, sort, populate, select);
};

/**
 * Get admin access logs by operation type
 */
exports.getAdminAccessLogsByOperation = async (operation, page = 1, limit = 10, sort = { access_date: -1 }, populate = [], select = '') => {
    if (!Object.values(PORTAL_OPERATIONS).includes(operation)) {
        throw new ErrorResponse(`Invalid operation: ${operation}`, 400);
    }

    const query = { operation };
    return await this.getAdminAccessLogs(query, page, limit, sort, populate, select);
};

/**
 * Get admin access logs within a date range
 */
exports.getAdminAccessLogsByDateRange = async (startDate, endDate, page = 1, limit = 10, sort = { access_date: -1 }, populate = [], select = '') => {
    const query = {
        access_date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    };
    
    return await this.getAdminAccessLogs(query, page, limit, sort, populate, select);
};

/**
 * Get recent admin activity (last login/logout for each admin)
 */
exports.getRecentAdminActivity = async (limit = 50, populate = ['admin']) => {
    return await AdminAccessLog.aggregate([
        {
            $sort: { access_date: -1 }
        },
        {
            $group: {
                _id: '$admin',
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
        ...(populate.includes('admin') ? [
            {
                $lookup: {
                    from: 'admins',
                    localField: 'admin',
                    foreignField: '_id',
                    as: 'admin'
                }
            },
            {
                $unwind: '$admin'
            }
        ] : [])
    ]);
};

/**
 * Get admin login statistics
 */
exports.getAdminLoginStats = async (adminId, days = 30) => {
    Validators.checkValidateObjectId(adminId, 'Admin ID');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await AdminAccessLog.aggregate([
        {
            $match: {
                admin: mongoose.Types.ObjectId(adminId),
                access_date: { $gte: startDate },
                operation: { $in: [PORTAL_OPERATIONS.LOGIN, PORTAL_OPERATIONS.LOGOUT] }
            }
        },
        {
            $group: {
                _id: '$operation',
                count: { $sum: 1 },
                dates: { $push: '$access_date' }
            }
        }
    ]);

    return {
        adminId,
        days,
        stats
    };
};

/**
 * Delete old admin access logs
 */
exports.deleteOldAdminAccessLogs = async (daysToKeep = 365) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await AdminAccessLog.deleteMany({
        access_date: { $lt: cutoffDate }
    });

    return {
        deletedCount: result.deletedCount,
        cutoffDate
    };
}; 