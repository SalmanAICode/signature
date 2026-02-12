const Joi = require('joi');

const PayoutService = require('../services/payoutService');
const PaybackService = require('../services/paybackService');
const FundingService = require('../services/fundingService');
const SyndicationService = require('../services/syndicationService');
const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');
const { accessControl } = require('../middleware/auth');

const { PORTAL_TYPES } = require('../utils/constants');

const default_populate = [
    { path: 'funder', select: 'name email phone' },
    { path: 'syndicator', select: 'name first_name last_name email phone_mobile' },
    { path: 'funding', select: 'name' },
    { path: 'payback', select: 'amount status note' },
    { path: 'syndication', select: 'status' }
];

// query schema for payout
const query_schema = {
    sort: Joi.string().optional(),
    funder: Joi.string().optional(),
    lender: Joi.string().optional(),
    syndicator: Joi.string().optional(),
    funding: Joi.string().optional(),
    syndication: Joi.string().optional(),
    payback: Joi.string().optional(),
    pending: Joi.boolean().optional(),
    include_inactive: Joi.boolean().optional()
};

// Build db query for payout
const buildDbQuery = async (req, query) => {
    const dbQuery = {};
  
    dbQuery.$and = [];

    const funderQuery = await Helpers.buildFunderFilter(req, query.funder);
    const lenderQuery = await Helpers.buildLenderFilter(req, query.lender);
    const syndicatorQuery = await Helpers.buildSyndicatorFilter(req, query.syndicator);

    if (funderQuery) dbQuery.$and.push({ funder: funderQuery });
    if (lenderQuery) dbQuery.$and.push({ lender: lenderQuery });
    if (syndicatorQuery) dbQuery.$and.push({ syndicator: syndicatorQuery });

    if (query.funding) {
        const funding = await FundingService.getFundingById(query.funding);
        accessControl(req, funding, 'funding');
        dbQuery.$and.push({ funding: query.funding });
    }

    if (query.syndication) {
        const syndication = await SyndicationService.getSyndicationById(query.syndication);
        accessControl(req, syndication, 'syndication');
        dbQuery.$and.push({ syndication: query.syndication });
    }

    if (query.payback) {
        const payback = await PaybackService.getPaybackById(query.payback);
        accessControl(req, payback, 'payback');
        dbQuery.$and.push({ payback: query.payback });
    }

    if (query.pending !== undefined) {
        dbQuery.$and.push({ pending: query.pending });
    }

    if (!query.include_inactive) {
        dbQuery.$and.push({ inactive: { $ne: true } });
    }

    return dbQuery;
};

// @desc    Get all payouts
// @route   GET /api/v1/payouts
// @access  Private
exports.getPayouts = async (req, res, next) => {
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
        
        // Handle query
        const dbQuery = await buildDbQuery(req, query);

        // Handle sort
        const dbSort = Helpers.buildSort(sort, { created_date: -1 });

        const payouts = await PayoutService.getPayouts(
            dbQuery,
            dbSort,
            page,
            limit,
            default_populate,
            ''
        );
        res.status(200).json({
            success: true,
            data: payouts
        });
        
    } catch (err) {
        next(err);
    }
};

// @desc    Create a new payout
// @route   POST /api/v1/payouts
// @access  Private
exports.createPayout = async (req, res, next) => {
    try {
        const schema = Joi.object({
            payback: Joi.string().required(),
            syndication: Joi.string().required(),
            payout_amount: Joi.number().required(),
            fee_amount: Joi.number().optional(),
            credit_amount: Joi.number().optional(),
            created_date: Joi.date().optional(),
            created_by_user: Joi.string().optional(),
            redeemed_date: Joi.date().optional(),
            pending: Joi.boolean().optional()
        });

        const { value, error } = schema.validate(req.body);
        
        if (error) {
            throw new ErrorResponse(error.message, 400);
        }
        
        const data = {...value};

        const payback = await PaybackService.getPaybackById(data.payback);
        accessControl(req, payback, 'payback');

        const syndication = await SyndicationService.getSyndicationById(data.syndication, [], '', true);
        accessControl(req, syndication, 'syndication');

        data.funding = Helpers.extractIdString(payback.funding);
        data.funder = Helpers.extractIdString(syndication.funder);
        data.lender = Helpers.extractIdString(payback.lender);
        data.syndicator = Helpers.extractIdString(syndication.syndicator);

        if (!data.created_date) {
            data.created_date = new Date();
        }

        if (!data.created_by_user && req.portal === PORTAL_TYPES.FUNDER) {
            data.created_by_user = req.id;
        }

        const payout = await PayoutService.createPayout(data, default_populate);
        res.status(201).json({
            success: true,
            data: payout
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get payout list without pagination
// @route   GET /api/v1/payouts/list
// @access  Private
exports.getPayoutList = async (req, res, next) => {
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

        const dbSort = Helpers.buildSort(sort, { created_date: -1 });

        const payouts = await PayoutService.getPayoutList(
            dbQuery,
            dbSort,
            default_populate,
            ''
        );
        res.status(200).json({
            success: true,
            data: payouts
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single payout
// @route   GET /api/v1/payouts/:id
// @access  Private
exports.getPayout = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);
        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const { id } = value;

        const payout = await PayoutService.getPayoutById(id, default_populate);

        accessControl(req, payout, 'payout');

        res.status(200).json({
            success: true,
            data: payout
        });


    } catch (err) {
        next(err);
    }
};

// @desc    Update a payout
// @route   PUT /api/v1/payouts/:id
// @access  Private
exports.updatePayout = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            redeemed_date: Joi.date().optional(),
            pending: Joi.boolean().optional(),
            inactive: Joi.boolean().optional()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.body });
        
        if (error) {
            throw new ErrorResponse(error.message, 400);
        }
        
        const { id, ...data } = value;

        const payout = await PayoutService.getPayoutById(id);
        accessControl(req, payout, 'payout');

        const updatedPayout = await PayoutService.updatePayout(id, data, default_populate);
        
        res.status(200).json({
            success: true,
            data: updatedPayout
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete a payout
// @route   DELETE /api/v1/payouts/:id
// @access  Private
exports.deletePayout = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);
        
        if (error) {
            throw new ErrorResponse(error.message, 400);
        }
        
        const { id } = value;
        
        const payout = await PayoutService.getPayoutById(id);
        accessControl(req, payout, 'payout');

        const deletedPayout = await PayoutService.deletePayout(id);

        res.status(200).json({
            success: true,
            message: 'Payout deleted successfully',
            data: deletedPayout
        });
    } catch (err) {
        next(err);
    }
};