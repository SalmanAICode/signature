const Joi = require('joi');

const SyndicationService = require('../services/syndicationService');
const FundingService = require('../services/fundingService');

const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');
const { accessControl } = require('../middleware/auth');
const { PORTAL_TYPES, SYNDICATION_STATUS } = require('../utils/constants');

const default_populate = [
    { path: 'funding', select: 'name funded_amount payback_amount commission_amount factor_rate buy_rate' },
    { path: 'funder', select: 'name email phone' },
    { path: 'lender', select: 'name email phone' },
    { path: 'syndicator', select: 'name first_name last_name email phone_mobile' },
    { path: 'syndication_offer', select: 'offered_date expired_date status' },
    { path: 'transaction', select: 'amount transaction_date type status' },
    { path: 'created_by_user', select: 'first_name last_name email phone_mobile' },
    { path: 'updated_by_user', select: 'first_name last_name email phone_mobile' }
];

// Enhanced query schema for syndications based on funding controller patterns
const query_schema = {
    sort: Joi.string().allow('').optional(),
    select: Joi.string().allow('').optional(),
    search: Joi.string().allow('').optional(),
    // Following query parameters are based on fields from syndication model
    funding: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    funder: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    lender: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    syndicator: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    syndication_offer: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    status: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    created_by_user: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    updated_by_user: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    participate_amount_from: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    participate_amount_to: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    payback_amount_from: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    payback_amount_to: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    participate_percent_from: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    participate_percent_to: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    start_date_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    start_date_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    end_date_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    end_date_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    include_inactive: Joi.boolean().default(false).optional(),
    createdAt_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    createdAt_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    updatedAt_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    updatedAt_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional()
};

// Enhanced buildDbQuery function based on funding controller patterns
const buildDbQuery = (req, query) => {
    const dbQuery = { $and: [] };

    // Add filter for different request portal based on req filters
    if (req.filter.funder) {
        dbQuery.$and.push({ funder: req.filter.funder });
    } else if (req.filter.funder_list) {
        dbQuery.$and.push({ funder: { $in: req.filter.funder_list } });
    }
    if (req.filter.lender_list) dbQuery.$and.push({ lender: { $in: req.filter.lender_list } });
    if (req.filter.syndicator_list) dbQuery.$and.push({ syndicator: { $in: req.filter.syndicator_list } });

    // Handle search
    if (query.search) {
        dbQuery.$and.push(Helpers.buildSearchFilter([
            'funding.name',
            'funder.name', 'funder.email', 'funder.phone',
            'lender.name', 'lender.email', 'lender.phone',
            'syndicator.name', 'syndicator.first_name', 'syndicator.last_name', 'syndicator.email', 'syndicator.phone_mobile',
            'created_by_user.first_name', 'created_by_user.last_name', 'created_by_user.email', 'created_by_user.phone_mobile',
            'updated_by_user.first_name', 'updated_by_user.last_name', 'updated_by_user.email', 'updated_by_user.phone_mobile',
            'status'
        ], query.search));
    }

    // Handle fields from syndication model
    if (query.funding) dbQuery.$and.push(Helpers.buildArrayFilter('funding', query.funding, true));
    if (query.funder) dbQuery.$and.push(Helpers.buildArrayFilter('funder', query.funder, true));
    if (query.lender) dbQuery.$and.push(Helpers.buildArrayFilter('lender', query.lender, true));
    if (query.syndicator) dbQuery.$and.push(Helpers.buildArrayFilter('syndicator', query.syndicator, true));
    if (query.syndication_offer) dbQuery.$and.push(Helpers.buildArrayFilter('syndication_offer', query.syndication_offer, true));
    
    if (query.status) dbQuery.$and.push(Helpers.buildArrayFilter('status', query.status));

    if (query.created_by_user) dbQuery.$and.push(Helpers.buildArrayFilter('created_by_user', query.created_by_user, true));
    if (query.updated_by_user) dbQuery.$and.push(Helpers.buildArrayFilter('updated_by_user', query.updated_by_user, true));

    if (query.participate_amount_from) dbQuery.$and.push(Helpers.buildGTEFilter('participate_amount', query.participate_amount_from, true));
    if (query.participate_amount_to) dbQuery.$and.push(Helpers.buildLTEFilter('participate_amount', query.participate_amount_to, true));
    if (query.payback_amount_from) dbQuery.$and.push(Helpers.buildGTEFilter('payback_amount', query.payback_amount_from, true));
    if (query.payback_amount_to) dbQuery.$and.push(Helpers.buildLTEFilter('payback_amount', query.payback_amount_to, true));
    if (query.participate_percent_from) dbQuery.$and.push(Helpers.buildGTEFilter('participate_percent', query.participate_percent_from));
    if (query.participate_percent_to) dbQuery.$and.push(Helpers.buildLTEFilter('participate_percent', query.participate_percent_to));

    if (query.start_date_from) dbQuery.$and.push(Helpers.buildGTEFilter('start_date', query.start_date_from));
    if (query.start_date_to) dbQuery.$and.push(Helpers.buildLTEFilter('start_date', query.start_date_to));
    if (query.end_date_from) dbQuery.$and.push(Helpers.buildGTEFilter('end_date', query.end_date_from));
    if (query.end_date_to) dbQuery.$and.push(Helpers.buildLTEFilter('end_date', query.end_date_to));

    if (query.created_date_from) dbQuery.$and.push(Helpers.buildGTEFilter('createdAt', query.created_date_from));
    if (query.created_date_to) dbQuery.$and.push(Helpers.buildLTEFilter('createdAt', query.created_date_to));
    if (query.updated_date_from) dbQuery.$and.push(Helpers.buildGTEFilter('updatedAt', query.updated_date_from));
    if (query.updated_date_to) dbQuery.$and.push(Helpers.buildLTEFilter('updatedAt', query.updated_date_to));

    if (!query.include_inactive) dbQuery.$and.push({ status: { $ne: SYNDICATION_STATUS.CLOSED } });

    if (query.createdAt_from) dbQuery.$and.push(Helpers.buildGTEFilter('createdAt', query.createdAt_from));
    if (query.createdAt_to) dbQuery.$and.push(Helpers.buildLTEFilter('createdAt', query.createdAt_to));
    if (query.updatedAt_from) dbQuery.$and.push(Helpers.buildGTEFilter('updatedAt', query.updatedAt_from));
    if (query.updatedAt_to) dbQuery.$and.push(Helpers.buildLTEFilter('updatedAt', query.updatedAt_to));

    // Clear empty filters
    dbQuery.$and = dbQuery.$and.filter(filter => Object.keys(filter).length > 0);

    return dbQuery;
};

// @desc    Get all syndications
// @route   GET /api/v1/syndications
// @access  Private/Admin
exports.getSyndications = async (req, res, next) => {
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
        const dbSort = Helpers.buildSort(sort, { start_date: -1 });

        const result = await SyndicationService.getSyndications(
            dbQuery,
            dbSort,
            page,
            limit,
            default_populate,
            select,
            true
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get syndication list without pagination
// @route   GET /api/v1/syndications/list
// @access  Private
exports.getSyndicationList = async (req, res, next) => {
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
        const dbSort = Helpers.buildSort(sort, { start_date: -1 });

        const syndications = await SyndicationService.getSyndicationList(
            dbQuery,
            dbSort,
            default_populate,
            select || 'participate_percent participate_amount payback_amount status start_date total_fee_amount total_credit_amount upfront_fee_amount upfront_credit_amount recurring_fee_amount recurring_credit_amount fee_list credit_list',
            true
        );

        res.status(200).json({
            success: true,
            data: syndications
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create a new syndication
// @route   POST /api/v1/syndications
// @access  Private/Admin
exports.createSyndication = async (req, res, next) => {
    try {
        const schema = Joi.object({
            funding: Joi.string().required(),
            syndicator: Joi.string().required(),
            syndication_offer: Joi.string().allow(null).optional(),
            participate_percent: Joi.number().required(),
            participate_amount: Joi.number().required(),
            payback_amount: Joi.number().required(),
            fee_list: Joi.array().items(Joi.object({
                name: Joi.string().optional().allow(null),
                expense_type: Joi.string().optional().allow(null),
                amount: Joi.number().required(),
                upfront: Joi.boolean().optional(),
                syndication: Joi.boolean().optional(),
            })).optional(),
            credit_list: Joi.array().items(Joi.object({
                name: Joi.string().optional().allow(null),
                fee_type: Joi.string().optional().allow(null),
                amount: Joi.number().required(),
                upfront: Joi.boolean().optional(),
                syndication: Joi.boolean().optional(),
            })).optional(),
            start_date: Joi.date().optional(),
            end_date: Joi.date().optional(),
            status: Joi.string().optional(),
            created_by_user: Joi.string().optional()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const data = { ...value };

        const funding = await FundingService.getFundingById(data.funding);
        accessControl(req, funding, 'funding');

        data.funder = Helpers.extractIdString(funding.funder);
        data.lender = Helpers.extractIdString(funding.lender);

        if (!data.start_date) data.start_date = Date.now();
        if (!data.status) data.status = SYNDICATION_STATUS.ACTIVE;

        if (!data.created_by_user) {
            if (req.portal === PORTAL_TYPES.FUNDER) data.created_by_user = req.id;
        }

        accessControl(req, data);

        const syndication = await SyndicationService.createSyndication(data, default_populate, '', true);

        res.status(201).json({
            success: true,
            data: syndication
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single syndication
// @route   GET /api/v1/syndications/:id
// @access  Private
exports.getSyndication = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id } = value;

        const syndication = await SyndicationService.getSyndicationById(id, default_populate, '', true);

        accessControl(req, syndication, 'syndication');

        res.status(200).json({
            success: true,
            data: syndication
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get payout schedule with status for a syndication
// @route   GET /api/v1/syndications/:id/payout-schedule
// @access  Private
exports.getSyndicationPayoutSchedule = async (req, res, next) => {
    try {
        const paramsSchema = Joi.object({
            id: Joi.string().required()
        });

        const querySchema = Joi.object({
            group_by_plan: Joi.string().valid('true', 'false').optional()
        });

        const { value: params, error: paramsError } = paramsSchema.validate(req.params);
        const { value: query, error: queryError } = querySchema.validate(req.query);

        if (paramsError) {
            return next(new ErrorResponse(paramsError.message, 400));
        }
        if (queryError) {
            return next(new ErrorResponse(queryError.message, 400));
        }

        const { id } = params;
        const { group_by_plan } = query;

        // Get syndication first to check authorization
        const syndication = await SyndicationService.getSyndicationById(id);
        
        // Authorization: Only funder or the syndicator who owns this syndication can view
        // For syndicator portal, verify they own this syndication
        if (req.portal === PORTAL_TYPES.SYNDICATOR) {
            const syndicatorId = Helpers.extractIdString(syndication.syndicator);
            if (syndicatorId !== req.id) {
                return next(new ErrorResponse('Not authorized to view this syndication payout schedule', 403));
            }
        } else {
            // For funder portal, use standard access control
            accessControl(req, syndication, 'syndication');
        }

        // Get payout schedule
        let data;
        if (group_by_plan === 'true') {
            data = await SyndicationService.getPayoutScheduleByPaybackPlan(id);
        } else {
            data = await SyndicationService.getPayoutScheduleWithStatus(id);
        }

        res.status(200).json({
            success: true,
            data: data
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update syndication
// @route   PUT /api/v1/syndications/:id
// @access  Private
exports.updateSyndication = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            end_date: Joi.date().optional(),
            status: Joi.string().optional(),
            inactive: Joi.boolean().optional()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, ...data } = value;

        const syndication = await SyndicationService.getSyndicationById(id);
        accessControl(req, syndication, 'syndication');

        if (req.portal === PORTAL_TYPES.FUNDER) {
            data.updated_by_user = req.id;
        }

        const updatedSyndication = await SyndicationService.updateSyndication(id, data, default_populate, '', true);

        res.status(200).json({
            success: true,
            data: updatedSyndication
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete syndication
// @route   DELETE /api/v1/syndications/:id
// @access  Private
exports.deleteSyndication = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id } = value;

        const syndication = await SyndicationService.getSyndicationById(id);
        accessControl(req, syndication, 'syndication');

        const deletedSyndication = await SyndicationService.deleteSyndication(id, default_populate, '', true);

        res.status(200).json({
            success: true,
            message: 'Syndication deleted successfully',
            data: deletedSyndication
        });
    } catch (err) {
        next(err);
    }
};