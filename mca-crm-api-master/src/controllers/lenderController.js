const Joi = require('joi');

const LenderService = require('../services/lenderService');
const UserLenderService = require('../services/userLenderService');
const VirtualToVirtualService = require('../services/transfer/virtualToVirtualService');
const SyndicatorService = require('../services/syndicatorService');
const LenderAccountService = require('../services/lenderAccountService');
const SyndicatorFunderService = require('../services/syndicatorFunderService');

const { PORTAL_TYPES } = require('../utils/constants');
const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');
const { accessControl } = require('../middleware/auth');

// Default populate for lender
// This is used to populate for lender list, lender details, lender update, lender create
// To make the object structure in the response consistent and avoid to write the same code over and over again
const default_populate = [];

// query schema for lenders
const query_schema = {
    sort: Joi.string().allow('').optional(),
    select: Joi.string().allow('').optional(),
    search: Joi.string().allow('').optional(),
    
    name: Joi.string().allow('').optional(),
    email: Joi.string().allow('').optional(),
    phone: Joi.string().allow('').optional(),
    website: Joi.string().allow('').optional(),
    type: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    address_detail: Joi.string().allow('').optional(),
    business_detail: Joi.string().allow('').optional(),
    include_inactive: Joi.boolean().default(false).optional(),
    createdAt_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    createdAt_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    updatedAt_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    updatedAt_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional()
};

// build db query for lenders
const buildDbQuery = (req, query) => {
    const dbQuery = {$and: []};
    
    const lenderFilter = Helpers.buildLenderFilter(req);
    if (lenderFilter) dbQuery.$and.push({ _id: lenderFilter });

    if (query.search) {
        dbQuery.$and.push(Helpers.buildSearchFilter([
            'name',
            'email',
            'phone',
            'website',
            'address_list.address_1',
            'address_list.address_2',
            'address_list.city',
            'address_list.state',
            'address_list.zip',
            'business_detail.ein',
            'business_detail.entity_type',
            'business_detail.state_of_incorporation'
        ], query.search));
    }

    if (query.name) dbQuery.$and.push(Helpers.buildSearchFilter('name', query.name));
    if (query.email) dbQuery.$and.push(Helpers.buildSearchFilter('email', query.email));
    if (query.phone) dbQuery.$and.push(Helpers.buildSearchFilter('phone', query.phone));
    if (query.website) dbQuery.$and.push(Helpers.buildSearchFilter('website', query.website));

    if (query.type) dbQuery.$and.push(Helpers.buildArrayFilter('type', query.type));

    if (query.address_detail) dbQuery.$and.push(Helpers.buildSearchFilter([
        'address_detail.address_1', 
        'address_detail.address_2', 
        'address_detail.city', 
        'address_detail.state', 
        'address_detail.zip'
    ], query.address_detail));

    if (query.business_detail) dbQuery.$and.push(Helpers.buildSearchFilter([
        'business_detail.ein',
        'business_detail.entity_type',
        'business_detail.state_of_incorporation'
    ], query.business_detail));

    if (!query.include_inactive) {
        dbQuery.$and.push({ inactive: { $ne: true } });
    }

    if (query.createdAt_from) dbQuery.$and.push(Helpers.buildGTEFilter('createdAt', query.createdAt_from));
    if (query.createdAt_to) dbQuery.$and.push(Helpers.buildLTEFilter('createdAt', query.createdAt_to));
    if (query.updatedAt_from) dbQuery.$and.push(Helpers.buildGTEFilter('updatedAt', query.updatedAt_from));
    if (query.updatedAt_to) dbQuery.$and.push(Helpers.buildLTEFilter('updatedAt', query.updatedAt_to));

    dbQuery.$and = dbQuery.$and.filter(item => Object.keys(item).length > 0);

    return dbQuery;
};

// @desc    Get all lenders
// @route   GET /api/v1/lenders
// @access  Private
exports.getLenders = async (req, res, next) => {
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

        const { page, limit, sort, select, ...query } = value;

        const dbQuery = buildDbQuery(req, query);

        const dbSort = Helpers.buildSort(sort, { name: 1 });

        const lenders = await LenderService.getLenders(dbQuery, dbSort, page, limit, default_populate, select, true);

        res.status(200).json({
            success: true,
            data: lenders
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get lender list without pagination
// @route   GET /api/v1/lenders/list
// @access  Private
exports.getLenderList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            ...query_schema
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { sort, select, ...query } = value;

        const dbQuery = buildDbQuery(req, query);

        const dbSort = Helpers.buildSort(sort, { name: 1 });

        const lenders = await LenderService.getLenderList(dbQuery, dbSort, [], select || 'name email phone inactive');

        res.status(200).json({
            success: true,
            data: lenders
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single lender
// @route   GET /api/v1/lenders/:id
// @access  Private
exports.getLender = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        // Check if the lender is in the filter
        if (req.filter?.lender_list && !req.filter.lender_list.includes(value.id)) {
            return next(new ErrorResponse('Lender is not allowed to be accessed with current login', 403));
        }

        const lender = await LenderService.getLenderById(value.id, default_populate, '', true);

        res.status(200).json({
            success: true,
            data: lender
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new lender
// @route   POST /api/v1/lenders
// @access  Private (Admin only)
exports.createLender = async (req, res, next) => {
    try {
        const schema = Joi.object({
            funder: Joi.string().optional(),
            name: Joi.string().required(),
            email: Joi.string().email().required(),
            phone: Joi.string().required(),
            type: Joi.string().optional(),
            website: Joi.string().uri().optional(),
            business_detail: Joi.object().optional(),
            address_detail: Joi.object().optional(),
            user_list: Joi.array().items(Joi.string()).optional()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        // If user_list is not provided, set it to the current user's id if the request is from funder portal
        if (req.portal === PORTAL_TYPES.FUNDER) {
            if (!value.user_list || value.user_list?.length === 0) {
                value.user_list = [req.id];
            } else if (!value.user_list.includes(req.id)) {
                value.user_list.push(req.id);
            }
        }

        const { user_list, ...lenderData } = value;

        if (!lenderData.funder) {
            if (req.portal === PORTAL_TYPES.FUNDER && req.filter?.funder) {
                lenderData.funder = req.filter.funder;
            } else {
                throw new ErrorResponse('Funder is required', 400);
            }
        }

        const lender = await LenderService.createLender(lenderData);

        if (lender && user_list && user_list.length > 0) {
            Promise.all(user_list.map(user => UserLenderService.createUserLender(user, lender._id)));
        }

        const newLender = await LenderService.getLenderById(lender._id, default_populate, '', true);

        res.status(201).json({
            success: true,
            data: newLender
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update lender
// @route   PUT /api/v1/lenders/:id
// @access  Private (Admin only)
exports.updateLender = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            name: Joi.string().optional(),
            email: Joi.string().email().optional(),
            phone: Joi.string().optional(),
            website: Joi.string().uri().optional(),
            type: Joi.string().optional(),
            business_detail: Joi.object().optional(),
            address_detail: Joi.object().optional(),
            inactive: Joi.boolean().optional()
        });

        // Combine params and body for validation
        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, ...lenderData } = value;

        // Check if the lender is in the filter
        if (req.filter?.lender_list && !req.filter.lender_list.includes(id)) {
            return next(new ErrorResponse('Lender is not allowed to be accessed with current login', 404));
        }

        const lender = await LenderService.updateLender(id, lenderData, default_populate, '', true);

        if (!lender) {
            return next(
                new ErrorResponse(`Lender not found with id of ${id}`, 404)
            );
        }

        res.status(200).json({
            success: true,
            data: lender
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete lender
// @route   DELETE /api/v1/lenders/:id
// @access  Private (Admin only)
exports.deleteLender = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        if(req.filter?.lender_list && !req.filter.lender_list.includes(value.id)) {
            return next(new ErrorResponse('Lender is not allowed to be accessed with current login', 403));
        }

        await LenderService.deleteLender(value.id);

        res.status(200).json({
            success: true,
            message: 'Lender deleted successfully'
        });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Transfer available balance from lender to syndicator account
 * @route   POST /api/v1/lenders/:id/syndicators/:syndicatorId/transfer
 * @access  User
 */

exports.transferBalanceToSyndicator = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            syndicatorId: Joi.string().required(),
            lenderAccountId: Joi.string().optional(),
            amount: Joi.number().positive().precision(2).required(),
            password: Joi.string().required()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, syndicatorId, lenderAccountId, amount, password } = value;

        const result = await Helpers.withTransaction(async (session) => {
            const [accessableSyndicatorIds, lender, syndicator] = await Promise.all([
                Helpers.getAccessableSyndicatorIds(req, session),
                LenderService.getLenderById(id, [], '', true, session),
                SyndicatorService.getSyndicatorById(syndicatorId, [], '+password', false, false, session)
            ]);

            accessControl(req, lender, 'lender');

            if (!accessableSyndicatorIds.includes(Helpers.extractIdString(syndicatorId))) {
                return next(new ErrorResponse('You do not have permission to access this syndicator', 403));
            }

            if (!(await syndicator.matchPassword(password))) {
                return next(new ErrorResponse('Password is incorrect', 400));
            }

            const [lenderAccounts, syndicatorFunders] = await Promise.all([
                LenderAccountService.getLenderAccountList({ lender: id, inactive: false}, [], '', false, session),
                SyndicatorFunderService.getSyndicatorFunderList({ syndicator: syndicatorId, funder: Helpers.extractIdString(lender.funder), inactive: false }, [], '', false, session)
            ]);
            if(syndicatorFunders.length !== 1) {
                return next(new ErrorResponse('Syndicator-funder count is not 1', 400));
            }
            if(lenderAccounts.length === 0) {
                return next(new ErrorResponse('Lender account not found', 400));
            }
            const syndicatorFunder = syndicatorFunders[0];

            let transferResult;
            let lenderAccount;
            if (lenderAccountId) {
                if(!lenderAccounts.some(lenderAccount => Helpers.extractIdString(lenderAccount) === lenderAccountId)) {
                    return next(new ErrorResponse('This lender account is not associated with this lender', 403));
                }else{
                    lenderAccount = lenderAccounts.find(lenderAccount => Helpers.extractIdString(lenderAccount) === lenderAccountId);
                }
            }else{
                lenderAccount = lenderAccounts.find(lenderAccount => lenderAccount.available_balance >= amount);
                if(!lenderAccount) {
                    return next(new ErrorResponse('Lender account does not have enough balance', 400));
                }
            }

            transferResult = await VirtualToVirtualService.transferAvailableBalance(
                'Lender-Account',
                Helpers.extractIdString(lenderAccount),
                'Syndicator-Funder',
                Helpers.extractIdString(syndicatorFunder),
                amount,
                session
            )

            return transferResult.source;
        });

        res.status(200).json({
            success: true,
            message: `Successfully transferred $${amount} from lender account to syndicator-funder account`,
            data: result
        });

    } catch (err) {
        next(err);
    }
};