const Joi = require('joi');

const SyndicatorAccountService = require('../services/syndicatorAccountService');

const { accessControl } = require('../middleware/auth');
const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');

const default_populate = [
    { path: 'syndicator', select: 'name email phone' }
];

// query schema for syndicator accounts
const query_schema = {
    sort: Joi.string().optional(),
    search: Joi.string().optional(),
    include_inactive: Joi.boolean().default(false).optional(),
    syndicator: Joi.string().optional()
};

// build db query for syndicator accounts
const buildDbQuery = async (req, query) => {
    const dbQuery = {};

    dbQuery.$and = [];

    const accessableSyndicatorIds = await Helpers.getAccessableSyndicatorIds(req);
    if (query.syndicator) {
        if (accessableSyndicatorIds) {
            if (accessableSyndicatorIds.includes(query.syndicator)) {
                dbQuery.$and.push({ syndicator: query.syndicator });
            } else {
                throw new ErrorResponse('You do not have permission to access this syndicator', 403);
            }
        } else {
            dbQuery.$and.push({ syndicator: query.syndicator });
        }
    } else if (accessableSyndicatorIds) {
        dbQuery.$and.push({ syndicator: { $in: accessableSyndicatorIds } });
    }

    if (!query.include_inactive) dbQuery.$and.push({ inactive: { $ne: true } });

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

    return dbQuery;
};

// @desc    Get all syndicator accounts
// @route   GET /api/v1/syndicator-accounts
// @access  Private/Syndicator
exports.getSyndicatorAccounts = async (req, res, next) => {
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

        const syndicatorAccounts = await SyndicatorAccountService.getSyndicatorAccounts(
            dbQuery,
            dbSort,
            page,
            limit,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: syndicatorAccounts
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new syndicator account
// @route   POST /api/v1/syndicator-accounts
// @access  Private/Syndicator
exports.createSyndicatorAccount = async (req, res, next) => {
    try {
        const schema = Joi.object({
            syndicator: Joi.string().required(),
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

        //verify syndicator
        const accessableSyndicatorIds = await Helpers.getAccessableSyndicatorIds(req);
        if (accessableSyndicatorIds) {
            if (!accessableSyndicatorIds.includes(value.syndicator)) {
                return next(new ErrorResponse('You don\'t have permission to access this syndicator\'s account', 403));
            }
        }

        const syndicatorAccount = await SyndicatorAccountService.createSyndicatorAccount(value, default_populate);

        res.status(201).json({
            success: true,
            data: syndicatorAccount
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get syndicator accounts list without pagination
// @route   GET /api/v1/syndicator-accounts/list
// @access  Private/Syndicator
exports.getSyndicatorAccountList = async (req, res, next) => {
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

        const syndicatorAccounts = await SyndicatorAccountService.getSyndicatorAccountList(dbQuery, dbSort);

        res.status(200).json({
            success: true,
            data: syndicatorAccounts
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update a syndicator account
// @route   PUT /api/v1/syndicator-accounts/:id
// @access  Private/Syndicator
exports.updateSyndicatorAccount = async (req, res, next) => {
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

        const syndicatorAccount = await SyndicatorAccountService.getSyndicatorAccountById(id);
        accessControl(req, syndicatorAccount, 'syndicator account');

        const updatedSyndicatorAccount = await SyndicatorAccountService.updateSyndicatorAccount(id, data, default_populate);

        res.status(200).json({
            success: true,
            data: updatedSyndicatorAccount
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single syndicator account
// @route   GET /api/v1/syndicator-accounts/:id
// @access  Private/Syndicator
exports.getSyndicatorAccount = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const syndicatorAccount = await SyndicatorAccountService.getSyndicatorAccountById(value.id, default_populate);
        accessControl(req, syndicatorAccount, 'syndicator account');

        res.status(200).json({
            success: true,
            data: syndicatorAccount
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete syndicator account
// @route   DELETE /api/v1/syndicator-accounts/:id
// @access  Private/Syndicator
exports.deleteSyndicatorAccount = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const syndicatorAccount = await SyndicatorAccountService.getSyndicatorAccountById(value.id);
        accessControl(req, syndicatorAccount, 'syndicator account');

        await SyndicatorAccountService.deleteSyndicatorAccount(value.id);

        res.status(200).json({
            success: true,
            message: 'Syndicator account deleted successfully'
        });
    } catch (err) {
        next(err);
    }
}; 