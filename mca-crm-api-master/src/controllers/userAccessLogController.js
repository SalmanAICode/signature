const Joi = require('joi');

const UserAccessLogService = require('../services/userAccessLogService');
const UserService = require('../services/userService');

const ErrorResponse = require('../utils/errorResponse');
const { PORTAL_OPERATIONS } = require('../utils/constants');

// Default populate for user access logs
const default_populate = [
    { path: 'user', select: 'first_name last_name email' }
];

// @desc    Get all user access logs
// @route   GET /api/v1/users/access-logs
// @access  Private
exports.getUserAccessLogs = async (req, res, next) => {
    try {
        const schema = Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).default(10),
            user: Joi.string().optional(),
            operation: Joi.string().valid(...Object.values(PORTAL_OPERATIONS)).optional(),
            start_date: Joi.date().optional(),
            end_date: Joi.date().optional(),
            ip_address: Joi.string().optional(),
            sort: Joi.string().allow('').optional()
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { page, limit, sort, ...query } = value;

        // Build database query
        let dbQuery = {};

        if (query.user) {
            dbQuery.user = query.user;
        }

        if (query.operation) {
            dbQuery.operation = query.operation;
        }

        if (query.ip_address) {
            dbQuery.ip_address = { $regex: query.ip_address, $options: 'i' };
        }

        // Handle date range
        if (query.start_date || query.end_date) {
            dbQuery.access_date = {};
            if (query.start_date) {
                dbQuery.access_date.$gte = new Date(query.start_date);
            }
            if (query.end_date) {
                dbQuery.access_date.$lte = new Date(query.end_date);
            }
        }

        // Handle sorting
        let dbSort = { access_date: -1 }; // Default sort by access_date descending
        if (sort) {
            dbSort = {};
            const sortFields = sort.split(',');
            sortFields.forEach(field => {
                if (field.startsWith('-')) {
                    dbSort[field.substring(1)] = -1;
                } else {
                    dbSort[field] = 1;
                }
            });
        }

        const userAccessLogs = await UserAccessLogService.getUserAccessLogs(
            dbQuery,
            page,
            limit,
            dbSort,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: userAccessLogs
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get user access logs list without pagination
// @route   GET /api/v1/users/access-logs/list
// @access  Private
exports.getUserAccessLogList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            user: Joi.string().optional(),
            operation: Joi.string().valid(...Object.values(PORTAL_OPERATIONS)).optional(),
            start_date: Joi.date().optional(),
            end_date: Joi.date().optional(),
            sort: Joi.string().allow('').optional()
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { sort, ...query } = value;

        // Build database query
        let dbQuery = {};

        if (query.user) {
            dbQuery.user = query.user;
        }

        if (query.operation) {
            dbQuery.operation = query.operation;
        }

        // Handle date range
        if (query.start_date || query.end_date) {
            dbQuery.access_date = {};
            if (query.start_date) {
                dbQuery.access_date.$gte = new Date(query.start_date);
            }
            if (query.end_date) {
                dbQuery.access_date.$lte = new Date(query.end_date);
            }
        }

        // Handle sorting
        let dbSort = { access_date: -1 };
        if (sort) {
            dbSort = {};
            const sortFields = sort.split(',');
            sortFields.forEach(field => {
                if (field.startsWith('-')) {
                    dbSort[field.substring(1)] = -1;
                } else {
                    dbSort[field] = 1;
                }
            });
        }

        const userAccessLogs = await UserAccessLogService.getUserAccessLogList(
            dbQuery,
            dbSort,
            default_populate,
            'user operation access_date ip_address'
        );

        res.status(200).json({
            success: true,
            data: userAccessLogs
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get a single user access log
// @route   GET /api/v1/users/access-logs/:id
// @access  Private
exports.getUserAccessLog = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const userAccessLog = await UserAccessLogService.getUserAccessLogById(
            value.id,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: userAccessLog
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get user access logs by user ID
// @route   GET /api/v1/users/:id/access-logs
// @access  Private
exports.getUserAccessLogsByUserId = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).default(10),
            operation: Joi.string().valid(...Object.values(PORTAL_OPERATIONS)).optional(),
            start_date: Joi.date().optional(),
            end_date: Joi.date().optional(),
            sort: Joi.string().allow('').optional()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.query });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, page, limit, sort, ...query } = value;

        // Build additional query filters
        let additionalQuery = {};

        if (query.operation) {
            additionalQuery.operation = query.operation;
        }

        // Handle date range
        if (query.start_date || query.end_date) {
            additionalQuery.access_date = {};
            if (query.start_date) {
                additionalQuery.access_date.$gte = new Date(query.start_date);
            }
            if (query.end_date) {
                additionalQuery.access_date.$lte = new Date(query.end_date);
            }
        }

        // Handle sorting
        let dbSort = { access_date: -1 };
        if (sort) {
            dbSort = {};
            const sortFields = sort.split(',');
            sortFields.forEach(field => {
                if (field.startsWith('-')) {
                    dbSort[field.substring(1)] = -1;
                } else {
                    dbSort[field] = 1;
                }
            });
        }

        // Combine user filter with additional filters
        const finalQuery = { user: id, ...additionalQuery };

        const userAccessLogs = await UserAccessLogService.getUserAccessLogs(
            finalQuery,
            page,
            limit,
            dbSort,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: userAccessLogs
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get user access logs by operation type
// @route   GET /api/v1/users/access-logs/operation/:operation
// @access  Private
exports.getUserAccessLogsByOperation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            operation: Joi.string().valid(...Object.values(PORTAL_OPERATIONS)).required(),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).default(10),
            user: Joi.string().optional(),
            start_date: Joi.date().optional(),
            end_date: Joi.date().optional(),
            sort: Joi.string().allow('').optional()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.query });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { operation, page, limit, sort, ...query } = value;

        // Build additional query filters
        let additionalQuery = {};

        if (query.user) {
            additionalQuery.user = query.user;
        }

        // Handle date range
        if (query.start_date || query.end_date) {
            additionalQuery.access_date = {};
            if (query.start_date) {
                additionalQuery.access_date.$gte = new Date(query.start_date);
            }
            if (query.end_date) {
                additionalQuery.access_date.$lte = new Date(query.end_date);
            }
        }

        // Handle sorting
        let dbSort = { access_date: -1 };
        if (sort) {
            dbSort = {};
            const sortFields = sort.split(',');
            sortFields.forEach(field => {
                if (field.startsWith('-')) {
                    dbSort[field.substring(1)] = -1;
                } else {
                    dbSort[field] = 1;
                }
            });
        }

        // Combine operation filter with additional filters
        const finalQuery = { operation, ...additionalQuery };

        const userAccessLogs = await UserAccessLogService.getUserAccessLogs(
            finalQuery,
            page,
            limit,
            dbSort,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: userAccessLogs
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get recent user activity
// @route   GET /api/v1/users/access-logs/recent-activity
// @access  Private
exports.getRecentUserActivity = async (req, res, next) => {
    try {
        const schema = Joi.object({
            limit: Joi.number().integer().min(1).max(100).default(50)
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const recentActivity = await UserAccessLogService.getRecentUserActivity(value.limit);

        res.status(200).json({
            success: true,
            data: recentActivity
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get user login statistics
// @route   GET /api/v1/users/:id/access-logs/stats
// @access  Private
exports.getUserLoginStats = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            days: Joi.number().integer().min(1).max(365).default(30)
        });

        const { value, error } = schema.validate({ ...req.params, ...req.query });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const stats = await UserAccessLogService.getUserLoginStats(value.id, value.days);

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create a user access log entry (mainly for testing or manual logging)
// @route   POST /api/v1/users/access-logs
// @access  Private
exports.createUserAccessLog = async (req, res, next) => {
    try {
        const schema = Joi.object({
            user: Joi.string().required(),
            operation: Joi.string().valid(...Object.values(PORTAL_OPERATIONS)).required(),
            ip_address: Joi.string().optional(),
            access_date: Joi.date().default(Date.now)
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        // Verify user exists
        await UserService.getUserById(value.user);

        const userAccessLog = await UserAccessLogService.createUserAccessLog(value);

        if (!userAccessLog) {
            return next(new ErrorResponse('Failed to create user access log', 500));
        }

        const result = await UserAccessLogService.getUserAccessLogById(
            userAccessLog._id,
            default_populate
        );

        res.status(201).json({
            success: true,
            data: result
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete old user access logs (cleanup)
// @route   DELETE /api/v1/users/access-logs/cleanup
// @access  Private
exports.deleteOldUserAccessLogs = async (req, res, next) => {
    try {
        const schema = Joi.object({
            days_to_keep: Joi.number().integer().min(30).max(3650).default(365)
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const result = await UserAccessLogService.deleteOldUserAccessLogs(value.days_to_keep);

        res.status(200).json({
            success: true,
            message: `Deleted ${result.deletedCount} old user access log entries`,
            data: {
                deletedCount: result.deletedCount,
                daysKept: value.days_to_keep
            }
        });
    } catch (err) {
        next(err);
    }
};
