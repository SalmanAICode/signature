const Joi = require('joi');

const AdminAccessLogService = require('../services/adminAccessLogService');
const AdminService = require('../services/adminService');

const ErrorResponse = require('../utils/errorResponse');
const { PORTAL_OPERATIONS } = require('../utils/constants');
const Helper = require('../utils/helpers');

// Default populate for admin access logs
const default_populate = [
    { path: 'admin', select: 'first_name last_name email' }
];

// Query schema for admin access logs
const query_schema = {
    sort: Joi.string().allow('').optional(),
    admin: Joi.string().optional(),
    operation: Joi.string().valid(...Object.values(PORTAL_OPERATIONS)).optional(),
    start_date: Joi.date().optional(),
    end_date: Joi.date().optional(),
    ip_address: Joi.string().optional()
};

// Build database query for admin access logs
const buildDbQuery = (req, query) => {
    const dbQuery = {};

    dbQuery.$and = [];

    // Handle include_inactive
    if (!query.include_inactive) dbQuery.$and.push({ inactive: { $ne: true } });

    if (query.admin) dbQuery.$and.push({ admin: query.admin });

    if (query.operation) dbQuery.$and.push({ operation: query.operation });

    if (query.ip_address) dbQuery.$and.push({ ip_address: { $regex: query.ip_address, $options: 'i' } });

    // Handle date range
    if (query.start_date || query.end_date) {
        dbQuery.$and.push({ access_date: {} });
        if (query.start_date) {
            dbQuery.$and.push({ access_date: { $gte: new Date(query.start_date) } });
        }
        if (query.end_date) {
            dbQuery.$and.push({ access_date: { $lte: new Date(query.end_date) } });
        }
    }

    return dbQuery;
};

// @desc    Get all admin access logs
// @route   GET /api/v1/admins/access-logs
// @access  Private
exports.getAdminAccessLogs = async (req, res, next) => {
    try {
        const schema = Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).default(10),
            ...query_schema
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { page, limit, sort, ...query } = value;

        // Build database query
        const dbQuery = buildDbQuery(req, query);

        // Handle sorting
        const dbSort = Helper.buildSort(sort, { access_date: -1 });

        const adminAccessLogs = await AdminAccessLogService.getAdminAccessLogs(
            dbQuery,
            page,
            limit,
            dbSort,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: adminAccessLogs
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get admin access logs list without pagination
// @route   GET /api/v1/admins/access-logs/list
// @access  Private
exports.getAdminAccessLogList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            ...query_schema
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { sort, ...query } = value;

        // Build database query
        const dbQuery = buildDbQuery(req, query);

        // Handle sorting
        const dbSort = Helper.buildSort(sort, { access_date: -1 });

        // Get admin access logs
        const adminAccessLogs = await AdminAccessLogService.getAdminAccessLogList(
            dbQuery,
            dbSort,
            default_populate,
            'admin operation access_date ip_address'
        );

        res.status(200).json({
            success: true,
            data: adminAccessLogs
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get a single admin access log
// @route   GET /api/v1/admins/access-logs/:id
// @access  Private
exports.getAdminAccessLog = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const adminAccessLog = await AdminAccessLogService.getAdminAccessLogById(
            value.id,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: adminAccessLog
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get admin access logs by admin ID
// @route   GET /api/v1/admins/:id/access-logs
// @access  Private
exports.getAdminAccessLogsByAdminId = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).default(10),
            ...query_schema.filter(key => key !== 'admin')
        });

        const { value, error } = schema.validate({ ...req.params, ...req.query });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, page, limit, sort, ...query } = value;

        // Build database query
        const dbQuery = buildDbQuery(req, { ...query, admin: id });

        // Handle sorting
        const dbSort = Helper.buildSort(sort, { access_date: -1 });

        // Get admin access logs
        const adminAccessLogs = await AdminAccessLogService.getAdminAccessLogs(
            dbQuery,
            page,
            limit,
            dbSort,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: adminAccessLogs
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get admin access logs by operation type
// @route   GET /api/v1/admins/access-logs/operation/:operation
// @access  Private
exports.getAdminAccessLogsByOperation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).default(10),
            ...query_schema
        });

        const { value, error } = schema.validate({ ...req.params, ...req.query });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { page, limit, sort, ...query } = value;

        // Build database query
        const dbQuery = buildDbQuery(req, { ...query, operation: req.params.operation });

        // Handle sorting
        const dbSort = Helper.buildSort(sort, { access_date: -1 });

        // Get admin access logs
        const adminAccessLogs = await AdminAccessLogService.getAdminAccessLogs(
            dbQuery,
            page,
            limit,
            dbSort,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: adminAccessLogs
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get recent admin activity
// @route   GET /api/v1/admins/access-logs/recent-activity
// @access  Private
exports.getRecentAdminActivity = async (req, res, next) => {
    try {
        const schema = Joi.object({
            limit: Joi.number().integer().min(1).max(100).default(50)
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const recentActivity = await AdminAccessLogService.getRecentAdminActivity(value.limit);

        res.status(200).json({
            success: true,
            data: recentActivity
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get admin login statistics
// @route   GET /api/v1/admins/:id/access-logs/stats
// @access  Private
exports.getAdminLoginStats = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            days: Joi.number().integer().min(1).max(365).default(30)
        });

        const { value, error } = schema.validate({ ...req.params, ...req.query });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const stats = await AdminAccessLogService.getAdminLoginStats(value.id, value.days);

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create a admin access log entry (mainly for testing or manual logging)
// @route   POST /api/v1/admins/access-logs
// @access  Private
exports.createAdminAccessLog = async (req, res, next) => {
    try {
        const schema = Joi.object({
            admin: Joi.string().required(),
            operation: Joi.string().valid(...Object.values(PORTAL_OPERATIONS)).required(),
            ip_address: Joi.string().optional(),
            access_date: Joi.date().default(Date.now)
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        // Verify admin exists
        await AdminService.getAdminById(value.admin);

        const adminAccessLog = await AdminAccessLogService.createAdminAccessLog(value);

        if (!adminAccessLog) {
            return next(new ErrorResponse('Failed to create admin access log', 500));
        }

        const result = await AdminAccessLogService.getAdminAccessLogById(
            adminAccessLog._id,
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

// @desc    Delete old admin access logs (cleanup)
// @route   DELETE /api/v1/admins/access-logs/cleanup
// @access  Private
exports.deleteOldAdminAccessLogs = async (req, res, next) => {
    try {
        const schema = Joi.object({
            days_to_keep: Joi.number().integer().min(30).max(3650).default(365)
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const result = await AdminAccessLogService.deleteOldAdminAccessLogs(value.days_to_keep);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        next(err);
    }
};
