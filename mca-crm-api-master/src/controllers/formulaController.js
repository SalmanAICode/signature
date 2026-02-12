const Joi = require('joi');

const FormulaService = require('../services/formulaService');

const { accessControl } = require('../middleware/auth');
const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');

// Default populate for formula
// This is used to populate for formula list, formula details, formula update, formula create
// To make the object structure in the response consistent and avoid to write the same code over and over again
const default_populate = [];

// Query schema for formula
const query_schema = {
    search: Joi.string().allow('').optional(),
    include_inactive: Joi.boolean().default(false).optional(),
    include_private: Joi.boolean().default(false).optional(),
    sort: Joi.string().allow('').optional(),
    funder: Joi.string().optional()
};

// Build dbQuery from query
const buildDbQuery = (req, query) => {
    let dbQuery = {};
    
    dbQuery.$and = [];

    const funderFilter = Helpers.buildFunderFilter(req, query.funder);
    if (funderFilter) dbQuery.$and.push({ funder: funderFilter });

    if (!query.include_inactive) dbQuery.$and.push({ inactive: { $ne: true } });
    if (!query.include_private) dbQuery.$and.push({ shared: true });
    
    if (query.search) dbQuery.$and.push({ name: { $regex: query.search, $options: 'i' } });

    return dbQuery;
};

// @desc    Get all formulas
// @route   GET /api/v1/formulas
// @access  Private
exports.getFormulas = async (req, res, next) => {
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

        // Build dbQuery from query
        const dbQuery = buildDbQuery(req, query);

        // Handle sorting
        const dbSort = Helpers.buildSort(sort, { name: 1 });

        const formulas = await FormulaService.getFormulas(dbQuery, page, limit, dbSort, default_populate);

        res.status(200).json({
            success: true,
            data: formulas
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get formula list without pagination
// @route   GET /api/v1/formulas/list
// @access  Private
exports.getFormulaList = async (req, res, next) => {
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

        const formulas = await FormulaService.getFormulaList(dbQuery, dbSort, [], 'name shared inactive');

        res.status(200).json({
            success: true,
            data: formulas
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single formula
// @route   GET /api/v1/formulas/:id
// @access  Private
exports.getFormula = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const formula = await FormulaService.getFormulaById(value.id, default_populate);
        accessControl(req, formula, 'formula');

        res.status(200).json({
            success: true,
            data: formula
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new formula
// @route   POST /api/v1/formulas
// @access  Private (Admin only)
exports.createFormula = async (req, res, next) => {
    try {
        // Simplified schema that makes all fields optional except the required ones
        const schema = Joi.object({
            funder: Joi.string().optional(),
            name: Joi.string().required(),
            calculate_type: Joi.string().required(),
            base_item: Joi.string().when('calculate_type', {
                is: 'PERCENT',
                then: Joi.string().required(),
                otherwise: Joi.string().optional()
            }),
            tier_type: Joi.string().optional(),
            tier_list: Joi.array().min(1).items({
                min_number: Joi.number().optional(),
                max_number: Joi.number().optional(),
                amount: Joi.number().optional(),
                percent: Joi.number().optional()
            }).required(),
            shared: Joi.boolean().default(false).optional()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        // If calculate_type is PERCENT, then percent in tier_list is required
        if (value.calculate_type === 'PERCENT') {
            if (!value.tier_list.every(tier => tier.percent !== undefined)) {
                return next(new ErrorResponse('Percent is required', 400));
            }
        } else {
            if (!value.tier_list.every(tier => tier.amount !== undefined)) {
                return next(new ErrorResponse('Amount is required', 400));
            }
        }

        // If tier_type is provided, then min_number is required except for the first tier
        if (value.tier_type) {
            if (!value.tier_list.every((tier, index) => index === 0 || tier.min_number !== undefined)) {
                return next(new ErrorResponse('Min number is required', 400));
            }
        }

        // If tier_type is provided, then max_number is required except for the last tier
        if (value.tier_type) {
            if (!value.tier_list.every((tier, index) => index === value.tier_list.length - 1 || tier.max_number !== undefined)) {
                return next(new ErrorResponse('Max number is required', 400));
            }
        }

        if (!value.funder) {
            value.funder = req.filter.funder;
        } else {
            if (req.filter.funder && req.filter.funder !== value.funder) {
                return next(new ErrorResponse('You don\'t have permission to create fee type for this funder', 403));
            }
        }

        if (value.tier_type) {
            // Set the first tier's min_number to 0
            value.tier_list[0].min_number = 0;

            // Set the last tier's max_number to a very large number instead of Infinity
            value.tier_list[value.tier_list.length - 1].max_number = Number.MAX_SAFE_INTEGER;
        }

        const formula = await FormulaService.createFormula(value, default_populate);

        res.status(201).json({
            success: true,
            data: formula
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update formula
// @route   PUT /api/v1/formulas/:id
// @access  Private (Admin only)
exports.updateFormula = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            name: Joi.string().required(),
            calculate_type: Joi.string().required(),
            base_item: Joi.string().when('calculate_type', {
                is: 'PERCENT',
                then: Joi.string().required(),
                otherwise: Joi.string().optional()
            }),
            tier_type: Joi.string().optional(),
            tier_list: Joi.array().min(1).items({
                min_number: Joi.number().optional(),
                max_number: Joi.number().optional(),
                amount: Joi.number().optional(),
                percent: Joi.number().optional()
            }).required(),
            shared: Joi.boolean().default(false).optional(),
            inactive: Joi.boolean().default(false).optional()
        });

        // Combine params and body for validation
        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        // If calculate_type is PERCENT, then percent in tier_list is required
        if (value.calculate_type === 'PERCENT') {
            if (!value.tier_list.every(tier => tier.percent !== undefined)) {
                return next(new ErrorResponse('Percent is required', 400));
            }
        } else {
            if (!value.tier_list.every(tier => tier.amount !== undefined)) {
                return next(new ErrorResponse('Amount is required', 400));
            }
        }

        // If tier_type is provided, then min_number is required except for the first tier
        if (value.tier_type) {
            if (!value.tier_list.every((tier, index) => index === 0 || tier.min_number !== undefined)) {
                return next(new ErrorResponse('Min number is required', 400));
            }
        }

        // If tier_type is provided, then max_number is required except for the last tier
        if (value.tier_type) {
            if (!value.tier_list.every((tier, index) => index === value.tier_list.length - 1 || tier.max_number !== undefined)) {
                return next(new ErrorResponse('Max number is required', 400));
            }
        }

        if (value.tier_type) {
            // Set the first tier's min_number to 0
            value.tier_list[0].min_number = 0;

            // Set the last tier's max_number to a very large number instead of Infinity
            value.tier_list[value.tier_list.length - 1].max_number = Number.MAX_SAFE_INTEGER;
        }

        const { id, ...formulaData } = value;

        const formula = await FormulaService.getFormulaById(id);
        accessControl(req, formula, 'formula');

        const updatedFormula = await FormulaService.updateFormula(id, formulaData, default_populate);

        res.status(200).json({
            success: true,
            data: updatedFormula
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete formula
// @route   DELETE /api/v1/formulas/:id
// @access  Private (Admin only)
exports.deleteFormula = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const formula = await FormulaService.getFormulaById(value.id);
        accessControl(req, formula, 'formula');

        await FormulaService.deleteFormula(value.id);

        res.status(200).json({
            success: true,
            message: 'Formula deleted successfully'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Calculate Cost of formula with given object id and type
// @route   POST /api/v1/formulas/:id/calculate
// @access  Private
exports.calculateFormula = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            fund: Joi.number().required(),
            payback: Joi.number().required()
        });

        const { value, error } = schema.validate({...req.params, ...req.query});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const formula = await FormulaService.getFormulaById(value.id);
        accessControl(req, formula, 'formula');

        const cost = await FormulaService.calculateFormula(value.id, value.fund, value.payback);

        res.status(200).json({
            success: true,
            data: cost
        });
    } catch (err) {
        next(err);
    }
};
