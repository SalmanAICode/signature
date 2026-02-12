const Joi = require('joi');

const ISOService = require('../services/isoService');
const RepresentativeISOService = require('../services/representativeISOService');

const ErrorResponse = require('../utils/errorResponse');
const { PORTAL_TYPES } = require('../utils/constants');
const Helpers = require('../utils/helpers');

// Default populate for iso
// This is used to populate for iso list, iso details, iso update, iso create
// To make the object structure in the response consistent and avoid to write the same code over and over again
const default_populate = [];

// query schema for iso
const query_schema = {
    sort: Joi.string().allow('').optional(),
    select: Joi.string().allow('').optional(),
    search: Joi.string().allow('').optional(),
    // Following query parameters are based on fields from iso model
    name: Joi.string().allow('').optional(),
    email: Joi.string().allow('').optional(),
    phone: Joi.string().allow('').optional(),
    website: Joi.string().allow('').optional(),
    type: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    address_detail: Joi.string().allow('').optional(),
    business_detail: Joi.string().allow('').optional(),
    primary_representative: Joi.string().allow('').optional(),
    include_inactive: Joi.boolean().default(false).optional(),
    createdAt_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    createdAt_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    updatedAt_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    updatedAt_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional()
};

// Build db query for iso
const buildDbQuery = async (req, query) => {
    const dbQuery = {$and: []};

    // Add filter for different request portal
    // This is based on the req filters
    const accessableIsoIds = await Helpers.getAccessableIsoIds(req);

    if (accessableIsoIds) {
        dbQuery.$and.push({ _id: { $in: accessableIsoIds } });
    }

    // Handle search
    if (query.search) {
        dbQuery.$and.push(Helpers.buildSearchFilter([
            'name',
            'email',
            'phone',
            'website',
            'primary_representative.first_name',
            'primary_representative.last_name',
            'primary_representative.email',
            'primary_representative.phone_mobile',
            'address_list.address_1',
            'address_list.address_2',
            'address_list.city',
            'address_list.state',
            'address_list.zip',
            'business_detail.ein',
            'business_detail.entity_type',
            'business_detail.state_of_incorporation'
        ], query.search));
    }

    // Handle fields from iso model
    if (query.name) dbQuery.$and.push(Helpers.buildSearchFilter('name', query.name));
    if (query.email) dbQuery.$and.push(Helpers.buildSearchFilter('email', query.email));
    if (query.phone) dbQuery.$and.push(Helpers.buildSearchFilter('phone', query.phone));
    if (query.website) dbQuery.$and.push(Helpers.buildSearchFilter('website', query.website));
    
    if (query.type) dbQuery.$and.push(Helpers.buildArrayFilter('type', query.type));

    if (query.primary_representative) dbQuery.$and.push(Helpers.buildSearchFilter([
        'primary_representative.first_name', 
        'primary_representative.last_name', 
        'primary_representative.email', 
        'primary_representative.phone_mobile'
    ], query.primary_representative));

    if (query.address_detail) dbQuery.$and.push(Helpers.buildSearchFilter([
        'address_list.address_1', 
        'address_list.address_2', 
        'address_list.city', 
        'address_list.state', 
        'address_list.zip'
    ], query.address_detail));

    if (query.business_detail) dbQuery.$and.push(Helpers.buildSearchFilter([
        'business_detail.ein',
        'business_detail.entity_type',
        'business_detail.state_of_incorporation'
    ], query.business_detail));

    if (!query.include_inactive) dbQuery.$and.push({ inactive: { $ne: true } });

    if (query.createdAt_from) dbQuery.$and.push(Helpers.buildGTEFilter('createdAt', query.createdAt_from));
    if (query.createdAt_to) dbQuery.$and.push(Helpers.buildLTEFilter('createdAt', query.createdAt_to));
    if (query.updatedAt_from) dbQuery.$and.push(Helpers.buildGTEFilter('updatedAt', query.updatedAt_from));
    if (query.updatedAt_to) dbQuery.$and.push(Helpers.buildLTEFilter('updatedAt', query.updatedAt_to));

    // Remove empty $and
    dbQuery.$and = dbQuery.$and.filter(item => Object.keys(item).length > 0);

    return dbQuery;
};

// @desc    Get all isos
// @route   GET /api/v1/isos
// @access  BOOKKEEPER FUNDER_MANAGER FUNDER_USER ISO_MANAGER ISO_SALES MERCHANT
exports.getISOs = async (req, res, next) => {
    try {
        const schema = Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).default(10),
            ...query_schema
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { page, limit, sort, select, ...query } = value;

        const dbQuery = await buildDbQuery(req, query);

        // Handle sorting
        const dbSort = Helpers.buildSort(sort, { name: 1 }); // Default sort

        const isos = await ISOService.getISOs(dbQuery, dbSort, page, limit, default_populate, select, true);

        res.status(200).json({
            success: true,
            data: isos
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get iso list without pagination
// @route   GET /api/v1/isos/list
// @access  BOOKKEEPER FUNDER_MANAGER FUNDER_USER ISO_MANAGER ISO_SALES MERCHANT
exports.getISOList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            ...query_schema
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { sort, select, ...query } = value;

        const dbQuery = await buildDbQuery(req, query);

        const dbSort = Helpers.buildSort(sort, { name: 1 });

        const isos = await ISOService.getISOList(dbQuery, dbSort, [], select || 'name email phone inactive', true);

        res.status(200).json({
            success: true,
            data: isos
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single iso
// @route   GET /api/v1/isos/:id
// @access  Private
exports.getISO = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        // Check if the iso is in the filter
        const isoFilter = await Helpers.getAccessableIsoIds(req);
        if (isoFilter && !isoFilter.includes(value.id)) {
            return next(new ErrorResponse('ISO is not allowed to be accessed with current login', 404));
        }

        const iso = await ISOService.getISOById(value.id, default_populate, '', true);

        res.status(200).json({
            success: true,
            data: iso
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new iso
// @route   POST /api/v1/isos
// @access  ADMIN ISO_MANAGER
exports.createISO = async (req, res, next) => {
    try {
        const schema = Joi.object({
            name: Joi.string().required(),
            email: Joi.string().email().optional(),
            phone: Joi.string().optional(),
            website: Joi.string().uri().optional(),
            business_detail: Joi.object({
                ein: Joi.string().optional(),
                entity_type: Joi.string().optional(),
                incorporation_date: Joi.date().optional(),
                state_of_incorporation: Joi.string().optional()
            }).optional(),
            address_list: Joi.array().items(Joi.object({
                type: Joi.string().optional(),
                address_1: Joi.string().optional(),
                address_2: Joi.string().optional(),
                city: Joi.string().optional(),
                state: Joi.string().optional(),
                zip: Joi.string().optional(),
                primary: Joi.boolean().optional(),
                verified: Joi.boolean().optional()
            })).optional(),
            primary_representative: Joi.string().optional(),
            commission_formula: Joi.string().optional(),
            representative_list: Joi.array().items(Joi.string()).optional()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { representative_list, ...data } = value;

        // If primary representative is not provided, set it to the current user's id if the request is from iso portal
        if (!data.primary_representative) {
            if (req.portal === PORTAL_TYPES.ISO) {
                data.primary_representative = req.id;
            } else {
                data.primary_representative = null;
            }
        }

        const iso = await ISOService.createISO(data);

        if (iso && representative_list && representative_list.length > 0) {
            await RepresentativeISOService.updateISORepresentativeList(iso._id, representative_list);
        }

        const newIso = await ISOService.getISOById(iso._id, default_populate, '', true);

        res.status(201).json({
            success: true,
            data: newIso
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update iso
// @route   PUT /api/v1/isos/:id
// @access  ADMIN ISO_MANAGER
exports.updateISO = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            name: Joi.string().optional(),
            email: Joi.string().email().optional(),
            phone: Joi.string().optional(),
            website: Joi.string().uri().optional(),
            business_detail: Joi.object({
                ein: Joi.string().optional(),
                entity_type: Joi.string().optional(),
                incorporation_date: Joi.date().optional(),
                state_of_incorporation: Joi.string().optional()
            }).optional(),
            address_list: Joi.array().items(Joi.object({
                type: Joi.string().optional(),
                address_1: Joi.string().optional(),
                address_2: Joi.string().optional(),
                city: Joi.string().optional(),
                state: Joi.string().optional(),
                zip: Joi.string().optional(),
                primary: Joi.boolean().optional(),
                verified: Joi.boolean().optional()
            })).optional(),
            primary_representative: Joi.string().optional(),
            commission_formula: Joi.string().optional(),
            inactive: Joi.boolean().optional(),
            representative_list: Joi.array().items(Joi.string()).optional()
        });

        // Combine params and body for validation
        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, representative_list, ...data } = value;

        // Check if the iso is in the filter
        if (req.filter?.iso_list && !req.filter.iso_list.includes(id)) {
            return next(new ErrorResponse('ISO is not allowed to be accessed with current login', 404));
        }

        const iso = await ISOService.updateISO(id, data);

        if (representative_list && representative_list.length > 0) {
            await RepresentativeISOService.updateISORepresentativeList(iso._id, representative_list);
        }

        const updatedIso = await ISOService.getISOById(iso._id, default_populate, '', true);

        res.status(200).json({
            success: true,
            data: updatedIso
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete iso
// @route   DELETE /api/v1/isos/:id
// @access  ADMIN ISO_MANAGER
exports.deleteISO = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        // verify iso_list
        if (req.filter?.iso_list) {
            if (!req.filter.iso_list.includes(value.id)) {
                return next(new ErrorResponse('You don\'t have permission to delete this ISO', 403));
            }
        }

        await ISOService.deleteISO(value.id);

        res.status(200).json({
            success: true,
            message: 'ISO deleted successfully'
        });
    } catch (err) {
        next(err);
    }
};

