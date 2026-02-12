const Joi = require('joi');

const MerchantAccountService = require('../services/merchantAccountService');

const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');
const { accessControl } = require('../middleware/auth');

const default_populate = [
    { path: 'merchant', select: 'name dba_name email phone' }
];

// query schema for merchant accounts
const query_schema = {
    sort: Joi.string().optional(),
    search: Joi.string().optional(),
    include_inactive: Joi.boolean().default(false).optional(),
    merchant: Joi.string().optional(),
    account_type: Joi.string().optional()
};

// build db query for merchant accounts
const buildDbQuery = async (req, query) => {
    let dbQuery = {};
    dbQuery.$and = [];

    const merchantFilter = await Helpers.getAccessableMerchantIds(req);
    if (merchantFilter) dbQuery.merchant = merchantFilter;

    if (!query.include_inactive) {
        dbQuery.inactive = { $ne: true };
    }

    if (query.search) {
        dbQuery.$and.push({
            $or: [
                { name: { $regex: query.search, $options: 'i' } },
                { bank_name: { $regex: query.search, $options: 'i' } },
                { routing_number: { $regex: query.search, $options: 'i' } },
                { account_number: { $regex: query.search, $options: 'i' } },
                { branch: { $regex: query.search, $options: 'i' } },
                { dda: { $regex: query.search, $options: 'i' } }
            ]
        });
    }

    if (query.account_type) {
        dbQuery.$and.push({ account_type: query.account_type });
    }

    return dbQuery;
};

// @desc    Get all merchant accounts
// @route   GET /api/v1/merchant-accounts
// @access  Private/Merchant
exports.getMerchantAccounts = async (req, res, next) => {
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

        const dbQuery = await buildDbQuery(req, query);

        const dbSort = Helpers.buildSort(sort, { createdAt: -1 });

        const merchantAccounts = await MerchantAccountService.getMerchantAccounts(
            dbQuery,
            dbSort,
            page,
            limit,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: merchantAccounts
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create a new merchant account
// @route   POST /api/v1/merchant-accounts
// @access  Private/Merchant
exports.createMerchantAccount = async (req, res, next) => {
    try {
        const schema = Joi.object({
            merchant: Joi.string().required(),
            name: Joi.string().required(),
            bank_name: Joi.string().optional(),
            routing_number: Joi.string().required(),
            account_number: Joi.string().required(),
            account_type: Joi.string().optional(),
            branch: Joi.string().optional(),
            dda: Joi.string().optional()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        //verify merchant
        const merchantIds = await Helpers.getAccessableMerchantIds(req);
        if (merchantIds) {
            if (!merchantIds.includes(value.merchant)) {
                return next(new ErrorResponse('You don\'t have permission to access this merchant\'s account', 403));
            }
        }

        const merchantAccount = await MerchantAccountService.createMerchantAccount(value, default_populate);

        res.status(201).json({
            success: true,
            data: merchantAccount
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get merchant accounts list without pagination
// @route   GET /api/v1/merchant-accounts/list
// @access  Private/Merchant
exports.getMerchantAccountsList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            ...query_schema
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const dbQuery = await buildDbQuery(req, value);

        const dbSort = Helpers.buildSort(value.sort, { name: 1 });

        const merchantAccounts = await MerchantAccountService.getMerchantAccountList(dbQuery, dbSort, default_populate);

        res.status(200).json({
            success: true,
            data: merchantAccounts
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update merchant account
// @route   PUT /api/v1/merchant-accounts/:id
// @access  Private/Merchant
exports.updateMerchantAccount = async (req, res, next) => {
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
            inactive: Joi.boolean().optional()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, ...data } = value;

        const merchantAccount = await MerchantAccountService.getMerchantAccountById(id);
        accessControl(req, merchantAccount, 'merchant account');

        const updatedMerchantAccount = await MerchantAccountService.updateMerchantAccount(id, data, default_populate);

        res.status(200).json({
            success: true,
            data: updatedMerchantAccount
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single merchant account
// @route   GET /api/v1/merchant-accounts/:id
// @access  Private/Merchant
exports.getMerchantAccount = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const merchantAccount = await MerchantAccountService.getMerchantAccountById(value.id, default_populate);
        accessControl(req, merchantAccount, 'merchant account');

        res.status(200).json({
            success: true,
            data: merchantAccount
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete merchant account
// @route   DELETE /api/v1/merchant-accounts/:id
// @access  Private/Merchant
exports.deleteMerchantAccount = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const merchantAccount = await MerchantAccountService.getMerchantAccountById(value.id);
        accessControl(req, merchantAccount, 'merchant account');

        const deletedMerchantAccount = await MerchantAccountService.deleteMerchantAccount(value.id, default_populate);

        res.status(200).json({
            success: true,
            message: 'Merchant account deleted successfully',
            data: deletedMerchantAccount
        });
    } catch (err) {
        next(err);
    }
};
