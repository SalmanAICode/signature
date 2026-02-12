const Joi = require('joi');

const SyndicationOfferService = require('../services/syndicationOfferService');
const FundingService = require('../services/fundingService');
const SyndicationService = require('../services/syndicationService');

const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');
const { accessControl } = require('../middleware/auth');
const { PORTAL_TYPES, SYNDICATION_OFFER_STATUS } = require('../utils/constants');

const default_populate = [
    { path: 'funding', select: 'name funded_amount payback_amount commission_amount factor_rate buy_rate' },
    { path: 'funder', select: 'name email phone' },
    { path: 'syndicator', select: 'name first_name last_name email phone_mobile' },
    { path: 'lender', select: 'name email phone' },
    { path: 'created_by_user', select: 'first_name last_name email phone_mobile' },
    { path: 'updated_by_user', select: 'first_name last_name email phone_mobile' }
];

// Enhanced query schema for syndication offers based on funding controller patterns
const query_schema = {
    sort: Joi.string().allow('').optional(),
    select: Joi.string().allow('').optional(),
    search: Joi.string().allow('').optional(),
    // Following query parameters are based on fields from syndication offer model
    funding: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    funder: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    lender: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    syndicator: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    status: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    created_by_user: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    updated_by_user: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    participate_amount_from: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    participate_amount_to: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    payback_amount_from: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    payback_amount_to: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    participate_percent_from: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    participate_percent_to: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    offered_date_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    offered_date_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    expired_date_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    expired_date_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    status_date_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    status_date_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
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

    // Handle fields from syndication offer model
    if (query.funding) dbQuery.$and.push(Helpers.buildArrayFilter('funding', query.funding, true));
    if (query.funder) dbQuery.$and.push(Helpers.buildArrayFilter('funder', query.funder, true));
    if (query.lender) dbQuery.$and.push(Helpers.buildArrayFilter('lender', query.lender, true));
    if (query.syndicator) dbQuery.$and.push(Helpers.buildArrayFilter('syndicator', query.syndicator, true));

    if (query.status) dbQuery.$and.push(Helpers.buildArrayFilter('status', query.status));

    if (query.created_by_user) dbQuery.$and.push(Helpers.buildArrayFilter('created_by_user', query.created_by_user, true));
    if (query.updated_by_user) dbQuery.$and.push(Helpers.buildArrayFilter('updated_by_user', query.updated_by_user, true));

    if (query.participate_amount_from) dbQuery.$and.push(Helpers.buildGTEFilter('participate_amount', query.participate_amount_from, true));
    if (query.participate_amount_to) dbQuery.$and.push(Helpers.buildLTEFilter('participate_amount', query.participate_amount_to, true));
    if (query.payback_amount_from) dbQuery.$and.push(Helpers.buildGTEFilter('payback_amount', query.payback_amount_from, true));
    if (query.payback_amount_to) dbQuery.$and.push(Helpers.buildLTEFilter('payback_amount', query.payback_amount_to, true));
    if (query.participate_percent_from) dbQuery.$and.push(Helpers.buildGTEFilter('participate_percent', query.participate_percent_from));
    if (query.participate_percent_to) dbQuery.$and.push(Helpers.buildLTEFilter('participate_percent', query.participate_percent_to));

    if (query.offered_date_from) dbQuery.$and.push(Helpers.buildGTEFilter('offered_date', query.offered_date_from));
    if (query.offered_date_to) dbQuery.$and.push(Helpers.buildLTEFilter('offered_date', query.offered_date_to));
    if (query.expired_date_from) dbQuery.$and.push(Helpers.buildGTEFilter('expired_date', query.expired_date_from));
    if (query.expired_date_to) dbQuery.$and.push(Helpers.buildLTEFilter('expired_date', query.expired_date_to));
    if (query.status_date_from) dbQuery.$and.push(Helpers.buildGTEFilter('status_date', query.status_date_from));
    if (query.status_date_to) dbQuery.$and.push(Helpers.buildLTEFilter('status_date', query.status_date_to));

    if (!query.include_inactive) dbQuery.$and.push({ inactive: { $ne: true } });

    if (query.createdAt_from) dbQuery.$and.push(Helpers.buildGTEFilter('createdAt', query.createdAt_from));
    if (query.createdAt_to) dbQuery.$and.push(Helpers.buildLTEFilter('createdAt', query.createdAt_to));
    if (query.updatedAt_from) dbQuery.$and.push(Helpers.buildGTEFilter('updatedAt', query.updatedAt_from));
    if (query.updatedAt_to) dbQuery.$and.push(Helpers.buildLTEFilter('updatedAt', query.updatedAt_to));

    // Clear empty filters
    dbQuery.$and = dbQuery.$and.filter(filter => Object.keys(filter).length > 0);

    return dbQuery;
};

// @desc    Get all syndication offers
// @route   GET /api/v1/syndication-offers
// @access  Private/Admin
exports.getSyndicationOffers = async (req, res, next) => {
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
        const dbSort = Helpers.buildSort(sort, { offered_date: -1 });

        const result = await SyndicationOfferService.getSyndicationOffers(
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

// @desc    Create a new syndication offer
// @route   POST /api/v1/syndication-offers
// @access  Private/Admin
exports.createSyndicationOffer = async (req, res, next) => {
    try {
        const schema = Joi.object({
            funding: Joi.string().required(),
            syndicator: Joi.string().required(),
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
            offered_date: Joi.date().optional(),
            expired_date: Joi.date().optional(),
            status: Joi.string().optional(),
            created_by_user: Joi.string().optional(),
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

        if (!data.status) data.status = SYNDICATION_OFFER_STATUS.SUBMITTED;
        
        if (!data.created_by_user) {
            if (req.portal === PORTAL_TYPES.FUNDER) data.created_by_user = req.id;
        }

        accessControl(req, data);

        const syndicationOffer = await SyndicationOfferService.createSyndicationOffer(data, default_populate, '', true);

        res.status(201).json({
            success: true,
            data: syndicationOffer
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get syndication offers list without pagination
// @route   GET /api/v1/syndication-offers/list
// @access  Private
exports.getSyndicationOffersList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            ...query_schema
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { sort, select, ...query } = value;

        // Handle query
        const dbQuery = buildDbQuery(req, query);

        // Handle sort
        const dbSort = Helpers.buildSort(sort, { offered_date: -1 });

        const syndicationOffers = await SyndicationOfferService.getSyndicationOfferList(
            dbQuery,
            dbSort,
            default_populate,
            select || 'participate_percent participate_amount payback_amount status offered_date',
            true
        );

        res.status(200).json({
            success: true,
            data: syndicationOffers
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update syndication offer
// @route   PUT /api/v1/syndication-offers/:id
// @access  Private
exports.updateSyndicationOffer = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            participate_percent: Joi.number().optional(),
            participate_amount: Joi.number().optional(),
            payback_amount: Joi.number().optional(),
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
            offered_date: Joi.date().optional(),
            expired_date: Joi.date().optional(),
            status: Joi.string().optional(),
            inactive: Joi.boolean().optional(),
        });

        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, ...data } = value;

        const syndicationOffer = await SyndicationOfferService.getSyndicationOfferById(id);
        accessControl(req, syndicationOffer, 'syndication offer');

        if (req.portal === PORTAL_TYPES.FUNDER) {
            data.updated_by_user = req.id;
        }

        const updatedSyndicationOffer = await SyndicationOfferService.updateSyndicationOffer(id, data, default_populate, '', true);

        res.status(200).json({
            success: true,
            data: updatedSyndicationOffer
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single syndication offer
// @route   GET /api/v1/syndication-offers/:id
// @access  Private
exports.getSyndicationOffer = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id } = value;

        const syndicationOffer = await SyndicationOfferService.getSyndicationOfferById(id, default_populate, '', true);

        accessControl(req, syndicationOffer, 'syndication offer');

        res.status(200).json({
            success: true,
            data: syndicationOffer
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete syndication offer
// @route   DELETE /api/v1/syndication-offers/:id
// @access  Private
exports.deleteSyndicationOffer = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id } = value;

        const syndicationOffer = await SyndicationOfferService.getSyndicationOfferById(id);
        accessControl(req, syndicationOffer, 'syndication offer');

        const deletedSyndicationOffer = await SyndicationOfferService.deleteSyndicationOffer(id, default_populate, '', true);

        res.status(200).json({
            success: true,
            message: 'Syndication offer deleted successfully',
            data: deletedSyndicationOffer
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Accept a syndication offer
// @route   POST /api/v1/syndication-offers/:id/accept
// @access  Private
exports.acceptSyndicationOffer = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id } = value;

        const syndicationOffer = await SyndicationOfferService.getSyndicationOfferById(id);
        accessControl(req, syndicationOffer, 'syndication offer');
        
        await SyndicationService.generateSyndicationFromOffer(id);

        const updatedSyndicationOffer = await SyndicationOfferService.updateSyndicationOffer(id, { 
            status: SYNDICATION_OFFER_STATUS.ACCEPTED,
            status_date: Date.now(),
            updated_by_user: req.portal === PORTAL_TYPES.FUNDER ? req.id : undefined
        }, default_populate, '', true);

        res.status(200).json({
            success: true,
            message: 'Syndication offer accepted successfully',
            data: updatedSyndicationOffer
        });
    } catch (err) {
        next(err);
    }
};
