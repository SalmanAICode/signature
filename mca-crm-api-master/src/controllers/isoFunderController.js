const Joi = require('joi');

const ISOFunderService = require('../services/isoFunderService');

const Helpers = require('../utils/helpers');
const ErrorResponse = require('../utils/errorResponse');
const { accessControl } = require('../middleware/auth');

// Default populate for funders
// It should be the same as the funder controller
const default_populate = [
    { path: 'funder', select: 'name email phone' },
    { path: 'iso', select: 'name email phone' },
    { path: 'commission_formula', select: 'name' }
];

// query schema for iso-funders
const query_schema = {
    iso: Joi.string().optional(),
    funder: Joi.string().optional(),
    include_inactive: Joi.boolean().default(false).optional(),
    sort: Joi.string().allow('').optional()
};

// build db query for iso-funders
const buildDbQuery = (req, query) => {
    let dbQuery = {};
    dbQuery.$and = [];

    const isoFilter = Helpers.buildIsoFilter(req, query.iso);
    if (isoFilter) dbQuery.$and.push({ iso: isoFilter });

    const funderFilter = Helpers.buildFunderFilter(req, query.funder);
    if (funderFilter) dbQuery.$and.push({ funder: funderFilter });

    if (!query.include_inactive) {
        dbQuery.$and.push({ inactive: { $ne: true } });
    }

    return dbQuery;
};

// @desc    Get all ISO-funders (with pagination)
// @route   GET /api/v1/iso-funders
// @access  Private
exports.getISOFunders = async (req, res, next) => {
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

        const dbQuery = buildDbQuery(req, query);

        const dbSort = Helpers.buildSort(sort, { _id: -1 });

        const result = await ISOFunderService.getISOFunders(
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

// @desc    List all funders of an ISO (without pagination)
// @route   GET /api/v1/iso-funders/list
// @access  Private
exports.getISOFunderList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            ...query_schema
        });

        const { value, error } = schema.validate({...req.params, ...req.query});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { sort, ...query } = value;

        const dbQuery = buildDbQuery(req, query);

        const dbSort = Helpers.buildSort(sort, { funder: 1 });

        // Modify the default populate to remove some fields
        let populate = [...default_populate]; // Create a copy to avoid mutating the original
        let select = '';
        
        if (query.iso) {
            populate = populate.filter(p => p.path !== 'iso');
            select += '-iso ';
        }
        if (query.funder) {
            populate = populate.filter(p => p.path !== 'funder');
            select += '-funder ';
        }

        const funders = await ISOFunderService.getISOFunderList(dbQuery, dbSort, populate, select);

        res.status(200).json({
            success: true,
            data: funders
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get a iso-funder by id
// @route   GET /api/v1/iso-funders/:id
// @access  Private
exports.getISOFunder = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const isoFunder = await ISOFunderService.getISOFunderById(value.id, default_populate);

        res.status(200).json({
            success: true,
            data: isoFunder
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Add a funder to an ISO
// @route   POST /api/v1/iso-funders
// @access  Private
exports.createISOFunder = async (req, res, next) => {
    try {
        const schema = Joi.object({
            iso: Joi.string().required(),
            funder: Joi.string().required(),
            commission_formula: Joi.string().optional()
        });

        const { value, error } = schema.validate({...req.params, ...req.body});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        accessControl(req, value);
        const { iso, funder, ...data } = value;

        const isoFunder = await ISOFunderService.createISOFunder(iso, funder, data, default_populate);

        res.status(201).json({
            success: true,
            data: isoFunder
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update a funder from an ISO
// @route   PUT /api/v1/iso-funders/:id
// @access  Private
exports.updateISOFunder = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            commission_formula: Joi.string().optional(),
            inactive: Joi.boolean().optional()
        });

        const { value, error } = schema.validate({...req.params, ...req.body});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }
        
        const { id, ...data } = value;

        const isoFunder = await ISOFunderService.getISOFunderById(id, default_populate);
        accessControl(req, isoFunder);

        const updatedIsoFunder = await ISOFunderService.updateISOFunder(id, data, default_populate);

        res.status(200).json({
            success: true,
            data: updatedIsoFunder
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Remove a funder from an ISO
// @route   DELETE /api/v1/isos/:id/funders/:funder
// @access  Private
exports.deleteISOFunder = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id } = value;

        const isoFunder = await ISOFunderService.getISOFunderById(id);
        accessControl(req, isoFunder);

        const deletedIsoFunder = await ISOFunderService.deleteISOFunder(id, default_populate);

        res.status(200).json({
            success: true,
            message: 'Funder removed from ISO successfully',
            data: deletedIsoFunder
        });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Get cache statistics
 * @route   GET /api/v1/iso-funders/cache/stats
 * @access  Private (Admin only)
 */
exports.getCacheStats = async (req, res) => {
    try {
        const stats = ISOFunderService.cache.getStats();
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
 * @route   DELETE /api/v1/iso-funders/cache
 * @access  Private (Admin only)
 */
exports.clearCache = async (req, res) => {
    try {
        ISOFunderService.cache.clear();
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
 * @route   DELETE /api/v1/iso-funders/cache/iso/:isoId
 * @access  Private (Admin only)
 */
exports.invalidateISOCache = async (req, res) => {
    try {
        const { isoId } = req.params;
        ISOFunderService.cache.invalidateISO(isoId);
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
 * @desc    Invalidate cache for specific funder
 * @route   DELETE /api/v1/iso-funders/cache/funder/:funderId
 * @access  Private (Admin only)
 */
exports.invalidateFunderCache = async (req, res) => {
    try {
        const { funderId } = req.params;
        ISOFunderService.cache.invalidateFunder(funderId);
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