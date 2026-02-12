const Joi = require('joi');

const ISOMerchantService = require('../services/isoMerchantService');

const Helpers = require('../utils/helpers');
const ErrorResponse = require('../utils/errorResponse');
const { accessControl } = require('../middleware/auth');

// Default populate for merchants
const default_populate = [
    { path: 'merchant', select: 'name email phone dba_name' },
    { path: 'iso', select: 'name email phone' }
];

// query schema for iso-merchants
const query_schema = {
    iso: Joi.string().optional(),
    merchant: Joi.string().optional(),
    include_inactive: Joi.boolean().default(false).optional(),
    sort: Joi.string().allow('').optional()
};

// build db query for iso-merchants
const buildDbQuery = async (req, query) => {
    let dbQuery = {};
    dbQuery.$and = [];

    const isoFilter = await Helpers.getAccessableIsoIds(req);
    if (isoFilter) dbQuery.$and.push({ iso: { $in: isoFilter } });

    const merchantFilter = await Helpers.getAccessableMerchantIds(req);
    if (merchantFilter) dbQuery.$and.push({ merchant: merchantFilter });

    if (!query.include_inactive) {
        dbQuery.$and.push({ inactive: { $ne: true } });
    }

    return dbQuery;
};


// @desc    Get all ISO-merchants (with pagination)
// @route   GET /api/v1/iso-merchants
// @access  Private
exports.getISOMerchants = async (req, res, next) => {
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

        // Handle sort
        const dbSort = Helpers.buildSort(sort, { _id: -1 });

        const result = await ISOMerchantService.getISOMerchants(
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

// @desc    List all merchants of an ISO (without pagination)
// @route   GET /api/v1/iso-merchants/list
// @access  Private
exports.getISOMerchantList = async (req, res, next) => {
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

        const dbSort = Helpers.buildSort(sort, { merchant: 1 });


        // Modify the default populate to remove some fields
        let populate = [...default_populate]; // Create a copy to avoid mutating the original
        let select = '';
        
        if (query.iso) {
            populate = populate.filter(p => p.path !== 'iso');
            select += '-iso ';
        }
        if (query.merchant) {
            populate = populate.filter(p => p.path !== 'merchant');
            select += '-merchant ';
        }

        const merchants = await ISOMerchantService.getISOMerchantList(dbQuery, dbSort, populate, select);

        res.status(200).json({
            success: true,
            data: merchants
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get an iso-merchant by id
// @route   GET /api/v1/iso-merchants/:id
// @access  Private
exports.getISOMerchant = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const isoMerchant = await ISOMerchantService.getISOMerchantById(value.id, default_populate);

        res.status(200).json({
            success: true,
            data: isoMerchant
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Add a merchant to an ISO
// @route   POST /api/v1/iso-merchants
// @access  Private
exports.createISOMerchant = async (req, res, next) => {
    try {
        const schema = Joi.object({
            iso: Joi.string().required(),
            merchant: Joi.string().required()
        });

        const { value, error } = schema.validate({...req.params, ...req.body});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        accessControl(req, value);
        const { iso, merchant, ...data } = value;

        const isoMerchant = await ISOMerchantService.createISOMerchant(iso, merchant, data, default_populate);

        res.status(201).json({
            success: true,
            data: isoMerchant
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update a merchant from an ISO
// @route   PUT /api/v1/iso-merchants/:id
// @access  Private
exports.updateISOMerchant = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            inactive: Joi.boolean().optional()
        });

        const { value, error } = schema.validate({...req.params, ...req.body});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }
        
        const { id, ...data } = value;

        const isoMerchant = await ISOMerchantService.getISOMerchantById(id, default_populate);
        accessControl(req, isoMerchant);

        const updatedIsoMerchant = await ISOMerchantService.updateISOMerchant(id, data, default_populate);

        res.status(200).json({
            success: true,
            data: updatedIsoMerchant
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Remove a merchant from an ISO
// @route   DELETE /api/v1/iso-merchants/:id
// @access  Private
exports.deleteISOMerchant = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id } = value;

        const isoMerchant = await ISOMerchantService.getISOMerchantById(id);
        accessControl(req, isoMerchant);

        const deletedIsoMerchant = await ISOMerchantService.deleteISOMerchant(id, default_populate);

        res.status(200).json({
            success: true,
            message: 'Merchant removed from ISO successfully',
            data: deletedIsoMerchant
        });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Get cache statistics
 * @route   GET /api/v1/iso-merchants/cache/stats
 * @access  Private (Admin only)
 */
exports.getCacheStats = async (req, res) => {
    try {
        const stats = ISOMerchantService.cache.getStats();
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
 * @route   DELETE /api/v1/iso-merchants/cache
 * @access  Private (Admin only)
 */
exports.clearCache = async (req, res) => {
    try {
        ISOMerchantService.cache.clear();
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
 * @desc    Invalidate cache for specific ISO
 * @route   DELETE /api/v1/iso-merchants/cache/iso/:isoId
 * @access  Private (Admin only)
 */
exports.invalidateISOCache = async (req, res) => {
    try {
        const { isoId } = req.params;
        ISOMerchantService.cache.invalidateISO(isoId);
        res.json({
            success: true,
            message: `Cache invalidated for ISO ${isoId}`
        });
    } catch (error) {
        console.error('Error invalidating ISO cache:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to invalidate ISO cache',
            error: error.message
        });
    }
};

/**
 * @desc    Invalidate cache for specific merchant
 * @route   DELETE /api/v1/iso-merchants/cache/merchant/:merchantId
 * @access  Private (Admin only)
 */
exports.invalidateMerchantCache = async (req, res) => {
    try {
        const { merchantId } = req.params;
        ISOMerchantService.cache.invalidateMerchant(merchantId);
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