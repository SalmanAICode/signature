const Joi = require('joi');

const RepresentativeISOService = require('../services/representativeISOService');
const ISOService = require('../services/isoService');
const RepresentativeService = require('../services/representativeService');
const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');

// Default populate for isos
// It should be the same as the iso controller
const default_iso_populate = [];

// Default populate for representatives
// It should be the same as the representative controller
const default_representative_populate = [
    { path: 'iso_count' },
    { path: 'access_log_count' }
];

// @desc    Get isos of a representative (with pagination)
// @route   GET /api/v1/representatives/:id/isos
// @access  Private
exports.getRepresentativeISOs = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            include_inactive: Joi.boolean().default(false).optional(),
            search: Joi.string().allow('').optional(),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).default(25),
            sort: Joi.string().allow('').optional()
        });

        const { value, error } = schema.validate({...req.params, ...req.query});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        let isoIds = await RepresentativeISOService.getISOsByRepresentativeId(value.id);

        // Handle filter
        if (req.filter?.iso_list) {
            isoIds = isoIds.filter(iso => req.filter.iso_list.includes(iso));
        }

        let dbQuery = {};
        dbQuery._id = { $in: isoIds };
        
        // Handle search
        if (value.search) {
            dbQuery.$or = [
                { 'name': { $regex: value.search, $options: 'i' } },
                { 'email': { $regex: value.search, $options: 'i' } },
                { 'phone': { $regex: value.search, $options: 'i' } }
            ];
        }

        // Handle include_inactive
        if (!value.include_inactive) {
            dbQuery.inactive = { $ne: true };
        }

        // Handle sort
        const dbSort = Helpers.buildSort(value.sort, { name: 1 });

        const result = await ISOService.getISOs(
            dbQuery,
            value.page,
            value.limit,
            dbSort,
            default_iso_populate,
            '',
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

// @desc    List all isos of a representative (without pagination)
// @route   GET /api/v1/representatives/:id/isos/list
// @access  Private
exports.getRepresentativeISOList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            include_inactive: Joi.boolean().default(false).optional(),
            sort: Joi.string().allow('').optional()
        });

        const { value, error } = schema.validate({...req.params, ...req.query});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        let isoIds = await RepresentativeISOService.getISOsByRepresentativeId(value.id);

        // Handle filter
        if (req.filter?.iso_list) {
            isoIds = isoIds.filter(iso => req.filter.iso_list.includes(iso));
        }

        let dbQuery = {};
        dbQuery._id = { $in: isoIds };

        // Handle include_inactive
        if (!value.include_inactive) {
            dbQuery.inactive = { $ne: true };
        }

        // Handle sort
        const dbSort = Helpers.buildSort(value.sort, { name: 1 });

        const isos = await ISOService.getISOList(dbQuery, dbSort, 'name email phone inactive');

        res.status(200).json({
            success: true,
            data: isos
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Add a iso to representative
// @route   POST /api/v1/representatives/:id/isos
// @access  Private
exports.createRepresentativeISO = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            iso: Joi.string().required()
        });

        const { value, error } = schema.validate({...req.params, ...req.body});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const representativeISO = await RepresentativeISOService.createRepresentativeISO(value.id, value.iso);

        const iso = await ISOService.getISOById(representativeISO.iso, default_iso_populate, '', true);

        res.status(201).json({
            success: true,
            data: iso
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Remove a iso from representative
// @route   DELETE /api/v1/representatives/:id/isos/:isoId
// @access  Private
exports.deleteRepresentativeISO = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            isoId: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        await RepresentativeISOService.deleteRepresentativeISO(value.id, value.isoId);

        res.status(200).json({
            success: true,
            message: 'ISO removed from representative successfully'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get representatives of a iso (with pagination)
// @route   GET /api/v1/isos/:id/representatives
// @access  Private
exports.getISORepresentatives = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            include_inactive: Joi.boolean().default(false).optional(),
            search: Joi.string().allow('').optional(),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).default(25),
            sort: Joi.string().allow('').optional()
        });

        const { value, error } = schema.validate({...req.params, ...req.query});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        // Handle filter
        if (req.filter?.iso_list) {
            if (!req.filter.iso_list.includes(value.id)) {
                return next(new ErrorResponse('ISO is not allowed to be accessed with current login', 403));
            }
        }

        let representativeIds = await RepresentativeISOService.getRepresentativesByISOId(value.id);

        let dbQuery = {};
        dbQuery._id = { $in: representativeIds };

        // Handle search
        if (value.search) {
            dbQuery.$or = [
                { 'first_name': { $regex: value.search, $options: 'i' } },
                { 'last_name': { $regex: value.search, $options: 'i' } },
                { 'email': { $regex: value.search, $options: 'i' } },
                { 'phone_mobile': { $regex: value.search, $options: 'i' } }
            ];
        }

        // Handle include_inactive
        if (!value.include_inactive) {
            dbQuery.inactive = { $ne: true };
        }

        // Handle sort
        const dbSort = Helpers.buildSort(value.sort, { name: 1 });

        const result = await RepresentativeService.getRepresentatives(
            dbQuery,
            dbSort,
            value.page,
            value.limit,
            default_representative_populate,
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        next(err);
    }
};

// @desc    List all representatives of a iso (without pagination)
// @route   GET /api/v1/isos/:id/representatives/list
// @access  Private
exports.getISORepresentativesList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            sort: Joi.string().allow('').optional(),
            include_inactive: Joi.boolean().default(false).optional()
        });

        const { value, error } = schema.validate({...req.params, ...req.query});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        // Handle filter
        if (req.filter?.iso_list) {
            if (!req.filter.iso_list.includes(value.id)) {
                return next(new ErrorResponse('ISO is not allowed to be accessed with current login', 403));
            }
        }

        let representativeIds = await RepresentativeISOService.getRepresentativesByISOId(value.id);

        let dbQuery = {};
        dbQuery._id = { $in: representativeIds };

        // Handle include_inactive
        if (!value.include_inactive) {
            dbQuery.inactive = { $ne: true };
        }

        // Handle sort
        const dbSort = Helpers.buildSort(value.sort, { name: 1 });

        const representatives = await RepresentativeService.getRepresentativeList(dbQuery, dbSort, 'first_name last_name email phone_mobile inactive');

        res.status(200).json({
            success: true,
            data: representatives
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Add a representative to iso
// @route   POST /api/v1/isos/:id/representatives
// @access  Private
exports.createISORepresentative = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            representative: Joi.string().required()
        });

        const { value, error } = schema.validate({...req.params, ...req.body});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const representativeISO = await RepresentativeISOService.createRepresentativeISO(value.representative, value.id);

        const representative = await RepresentativeService.getRepresentativeById(representativeISO.representative, default_representative_populate);

        res.status(201).json({
            success: true,
            data: representative
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Remove a representative from iso
// @route   DELETE /api/v1/isos/:id/representatives/:representative
// @access  Private
exports.deleteISORepresentative = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            representative: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        await RepresentativeISOService.deleteRepresentativeISO(value.representative, value.id);

        res.status(200).json({
            success: true,
            message: 'Representative removed from iso successfully'
        });
    } catch (err) {
        next(err);
    }
};

