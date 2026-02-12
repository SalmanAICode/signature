const Joi = require('joi');

const RepresentativeAccessLogService = require('../services/representativeAccessLogService');
const RepresentativeService = require('../services/representativeService');

const ErrorResponse = require('../utils/errorResponse');
const { PORTAL_OPERATIONS } = require('../utils/constants');

// Default populate for representative access logs
const default_populate = [
    { path: 'representative', select: 'first_name last_name email' }
];

// @desc    Get all representative access logs
// @route   GET /api/v1/representatives/access-logs
// @access  Private
exports.getRepresentativeAccessLogs = async (req, res, next) => {
    try {
        const schema = Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).default(10),
            representative: Joi.string().optional(),
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

        if (query.representative) {
            dbQuery.representative = query.representative;
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

        const representativeAccessLogs = await RepresentativeAccessLogService.getRepresentativeAccessLogs(
            dbQuery,
            page,
            limit,
            dbSort,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: representativeAccessLogs
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get representative access logs list without pagination
// @route   GET /api/v1/representatives/access-logs/list
// @access  Private
exports.getRepresentativeAccessLogList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            representative: Joi.string().optional(),
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

        if (query.representative) {
            dbQuery.representative = query.representative;
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

        const representativeAccessLogs = await RepresentativeAccessLogService.getRepresentativeAccessLogList(
            dbQuery,
            dbSort,
            default_populate,
            'representative operation access_date ip_address'
        );

        res.status(200).json({
            success: true,
            data: representativeAccessLogs
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get a single representative access log
// @route   GET /api/v1/representatives/access-logs/:id
// @access  Private
exports.getRepresentativeAccessLog = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const representativeAccessLog = await RepresentativeAccessLogService.getRepresentativeAccessLogById(
            value.id,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: representativeAccessLog
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get representative access logs by representative ID
// @route   GET /api/v1/representatives/:id/access-logs
// @access  Private
exports.getRepresentativeAccessLogsByRepresentativeId = async (req, res, next) => {
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

        // Combine representative filter with additional filters
        const finalQuery = { representative: id, ...additionalQuery };

        const representativeAccessLogs = await RepresentativeAccessLogService.getRepresentativeAccessLogs(
            finalQuery,
            page,
            limit,
            dbSort,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: representativeAccessLogs
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get representative access logs by operation type
// @route   GET /api/v1/representatives/access-logs/operation/:operation
// @access  Private
exports.getRepresentativeAccessLogsByOperation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            operation: Joi.string().valid(...Object.values(PORTAL_OPERATIONS)).required(),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).default(10),
            representative: Joi.string().optional(),
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

        if (query.representative) {
            additionalQuery.representative = query.representative;
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

        const representativeAccessLogs = await RepresentativeAccessLogService.getRepresentativeAccessLogs(
            finalQuery,
            page,
            limit,
            dbSort,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: representativeAccessLogs
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get recent representative activity
// @route   GET /api/v1/representatives/access-logs/recent-activity
// @access  Private
exports.getRecentRepresentativeActivity = async (req, res, next) => {
    try {
        const schema = Joi.object({
            limit: Joi.number().integer().min(1).max(100).default(50)
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const recentActivity = await RepresentativeAccessLogService.getRecentRepresentativeActivity(value.limit);

        res.status(200).json({
            success: true,
            data: recentActivity
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get representative login statistics
// @route   GET /api/v1/representatives/:id/access-logs/stats
// @access  Private
exports.getRepresentativeLoginStats = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            days: Joi.number().integer().min(1).max(365).default(30)
        });

        const { value, error } = schema.validate({ ...req.params, ...req.query });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const stats = await RepresentativeAccessLogService.getRepresentativeLoginStats(value.id, value.days);

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create a representative access log entry (mainly for testing or manual logging)
// @route   POST /api/v1/representatives/access-logs
// @access  Private
exports.createRepresentativeAccessLog = async (req, res, next) => {
    try {
        const schema = Joi.object({
            representative: Joi.string().required(),
            operation: Joi.string().valid(...Object.values(PORTAL_OPERATIONS)).required(),
            ip_address: Joi.string().optional(),
            access_date: Joi.date().default(Date.now)
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        // Verify representative exists
        await RepresentativeService.getRepresentativeById(value.representative);

        const representativeAccessLog = await RepresentativeAccessLogService.createRepresentativeAccessLog(value);

        if (!representativeAccessLog) {
            return next(new ErrorResponse('Failed to create representative access log', 500));
        }

        const result = await RepresentativeAccessLogService.getRepresentativeAccessLogById(
            representativeAccessLog._id,
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

// @desc    Delete old representative access logs (cleanup)
// @route   DELETE /api/v1/representatives/access-logs/cleanup
// @access  Private
exports.deleteOldRepresentativeAccessLogs = async (req, res, next) => {
    try {
        const schema = Joi.object({
            days_to_keep: Joi.number().integer().min(30).max(3650).default(365)
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const result = await RepresentativeAccessLogService.deleteOldRepresentativeAccessLogs(value.days_to_keep);

        res.status(200).json({
            success: true,
            message: `Deleted ${result.deletedCount} old representative access log entries`,
            data: {
                deletedCount: result.deletedCount,
                daysKept: value.days_to_keep
            }
        });
    } catch (err) {
        next(err);
    }
}; 