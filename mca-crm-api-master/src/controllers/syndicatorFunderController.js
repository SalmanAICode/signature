const Joi = require('joi');

const SyndicatorFunderService = require('../services/syndicatorFunderService');

const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');
const { accessControl } = require('../middleware/auth');

// Default populate for syndicator-funder
// This is used to populate for syndicator-funder list, syndicator-funder details, syndicator-funder update, syndicator-funder create
// To make the object structure in the response consistent and avoid to write the same code over and over again
const default_populate = [
    { path: 'funder', select: 'name email phone' },
    { path: 'syndicator', select: 'name first_name last_name email phone_mobile' }
];

// query schema for syndicator-funder
const query_schema = {
    sort: Joi.string().allow('').optional(),
    select: Joi.string().allow('').optional(),

    funder: Joi.string().optional(),
    syndicator: Joi.string().optional(),
    available_balance_from: Joi.number().precision(2).optional(),
    available_balance_to: Joi.number().precision(2).optional(),
    payout_frequency: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    next_payout_date_from: Joi.date().optional(),
    next_payout_date_to: Joi.date().optional(),
    include_inactive: Joi.boolean().default(false).optional(),
    auto_syndication: Joi.boolean().optional(),
    createdAt_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    createdAt_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    updatedAt_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    updatedAt_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional()
};

// build db query for syndicator-funder
const buildDbQuery = async (req, query) => {
    const dbQuery = {};
    dbQuery.$and = [];

    const accessableSyndicatorIds = await Helpers.getAccessableSyndicatorIds(req);
    if (query.syndicator) {
        if (accessableSyndicatorIds) {
            if (accessableSyndicatorIds.includes(query.syndicator)) {
                dbQuery.$and.push({ syndicator: query.syndicator });
            } else {
                throw new ErrorResponse('You do not have permission to access this syndicator', 403);
            }
        } else {
            dbQuery.$and.push({ syndicator: query.syndicator });
        }
    } else if (accessableSyndicatorIds) {
        dbQuery.$and.push({ syndicator: { $in: accessableSyndicatorIds } });
    }

    const funderFilter = Helpers.buildFunderFilter(req, query.funder);
    if (funderFilter) dbQuery.$and.push({ funder: funderFilter });

    if (query.available_balance_from) dbQuery.$and.push(Helpers.buildGTEFilter('available_balance', query.available_balance_from));
    if (query.available_balance_to) dbQuery.$and.push(Helpers.buildLTEFilter('available_balance', query.available_balance_to));
    if (query.payout_frequency) dbQuery.$and.push(Helpers.buildArrayFilter('payout_frequency', query.payout_frequency));
    if (query.next_payout_date_from) dbQuery.$and.push(Helpers.buildGTEFilter('next_payout_date', query.next_payout_date_from));
    if (query.next_payout_date_to) dbQuery.$and.push(Helpers.buildLTEFilter('next_payout_date', query.next_payout_date_to));

    if (query.createdAt_from) dbQuery.$and.push(Helpers.buildGTEFilter('createdAt', query.createdAt_from));
    if (query.createdAt_to) dbQuery.$and.push(Helpers.buildLTEFilter('createdAt', query.createdAt_to));
    if (query.updatedAt_from) dbQuery.$and.push(Helpers.buildGTEFilter('updatedAt', query.updatedAt_from));
    if (query.updatedAt_to) dbQuery.$and.push(Helpers.buildLTEFilter('updatedAt', query.updatedAt_to));

    if (query.auto_syndication !== undefined) dbQuery.$and.push({ auto_syndication: query.auto_syndication });

    if (!query.include_inactive) dbQuery.$and.push({ inactive: { $ne: true } });

    dbQuery.$and = dbQuery.$and.filter(item => Object.keys(item).length > 0);

    return dbQuery;
};

// @desc    Get all syndicator-funders
// @route   GET /api/v1/syndicator-funders
// @access  Private
exports.getSyndicatorFunders = async (req, res, next) => {
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

        // Handle query
        const dbQuery = await buildDbQuery(req, query);

        // Handle sort
        const dbSort = Helpers.buildSort(sort, { _id: -1 });

        const result = await SyndicatorFunderService.getSyndicatorFunders(
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

// @desc    Get single syndicator-funder
// @route   GET /api/v1/syndicator-funders/:id
// @access  Private
exports.getSyndicatorFunder = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const syndicatorFunder = await SyndicatorFunderService.getSyndicatorFunderById(value.id, default_populate, '', true);
        accessControl(req, syndicatorFunder, 'syndicator-funder');

        res.status(200).json({
            success: true,
            data: syndicatorFunder
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get syndicator-funder list
// @route   GET /api/v1/syndicator-funders/list
// @access  Private
exports.getSyndicatorFunderList = async (req, res, next) => {
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
        const dbQuery = await buildDbQuery(req, query);

        // Handle sort
        const dbSort = Helpers.buildSort(sort, { _id: -1 });

        let populate = [...default_populate]; // Create a copy to avoid mutating the original

        let dbSelect = select || '';

        if (query.funder) {
            populate = populate.filter(p => p.path !== 'funder');
            dbSelect += '-funder ';
        }
        if (query.syndicator) {
            populate = populate.filter(p => p.path !== 'syndicator');
            dbSelect += '-syndicator ';
        }

        const syndicatorFunders = await SyndicatorFunderService.getSyndicatorFunderList(dbQuery, dbSort, populate, dbSelect, true);

        res.status(200).json({
            success: true,
            data: syndicatorFunders
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new syndicator-funder
// @route   POST /api/v1/syndicator-funders
// @access  Private
exports.createSyndicatorFunder = async (req, res, next) => {
    try {
        const schema = Joi.object({
            funder: Joi.string().optional(),
            syndicator: Joi.string().required(),
            available_balance: Joi.number().optional(),
            payout_frequency: Joi.string().optional(),
            next_payout_date: Joi.date().optional(),
            auto_syndication: Joi.boolean().optional(),
            auto_percent: Joi.number().min(0).max(1).optional(),
            max_amount: Joi.number().min(0).allow(null).optional(),
            min_amount: Joi.number().min(0).allow(null).optional()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        if (!value.funder) {
            value.funder = req.filter.funder;
        } else {
            if (req.filter.funder && req.filter.funder !== value.funder) {
                return next(new ErrorResponse('You don\'t have permission to create syndicator-funder for this funder', 403));
            } else if (req.filter.funder_list && !req.filter.funder_list.includes(value.funder)) {
                return next(new ErrorResponse('You don\'t have permission to create syndicator-funder for this funder', 403));
            }
        }

        const syndicatorFunder = await SyndicatorFunderService.createSyndicatorFunder(value, default_populate, '', true);

        res.status(201).json({
            success: true,
            data: syndicatorFunder
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update syndicator-funder
// @route   PUT /api/v1/syndicator-funders/:id
// @access  Private
exports.updateSyndicatorFunder = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            available_balance: Joi.number().optional(),
            payout_frequency: Joi.string().optional(),
            next_payout_date: Joi.date().optional(),
            inactive: Joi.boolean().optional(),
            auto_syndication: Joi.boolean().optional(),
            auto_percent: Joi.number().min(0).max(1).optional(),
            max_amount: Joi.number().min(0).allow(null).optional(),
            min_amount: Joi.number().min(0).allow(null).optional()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, ...data } = value;

        // Access control
        const syndicatorFunder = await SyndicatorFunderService.getSyndicatorFunderById(id);
        accessControl(req, syndicatorFunder, 'syndicator-funder');

        const updatedSyndicatorFunder = await SyndicatorFunderService.updateSyndicatorFunder(id, data, default_populate, '', true);

        res.status(200).json({
            success: true,
            data: updatedSyndicatorFunder
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete syndicator-funder
// @route   DELETE /api/v1/syndicator-funders/:id
// @access  Private
exports.deleteSyndicatorFunder = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id } = value;

        // Access control
        const syndicatorFunder = await SyndicatorFunderService.getSyndicatorFunderById(id);
        accessControl(req, syndicatorFunder, 'syndicator-funder');

        const deletedSyndicatorFunder = await SyndicatorFunderService.deleteSyndicatorFunder(id, default_populate, '', true);

        res.status(200).json({
            success: true,
            message: 'SyndicatorFunder deleted successfully',
            data: deletedSyndicatorFunder
        });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Get cache statistics
 * @route   GET /api/v1/syndicator-funders/cache/stats
 * @access  Private (Admin only)
 */
exports.getCacheStats = async (req, res) => {
    try {
        const stats = SyndicatorFunderService.cache.getStats();
        res.json({
            success: true,
            data: {
                ...stats,
                ttl_minutes: stats.timeout / (60 * 1000)
            }
        });
    } catch (error) {
        console.error('Error getting cache stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get cache statistics',
            error: error.message
        });
    }
};

/**
 * @desc    Clear cache
 * @route   DELETE /api/v1/syndicator-funders/cache
 * @access  Private (Admin only)
 */
exports.clearCache = async (req, res) => {
    try {
        SyndicatorFunderService.cache.clear();
        res.json({
            success: true,
            message: 'Cache cleared successfully'
        });
    } catch (error) {
        console.error('Error clearing cache:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear cache',
            error: error.message
        });
    }
};

/**
 * @desc    Invalidate cache for specific syndicator
 * @route   DELETE /api/v1/syndicator-funders/cache/syndicator/:syndicatorId
 * @access  Private (Admin only)
 */
exports.invalidateSyndicatorCache = async (req, res) => {
    try {
        const { syndicatorId } = req.params;
        SyndicatorFunderService.cache.invalidateSyndicator(syndicatorId);
        res.json({
            success: true,
            message: `Cache invalidated for syndicator ${syndicatorId}`
        });
    } catch (error) {
        console.error('Error invalidating syndicator cache:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to invalidate syndicator cache',
            error: error.message
        });
    }
};

/**
 * @desc    Invalidate cache for specific funder
 * @route   DELETE /api/v1/syndicator-funders/cache/funder/:funderId
 * @access  Private (Admin only)
 */
exports.invalidateFunderCache = async (req, res) => {
    try {
        const { funderId } = req.params;
        SyndicatorFunderService.cache.invalidateFunder(funderId);
        res.json({
            success: true,
            message: `Cache invalidated for funder ${funderId}`
        });
    } catch (error) {
        console.error('Error invalidating funder cache:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to invalidate funder cache',
            error: error.message
        });
    }
};