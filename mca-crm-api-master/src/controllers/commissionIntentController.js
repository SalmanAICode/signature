const Joi = require('joi');

const CommissionIntentService = require('../services/commissionIntentService');
const FundingService = require('../services/fundingService');
const FunderAccountService = require('../services/funderAccountService');
const ISOAccountService = require('../services/isoAccountService');

const ErrorResponse = require('../utils/errorResponse');

const { accessControl } = require('../middleware/auth');
const Helpers = require('../utils/helpers');
const { INTENT_STATUS, PORTAL_TYPES } = require('../utils/constants');

const default_populate = [
    { path: 'funding', select: 'name' },
    { path: 'funder_account', select: 'name bank_name routing_number account_number account_type' },
    { path: 'iso_account', select: 'name bank_name routing_number account_number account_type' },
    { path: 'created_by_user', select: 'first_name last_name email phone_mobile' },
    { path: 'updated_by_user', select: 'first_name last_name email phone_mobile' },
];

// query schema for commission intent
const querySchema = {
    sort: Joi.string().optional(),
    search: Joi.string().optional(),
    funding: Joi.string().optional(),
    funder: Joi.string().optional(),
    lender: Joi.string().optional(),
    iso: Joi.string().optional(),
    payment_method: Joi.string().optional(),
    ach_processor: Joi.string().optional(),
    status: Joi.string().optional()
};

// build db query from query schema
const buildDbQuery = (req, query) => {
    const dbQuery = {};

    dbQuery.$and = [];

    if (query.funding) dbQuery.$and.push({ funding: query.funding });

    const funderFilter = Helpers.buildFunderFilter(req, query.funder);
    const lenderFilter = Helpers.buildLenderFilter(req, query.lender);
    const isoFilter = Helpers.buildIsoFilter(req, query.iso);
    
    if (funderFilter) dbQuery.$and.push({ 'funder.id': funderFilter });
    if (lenderFilter) dbQuery.$and.push({ 'lender.id': lenderFilter });
    if (isoFilter) dbQuery.$and.push({ 'iso.id': isoFilter });

    if (query.payment_method) dbQuery.payment_method = query.payment_method;
    if (query.ach_processor) dbQuery.ach_processor = query.ach_processor;
    if (query.status) dbQuery.status = query.status;

    if (query.search) {
        dbQuery.$or = [
            { 'funder.name': { $regex: query.search, $options: 'i' } },
            { 'funder.email': { $regex: query.search, $options: 'i' } },
            { 'funder.phone': { $regex: query.search, $options: 'i' } },
            { 'lender.name': { $regex: query.search, $options: 'i' } },
            { 'lender.email': { $regex: query.search, $options: 'i' } },
            { 'lender.phone': { $regex: query.search, $options: 'i' } },
            { 'iso.name': { $regex: query.search, $options: 'i' } },
            { 'iso.email': { $regex: query.search, $options: 'i' } },
            { 'iso.phone': { $regex: query.search, $options: 'i' } },
            { 'note': { $regex: query.search, $options: 'i' } }
        ];
    }

    return dbQuery;
};

// @desc    Get all commission intents
// @route   GET /api/v1/commission-intents
// @access  Private
exports.getCommissionIntents = async (req, res, next) => {
    try {
        const schema = Joi.object({
            page: Joi.number().default(1).optional(),
            limit: Joi.number().default(10).optional(),
            ...querySchema
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { page, limit, sort, ...query } = value;

        if (query.funding) {
            const funding = await FundingService.getFundingById(query.funding);
            accessControl(req, funding, 'funding');
        }

        // Handle query
        const dbQuery = buildDbQuery(req, query);

        // Handle sort
        const dbSort = Helpers.buildSort(sort, { commission_date: -1 });    
        
        const commissionIntents = await CommissionIntentService.getCommissionIntents(
            dbQuery,
            page,
            limit,
            dbSort,
            default_populate,
            '',
            true
        );

        res.status(200).json({
            success: true,
            data: commissionIntents
        });

    } catch (err) {
        next(err);
    }
};

// @desc    Create a new commission intent
// @route   POST /api/v1/commission-intents
// @access  Private
exports.createCommissionIntent = async (req, res, next) => {
    try {
        const schema = Joi.object({
            funding: Joi.string().required(),
            commission_date: Joi.date().required(),
            amount: Joi.number().required(),
            payment_method: Joi.string().optional(),
            ach_processor: Joi.string().optional(),
            funder_account: Joi.string().required(),
            iso_account: Joi.string().required(),
            note: Joi.string().optional(),
            status: Joi.string().optional()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const data = { ...value };

        const funding = await FundingService.getFundingById(data.funding);
        accessControl(req, funding, 'funding');

        const funderAccount = await FunderAccountService.getFunderAccountById(data.funder_account);
        accessControl(req, funderAccount, 'funder account');

        // Get ISO account to extract ISO information
        const isoAccount = await ISOAccountService.getISOAccountById(data.iso_account);
        accessControl(req, isoAccount, 'iso account');

        data.funder = Helpers.extractIdString(funding.funder);
        data.lender = Helpers.extractIdString(funding.lender);
        data.iso = Helpers.extractIdString(isoAccount.iso);

        if (req.portal === PORTAL_TYPES.FUNDER) {
            data.created_by_user = req.id;
        }

        const commissionIntent = await CommissionIntentService.createCommissionIntent(data, default_populate, '', true);

        res.status(201).json({
            success: true,
            data: commissionIntent
        });
        
    } catch (err) {
        next(err);
    }
};

// @desc    Get commission intents list without pagination
// @route   GET /api/v1/commission-intents/list
// @access  Private
exports.getCommissionIntentList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            ...querySchema
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { sort, ...query } = value;

        const dbQuery = buildDbQuery(req, query);

        const dbSort = Helpers.buildSort(sort, { commission_date: -1 });

        const commissionIntents = await CommissionIntentService.getCommissionIntentList(
            dbQuery,
            dbSort
        );

        res.status(200).json({
            success: true,
            data: commissionIntents
        });

    } catch (err) {
        next(err);
    }
};

// @desc    Update a commission intent
// @route   PUT /api/v1/commission-intents/:id
// @access  Private
exports.updateCommissionIntent = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            commission_date: Joi.date().optional(),
            amount: Joi.number().optional(),
            payment_method: Joi.string().optional(),
            ach_processor: Joi.string().optional(),
            funder_account: Joi.string().optional(),
            iso_account: Joi.string().optional(),
            note: Joi.string().optional(),
            status: Joi.string().optional()
        });

        const { value, error } = schema.validate({...req.body, ...req.params});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, ...data } = value;

        const commissionIntent = await CommissionIntentService.getCommissionIntentById(id);
        accessControl(req, commissionIntent, 'commission intent');

        // Check the status of the commission intent to determine if it can be modified
        if (commissionIntent.status === INTENT_STATUS.SUBMITTED || commissionIntent.status === INTENT_STATUS.SUCCEED) {
            return next(new ErrorResponse(`Commission intent cannot be modified, the status is already ${commissionIntent.status}`, 400));
        }

        if (req.portal === PORTAL_TYPES.FUNDER) {
            data.updated_by_user = req.id;
        }

        const updatedCommissionIntent = await CommissionIntentService.updateCommissionIntent(id, data, default_populate, '', true);

        if(!updatedCommissionIntent) {
            return next(new ErrorResponse('Commission intent not found', 404));
        }

        res.status(200).json({
            success: true,
            data: updatedCommissionIntent
        });
        
    } catch (err) {
        next(err);
    }
};

// @decs    Get single commission intent
// @route   GET /api/v1/commission-intents/:id
// @access  Private
exports.getCommissionIntent = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id } = value;

        const commissionIntent = await CommissionIntentService.getCommissionIntentById(id, default_populate, '', true);
        accessControl(req, commissionIntent, 'commission intent');
        
        res.status(200).json({
            success: true,
            data: commissionIntent
        });
        
    } catch (err) {
        next(err);
    }
};