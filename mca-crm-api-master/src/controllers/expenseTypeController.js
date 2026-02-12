const Joi = require('joi');

const ExpenseTypeService = require('../services/expenseTypeService');

const { accessControl } = require('../middleware/auth');
const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');

const default_populate = [
    { path: 'funder', select: 'name email phone' },
    { path: 'formula', select: 'name' }
];

// Query schema for expense type
const query_schema = {
    sort: Joi.string().optional(),
    search: Joi.string().optional(),
    include_inactive: Joi.boolean().default(false).optional(),
    funder: Joi.string().optional(),
    default: Joi.boolean().optional(),
    commission: Joi.boolean().optional()
};

// Build dbQuery from query
const buildDbQuery = (req, query) => {
    let dbQuery = {};

    dbQuery.$and = [];
    
    const funderFilter = Helpers.buildFunderFilter(req, query.funder);
    if (funderFilter) dbQuery.$and.push({ funder: funderFilter });

    if (!query.include_inactive) dbQuery.$and.push({ inactive: { $ne: true } });

    if (query.search) dbQuery.$and.push({ name: { $regex: query.search, $options: 'i' } });

    if (query.default !== undefined) dbQuery.default = query.default;
    if (query.commission !== undefined) dbQuery.commission = query.commission;

    return dbQuery;
};

// @desc    Get all expense types
// @route   GET /api/v1/expense-types
// @access  Funder-ADMIN Funder-User Bookkeeper Admin
exports.getExpenseTypes = async (req, res, next) => {
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

        const expenseTypes = await ExpenseTypeService.getExpenseTypes(
            dbQuery,
            page,
            limit,
            dbSort,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: expenseTypes
        });

    } catch (error) {
        next(error);
    }
};

// @desc    create a new expense type
// @route   POST /api/v1/expense-types
// @access  Funder-ADMIN Admin
exports.createExpenseType = async (req, res, next) => {
    try {
        const schema = Joi.object({
            name: Joi.string().required(),
            funder: Joi.string().optional(),
            formula: Joi.string().optional().allow('').allow(null),
            commission: Joi.boolean().optional(),
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
                return next(new ErrorResponse('You don\'t have permission to create expense type for this funder', 403));
            }
        }

        if (value.formula?.trim() === '') value.formula = null;

        const expenseType = await ExpenseTypeService.createExpenseType(value, default_populate);

        res.status(201).json({
            success: true,
            data: expenseType
        });
        
    } catch (error) {
        next(error);
    }
};

// @desc    get funder expense without pagination
// @route   GET /api/v1/expense-types/list
// @access  Funder-ADMIN Admin
exports.getExpenseTypesList = async (req, res, next) => {
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

        const expenseTypes = await ExpenseTypeService.getExpenseTypesList(dbQuery, dbSort);

        res.status(200).json({
            success: true,
            data: expenseTypes
        });
        
    } catch (error) {
        next(error);
    }
};

// @desc    update expense type
// @route   PUT /api/v1/expense-types/:id
// @access  Funder-ADMIN Funder-User Bookkeeper Admin
exports.updateExpenseType = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            name: Joi.string().optional(),
            formula: Joi.string().optional().allow('').allow(null),
            commission: Joi.boolean().optional(),
            syndication: Joi.boolean().optional(),
            default: Joi.boolean().optional(),
            inactive: Joi.boolean().optional()
        });
        const { value, error } = schema.validate({...req.params, ...req.body});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }
        
        const {id, ...data} = value;

        const expenseType = await ExpenseTypeService.getExpenseTypeById(id);
        accessControl(req, expenseType, 'expense type');

        if (data.formula?.trim() === '') data.formula = null;
        
        const updatedExpenseType = await ExpenseTypeService.updateExpenseType(id, data, default_populate);

        res.status(200).json({
            success: true,
            data: updatedExpenseType
        });
    } catch (error) {
        next(error);
    }
};

// @desc get expense type by id
// @route GET /api/v1/expense-types/:id
// @access Funder-ADMIN Funder-User Bookkeeper Admin
exports.getExpenseTypeById = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);
        
        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const expenseType = await ExpenseTypeService.getExpenseTypeById(value.id, default_populate);
        accessControl(req, expenseType, 'expense type');

        res.status(200).json({
            success: true,
            data: expenseType
        });
    } catch (error) {
        next(error);
    }
};

// @desc delete expense type
// @route DELETE /api/v1/expense-types/:id
// @access Funder-ADMIN Admin
exports.deleteExpenseType = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);
        
        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id } = value;

        const expenseType = await ExpenseTypeService.getExpenseTypeById(id);
        accessControl(req, expenseType, 'expense type');
        
        await ExpenseTypeService.deleteExpenseType(id);

        res.status(200).json({
            success: true,
            message: 'Expense type deleted successfully'
        });
        
    } catch (error) {
        next(error);
    }
};