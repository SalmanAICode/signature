const Joi = require('joi');

const ParticipationService = require('../services/participationService');
const FundingService = require('../services/fundingService');
const FunderService = require('../services/funderService');
const LenderService = require('../services/lenderService');

const { PORTAL_TYPES } = require('../utils/constants');
const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');
const { accessControl } = require('../middleware/auth');

const default_populate = [
    { path: 'fee_list.fee_type', select: 'name' },
    { path: 'expense_list.expense_type', select: 'name' },
    { path: 'created_by_user', select: 'first_name last_name email phone_mobile' },
    { path: 'updated_by_user', select: 'first_name last_name email phone_mobile' }
];

// Query schema for participation
const query_schema = {
    sort: Joi.string().allow('').optional(),
    select: Joi.string().allow('').optional(),
    search: Joi.string().allow('').optional(),
    // Following query parameters are based on fields from participation model
    funding: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    funder: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    lender: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    created_by_user: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    updated_by_user: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    status: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    participate_amount_from: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    participate_amount_to: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    participate_percent_from: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    participate_percent_to: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    profit_percent_from: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    profit_percent_to: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    profit_amount_from: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    profit_amount_to: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    created_date_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    created_date_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    updated_date_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    updated_date_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    createdAt_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    createdAt_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    updatedAt_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    updatedAt_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional()
};

// Build dbQuery from query
const buildDbQuery = (req, query) => {
    const dbQuery = { $and: [] };

    // Add filter for different request portal
    // This is based on the req filters
    if (req.filter.funder) {
        dbQuery.$and.push({ 'funder.id': req.filter.funder });
    } else if (req.filter.funder_list) {
        dbQuery.$and.push({ 'funder.id': { $in: req.filter.funder_list } });
    }
    if (req.filter.lender_list) dbQuery.$and.push({ 'lender.id': { $in: req.filter.lender_list } });

    // Handle search
    if (query.search) {
        dbQuery.$and.push(Helpers.buildSearchFilter([
            'funding.name', 'funding.identifier',
            'funder.name', 'funder.email', 'funder.phone',
            'lender.name', 'lender.email', 'lender.phone',
            'created_by_user.first_name', 'created_by_user.last_name', 'created_by_user.email', 'created_by_user.phone_mobile',
            'updated_by_user.first_name', 'updated_by_user.last_name', 'updated_by_user.email', 'updated_by_user.phone_mobile',
            'status'
        ], query.search));
    }

    // Handle fields from participation model
    if (query.funding) dbQuery.$and.push(Helpers.buildArrayFilter('funding.id', query.funding, true));
    if (query.funder) dbQuery.$and.push(Helpers.buildArrayFilter('funder.id', query.funder, true));
    if (query.lender) dbQuery.$and.push(Helpers.buildArrayFilter('lender.id', query.lender, true));

    if (query.created_by_user) dbQuery.$and.push(Helpers.buildArrayFilter('created_by_user', query.created_by_user, true));
    if (query.updated_by_user) dbQuery.$and.push(Helpers.buildArrayFilter('updated_by_user', query.updated_by_user, true));

    if (query.status) dbQuery.$and.push(Helpers.buildArrayFilter('status', query.status));

    if (query.participate_amount_from) dbQuery.$and.push(Helpers.buildGTEFilter('participate_amount', query.participate_amount_from, true));
    if (query.participate_amount_to) dbQuery.$and.push(Helpers.buildLTEFilter('participate_amount', query.participate_amount_to, true));
    if (query.participate_percent_from) dbQuery.$and.push(Helpers.buildGTEFilter('participate_percent', query.participate_percent_from, true));
    if (query.participate_percent_to) dbQuery.$and.push(Helpers.buildLTEFilter('participate_percent', query.participate_percent_to, true));
    if (query.profit_percent_from) dbQuery.$and.push(Helpers.buildGTEFilter('profit_percent', query.profit_percent_from, true));
    if (query.profit_percent_to) dbQuery.$and.push(Helpers.buildLTEFilter('profit_percent', query.profit_percent_to, true));
    if (query.profit_amount_from) dbQuery.$and.push(Helpers.buildGTEFilter('profit_amount', query.profit_amount_from, true));
    if (query.profit_amount_to) dbQuery.$and.push(Helpers.buildLTEFilter('profit_amount', query.profit_amount_to, true));

    if (query.created_date_from) dbQuery.$and.push(Helpers.buildGTEFilter('createdAt', query.created_date_from));
    if (query.created_date_to) dbQuery.$and.push(Helpers.buildLTEFilter('createdAt', query.created_date_to));
    if (query.updated_date_from) dbQuery.$and.push(Helpers.buildGTEFilter('updatedAt', query.updated_date_from));
    if (query.updated_date_to) dbQuery.$and.push(Helpers.buildLTEFilter('updatedAt', query.updated_date_to));

    if (query.createdAt_from) dbQuery.$and.push(Helpers.buildGTEFilter('createdAt', query.createdAt_from));
    if (query.createdAt_to) dbQuery.$and.push(Helpers.buildLTEFilter('createdAt', query.createdAt_to));
    if (query.updatedAt_from) dbQuery.$and.push(Helpers.buildGTEFilter('updatedAt', query.updatedAt_from));
    if (query.updatedAt_to) dbQuery.$and.push(Helpers.buildLTEFilter('updatedAt', query.updatedAt_to));

    // Clear empty filters
    dbQuery.$and = dbQuery.$and.filter(filter => Object.keys(filter).length > 0);

    return dbQuery;
};

// @desc    Get all participation records
// @route   GET /api/v1/participations
// @access  Private/Admin
exports.getParticipations = async (req, res, next) => {
    try {
        const schema = Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).default(25),
            ...query_schema
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { page, limit, sort, select, ...query } = value;

        const dbQuery = buildDbQuery(req, query);

        // Handle sort
        const dbSort = Helpers.buildSort(sort, { createdAt: -1 });

        const result = await ParticipationService.getParticipations(
            dbQuery,
            dbSort,
            page,
            limit,
            default_populate,
            select
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get participation list without pagination
// @route   GET /api/v1/participations/list
// @access  Private
exports.getParticipationList = async (req, res, next) => {
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

        // Handle sort
        const dbSort = Helpers.buildSort(sort, { createdAt: -1 });

        const participations = await ParticipationService.getParticipationList(
            dbQuery,
            dbSort,
            default_populate,
            select || 'funding.name funder.name lender.name participate_amount participate_percent profit_percent status'
        );

        res.status(200).json({
            success: true,
            data: participations
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create a new participation record
// @route   POST /api/v1/participations
// @access  Private/Admin
exports.createParticipation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            funding: Joi.string().required(),
            funder: Joi.string().required(),
            lender: Joi.string().required(),
            participate_amount: Joi.number().required(),
            participate_percent: Joi.number().min(0).max(100).required(),
            profit_percent: Joi.number().min(0).max(100).required(),
            fee_list: Joi.array().items(Joi.object({
                name: Joi.string().optional(),
                fee_type: Joi.string().required(),
                amount: Joi.number().required(),
                syndication: Joi.boolean().optional()
            })).optional(),
            expense_list: Joi.array().items(Joi.object({
                name: Joi.string().optional(),
                expense_type: Joi.string().required(),
                amount: Joi.number().required(),
                syndication: Joi.boolean().optional()
            })).optional(),
            status: Joi.string().optional()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const data = value;

        // Set default arrays for fee_list and expense_list if not provided
        if (!data.fee_list) {
            data.fee_list = [];
        }
        if (!data.expense_list) {
            data.expense_list = [];
        }

        // Validate that funding, funder and lender exist
        const funding = await FundingService.getFundingById(data.funding);
        if (!funding) {
            return next(new ErrorResponse('Funding not found', 404));
        }
        accessControl(req, funding, 'funding');

        // Set default status if not provided
        if (!data.status) {
            data.status = 'PERFORMING';
        }

        if (req.portal === PORTAL_TYPES.FUNDER) {
            data.created_by_user = req.id;
        }

        accessControl(req, data);

        const participation = await ParticipationService.createParticipation(
            data, 
            default_populate, 
            ''
        );

        res.status(201).json({
            success: true,
            data: participation
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single participation
// @route   GET /api/v1/participations/:id
// @access  Private
exports.getParticipation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id } = value;

        const participation = await ParticipationService.getParticipationById(
            id, 
            default_populate, 
            ''
        );

        accessControl(req, participation, 'participation');

        res.status(200).json({
            success: true,
            data: participation
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update participation record (including status change to 'CLOSED' for deletion)
// @route   PUT /api/v1/participations/:id
// @access  Private
exports.updateParticipation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            profit_percent: Joi.number().min(0).max(1).optional(),
            profit_amount: Joi.number().optional(),
            status: Joi.string().optional()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, ...data } = value;

        const participation = await ParticipationService.getParticipationById(id);
        accessControl(req, participation, 'participation');

        if (req.portal === PORTAL_TYPES.FUNDER) {
            data.updated_by_user = req.id;
        }

        const updatedParticipation = await ParticipationService.updateParticipation(
            id, 
            data, 
            default_populate, 
            ''
        );

        res.status(200).json({
            success: true,
            data: updatedParticipation
        });
    } catch (err) {
        next(err);
    }
};


