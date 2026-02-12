const Joi = require('joi');

const ApplicationStatusService = require('../services/applicationStatusService');

const { accessControl } = require('../middleware/auth');
const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');

// Default populate
const default_populate = [
    { path: 'funder', select: 'name email phone' },
];

// Query schema
const query_schema = {
    sort: Joi.string().allow('').optional(),
    funder: Joi.string().optional(),
    search: Joi.string().allow('').optional(),
    initial: Joi.boolean().optional(),
    approved: Joi.boolean().optional(),
    closed: Joi.boolean().optional(),
    system: Joi.boolean().optional(),
    include_inactive: Joi.boolean().optional(),
};

// Build database query
const buildDbQuery = (req, query) => {
    const dbQuery = {};
    dbQuery.$and = [];
    
    const funderFilter = Helpers.buildFunderFilter(req, query.funder);

    if (funderFilter) dbQuery.$and.push({ funder: funderFilter });
    
    if (query.initial !== undefined) dbQuery.$and.push({ initial: query.initial });
    if (query.approved !== undefined) dbQuery.$and.push({ approved: query.approved });
    if (query.closed !== undefined) dbQuery.$and.push({ closed: query.closed });
    if (query.system !== undefined) dbQuery.$and.push({ system: query.system });

    if (query.search) dbQuery.$and.push({
        $or: [
            { name: { $regex: query.search, $options: 'i' } },
        ]
    });

    if (!query.include_inactive) dbQuery.$and.push({ inactive: { $ne: true } });
    
    return dbQuery;
};

// @desc    Get all application statuses
// @route   GET /api/v1/application-statuses
// @access  Funder-ADMIN Funder-User Bookkeeper Admin
exports.getApplicationStatuses = async (req, res, next) => {
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

        // Handle query
        const dbQuery = buildDbQuery(req, query);

        // Handle sorting
        const dbSort = Helpers.buildSort(sort, { idx: 1 });

        const applicationStatuses = await ApplicationStatusService.getApplicationStatuses(
            dbQuery,
            page,
            limit,
            dbSort,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: applicationStatuses
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get application statuses list without pagination
// @route   GET /api/v1/application-statuses/list
// @access  Funder-ADMIN Funder-User Bookkeeper Admin
exports.getApplicationStatusList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            ...query_schema
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        // Handle query
        const dbQuery = buildDbQuery(req, value);

        const dbSort = Helpers.buildSort(value.sort, { idx: 1 });

        const applicationStatuses = await ApplicationStatusService.getApplicationStatusList(dbQuery, dbSort, default_populate);

        res.status(200).json({
            success: true,
            data: applicationStatuses
        });

    } catch (err) {
        next(err);
    }
};

// @desc    Get single application statuses
// @route   GET /api/v1/application-statuses/:id
// @access  Funder-ADMIN Funder-User Bookkeeper Admin
exports.getApplicationStatus = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const applicationStatus = await ApplicationStatusService.getApplicationStatusById(value.id, default_populate);
        accessControl(req, applicationStatus, 'application status');

        res.status(200).json({
            success: true,
            data: applicationStatus
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update application status
// @route   PUT /api/v1/application-statuses/:id
// @access  Funder-ADMIN Admin
exports.updateApplicationStatus = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            name: Joi.string().optional(),
            bgcolor: Joi.string().optional(),
            initial: Joi.boolean().optional(),
            approved: Joi.boolean().optional(),
            closed: Joi.boolean().optional(),
            inactive: Joi.boolean().optional()
        });

        // Combine params and body for validation
        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, ...data } = value;

        const applicationStatus = await ApplicationStatusService.getApplicationStatusById(id);
        accessControl(req, applicationStatus, 'application status');

        const updatedApplicationStatus = await ApplicationStatusService.updateApplicationStatus(id, data, default_populate);

        res.status(200).json({
            success: true,
            data: updatedApplicationStatus
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete application status
// @route   DELETE /api/v1/application-statuses/:id
// @access  Funder-ADMIN Admin
exports.deleteApplicationStatus = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id } = value;

        const applicationStatus = await ApplicationStatusService.getApplicationStatusById(id);
        accessControl(req, applicationStatus, 'application status');

        await ApplicationStatusService.deleteApplicationStatus(id);

        res.status(200).json({
            success: true,
            message: 'Application status deleted successfully'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new application status
// @route   POST /api/v1/application-statuses
// @access  Private
exports.createApplicationStatus = async (req, res, next) => {
    try {
        const schema = Joi.object({
            funder: Joi.string().optional(),
            name: Joi.string().required(),
            bgcolor: Joi.string().optional(),
            initial: Joi.boolean().optional(),
            approved: Joi.boolean().optional(),
            closed: Joi.boolean().optional()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const data = {...value};

        if (!data.funder) {
            if (req.filter.funder) {
                data.funder = req.filter.funder;
            } else {
                throw new ErrorResponse('There is no funder selectedto create application status', 403);
            }
        }

        accessControl(req, data.funder, 'funder');

        data.system = false;   // All user created application statuses are not system
        data.inactive = false; // All new application statuses are active

        const applicationStatus = await ApplicationStatusService.createApplicationStatus(data, default_populate);

        res.status(201).json({
            success: true,
            data: applicationStatus
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update all application status index
// @route   PUT /api/v1/application-statuses/update-index
// @access  Funder-ADMIN Admin
exports.updateApplicationStatusIndex = async (req, res, next) => {
    try {
        const schema = Joi.object({
            funder: Joi.string().required(),
            ids: Joi.array().items(Joi.string().required()).required()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { funder, ids } = value;

        const applicationStatuses = await ApplicationStatusService.updateApplicationStatusIndex(funder, ids, [], '-funder');

        res.status(200).json({
            success: true,
            data: applicationStatuses
        });
    } catch (err) {
        next(err);
    }
};

