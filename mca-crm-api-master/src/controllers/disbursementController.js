const Joi = require('joi');

const DisbursementService = require('../services/disbursementService');
const DisbursementIntentService = require('../services/disbursementIntentService');
const FunderAccountService = require('../services/funderAccountService');
const MerchantAccountService = require('../services/merchantAccountService');

const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');
const { accessControl } = require('../middleware/auth');
const { PORTAL_TYPES } = require('../utils/constants');

const default_populate = [
    { path: 'disbursement_intent', select: 'funding disbursement_date amount note' },
    { path: 'created_by_user', select: 'first_name last_name email phone_mobile' },
    { path: 'updated_by_user', select: 'first_name last_name email phone_mobile' }
];

// query schema for disbursement
const querySchema = {
    id: Joi.string().required(),
    sort: Joi.string().optional(),
    payment_method: Joi.string().optional(),
    ach_processor: Joi.string().optional(),
    status: Joi.string().optional(),
    reconciled: Joi.boolean().optional()
};

// build db query from query schema
const buildDbQuery = (query) => {
    const dbQuery = {};

    dbQuery.$and = [];

    dbQuery.$and.push({ disbursement_intent: query.id });

    if (query.payment_method) dbQuery.$and.push({ payment_method: query.payment_method });
    if (query.ach_processor) dbQuery.$and.push({ ach_processor: query.ach_processor });
    if (query.status) dbQuery.$and.push({ status: query.status });
    if (query.reconciled !== undefined) dbQuery.$and.push({ reconciled: query.reconciled });

    return dbQuery;
};

// @desc    Get all disbursements
// @route   GET /api/v1/disbursement-intents/:id/disbursements
// @access  Private/Admin
exports.getDisbursements = async (req, res, next) => {
    try {
        const schema = Joi.object({
            page: Joi.number().default(1).optional(),
            limit: Joi.number().default(10).optional(),
            ...querySchema
        });

        const { value, error } = schema.validate({...req.params, ...req.query});
        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { page, limit, sort, ...query } = value;

        const disbursementIntent = await DisbursementIntentService.getDisbursementIntentById(query.id);
        accessControl(req, disbursementIntent, 'disbursement intent');

        // build db query
        const dbQuery = buildDbQuery(query);

        // Handle sort
        const dbSort = Helpers.buildSort(sort, { submitted_date: -1 });

        const disbursements = await DisbursementService.getDisbursements(
            dbQuery,
            page,
            limit,
            dbSort,
            default_populate
        );
        
        res.status(200).json({
            success: true,
            data: disbursements
        });

    } catch (err) {
        next(err);
    }
};

// @desc    Create a new disbursement
// @route   POST /api/v1/disbursement-intents/:id/disbursements
// @access  Private
exports.createDisbursement = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            submitted_date: Joi.date().optional(),
            responsed_date: Joi.date().optional(),
            amount: Joi.number().required(),
            status: Joi.string().optional(),
            funder_account: Joi.string().required(),
            merchant_account: Joi.string().required(),
            payment_method: Joi.string().optional(),
            ach_processor: Joi.string().optional(),
            transaction: Joi.string().optional(),
            reconciled: Joi.boolean().optional()
        });

        const { value, error } = schema.validate({...req.body, ...req.params});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, ...data } = value;

        const disbursementIntent = await DisbursementIntentService.getDisbursementIntentById(id);
        accessControl(req, disbursementIntent, 'disbursement intent');

        data.disbursement_intent = id;
        
        data.funder_account = await FunderAccountService.getFunderAccountById(data.funder_account);
        data.merchant_account = await MerchantAccountService.getMerchantAccountById(data.merchant_account);

        if(req.portal === PORTAL_TYPES.FUNDER) {
            data.created_by_user = req.id;
        }

        const disbursement = await DisbursementService.createDisbursement(data, default_populate);

        res.status(201).json({
            success: true,
            data: disbursement
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get disbursement list without pagination
// @route   GET /api/v1/disbursement-intents/:id/disbursements/list
// @access  Private/Admin
exports.getDisbursementList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            ...querySchema
        });

        const { value, error } = schema.validate({...req.query, ...req.params});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { sort, ...query } = value;

        const disbursementIntent = await DisbursementIntentService.getDisbursementIntentById(query.id);
        accessControl(req, disbursementIntent, 'disbursement intent');

        const dbQuery = buildDbQuery(query);

        const dbSort = Helpers.buildSort(sort, { submitted_date: -1 });

        const disbursements = await DisbursementService.getDisbursementList(dbQuery, dbSort);
        
        res.status(200).json({
            success: true,
            data: disbursements
        });
        
    } catch (err) {
        next(err);
    }
};

// @desc    Update a disbursement
// @route   PUT /api/v1/disbursement-intents/:id/disbursements/:disbursementId
// @access  Private/Admin
exports.updateDisbursement = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            disbursementId: Joi.string().required(),
            submitted_date: Joi.date().optional(),
            responsed_date: Joi.date().optional(),
            amount: Joi.number().optional(),
            status: Joi.string().optional(),
            funder_account: Joi.string().optional(),
            merchant_account: Joi.string().optional(),
            payment_method: Joi.string().optional(),
            ach_processor: Joi.string().optional(),
            transaction: Joi.string().optional(),
            reconciled: Joi.boolean().optional()
        });

        const { value, error } = schema.validate({...req.body, ...req.params});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, disbursementId, ...data } = value;

        const disbursementIntent = await DisbursementIntentService.getDisbursementIntentById(id);
        accessControl(req, disbursementIntent, 'disbursement intent');

        if(req.portal === PORTAL_TYPES.FUNDER) {
            data.updated_by_user = req.id;
        }

        const updatedDisbursement = await DisbursementService.updateDisbursement(disbursementId, data, default_populate);
        
        res.status(200).json({
            success: true,
            data: updatedDisbursement
        });

    } catch (err) {
        next(err);
    }
};

// @desc    Get single disbursement
// @route   GET /api/v1/disbursement-intents/:id/disbursements/:disbursementId
// @access  Private/Admin
exports.getDisbursement = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            disbursementId: Joi.string().required()
        });

        const { value, error } = schema.validate({...req.params});
        
        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, disbursementId } = value;

        const disbursementIntent = await DisbursementIntentService.getDisbursementIntentById(id);
        accessControl(req, disbursementIntent, 'disbursement intent');

        const disbursement = await DisbursementService.getDisbursementById(disbursementId, default_populate);
        
        res.status(200).json({
            success: true,
            data: disbursement
        });

    } catch (err) {
        next(err);
    }
};

// @desc    Process a disbursement
// @route   PUT /api/v1/disbursement-intents/:id/disbursements/:disbursementId/processed
// @access  Private/Admin
exports.processed = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            disbursementId: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, disbursementId } = value;

        const disbursementIntent = await DisbursementIntentService.getDisbursementIntentById(id);
        accessControl(req, disbursementIntent, 'disbursement intent');

        const disbursement = await DisbursementService.processed(disbursementId, req.id, default_populate);
        
        res.status(200).json({
            success: true,
            data: disbursement
        });

    } catch (err) {
        next(err);
    }
};

// @desc    Succeed a disbursement
// @route   PUT /api/v1/disbursement-intents/:id/disbursements/:disbursementId/succeed
// @access  Private/Admin
exports.succeed = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            disbursementId: Joi.string().required()
        });

        const { value, error } = schema.validate({...req.params});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, disbursementId } = value;

        const disbursementIntent = await DisbursementIntentService.getDisbursementIntentById(id);
        accessControl(req, disbursementIntent, 'disbursement intent');

        const disbursement = await DisbursementService.succeed(disbursementId, req.id, default_populate);

        res.status(200).json({
            success: true,
            data: disbursement
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Failed a disbursement
// @route   PUT /api/v1/disbursement-intents/:id/disbursements/:disbursementId/failed
// @access  Private/Admin
exports.failed = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            disbursementId: Joi.string().required()
        });

        const { value, error } = schema.validate({...req.params});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, disbursementId } = value;

        const disbursementIntent = await DisbursementIntentService.getDisbursementIntentById(id);
        accessControl(req, disbursementIntent, 'disbursement intent');

        const disbursement = await DisbursementService.failed(disbursementId, req.id, default_populate);

        res.status(200).json({
            success: true,
            data: disbursement
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Reconcile a disbursement
// @route   PUT /api/v1/disbursement-intents/:id/disbursements/:disbursementId/reconcile
// @access  Private/Admin
exports.reconcile = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            disbursementId: Joi.string().required()
        });

        const { value, error } = schema.validate({...req.params});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, disbursementId } = value;

        const disbursementIntent = await DisbursementIntentService.getDisbursementIntentById(id);
        accessControl(req, disbursementIntent, 'disbursement intent');

        const disbursement = await DisbursementService.reconcile(disbursementId, req.id, default_populate);

        res.status(200).json({
            success: true,
            data: disbursement
        });
    } catch (err) {
        next(err);
    }
};