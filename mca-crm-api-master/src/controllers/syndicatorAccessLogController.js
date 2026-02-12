const Joi = require('joi');

const SyndicatorAccessLogService = require('../services/syndicatorAccessLogService');
const SyndicatorService = require('../services/syndicatorService');

const ErrorResponse = require('../utils/errorResponse');
const { PORTAL_OPERATIONS } = require('../utils/constants');

// Default populate for syndicator access logs
const default_populate = [
    { path: 'syndicator', select: 'name email phone' }
];

// @desc    Get all syndicator access logs
// @route   GET /api/v1/syndicators/access-logs
// @access  Private
exports.getSyndicatorAccessLogs = async (req, res, next) => {
    try {
        const schema = Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).default(10),
            syndicator: Joi.string().optional(),
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

        if (query.syndicator) {
            dbQuery.syndicator = query.syndicator;
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

        const syndicatorAccessLogs = await SyndicatorAccessLogService.getSyndicatorAccessLogs(
            dbQuery,
            page,
            limit,
            dbSort,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: syndicatorAccessLogs
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get syndicator access logs list without pagination
// @route   GET /api/v1/syndicators/access-logs/list
// @access  Private
exports.getSyndicatorAccessLogList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            syndicator: Joi.string().optional(),
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

        if (query.syndicator) {
            dbQuery.syndicator = query.syndicator;
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

        const syndicatorAccessLogs = await SyndicatorAccessLogService.getSyndicatorAccessLogList(
            dbQuery,
            dbSort,
            default_populate,
            'syndicator operation access_date ip_address'
        );

        res.status(200).json({
            success: true,
            data: syndicatorAccessLogs
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get a single syndicator access log
// @route   GET /api/v1/syndicators/access-logs/:id
// @access  Private
exports.getSyndicatorAccessLog = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const syndicatorAccessLog = await SyndicatorAccessLogService.getSyndicatorAccessLogById(
            value.id,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: syndicatorAccessLog
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get syndicator access logs by syndicator ID
// @route   GET /api/v1/syndicators/:id/access-logs
// @access  Private
exports.getSyndicatorAccessLogsBySyndicatorId = async (req, res, next) => {
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

        // Combine syndicator filter with additional filters
        const finalQuery = { syndicator: id, ...additionalQuery };

        const syndicatorAccessLogs = await SyndicatorAccessLogService.getSyndicatorAccessLogs(
            finalQuery,
            page,
            limit,
            dbSort,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: syndicatorAccessLogs
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get syndicator access logs by operation type
// @route   GET /api/v1/syndicators/access-logs/operation/:operation
// @access  Private
exports.getSyndicatorAccessLogsByOperation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            operation: Joi.string().valid(...Object.values(PORTAL_OPERATIONS)).required(),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).default(10),
            syndicator: Joi.string().optional(),
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

        if (query.syndicator) {
            additionalQuery.syndicator = query.syndicator;
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

        const syndicatorAccessLogs = await SyndicatorAccessLogService.getSyndicatorAccessLogs(
            finalQuery,
            page,
            limit,
            dbSort,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: syndicatorAccessLogs
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get recent syndicator activity
// @route   GET /api/v1/syndicators/access-logs/recent-activity
// @access  Private
exports.getRecentSyndicatorActivity = async (req, res, next) => {
    try {
        const schema = Joi.object({
            limit: Joi.number().integer().min(1).max(100).default(50)
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const recentActivity = await SyndicatorAccessLogService.getRecentSyndicatorActivity(value.limit);

        res.status(200).json({
            success: true,
            data: recentActivity
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get syndicator login statistics
// @route   GET /api/v1/syndicators/:id/access-logs/stats
// @access  Private
exports.getSyndicatorLoginStats = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            days: Joi.number().integer().min(1).max(365).default(30)
        });

        const { value, error } = schema.validate({ ...req.params, ...req.query });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const stats = await SyndicatorAccessLogService.getSyndicatorLoginStats(value.id, value.days);

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create a syndicator access log entry (mainly for testing or manual logging)
// @route   POST /api/v1/syndicators/access-logs
// @access  Private
exports.createSyndicatorAccessLog = async (req, res, next) => {
    try {
        const schema = Joi.object({
            syndicator: Joi.string().required(),
            operation: Joi.string().valid(...Object.values(PORTAL_OPERATIONS)).required(),
            ip_address: Joi.string().optional(),
            access_date: Joi.date().default(Date.now)
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        // Verify syndicator exists
        await SyndicatorService.getSyndicatorById(value.syndicator);

        const syndicatorAccessLog = await SyndicatorAccessLogService.createSyndicatorAccessLog(value);

        if (!syndicatorAccessLog) {
            return next(new ErrorResponse('Failed to create syndicator access log', 500));
        }

        const result = await SyndicatorAccessLogService.getSyndicatorAccessLogById(
            syndicatorAccessLog._id,
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

// @desc    Delete old syndicator access logs (cleanup)
// @route   DELETE /api/v1/syndicators/access-logs/cleanup
// @access  Private
exports.deleteOldSyndicatorAccessLogs = async (req, res, next) => {
    try {
        const schema = Joi.object({
            days_to_keep: Joi.number().integer().min(30).max(3650).default(365)
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const result = await SyndicatorAccessLogService.deleteOldSyndicatorAccessLogs(value.days_to_keep);

        res.status(200).json({
            success: true,
            message: `Deleted ${result.deletedCount} old syndicator access log entries`,
            data: {
                deletedCount: result.deletedCount,
                daysKept: value.days_to_keep
            }
        });
    } catch (err) {
        next(err);
    }
}; 