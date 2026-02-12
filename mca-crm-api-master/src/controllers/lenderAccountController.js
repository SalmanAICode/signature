const Joi = require('joi');

const LenderAccountService = require('../services/lenderAccountService');

const { accessControl } = require('../middleware/auth');
const Helpers = require('../utils/helpers');
const ErrorResponse = require('../utils/errorResponse');

const default_populate = [
    { path: 'lender', select: 'name email phone' }
];

// @desc    Get all lender accounts
// @route   GET /api/v1/lender-accounts
// @access  Private/Lender
exports.getLenderAccounts = async (req, res, next) => {
    try {
        const schema = Joi.object({
            page: Joi.number().default(1).optional(),
            limit: Joi.number().default(10).optional(),
            sort: Joi.string().optional(),
            search: Joi.string().optional(),
            include_inactive: Joi.boolean().default(false).optional(),
            lender: Joi.string().optional()
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { page, limit, sort, ...query } = value;

        let dbQuery = {};

        const lenderFilter = Helpers.buildLenderFilter(req, query.lender);
        if (!lenderFilter) dbQuery.lender = lenderFilter;

        if (!query.include_inactive) {
            dbQuery.inactive = { $ne: true };
        }

        if (query.search) {
            dbQuery.$or = [
                { name: { $regex: query.search, $options: 'i' } },
                { bank_name: { $regex: query.search, $options: 'i' } },
                { routing_number: { $regex: query.search, $options: 'i' } },
                { account_number: { $regex: query.search, $options: 'i' } },
                { branch: { $regex: query.search, $options: 'i' } },
                { dda: { $regex: query.search, $options: 'i' } }
            ];
        }

        const dbSort = Helpers.buildSort(sort, { name: 1 });

        const lenderAccounts = await LenderAccountService.getLenderAccounts(
            dbQuery,
            page,
            limit,
            dbSort,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: lenderAccounts
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create a new lender account
// @route   POST /api/v1/lender-accounts
// @access  Private/Lender
exports.createLenderAccount = async (req, res, next) => {
    try {
        const schema = Joi.object({
            lender: Joi.string().required(),
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

        // verify lender
        if (req.filter?.lender_list) {
            if (!req.filter.lender_list.includes(value.lender)) {
                return next(new ErrorResponse('You don\'t have permission to access this lender account', 403));
            }
        }

        const lenderAccount = await LenderAccountService.createLenderAccount(value, default_populate);

        res.status(201).json({
            success: true,
            data: lenderAccount
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get lender accounts list without pagination
// @route   GET /api/v1/lender-accounts/list
// @access  Private/Lender
exports.getLenderAccountList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            include_inactive: Joi.boolean().default(false).optional(),
            sort: Joi.string().optional(),
            lender: Joi.string().optional()
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        let dbQuery = {};

        const lenderFilter = Helpers.buildLenderFilter(req, value.lender);
        if (!lenderFilter) dbQuery.lender = lenderFilter;

        if (!value.include_inactive) {
            dbQuery.inactive = { $ne: true };
        }

        const dbSort = Helpers.buildSort(value.sort, { name: 1 });

        const lenderAccounts = await LenderAccountService.getLenderAccountList(dbQuery, dbSort, [], 'name available_balance');

        res.status(200).json({
            success: true,
            data: lenderAccounts
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update lender account
// @route   PUT /api/v1/lender-accounts/:id
// @access  Private/Lender
exports.updateLenderAccount = async (req, res, next) => {
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

        const lenderAccount = await LenderAccountService.getLenderAccountById(id);
        accessControl(req, lenderAccount, 'lender account');

        const updatedLenderAccount = await LenderAccountService.updateLenderAccount(id, data, default_populate);

        res.status(200).json({
            success: true,
            data: updatedLenderAccount
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single lender account
// @route   GET /api/v1/lender-accounts/:id
// @access  Private/Lender
exports.getLenderAccount = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const lenderAccount = await LenderAccountService.getLenderAccountById(value.id, default_populate);
        accessControl(req, lenderAccount, 'lender account');

        res.status(200).json({
            success: true,
            data: lenderAccount
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete lender account
// @route   DELETE /api/v1/lender-accounts/:id
// @access  Private/Lender
exports.deleteLenderAccount = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const lenderAccount = await LenderAccountService.getLenderAccountById(value.id);
        accessControl(req, lenderAccount, 'lender account');

        const deletedLenderAccount = await LenderAccountService.deleteLenderAccount(lenderAccount._id);

        res.status(200).json({
            success: true,
            message: 'Lender account deleted successfully',
            data: deletedLenderAccount
        });
    } catch (err) {
        next(err);
    }
};

