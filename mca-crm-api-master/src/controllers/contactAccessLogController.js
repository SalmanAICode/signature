const Joi = require('joi');

const ContactAccessLogService = require('../services/contactAccessLogService');
const ContactService = require('../services/contactService');

const ErrorResponse = require('../utils/errorResponse');
const { PORTAL_OPERATIONS } = require('../utils/constants');
const Helpers = require('../utils/helpers');

// Default populate for contact access logs
const default_populate = [
    { path: 'contact', select: 'first_name last_name email' }
];

// query schema for contact access logs
const querySchema = {
    contact: Joi.string().optional(),
    operation: Joi.string().valid(...Object.values(PORTAL_OPERATIONS)).optional(),
    start_date: Joi.date().optional(),
    end_date: Joi.date().optional(),
    ip_address: Joi.string().optional(),
    sort: Joi.string().allow('').optional()
};

// build db query from query schema
const buildDbQuery = (req, query) => {
    const dbQuery = {};

    dbQuery.$and = [];

    if (query.contact) dbQuery.$and.push({ contact: query.contact });
    if (query.operation) dbQuery.$and.push({ operation: query.operation });
    if (query.ip_address) dbQuery.$and.push({ ip_address: { $regex: query.ip_address, $options: 'i' } });

    if (query.start_date || query.end_date) {
        dbQuery.access_date = {};
        if (query.start_date) dbQuery.access_date.$gte = new Date(query.start_date);
        if (query.end_date) dbQuery.access_date.$lte = new Date(query.end_date);
    }

    return dbQuery;
};

// @desc    Get all contact access logs
// @route   GET /api/v1/contacts/access-logs
// @access  Private
exports.getContactAccessLogs = async (req, res, next) => {
    try {
        const schema = Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).default(10),
            ...querySchema
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { page, limit, sort, ...query } = value;

        // Handle query
        const dbQuery = buildDbQuery(req, query);

        // Handle sort
        const dbSort = Helpers.buildSort(sort, { access_date: -1 });

        const contactAccessLogs = await ContactAccessLogService.getContactAccessLogs(
            dbQuery,
            page,
            limit,
            dbSort,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: contactAccessLogs
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get contact access logs list without pagination
// @route   GET /api/v1/contacts/access-logs/list
// @access  Private
exports.getContactAccessLogList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            ...querySchema
        });

        const { value, error } = schema.validate(req.query);    

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { sort, ...query } = value;

        const dbQuery = buildDbQuery(req, query);

        const dbSort = Helpers.buildSort(sort, { access_date: -1 });

        const contactAccessLogs = await ContactAccessLogService.getContactAccessLogList(
            dbQuery,
            dbSort,
            default_populate,
            'contact operation access_date ip_address'
        );

        res.status(200).json({
            success: true,
            data: contactAccessLogs
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get a single contact access log
// @route   GET /api/v1/contacts/access-logs/:id
// @access  Private
exports.getContactAccessLog = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const contactAccessLog = await ContactAccessLogService.getContactAccessLogById(
            value.id,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: contactAccessLog
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get contact access logs by contact ID
// @route   GET /api/v1/contacts/:id/access-logs
// @access  Private
exports.getContactAccessLogsByContactId = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).default(10),
            ...querySchema.filter(query => query !== 'contact')
        });

        const { value, error } = schema.validate({ ...req.params, ...req.query });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, page, limit, sort, ...query } = value;

        // Handle query
        const dbQuery = buildDbQuery(req, { ...query, contact: id });

        // Handle sort
        const dbSort = Helpers.buildSort(sort, { access_date: -1 });

        const contactAccessLogs = await ContactAccessLogService.getContactAccessLogs(
            dbQuery,
            page,
            limit,
            dbSort,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: contactAccessLogs
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get contact access logs by operation type
// @route   GET /api/v1/contacts/access-logs/operation/:operation
// @access  Private
exports.getContactAccessLogsByOperation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).default(10),
            ...querySchema
        });

        const { value, error } = schema.validate({ ...req.params, ...req.query });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { page, limit, sort, ...query } = value;

        // Handle query
        const dbQuery = buildDbQuery(req, query);

        // Handle sort
        const dbSort = Helpers.buildSort(sort, { access_date: -1 });

        const contactAccessLogs = await ContactAccessLogService.getContactAccessLogs(
            dbQuery,
            page,
            limit,
            dbSort,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: contactAccessLogs
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get recent contact activity
// @route   GET /api/v1/contacts/access-logs/recent-activity
// @access  Private
exports.getRecentContactActivity = async (req, res, next) => {
    try {
        const schema = Joi.object({
            limit: Joi.number().integer().min(1).max(100).default(50)
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const recentActivity = await ContactAccessLogService.getRecentContactActivity(value.limit);

        res.status(200).json({
            success: true,
            data: recentActivity
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get contact login statistics
// @route   GET /api/v1/contacts/:id/access-logs/stats
// @access  Private
exports.getContactLoginStats = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            days: Joi.number().integer().min(1).max(365).default(30)
        });

        const { value, error } = schema.validate({ ...req.params, ...req.query });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const stats = await ContactAccessLogService.getContactLoginStats(value.id, value.days);

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create a contact access log entry (mainly for testing or manual logging)
// @route   POST /api/v1/contacts/access-logs
// @access  Private
exports.createContactAccessLog = async (req, res, next) => {
    try {
        const schema = Joi.object({
            contact: Joi.string().required(),
            operation: Joi.string().valid(...Object.values(PORTAL_OPERATIONS)).required(),
            ip_address: Joi.string().optional(),
            access_date: Joi.date().default(Date.now)
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        // Verify contact exists
        await ContactService.getContactById(value.contact);

        const contactAccessLog = await ContactAccessLogService.createContactAccessLog(value);

        if (!contactAccessLog) {
            return next(new ErrorResponse('Failed to create contact access log', 500));
        }

        const result = await ContactAccessLogService.getContactAccessLogById(
            contactAccessLog._id,
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

// @desc    Delete old contact access logs (cleanup)
// @route   DELETE /api/v1/contacts/access-logs/cleanup
// @access  Private
exports.deleteOldContactAccessLogs = async (req, res, next) => {
    try {
        const schema = Joi.object({
            days_to_keep: Joi.number().integer().min(30).max(3650).default(365)
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const result = await ContactAccessLogService.deleteOldContactAccessLogs(value.days_to_keep);

        res.status(200).json({
            success: true,
            message: `Deleted ${result.deletedCount} old contact access log entries`,
            data: {
                deletedCount: result.deletedCount,
                daysKept: value.days_to_keep
            }
        });
    } catch (err) {
        next(err);
    }
}; 