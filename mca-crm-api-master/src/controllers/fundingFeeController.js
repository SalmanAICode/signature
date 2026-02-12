const Joi = require('joi');

const FundingFeeService = require('../services/fundingFeeService');
const FundingService = require('../services/fundingService');
const FeeTypeService = require('../services/feeTypeService');

const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');
const { accessControl } = require('../middleware/auth');
const { PORTAL_TYPES } = require('../utils/constants');

const default_populate = [
    { path: 'funding', select: 'name' },
    { path: 'funder', select: 'name email phone' },
    { path: 'lender', select: 'name email phone' },
    { path: 'merchant', select: 'name email phone' },
    { path: 'iso', select: 'name email phone' },
    { path: 'created_by_user', select: 'first_name last_name email phone_mobile' },
    { path: 'updated_by_user', select: 'first_name last_name email phone_mobile' },
];

// Query schema for funding fee
const query_schema = {
    sort: Joi.string().optional(),
    search: Joi.string().optional(),
    include_inactive: Joi.boolean().optional(),
    funding: Joi.string().optional(),
    funder: Joi.string().optional(),
    lender: Joi.string().optional(),
    merchant: Joi.string().optional(),
    iso: Joi.string().optional(),
    upfront: Joi.boolean().optional(),
    fee_type: Joi.string().optional()
};

// Build dbQuery from query
const buildDbQuery = (req, query) => {
    let dbQuery = {};

    dbQuery.$and = [];

    const funderFilter = Helpers.buildFunderFilter(req, query.funder);
    const lenderFilter = Helpers.buildLenderFilter(req, query.lender);
    const merchantFilter = Helpers.buildMerchantFilter(req, query.merchant);
    const isoFilter = Helpers.buildIsoFilter(req, query.iso);

    if (funderFilter) dbQuery.$and.push({ funder: funderFilter });
    if (lenderFilter) dbQuery.$and.push({ lender: lenderFilter });
    if (merchantFilter) dbQuery.$and.push({ merchant: merchantFilter });
    if (isoFilter) dbQuery.$and.push({ iso: isoFilter });

    if (query.search) dbQuery.$and.push({ $or: [
        { 'name': { $regex: query.search, $options: 'i' } },
        { 'note': { $regex: query.search, $options: 'i' } }
    ] });

    if (!query.include_inactive) dbQuery.$and.push({ inactive: { $ne: true } });

    if (query.funding) dbQuery.$and.push({ funding: query.funding });

    if (query.upfront) dbQuery.$and.push({ upfront: query.upfront });

    if (query.fee_type) dbQuery.$and.push({ fee_type: query.fee_type });

    return dbQuery;
};

// @desc    Get all funding fees
// @route   GET /api/v1/funding-fees
// @access  Private
exports.getFundingFees = async (req, res, next) => {
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
        const dbSort = Helpers.buildSort(sort, { fee_date: -1 });

        const fundingFees = await FundingFeeService.getFundingFees(dbQuery, dbSort, page, limit, default_populate);

        res.status(200).json({
            success: true,
            data: fundingFees
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get funding fee list without pagination
// @route   GET /api/v1/funding-fees/list
// @access  Private
exports.getFundingFeeList = async (req, res, next) => {
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
        const dbSort = Helpers.buildSort(sort, { fee_date: -1 });

        const fundingFees = await FundingFeeService.getFundingFeeList(dbQuery, dbSort, default_populate);

        res.status(200).json({
            success: true,
            data: fundingFees
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new funding fee
// @route   POST /api/v1/funding-fees
// @access  Private
exports.createFundingFee = async (req, res, next) => {
    try {
        const schema = Joi.object({
            funding: Joi.string().required(),
            name: Joi.string().required(),
            fee_type: Joi.string().optional(),
            amount: Joi.number().required(),
            fee_date: Joi.date().optional(),
            upfront: Joi.boolean().optional(),
            syndication: Joi.boolean().optional(),
            note: Joi.string().optional(),
            created_by_user: Joi.string().optional()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const data = { ...value };

        // Handle filter
        const funding = await FundingService.getFundingById(data.funding);
        accessControl(req, funding, 'funding');

        if (data.fee_type) {
            const feeType = await FeeTypeService.getFeeTypeById(data.fee_type);
            accessControl(req, feeType, 'fee type');
        }

        data.funder = Helpers.extractIdString(funding.funder);
        data.lender = Helpers.extractIdString(funding.lender);
        data.merchant = Helpers.extractIdString(funding.merchant);
        data.iso = Helpers.extractIdString(funding.iso_list[0]);
        data.fee_date = data.fee_date || new Date();

        if (!data.created_by_user) {
            if (req.portal === PORTAL_TYPES.FUNDER) {
                data.created_by_user = req.id;
            }
        }

        const fundingFee = await FundingFeeService.createFundingFee(data, default_populate);
        res.status(201).json({
            success: true,
            data: fundingFee
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get a funding fee by id
// @route   GET /api/v1/funding-fees/:id
// @access  Private
exports.getFundingFee = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const { id } = value;

        // fundingFee check whether it is null in Service
        const fundingFee = await FundingFeeService.getFundingFeeById(id, default_populate);
        accessControl(req, fundingFee, 'funding fee');

        res.status(200).json({
            success: true,
            data: fundingFee
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Update a funding fee
// @route   PUT /api/v1/funding-fees/:id
// @access  Private
exports.updateFundingFee = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            name: Joi.string().optional(),
            fee_type: Joi.string().optional(),
            amount: Joi.number().optional(),
            upfront: Joi.boolean().optional(),
            syndication: Joi.boolean().optional(),
            fee_date: Joi.date().optional(),
            note: Joi.string().optional(),
            inactive: Joi.boolean().optional()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const { id, ...data } = value;

        const fundingFee = await FundingFeeService.getFundingFeeById(id);
        accessControl(req, fundingFee, 'funding fee');

        if (data.fee_type) {
            const feeType = await FeeTypeService.getFeeTypeById(data.fee_type);
            accessControl(req, feeType, 'fee type');
        }

        if (req.portal === PORTAL_TYPES.FUNDER) {
            data.updated_by_user = req.id;
        }

        const updatedFundingFee = await FundingFeeService.updateFundingFee(id, data, default_populate);

        res.status(200).json({
            success: true,
            data: updatedFundingFee
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a funding fee
// @route   DELETE /api/v1/funding-fees/:id
// @access  Private
exports.deleteFundingFee = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const { id } = value;

        const fundingFee = await FundingFeeService.getFundingFeeById(id);
        accessControl(req, fundingFee, 'funding fee');

        await FundingFeeService.deleteFundingFee(id, default_populate);

        res.status(200).json({
            success: true,
            message: 'Funding fee deleted successfully',
            data: fundingFee
        });
    } catch (error) {
        next(error);
    }
};