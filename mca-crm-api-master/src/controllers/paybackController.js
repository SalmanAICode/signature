const Joi = require('joi');

const FundingService = require('../services/fundingService');
const PaybackService = require('../services/paybackService');
const PaybackPlanService = require('../services/paybackPlanService');


const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');
const { PORTAL_TYPES, PAYBACK_STATUS } = require('../utils/constants');
const { accessControl } = require('../middleware/auth');

const default_populate = [
    { path: 'funding', select: 'name' },
    { path: 'merchant', select: 'name email phone' },
    { path: 'funder', select: 'name email phone' }
];

// query schema for paybacks
const query_schema = {
    sort: Joi.string().optional(),
    merchant: Joi.string().optional(),
    funder: Joi.string().optional(),
    lender: Joi.string().optional(),
    funding: Joi.string().optional(),
    payback_plan: Joi.string().optional(),
    search: Joi.string().optional(),
    payment_method: Joi.string().optional(),
    status: Joi.string().optional(),
    reconciled: Joi.boolean().optional()
};

// build db query for paybacks
const buildDbQuery = async (req, query) => {
    let dbQuery = {};
    dbQuery.$and = [];

    const merchantFilter = Helpers.buildMerchantFilter(req, query.merchant);
    const funderFilter = Helpers.buildFunderFilter(req, query.funder);
    const lenderFilter = Helpers.buildLenderFilter(req, query.lender);

    if (merchantFilter) dbQuery.$and.push({ merchant: merchantFilter });
    if (funderFilter) dbQuery.$and.push({ funder: funderFilter });
    if (lenderFilter) dbQuery.$and.push({ lender: lenderFilter });

    if (query.funding) {
        const funding = await FundingService.getFundingById(query.funding);
        accessControl(req, funding, 'funding');
        dbQuery.funding = query.funding;
    }

    if (query.payback_plan) {
        const paybackPlan = await PaybackPlanService.getPaybackPlanById(query.payback_plan);
        accessControl(req, paybackPlan, 'payback_plan');
        dbQuery.payback_plan = query.payback_plan;
    }

    if (query.search) {
        dbQuery.$and.push({
            $or: [
                { 'note': { $regex: query.search, $options: 'i' } },
                { 'response': { $regex: query.search, $options: 'i' } }
            ]
        });
    }

    if (query.payment_method) dbQuery.$and.push({ payment_method: query.payment_method });
    if (query.status) dbQuery.$and.push({ status: query.status });
    if (query.reconciled !== undefined) dbQuery.$and.push({ reconciled: query.reconciled });

    return dbQuery;
};

// @route   GET /api/v1/paybacks
// @desc    Get all paybacks
// @route   GET /api/v1/paybacks
// @access  Private
exports.getPaybacks = async (req, res, next) => {
    try {
        const schema = Joi.object({
            page: Joi.number().default(1).optional(),
            limit: Joi.number().default(10).optional(),
            ...query_schema
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const { page, limit, sort, ...query } = value;

        const dbQuery = await buildDbQuery(req, query);

        // Handle sort
        const dbSort = Helpers.buildSort(sort, { submitted_date: -1 });

        const paybacks = await PaybackService.getPaybacks(
            dbQuery,
            dbSort,
            page,
            limit,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: paybacks
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new payback
// @route   POST /api/v1/paybacks
// @access  Private
exports.createPayback = async (req, res, next) => {
    try {
        const schema = Joi.object({
            funding: Joi.string().required(),
            payback_plan: Joi.string().optional(),
            due_date: Joi.date().optional(),
            payback_amount: Joi.number().required(),
            status: Joi.string().optional()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const data = { ...value };

        const funding = await FundingService.getFundingById(data.funding);
        accessControl(req, funding, 'funding');

        data.funder = Helpers.extractIdString(funding.funder);
        data.lender = Helpers.extractIdString(funding.lender);
        data.merchant = Helpers.extractIdString(funding.merchant);

        if (data.payback_plan) {
            const paybackPlan = await PaybackPlanService.getPaybackPlanById(data.payback_plan);
            accessControl(req, paybackPlan, 'payback_plan');
        }


        if (!data.status) {
            data.status = PAYBACK_STATUS.SUBMITTED;
        }

        const payback = await PaybackService.createPayback(data, default_populate);

        res.status(201).json({
            success: true,
            data: payback
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get payback list without pagination
// @route   GET /api/v1/paybacks/list
// @access  Private
exports.getPaybackList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            ...query_schema
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const { sort, ...query } = value;

        const dbQuery = await buildDbQuery(req, query);

        // Handle sort
        const dbSort = Helpers.buildSort(sort, { submitted_date: -1 });

        const paybacks = await PaybackService.getPaybackList(
            dbQuery,
            dbSort
        );

        res.status(200).json({
            success: true,
            data: paybacks
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get payback by id
// @route   GET /api/v1/paybacks/:id
// @access  Private
exports.getPayback = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const { id } = value;

        const payback = await PaybackService.getPaybackById(id, default_populate);
        accessControl(req, payback, 'payback');

        res.status(200).json({
            success: true,
            data: payback
        });


    } catch (error) {
        next(error);
    }
};

// @desc    Update payback
// @route   PUT /api/v1/paybacks/:id
// @access  Private
exports.updatePayback = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            due_date: Joi.date().optional(),
            payback_amount: Joi.number().optional(),
            status: Joi.string().optional()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const { id, ...data } = value;

        const payback = await PaybackService.getPaybackById(id);
        accessControl(req, payback, 'payback');

        const updatedPayback = await PaybackService.updatePayback(id, data, default_populate);

        res.status(200).json({
            success: true,
            data: updatedPayback
        });
    } catch (error) {
        next(error);
    }
};
