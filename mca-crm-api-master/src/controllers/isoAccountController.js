const Joi = require('joi');

const ISOAccountService = require('../services/isoAccountService');

const { accessControl } = require('../middleware/auth');
const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');

const default_populate = [
    { path: 'iso', select: 'name email phone' }
];

// query schema for ISO accounts
const query_schema = {
    sort: Joi.string().optional(),
    search: Joi.string().optional(),
    include_inactive: Joi.boolean().default(false).optional(),
    iso: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional()
};

// Build dbQuery from query
const buildDbQuery = async (req, query) => {
    let dbQuery = {};

    dbQuery.$and = [];

    const isoFilter = await Helpers.getAccessableIsoIds(req);
    if (isoFilter) dbQuery.$and.push({ iso: isoFilter });

    if (!query.include_inactive) {
        dbQuery.$and.push({ inactive: { $ne: true } });
    }

    // Handle iso filter (supports both single string and array)
    if (query.iso) dbQuery.$and.push(Helpers.buildArrayFilter('iso', query.iso, true));

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

    return dbQuery;
};

// @desc    Get all ISO accounts
// @route   GET /api/v1/iso-accounts
// @access  Private/ISO
exports.getISOAccounts = async (req, res, next) => {
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

        const dbSort = Helpers.buildSort(sort, { name: 1 });

        const isoAccounts = await ISOAccountService.getISOAccounts(
            dbQuery,
            dbSort,
            page,
            limit,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: isoAccounts
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new ISO account
// @route   POST /api/v1/iso-accounts
// @access  Private/ISO
exports.createISOAccount = async (req, res, next) => {
    try {
        const schema = Joi.object({
            iso: Joi.string().required(),
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

        //verify iso
        if (req.filter?.iso_list) {
            if (!req.filter.iso_list.includes(value.iso)) {
                return next(new ErrorResponse('You don\'t have permission to access this ISO\'s account', 403));
            }
        }

        const isoAccount = await ISOAccountService.createISOAccount(value, default_populate);

        res.status(201).json({
            success: true,
            data: isoAccount
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get iso accounts list without pagination
// @route   GET /api/v1/iso-accounts/list
// @access  Private/ISO
exports.getISOAccountList = async (req, res, next) => {
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

        const isoAccounts = await ISOAccountService.getISOAccountList(dbQuery, dbSort);

        res.status(200).json({
            success: true,
            data: isoAccounts
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update an ISO account
// @route   PUT /api/v1/iso-accounts/:id
// @access  Private/ISO
exports.updateISOAccount = async (req, res, next) => {
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

        const isoAccount = await ISOAccountService.getISOAccountById(id);
        accessControl(req, isoAccount, 'iso account');

        const updatedISOAccount = await ISOAccountService.updateISOAccount(id, data, default_populate);

        res.status(200).json({
            success: true,
            data: updatedISOAccount
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get  single ISO account
// @route   GET /api/v1/iso-accounts/:id
// @access  Private/ISO
exports.getISOAccount = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const isoAccount = await ISOAccountService.getISOAccountById(value.id, default_populate);
        accessControl(req, isoAccount, 'iso account');

        res.status(200).json({
            success: true,
            data: isoAccount
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete ISO account
// @route   DELETE /api/v1/iso-accounts/:id
// @access  Private/ISO
exports.deleteISOAccount = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const isoAccount = await ISOAccountService.getISOAccountById(value.id);
        accessControl(req, isoAccount, 'iso account');

        await ISOAccountService.deleteISOAccount(value.id);

        res.status(200).json({
            success: true,
            message: 'ISO account deleted successfully'
        });
    } catch (err) {
        next(err);
    }
};
