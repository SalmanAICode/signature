const Joi = require('joi');

const MerchantFunderService = require('../services/merchantFunderService');

const Helpers = require('../utils/helpers');
const ErrorResponse = require('../utils/errorResponse');
const { accessControl } = require('../middleware/auth');

// Default populate for merchant-funders
const default_populate = [
    { path: 'funder', select: 'name email phone' },
    { path: 'merchant', select: 'name dba_name email phone' },
    { path: 'assigned_manager', select: 'first_name last_name email phone_mobile' },
    { path: 'assigned_user', select: 'first_name last_name email phone_mobile' }
];

// query schema for merchant-funders
const query_schema = {
    merchant: Joi.string().optional(),
    funder: Joi.string().optional(),
    include_inactive: Joi.boolean().default(false).optional(),
    sort: Joi.string().allow('').optional()
};

// build db query for merchant-funders
const buildDbQuery = async (req, query) => {
    let dbQuery = {};
    dbQuery.$and = [];

    const merchantFilter = Helpers.buildMerchantFilter(req, query.merchant);
    if (merchantFilter) dbQuery.merchant = merchantFilter;

    const funderFilter = Helpers.buildFunderFilter(req, query.funder);
    if (funderFilter) dbQuery.funder = funderFilter;


    if (!query.include_inactive) {
        dbQuery.inactive = { $ne: true };
    }

    if (query.search) {
        dbQuery.$and.push({
            $or: [
                { 'merchant.name': { $regex: query.search, $options: 'i' } },
                { 'funder.name': { $regex: query.search, $options: 'i' } },
                { 'assigned_manager.first_name': { $regex: query.search, $options: 'i' } },
                { 'assigned_manager.last_name': { $regex: query.search, $options: 'i' } },
                { 'assigned_user.first_name': { $regex: query.search, $options: 'i' } },
                { 'assigned_user.last_name': { $regex: query.search, $options: 'i' } }
            ]
        });
    }

    return dbQuery;
};

// @desc    Get all merchant-funders (with pagination)
// @route   GET /api/v1/merchant-funders
// @access  Private

// get all merchant-funders (with pagination)
exports.getMerchantFunders = async (req, res, next) => {
    try {
        const schema = Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).default(25),
            ...query_schema
        });

        const { value, error } = schema.validate({...req.params, ...req.query});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { page, limit, sort, ...query } = value;

        const dbQuery = await buildDbQuery(req, query);

        const dbSort = Helpers.buildSort(sort, { name: 1 });
                
        const result = await MerchantFunderService.getMerchantFunders(
            dbQuery,
            dbSort,
            page,
            limit,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        next(err);
    }
};

// @desc    List all funders of a merchant (without pagination)
// @route   GET /api/v1/merchant-funders/list
// @access  Private
exports.getMerchantFunderList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            ...query_schema
        });

        const { value, error } = schema.validate({...req.params, ...req.query});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { sort, ...query } = value;

        const dbQuery = await buildDbQuery(req, query);

        const dbSort = Helpers.buildSort(sort, { funder: 1 });

        // Modify the default populate to remove some fields
        let populate = [...default_populate];
        let select = '';

        if(query.merchant) {
            populate = populate.filter(p => p.path !== 'merchant');
            select += '-merchant ';
        }
        if(query.funder) {
            populate = populate.filter(p => p.path !== 'funder');
            select += '-funder ';
        }

        const funders = await MerchantFunderService.getMerchantFunderList(dbQuery, dbSort, populate, select);

        res.status(200).json({
            success: true,
            data: funders
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get a merchant-funder by ID
// @route   GET /api/v1/merchant-funders/:id
// @access  Private
exports.getMerchantFunder = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id } = value;

        const merchantFunder = await MerchantFunderService.getMerchantFunderById(id, default_populate);
        accessControl(req, merchantFunder);

        res.status(200).json({
            success: true,
            data: merchantFunder
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Add a funder to a merchant
// @route   POST /api/v1/merchant-funders
// @access  Private
exports.createMerchantFunder = async (req, res, next) => {
    try {
        const schema = Joi.object({
            merchant: Joi.string().required(),
            funder: Joi.string().required(),
            assigned_manager: Joi.string().optional(),
            assigned_user: Joi.string().optional()
        });

        const { value, error } = schema.validate({...req.params, ...req.body});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        accessControl(req, value);
        const { merchant, funder, ...data } = value;

        const merchantFunder = await MerchantFunderService.createMerchantFunder(merchant, funder, data, default_populate);

        res.status(201).json({
            success: true,
            data: merchantFunder
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update a merchant-funder relationship
// @route   PUT /api/v1/merchant-funders/:id
// @access  Private
exports.updateMerchantFunder = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            assigned_manager: Joi.string().optional(),
            assigned_user: Joi.string().optional(),
            inactive: Joi.boolean().optional()
        });

        const { value, error } = schema.validate({...req.params, ...req.body});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, ...data } = value;

        const merchantFunder = await MerchantFunderService.getMerchantFunderById(id);
        accessControl(req, merchantFunder);

        const updatedMerchantFunder = await MerchantFunderService.updateMerchantFunder(id, data, default_populate);

        res.status(200).json({
            success: true,
            data: updatedMerchantFunder
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Remove a funder from a merchant
// @route   DELETE /api/v1/merchant-funders/:id
// @access  Private
exports.deleteMerchantFunder = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id } = value;

        const merchantFunder = await MerchantFunderService.getMerchantFunderById(id);
        accessControl(req, merchantFunder);

        const deletedMerchantFunder = await MerchantFunderService.deleteMerchantFunder(id, default_populate);

        res.status(200).json({
            success: true,
            message: 'Funder removed from merchant successfully',
            data: deletedMerchantFunder
        });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Get cache statistics
 * @route   GET /api/v1/merchant-funders/cache/stats
 * @access  Private (Admin only)
 */
exports.getCacheStats = async (req, res) => {
    try {
        const stats = MerchantFunderService.cache.getStats();
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
 * @route   DELETE /api/v1/merchant-funders/cache
 * @access  Private (Admin only)
 */
exports.clearCache = async (req, res) => {
    try {
        MerchantFunderService.cache.clear();
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
 * @desc    Invalidate cache for specific funder
 * @route   DELETE /api/v1/merchant-funders/cache/funder/:funderId
 * @access  Private (Admin only)
 */
exports.invalidateFunderCache = async (req, res) => {
    try {
        const { funderId } = req.params;
        MerchantFunderService.cache.invalidateFunder(funderId);
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

/**
 * @desc    Invalidate cache for specific merchant
 * @route   DELETE /api/v1/merchant-funders/cache/merchant/:merchantId
 * @access  Private (Admin only)
 */
exports.invalidateMerchantCache = async (req, res) => {
    try {
        const { merchantId } = req.params;
        MerchantFunderService.cache.invalidateMerchant(merchantId);
        res.json({
            success: true,
            message: `Cache invalidated for merchant ${merchantId}`
        });
    } catch (error) {
        console.error('Error invalidating merchant cache:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to invalidate merchant cache',
            error: error.message
        });
    }
};