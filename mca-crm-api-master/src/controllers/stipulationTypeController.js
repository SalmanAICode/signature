const Joi = require('joi');

const StipulationTypeService = require('../services/stipulationTypeService');

const { accessControl } = require('../middleware/auth');
const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');

const default_populate = [
    { path: 'funder', select: 'name email phone' }
];

// query schema for stipulation type
const query_schema = {
    page: Joi.number().default(1).optional(),
    limit: Joi.number().default(10).optional(),
    sort: Joi.string().optional(),
    search: Joi.string().optional(),
    include_inactive: Joi.boolean().optional(),
    funder: Joi.string().optional(),
    required: Joi.boolean().optional()
};

// build db query for stipulation type
const buildDbQuery = async (req, query) => {
    const dbQuery = {};

    dbQuery.$and = [];

    const funderFilter = Helpers.buildFunderFilter(req, query.funder);
    if (funderFilter) dbQuery.$and.push({ funder: funderFilter });

    if (!query.include_inactive) dbQuery.$and.push({ inactive: { $ne: true } });

    if (query.search) dbQuery.$and.push({ name: { $regex: query.search, $options: 'i' } });

    if (query.required !== undefined) dbQuery.required = query.required;

    return dbQuery;
};

// @desc    Get all stipulation types
// @route   GET /api/v1/stipulation-types
// @access  Funder-ADMIN Funder-User Bookkeeper Admin
exports.getStipulationTypes = async (req, res, next) => {
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

        // Handle query
        const dbQuery = await buildDbQuery(req, query);

        const dbSort = Helpers.buildSort(sort, { name: 1 });

        const stipulationTypes = await StipulationTypeService.getStipulationTypes(
            dbQuery,
            dbSort,
            page,
            limit,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: stipulationTypes
        });
    } catch (error) {
        next(error);
    }
};

// @desc    create a new stipulation type
// @route   POST /api/v1/stipulation-types
// @access  Funder-ADMIN Admin
exports.createStipulationType = async (req, res, next) => {
    try {
        const schema = Joi.object({
            funder: Joi.string().optional(),
            name: Joi.string().required(),
            required: Joi.boolean().optional()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        if (!value.funder) {
            value.funder = req.filter.funder;
        } else {
            if (req.filter.funder && req.filter.funder !== value.funder) {
                return next(new ErrorResponse('You don\'t have permission to create stipulation type for this funder', 403));
            } else if (req.filter.funder_list && !req.filter.funder_list.includes(value.funder)) {
                return next(new ErrorResponse('You don\'t have permission to create stipulation type for this funder', 403));
            }
        }

        const stipulationType = await StipulationTypeService.createStipulationType(value, default_populate);

        res.status(201).json({
            success: true,
            data: stipulationType
        });
    } catch (error) {
        next(error);
    }
};

// @desc    get stipulation type without pagination
// @route   GET /api/v1/stipulation-types/list
// @access  Funder-ADMIN Funder-User Bookkeeper Admin
exports.getStipulationTypesList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            ...query_schema
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        // Handle filter
        const dbQuery = await buildDbQuery(req, value);

        const dbSort = Helpers.buildSort(value.sort, { name: 1 });

        const stipulationTypes = await StipulationTypeService.getStipulationTypesList(dbQuery, dbSort, [], 'name required inactive');

        res.status(200).json({
            success: true,
            data: stipulationTypes
        });
    } catch (error) {
        next(error);
    }
};

// @desc    update stipulation type
// @route   PUT /api/v1/stipulation-types/:id
// @access  Funder-ADMIN Admin
exports.updateStipulationType = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            name: Joi.string().optional(),
            required: Joi.boolean().optional(),
            inactive: Joi.boolean().optional()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, ...data } = value;

        const stipulationType = await StipulationTypeService.getStipulationTypeById(id);
        accessControl(req, stipulationType, 'stipulation type');

        const updatedStipulationType = await StipulationTypeService.updateStipulationType(id, data, default_populate);

        res.status(200).json({
            success: true,
            data: updatedStipulationType
        });
    } catch (error) {
        next(error);
    }
};

// @desc    get stipulation type by id
// @route   GET /api/v1/stipulation-types/:id
// @access  Funder-ADMIN Funder-User Bookkeeper Admin
exports.getStipulationTypeById = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const stipulationType = await StipulationTypeService.getStipulationTypeById(value.id, default_populate);
        accessControl(req, stipulationType, 'stipulation type');
        
        res.status(200).json({
            success: true,
            data: stipulationType
        });
    } catch (error) {
        next(error);
    }
};

// @desc    delete stipulation type
// @route   DELETE /api/v1/stipulation-types/:id
// @access  Funder-ADMIN Admin
exports.deleteStipulationType = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id } = value;

        const stipulationType = await StipulationTypeService.getStipulationTypeById(id);
        accessControl(req, stipulationType, 'stipulation type');

        await StipulationTypeService.deleteStipulationType(id);

        res.status(200).json({
            success: true,
            message: 'Stipulation type deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};