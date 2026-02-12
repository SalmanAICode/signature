const Joi = require('joi');

const FundingCreditService = require('../services/fundingCreditService');
const FundingService = require('../services/fundingService');

const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');
const { accessControl } = require('../middleware/auth');
const { PORTAL_TYPES } = require('../utils/constants');

const default_populate = [
    { path: 'funding', select: 'name' },
    { path: 'funder', select: 'name email phone' },
    { path: 'lender', select: 'name email phone' },
    { path: 'merchant', select: 'name email phone' },
    { path: 'created_by_user', select: 'first_name last_name email phone_mobile' },
    { path: 'updated_by_user', select: 'first_name last_name email phone_mobile' },
];

// Query schema for funding credit
const query_schema = {
    sort: Joi.string().optional(),
    funder: Joi.string().optional(),
    search: Joi.string().optional(),
    include_inactive: Joi.boolean().optional(),
    funding: Joi.string().optional(),
    lender: Joi.string().optional(),
    merchant: Joi.string().optional()
};

// Build dbQuery from query
const buildDbQuery = (req, query) => {
    let dbQuery = {};

    dbQuery.$and = [];
  
    const funderFilter = Helpers.buildFunderFilter(req, query.funder);
    const lenderFilter = Helpers.buildLenderFilter(req, query.lender);
    const merchantFilter = Helpers.buildMerchantFilter(req, query.merchant);

    if (funderFilter) dbQuery.$and.push({ funder: funderFilter });
    if (lenderFilter) dbQuery.$and.push({ lender: lenderFilter });
    if (merchantFilter) dbQuery.$and.push({ merchant: merchantFilter });

    if (query.search) dbQuery.$and.push({ $or: [
        { 'note': { $regex: query.search, $options: 'i' } }
    ] });

    if (!query.include_inactive) dbQuery.$and.push({ inactive: { $ne: true } });

    if (query.funding) dbQuery.funding = query.funding;

    return dbQuery;
};

// @desc    Get all funding credits
// @route   GET /api/v1/funding-credits
// @access  Private
exports.getFundingCredits = async (req, res, next) => {
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
        const dbQuery = buildDbQuery(req, query);

        // Handle sort
        const dbSort = Helpers.buildSort(sort, { credit_date: -1 });

        const fundingCredits = await FundingCreditService.getFundingCredits(dbQuery, dbSort, page, limit, default_populate);

        res.status(200).json({
            success: true,
            data: fundingCredits
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get funding credit list without pagination
// @route   GET /api/v1/funding-credits/list
// @access  Private
exports.getFundingCreditList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            ...query_schema
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const { sort, ...query } = value;

        // Handle query
        const dbQuery = buildDbQuery(req, query);

        // Handle sort
        const dbSort = Helpers.buildSort(sort, { credit_date: -1 });

        const fundingCredits = await FundingCreditService.getFundingCreditList(dbQuery, dbSort);

        res.status(200).json({
            success: true,
            data: fundingCredits
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new funding credit
// @route   POST /api/v1/funding-credits
// @access  Private
exports.createFundingCredit = async (req, res, next) => {
    try {
        const schema = Joi.object({
            funding: Joi.string().required(),
            credit_date: Joi.date().required(),
            amount: Joi.number().required(),
            note: Joi.string().optional()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const data = { ...value };

        // Handle filter
        const funding = await FundingService.getFundingById(data.funding);    
        accessControl(req, funding, 'funding');

        data.funder = Helpers.extractIdString(funding.funder);
        data.lender = Helpers.extractIdString(funding.lender);
        data.merchant = Helpers.extractIdString(funding.merchant);

        if (req.portal === PORTAL_TYPES.FUNDER) {
            data.created_by_user = req.id;
        }
        
        const fundingCredit = await FundingCreditService.createFundingCredit(data, default_populate);

        res.status(201).json({
            success: true,
            data: fundingCredit
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get a funding credit by id
// @route   GET /api/v1/funding-credits/:id
// @access  Private
exports.getFundingCredit = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const { id } = value;

        // fundingCredit check whether it is null in Service
        const fundingCredit = await FundingCreditService.getFundingCreditById(id, default_populate);
        accessControl(req, fundingCredit, 'funding credit');

        res.status(200).json({
            success: true,
            data: fundingCredit
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Update a funding credit
// @route   PUT /api/v1/funding-credits/:id
// @access  Private
exports.updateFundingCredit = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            credit_date: Joi.date().optional(),
            amount: Joi.number().optional(),
            note: Joi.string().optional(),
            inactive: Joi.boolean().optional()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const { id, ...data } = value;

        const fundingCredit = await FundingCreditService.getFundingCreditById(id);
        accessControl(req, fundingCredit, 'funding credit');

        if (req.portal === PORTAL_TYPES.FUNDER) {
            data.updated_by_user = req.id;
        }

        const updatedFundingCredit = await FundingCreditService.updateFundingCredit(id, data, default_populate);

        res.status(200).json({
            success: true,
            data: updatedFundingCredit
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a funding credit
// @route   DELETE /api/v1/funding-credits/:id
// @access  Private
exports.deleteFundingCredit = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const { id } = value;

        const fundingCredit = await FundingCreditService.getFundingCreditById(id);
        accessControl(req, fundingCredit, 'funding credit');

        const deletedFundingCredit = await FundingCreditService.deleteFundingCredit(id);

        res.status(200).json({
            success: true,
            message: 'Funding fee deleted successfully',
            data: deletedFundingCredit
        });
    } catch (error) {
        next(error);
    }
};