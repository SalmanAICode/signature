const Joi = require('joi');

const FunderAccountService = require('../services/funderAccountService');

const { accessControl } = require('../middleware/auth');
const Helpers = require('../utils/helpers');
const ErrorResponse = require('../utils/errorResponse');

const default_populate = [
    { path: 'funder', select: 'name email phone' }
];

// Query schema for funder account
const query_schema = {
    sort: Joi.string().optional(),
    search: Joi.string().optional(),
    include_inactive: Joi.boolean().default(false).optional(),
    funder: Joi.string().optional()
};

// Build dbQuery from query
const buildDbQuery = (req, query) => {
    let dbQuery = {};

    dbQuery.$and = [];

    const funderFilter = Helpers.buildFunderFilter(req, query.funder);
    if (funderFilter) dbQuery.$and.push({ funder: funderFilter });

    if (!query.include_inactive) dbQuery.$and.push({ inactive: { $ne: true } });

    if (query.search) dbQuery.$and.push({ $or: [
        { name: { $regex: query.search, $options: 'i' } },
        { bank_name: { $regex: query.search, $options: 'i' } },
        { routing_number: { $regex: query.search, $options: 'i' } },
        { account_number: { $regex: query.search, $options: 'i' } },
        { branch: { $regex: query.search, $options: 'i' } },
        { dda: { $regex: query.search, $options: 'i' } }
    ] });

    return dbQuery;
};

// @desc    Get all funder accounts
// @route   GET /api/v1/funder-accounts
// @access  Private/Funder
exports.getFunderAccounts = async (req, res, next) => {
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

        const dbQuery = buildDbQuery(req, query);

        const dbSort = Helpers.buildSort(sort, { name: 1 });

        const funderAccounts = await FunderAccountService.getFunderAccounts(
            dbQuery,
            page,
            limit,
            dbSort,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: funderAccounts
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create a new funder account
// @route   POST /api/v1/funder-accounts
// @access  Private/Funder
exports.createFunderAccount = async (req, res, next) => {
    try {
        const schema = Joi.object({
            funder: Joi.string().optional(),
            name: Joi.string().required(),
            bank_name: Joi.string().optional(),
            routing_number: Joi.string().required(),
            account_number: Joi.string().required(),
            account_type: Joi.string().optional(),
            branch: Joi.string().optional(),
            dda: Joi.string().optional(),
            available_balance: Joi.number().optional()
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
            }
        }

        const funderAccount = await FunderAccountService.createFunderAccount(value, default_populate);

        res.status(201).json({
            success: true,
            data: funderAccount
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get funder accounts list without pagination
// @route   GET /api/v1/funder-accounts/list
// @access  Private/Funder
exports.getFunderAccountList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            ...query_schema
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const dbQuery = buildDbQuery(req, value);

        const dbSort = Helpers.buildSort(value.sort, { name: 1 });

        const funderAccounts = await FunderAccountService.getFunderAccountList(dbQuery, dbSort, [], 'name available_balance');

        res.status(200).json({
            success: true,
            data: funderAccounts
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update funder account
// @route   PUT /api/v1/funder-accounts/:id
// @access  Private/Funder
exports.updateFunderAccount = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            name: Joi.string().optional(),
            bank_name: Joi.string().optional(),
            routing_number: Joi.string().optional(),
            account_number: Joi.string().optional(),
            account_type: Joi.string().optional(),
            branch: Joi.string().optional(),
            dda: Joi.string().optional(),
            available_balance: Joi.number().optional(),
            inactive: Joi.boolean().optional()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, ...data } = value;

        const funderAccount = await FunderAccountService.getFunderAccountById(id);
        accessControl(req, funderAccount, 'funder account');

        const updatedFunderAccount = await FunderAccountService.updateFunderAccount(id, data, default_populate);

        res.status(200).json({
            success: true,
            data: updatedFunderAccount
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single funder account
// @route   GET /api/v1/funder-accounts/:id
// @access  Private/Funder
exports.getFunderAccount = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const funderAccount = await FunderAccountService.getFunderAccountById(value.id, default_populate);
        accessControl(req, funderAccount, 'funder account');

        res.status(200).json({
            success: true,
            data: funderAccount
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete funder account
// @route   DELETE /api/v1/funder-accounts/:id
// @access  Private/Funder
exports.deleteFunderAccount = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const funderAccount = await FunderAccountService.getFunderAccountById(value.id);
        accessControl(req, funderAccount, 'funder account');

        const deletedFunderAccount = await FunderAccountService.deleteFunderAccount(funderAccount._id);

        res.status(200).json({
            success: true,
            message: 'Funder account deleted successfully',
            data: deletedFunderAccount
        });
    } catch (err) {
        next(err);
    }
};
