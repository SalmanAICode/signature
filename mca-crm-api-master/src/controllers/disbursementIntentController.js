const Joi = require('joi');

const DisbursementIntentService = require('../services/disbursementIntentService');
const FundingService = require('../services/fundingService');
const FunderAccountService = require('../services/funderAccountService');

const ErrorResponse = require('../utils/errorResponse');

const { accessControl } = require('../middleware/auth');
const Helpers = require('../utils/helpers');
const { INTENT_STATUS, PORTAL_TYPES } = require('../utils/constants');

const default_populate = [
    { path: 'funding', select: 'name' },
    { path: 'funder_account', select: 'name bank_name routing_number account_number account_type' },
    { path: 'merchant_account', select: 'name bank_name routing_number account_number account_type' },
    { path: 'created_by_user', select: 'first_name last_name email phone_mobile' },
    { path: 'updated_by_user', select: 'first_name last_name email phone_mobile' },
];

// query schema for disbursement intent
const querySchema = {
    sort: Joi.string().optional(),
    search: Joi.string().optional(),
    funding: Joi.string().optional(),
    funder: Joi.string().optional(),
    lender: Joi.string().optional(),
    merchant: Joi.string().optional(),
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
    const merchantFilter = Helpers.buildMerchantFilter(req, query.merchant);
    
    if (funderFilter) dbQuery.$and.push({ 'funder.id': funderFilter });
    if (lenderFilter) dbQuery.$and.push({ 'lender.id': lenderFilter });
    if (merchantFilter) dbQuery.$and.push({ 'merchant.id': merchantFilter });

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
            { 'merchant.name': { $regex: query.search, $options: 'i' } },
            { 'merchant.email': { $regex: query.search, $options: 'i' } },
            { 'merchant.phone': { $regex: query.search, $options: 'i' } },
            { 'note': { $regex: query.search, $options: 'i' } }
        ];
    }

    return dbQuery;
};

// @desc    Get all disbursement intents
// @route   GET /api/v1/disbursement-intents
// @access  Private
exports.getDisbursementIntents = async (req, res, next) => {
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
        const dbSort = Helpers.buildSort(sort, { disbursement_date: -1 });
        
        const disbursementIntents = await DisbursementIntentService.getDisbursementIntents(
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
            data: disbursementIntents
        });

    } catch (err) {
        next(err);
    }
};

// @desc    Create a new disbursement intent
// @route   POST /api/v1/disbursement-intents
// @access  Private
exports.createDisbursementIntent = async (req, res, next) => {
    try {
        const schema = Joi.object({
            funding: Joi.string().required(),
            disbursement_date: Joi.date().required(),
            amount: Joi.number().required(),
            payment_method: Joi.string().optional(),
            ach_processor: Joi.string().optional(),
            funder_account: Joi.string().required(),
            merchant_account: Joi.string().required(),
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

        data.funder = Helpers.extractIdString(funding.funder);
        data.lender = Helpers.extractIdString(funding.lender);
        data.merchant = Helpers.extractIdString(funding.merchant);

        if (req.portal === PORTAL_TYPES.FUNDER) {
            data.created_by_user = req.id;
        }

        const disbursementIntent = await DisbursementIntentService.createDisbursementIntent(data, default_populate, '', true);

        res.status(201).json({
            success: true,
            data: disbursementIntent
        });
        
    } catch (err) {
        next(err);
    }
};

// @desc    Get disbursement intents list without pagination
// @route   GET /api/v1/disbursement-intents/list
// @access  Private
exports.getDisbursementIntentList = async (req, res, next) => {
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

        const dbSort = Helpers.buildSort(sort, { disbursement_date: -1 });

        const disbursementIntents = await DisbursementIntentService.getDisbursementIntentList(dbQuery, dbSort);

        res.status(200).json({
            success: true,
            data: disbursementIntents
        });

    } catch (err) {
        next(err);
    }
};

// @desc    Update a disbursement intent
// @route   PUT /api/v1/disbursement-intents/:id
// @access  Private
exports.updateDisbursementIntent = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            disbursement_date: Joi.date().optional(),
            amount: Joi.number().optional(),
            payment_method: Joi.string().optional(),
            ach_processor: Joi.string().optional(),
            funder_account: Joi.string().optional(),
            merchant_account: Joi.string().optional(),
            note: Joi.string().optional(),
            status: Joi.string().optional()
        });

        const { value, error } = schema.validate({...req.body, ...req.params});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, ...data } = value;

        const disbursementIntent = await DisbursementIntentService.getDisbursementIntentById(id);
        accessControl(req, disbursementIntent, 'disbursement intent');

        // Check the status of the disbursement intent to determine if it can be modified
        if (disbursementIntent.status === INTENT_STATUS.SUBMITTED || disbursementIntent.status === INTENT_STATUS.SUCCEED) {
            return next(new ErrorResponse(`Disbursement intent cannot be modified, the status is already ${disbursementIntent.status}`, 400));
        }

        if (req.portal === PORTAL_TYPES.FUNDER) {
            data.updated_by_user = req.id;
        }

        const updatedDisbursementIntent = await DisbursementIntentService.updateDisbursementIntent(id, data, default_populate, '', true);

        if(!updatedDisbursementIntent) {
            return next(new ErrorResponse('Disbursement intent not found', 404));
        }

        res.status(200).json({
            success: true,
            data: updatedDisbursementIntent
        });
        
    } catch (err) {
        next(err);
    }
};

// @decs    Get single disbursement intent
// @route   GET /api/v1/disbursement-intents/:id
// @access  Private
exports.getDisbursementIntent = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id } = value;

        const disbursementIntent = await DisbursementIntentService.getDisbursementIntentById(id, default_populate, '', true);
        accessControl(req, disbursementIntent, 'disbursement intent');
        
        res.status(200).json({
            success: true,
            data: disbursementIntent
        });
        
    } catch (err) {
        next(err);
    }
};