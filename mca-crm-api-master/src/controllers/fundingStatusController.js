const Joi = require('joi');

const FundingStatusService = require('../services/fundingStatusService');

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
    funded: Joi.boolean().optional(),
    performing: Joi.boolean().optional(),
    warning: Joi.boolean().optional(),
    closed: Joi.boolean().optional(),
    defaulted: Joi.boolean().optional(),
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
    if (query.funded !== undefined) dbQuery.$and.push({ funded: query.funded });
    if (query.performing !== undefined) dbQuery.$and.push({ performing: query.performing });
    if (query.warning !== undefined) dbQuery.$and.push({ warning: query.warning });
    if (query.closed !== undefined) dbQuery.$and.push({ closed: query.closed });
    if (query.defaulted !== undefined) dbQuery.$and.push({ defaulted: query.defaulted });
    if (query.system !== undefined) dbQuery.$and.push({ system: query.system });

    if (query.search) dbQuery.$and.push({
        $or: [
            { name: { $regex: query.search, $options: 'i' } },
        ]
    });

    if (!query.include_inactive) dbQuery.$and.push({ inactive: { $ne: true } });
    
    return dbQuery;
};

// @desc    Get all funding statuses
// @route   GET /api/v1/funding-statuses
// @access  Funder-ADMIN Funder-User Bookkeeper Admin
exports.getFundingStatuses = async (req, res, next) => {
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

        const fundingStatuses = await FundingStatusService.getFundingStatuses(
            dbQuery,
            page,
            limit,
            dbSort,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: fundingStatuses
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get funding statuses list without pagination
// @route   GET /api/v1/funding-statuses/list
// @access  Funder-ADMIN Funder-User Bookkeeper Admin
exports.getFundingStatusList = async (req, res, next) => {
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

        const fundingStatuses = await FundingStatusService.getFundingStatusList(dbQuery, dbSort, default_populate);

        res.status(200).json({
            success: true,
            data: fundingStatuses
        });

    } catch (err) {
        next(err);
    }
};

// @desc    Get single funding statuses
// @route   GET /api/v1/funding-statuses/:id
// @access  Funder-ADMIN Funder-User Bookkeeper Admin
exports.getFundingStatus = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const fundingStatus = await FundingStatusService.getFundingStatusById(value.id, default_populate);
        accessControl(req, fundingStatus, 'funding status');

        res.status(200).json({
            success: true,
            data: fundingStatus
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update funding status
// @route   PUT /api/v1/funding-statuses/:id
// @access  Funder-ADMIN Admin
exports.updateFundingStatus = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            name: Joi.string().optional(),
            bgcolor: Joi.string().optional(),
            initial: Joi.boolean().optional(),
            funded: Joi.boolean().optional(),
            performing: Joi.boolean().optional(),
            warning: Joi.boolean().optional(),
            closed: Joi.boolean().optional(),
            defaulted: Joi.boolean().optional(),
            inactive: Joi.boolean().optional(),
        });

        // Combine params and body for validation
        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, ...data } = value;

        const fundingStatus = await FundingStatusService.getFundingStatusById(id);
        accessControl(req, fundingStatus, 'funding status');

        const updatedFundingStatus = await FundingStatusService.updateFundingStatus(id, data, default_populate);

        res.status(200).json({
            success: true,
            data: updatedFundingStatus
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete funding status
// @route   DELETE /api/v1/funding-statuses/:id
// @access  Funder-ADMIN Admin
exports.deleteFundingStatus = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id } = value;

        const fundingStatus = await FundingStatusService.getFundingStatusById(id);
        accessControl(req, fundingStatus, 'funding status');

        await FundingStatusService.deleteFundingStatus(id);

        res.status(200).json({
            success: true,
            message: 'Funding status deleted successfully'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new funding status
// @route   POST /api/v1/funding-statuses
// @access  Private
exports.createFundingStatus = async (req, res, next) => {
    try {
        const schema = Joi.object({
            name: Joi.string().required(),
            funder: Joi.string().optional(),
            bgcolor: Joi.string().optional(),
            initial: Joi.boolean().optional(),
            funded: Joi.boolean().optional(),
            performing: Joi.boolean().optional(),
            warning: Joi.boolean().optional(),
            closed: Joi.boolean().optional(),
            defaulted: Joi.boolean().optional(),
            system: Joi.boolean().optional()
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
                throw new ErrorResponse('There is no funder selected to create funding status', 403);
            }
        }

        accessControl(req, data, 'funding status');

        if (data.system === undefined) data.system = false;   // All user created funding statuses are not system
        data.inactive = false; // All new funding statuses are active

        const fundingStatus = await FundingStatusService.createFundingStatus(data, default_populate);

        res.status(201).json({
            success: true,
            data: fundingStatus
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update all funding status index
// @route   PUT /api/v1/funding-statuses/update-index
// @access  Funder-ADMIN Admin
exports.updateFundingStatusIndex = async (req, res, next) => {
    try {
        const schema = Joi.object({
            funder: Joi.string().optional(),
            ids: Joi.array().items(Joi.string().required()).required()
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
                throw new ErrorResponse('There is no funder selected to update funding status index', 403);
            }
        }

        const fundingStatuses = await FundingStatusService.updateFundingStatusIndex(data.funder, data.ids, [], '-funder');

        res.status(200).json({
            success: true,
            data: fundingStatuses
        });
    } catch (err) {
        next(err);
    }
};

