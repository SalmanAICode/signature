const Joi = require('joi');

const CommissionService = require('../services/commissionService');
const CommissionIntentService = require('../services/commissionIntentService');
const FunderAccountService = require('../services/funderAccountService');
const ISOAccountService = require('../services/isoAccountService');

const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');
const { accessControl } = require('../middleware/auth');
const { PORTAL_TYPES } = require('../utils/constants');

const default_populate = [
    { path: 'commission_intent', select: 'funding commission_date amount note' },
    { path: 'created_by_user', select: 'first_name last_name email phone_mobile' },
    { path: 'updated_by_user', select: 'first_name last_name email phone_mobile' }
];

// query schema for commission
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

    dbQuery.$and.push({ commission_intent: query.id });

    if (query.payment_method) dbQuery.$and.push({ payment_method: query.payment_method });
    if (query.ach_processor) dbQuery.$and.push({ ach_processor: query.ach_processor });
    if (query.status) dbQuery.$and.push({ status: query.status });
    if (query.reconciled !== undefined) dbQuery.$and.push({ reconciled: query.reconciled });

    return dbQuery;
};

// @desc    Get all commissions
// @route   GET /api/v1/commission-intents/:id/commissions
// @access  Private/Admin
exports.getCommissions = async (req, res, next) => {
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

        const commissionIntent = await CommissionIntentService.getCommissionIntentById(query.id);
        accessControl(req, commissionIntent, 'commission intent');

        // build db query
        const dbQuery = buildDbQuery(query);

        // Handle sort
        const dbSort = Helpers.buildSort(sort, { submitted_date: -1 });

        const commissions = await CommissionService.getCommissions(
            dbQuery,
            page,
            limit,
            dbSort,
            default_populate
        );
        
        res.status(200).json({
            success: true,
            data: commissions
        });

    } catch (err) {
        next(err);
    }
};

// @desc    Create a new commission
// @route   POST /api/v1/commission-intents/:id/commissions
// @access  Private
exports.createCommission = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            submitted_date: Joi.date().optional(),
            responsed_date: Joi.date().optional(),
            amount: Joi.number().required(),
            status: Joi.string().optional(),
            funder_account: Joi.string().required(),
            iso_account: Joi.string().required(),
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

        const commissionIntent = await CommissionIntentService.getCommissionIntentById(id);
        accessControl(req, commissionIntent, 'commission intent');

        data.commission_intent = id;
        
        data.funder_account = await FunderAccountService.getFunderAccountById(data.funder_account);
        data.iso_account = await ISOAccountService.getISOAccountById(data.iso_account);
        
        if(req.portal === PORTAL_TYPES.FUNDER) {
            data.created_by_user = req.id;
        }

        const commission = await CommissionService.createCommission(data, default_populate);

        res.status(201).json({
            success: true,
            data: commission
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get commission list without pagination
// @route   GET /api/v1/commission-intents/:id/commissions/list
// @access  Private/Admin
exports.getCommissionList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            ...querySchema
        });

        const { value, error } = schema.validate({...req.query, ...req.params});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { sort, ...query } = value;

        const commissionIntent = await CommissionIntentService.getCommissionIntentById(query.id);
        accessControl(req, commissionIntent, 'commission intent');

        const dbQuery = buildDbQuery(query);

        const dbSort = Helpers.buildSort(sort, { submitted_date: -1 });

        const commissions = await CommissionService.getCommissionList(
            dbQuery,
            dbSort
        );
        
        res.status(200).json({
            success: true,
            data: commissions
        });
        
    } catch (err) {
        next(err);
    }
};

// @desc    Update a commission
// @route   PUT /api/v1/commission-intents/:id/commissions/:commissionId
// @access  Private/Admin
exports.updateCommission = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            commissionId: Joi.string().required(),
            submitted_date: Joi.date().optional(),
            responsed_date: Joi.date().optional(),
            amount: Joi.number().optional(),
            status: Joi.string().optional(),
            funder_account: Joi.string().optional(),
            iso_account: Joi.string().optional(),
            payment_method: Joi.string().optional(),
            ach_processor: Joi.string().optional(),
            transaction: Joi.string().optional(),
            reconciled: Joi.boolean().optional()
        });

        const { value, error } = schema.validate({...req.body, ...req.params});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, commissionId, ...data } = value;

        const commissionIntent = await CommissionIntentService.getCommissionIntentById(id);
        accessControl(req, commissionIntent, 'commission intent');

        if(req.portal === PORTAL_TYPES.FUNDER) {
            data.updated_by_user = req.id;
        }

        const updatedCommission = await CommissionService.updateCommission(commissionId, data, default_populate);
        
        res.status(200).json({
            success: true,
            data: updatedCommission
        });

    } catch (err) {
        next(err);
    }
};

// @desc    Get single commission
// @route   GET /api/v1/commission-intents/:id/commissions/:commissionId
// @access  Private/Admin
exports.getCommission = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            commissionId: Joi.string().required()
        });

        const { value, error } = schema.validate({...req.params});
        
        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const commissionIntent = await CommissionIntentService.getCommissionIntentById(value.id);
        accessControl(req, commissionIntent, 'commission intent');

        const commission = await CommissionService.getCommissionById(value.commissionId, default_populate);
        
        res.status(200).json({
            success: true,
            data: commission
        });

    } catch (err) {
        next(err);
    }
};

// @desc    Processed a commission
// @route   PUT /api/v1/commission-intents/:id/commissions/:commissionId/process
// @access  Private/Admin
exports.processed = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            commissionId: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const commissionIntent = await CommissionIntentService.getCommissionIntentById(value.id);
        accessControl(req, commissionIntent, 'commission intent');

        const commission = await CommissionService.processed(value.commissionId, req.id, default_populate);
        
        res.status(200).json({
            success: true,
            data: commission
        });

    } catch (err) {
        next(err);
    }
};

// @desc    Succeed a commission
// @route   PUT /api/v1/commission-intents/:id/commissions/:commissionId/succeed
// @access  Private/Admin
exports.succeed = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            commissionId: Joi.string().required()
        });

        const { value, error } = schema.validate({...req.params});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const commissionIntent = await CommissionIntentService.getCommissionIntentById(value.id);
        accessControl(req, commissionIntent, 'commission intent');

        const commission = await CommissionService.succeed(value.commissionId, req.id, default_populate);

        res.status(200).json({
            success: true,
            data: commission
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Failed a commission
// @route   PUT /api/v1/commission-intents/:id/commissions/:commissionId/failed
// @access  Private/Admin
exports.failed = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            commissionId: Joi.string().required()
        });

        const { value, error } = schema.validate({...req.params});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const commissionIntent = await CommissionIntentService.getCommissionIntentById(value.id);
        accessControl(req, commissionIntent, 'commission intent');

        const commission = await CommissionService.failed(value.commissionId, req.id, default_populate);

        res.status(200).json({
            success: true,
            data: commission
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Reconcile a commission
// @route   PUT /api/v1/commission-intents/:id/commissions/:commissionId/reconcile
// @access  Private/Admin
exports.reconcile = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            commissionId: Joi.string().required()
        });

        const { value, error } = schema.validate({...req.params});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const commissionIntent = await CommissionIntentService.getCommissionIntentById(value.id);
        accessControl(req, commissionIntent, 'commission intent');

        const commission = await CommissionService.reconcile(value.commissionId, req.id, default_populate);

        res.status(200).json({
            success: true,
            data: commission
        });
    } catch (err) {
        next(err);
    }
};