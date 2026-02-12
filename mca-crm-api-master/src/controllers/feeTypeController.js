const Joi = require('joi');

const FeeTypeService = require('../services/feeTypeService');

const { accessControl } = require('../middleware/auth');
const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');

const default_populate = [
    { path: 'funder', select: 'name email phone' },
    { path: 'formula', select: 'name' }
];

// Query schema for fee type
const query_schema = {
    sort: Joi.string().optional(),
    search: Joi.string().optional(),
    include_inactive: Joi.boolean().default(false).optional(),
    funder: Joi.string().optional(),
    upfront: Joi.boolean().optional(),
    default: Joi.boolean().optional()
};

// Build dbQuery from query
const buildDbQuery = (req, query) => {
    let dbQuery = {};

    dbQuery.$and = [];
    
    const funderFilter = Helpers.buildFunderFilter(req, query.funder);
    if (funderFilter) dbQuery.$and.push({ funder: funderFilter });

    if (!query.include_inactive) dbQuery.$and.push({ inactive: { $ne: true } });

    if (query.search) dbQuery.$and.push({ name: { $regex: query.search, $options: 'i' } });

    if (query.upfront !== undefined) dbQuery.upfront = query.upfront;
    if (query.default !== undefined) dbQuery.default = query.default;

    return dbQuery;
};


// @desc    Get all fee types
// @route   GET /api/v1/fee-types
// @access  Funder-ADMIN Funder-User Bookkeeper Admin
exports.getFeeTypes = async (req, res, next) => {
    try {
        const schema = Joi.object({
            page: Joi.number().default(1).optional(),
            limit: Joi.number().default(10).optional(),
            ...query_schema
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { page, limit, sort, ...query } = value;

        // Build dbQuery from query
        const dbQuery = buildDbQuery(req, query);


        // Handle sort
        const dbSort = Helpers.buildSort(sort, { name: 1 });

        const feeTypes = await FeeTypeService.getFeeTypes(
            dbQuery,
            dbSort,
            page,
            limit,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: feeTypes
        });

    } catch (error) {
        next(error);
    }
};

// @desc    create a new fee type
// @route   POST /api/v1/fee-types
// @access  Funder-ADMIN Admin
exports.createFeeType = async (req, res, next) => {
    try {
        const schema = Joi.object({
            name: Joi.string().required(),
            funder: Joi.string().optional(),
            formula: Joi.string().optional().allow('').allow(null),
            upfront: Joi.boolean().optional(),
            syndication: Joi.boolean().optional(),
            default: Joi.boolean().optional()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }
        
        if (!value.funder) {
            value.funder = req.filter.funder;
        } else {
            if (req.filter.funder && req.filter.funder !== value.funder) {
                return next(new ErrorResponse('You don\'t have permission to create fee type for this funder', 403));
            } else if (req.filter.funder_list && !req.filter.funder_list.includes(value.funder)) {
                return next(new ErrorResponse('You don\'t have permission to create fee type for this funder', 403));
            }
        }

        if (value.formula?.trim() === '') value.formula = null;

        const feeType = await FeeTypeService.createFeeType(value, default_populate);

        res.status(201).json({
            success: true,
            data: feeType
        });
        
    } catch (error) {
        next(error);
    }
};

// @desc    get funder fee without pagination
// @route   GET /api/v1/fee-types/list
// @access  Funder-ADMIN Admin
exports.getFeeTypesList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            ...query_schema
        });

        const { value, error } = schema.validate(req.query);
        
        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { sort, ...query } = value;

        // Build dbQuery from query
        const dbQuery = buildDbQuery(req, query);

        // Handle sort
        const dbSort = Helpers.buildSort(sort, { name: 1 });
        
        const feeTypes = await FeeTypeService.getFeeTypesList(dbQuery, dbSort);

        res.status(200).json({
            success: true,
            data: feeTypes
        });
        
    } catch (error) {
        next(error);
    }
};

// @desc    update fee type
// @route   PUT /api/v1/fee-types/:id
// @access  Funder-ADMIN Funder-User Bookkeeper Admin
exports.updateFeeType = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            name: Joi.string().optional(),
            formula: Joi.string().optional().allow('').allow(null),
            upfront: Joi.boolean().optional(),
            syndication: Joi.boolean().optional(),
            default: Joi.boolean().optional(),
            inactive: Joi.boolean().optional()
        });
        const { value, error } = schema.validate({...req.params, ...req.body});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }
        
        const {id, ...data} = value;

        const feeType = await FeeTypeService.getFeeTypeById(id);
        accessControl(req, feeType, 'fee type');

        if (data.formula?.trim() === '') data.formula = null;
        
        const updatedFeeType = await FeeTypeService.updateFeeType(id, data, default_populate);

        res.status(200).json({
            success: true,
            data: updatedFeeType
        });
    } catch (error) {
        next(error);
    }
};

// @desc get fee type by id
// @route GET /api/v1/fee-types/:id
// @access Funder-ADMIN Funder-User Bookkeeper Admin
exports.getFeeTypeById = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);
        
        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const feeType = await FeeTypeService.getFeeTypeById(value.id, default_populate);
        accessControl(req, feeType, 'fee type');

        res.status(200).json({
            success: true,
            data: feeType
        });
    } catch (error) {
        next(error);
    }
};

// @desc delete fee type
// @route DELETE /api/v1/fee-types/:id
// @access Funder-ADMIN Admin
exports.deleteFeeType = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);
        
        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id } = value;

        const feeType = await FeeTypeService.getFeeTypeById(id);
        accessControl(req, feeType, 'fee type');
        
        await FeeTypeService.deleteFeeType(id);

        res.status(200).json({
            success: true,
            message: 'Fee type deleted successfully'
        });
        
    } catch (error) {
        next(error);
    }
};