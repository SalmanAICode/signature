const Joi = require('joi');

const MerchantService = require('../services/merchantService');
const ContactMerchantService = require('../services/contactMerchantService');
const MerchantFunderService = require('../services/merchantFunderService');
const ISOMerchantService = require('../services/isoMerchantService');

const ErrorResponse = require('../utils/errorResponse');
const { PORTAL_TYPES } = require('../utils/constants');
const Helpers = require('../utils/helpers');

// Default populate for merchant
// This is used to populate for merchant list, merchant details, merchant update, merchant create
// To make the object structure in the response consistent and avoid to write the same code over and over again
const default_populate = [];

// query schema for merchant
const query_schema = {
    sort: Joi.string().allow('').optional(),
    select: Joi.string().allow('').optional(),
    search: Joi.string().allow('').optional(),
    // Following query parameters are based on fields from merchant model
    name: Joi.string().allow('').optional(),
    dba_name: Joi.string().allow('').optional(),
    email: Joi.string().allow('').optional(),
    phone: Joi.string().allow('').optional(),
    website: Joi.string().allow('').optional(),
    sic_detail: Joi.string().allow('').optional(),
    naics_detail: Joi.string().allow('').optional(),
    address_detail: Joi.string().allow('').optional(),
    business_detail: Joi.string().allow('').optional(),
    primary_contact: Joi.string().allow('').optional(),
    primary_owner: Joi.string().allow('').optional(),
    include_inactive: Joi.boolean().default(false).optional(),
    createdAt_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    createdAt_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    updatedAt_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    updatedAt_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional()
};

// Build db query for merchant
const buildDbQuery = async (req, query) => {
    const dbQuery = {$and: []};

    // Add filter for different request portal
    // This is based on the req filters
    const accessableMerchantIds = await Helpers.getAccessableMerchantIds(req);

    if (accessableMerchantIds) {
        dbQuery.$and.push({ _id: { $in: accessableMerchantIds } });
    }

    // Handle search
    if (query.search) {
        dbQuery.$and.push(Helpers.buildSearchFilter([
            'name',
            'dba_name',
            'email',
            'phone',
            'website',
            'sic_detail.code',
            'sic_detail.description',
            'naics_detail.code',
            'naics_detail.title',
            'naics_detail.description',
            'primary_contact.first_name',
            'primary_contact.last_name',
            'primary_contact.email',
            'primary_contact.phone_mobile',
            'primary_owner.first_name',
            'primary_owner.last_name',
            'primary_owner.email',
            'primary_owner.phone_mobile',
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

    // Handle fields from merchant model
    if (query.name) dbQuery.$and.push(Helpers.buildSearchFilter('name', query.name));
    if (query.dba_name) dbQuery.$and.push(Helpers.buildSearchFilter('dba_name', query.dba_name));
    if (query.email) dbQuery.$and.push(Helpers.buildSearchFilter('email', query.email));
    if (query.phone) dbQuery.$and.push(Helpers.buildSearchFilter('phone', query.phone));
    if (query.website) dbQuery.$and.push(Helpers.buildSearchFilter('website', query.website));
    
    if (query.sic_detail) dbQuery.$and.push(Helpers.buildSearchFilter(['sic_detail.code', 'sic_detail.description'], query.sic_detail));
    if (query.naics_detail) dbQuery.$and.push(Helpers.buildSearchFilter(['naics_detail.code', 'naics_detail.title', 'naics_detail.description'], query.naics_detail));

    if (query.primary_contact) dbQuery.$and.push(Helpers.buildSearchFilter(['primary_contact.first_name', 'primary_contact.last_name', 'primary_contact.email', 'primary_contact.phone_mobile'], query.primary_contact));

    if (query.primary_owner) dbQuery.$and.push(Helpers.buildSearchFilter(['primary_owner.first_name', 'primary_owner.last_name', 'primary_owner.email', 'primary_owner.phone_mobile'], query.primary_owner));

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

// @desc    Get all merchants
// @route   GET /api/v1/merchants
// @access  Private
exports.getMerchants = async (req, res, next) => {
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

        const merchants = await MerchantService.getMerchants(dbQuery, page, limit, dbSort, default_populate, select, true);

        res.status(200).json({
            success: true,
            data: merchants
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get merchant list without pagination
// @route   GET /api/v1/merchants/list
// @access  Private
exports.getMerchantList = async (req, res, next) => {
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

        const merchants = await MerchantService.getMerchantList(dbQuery, dbSort, [], select || 'name email phone inactive', true);

        res.status(200).json({
            success: true,
            data: merchants
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single merchant
// @route   GET /api/v1/merchants/:id
// @access  Private
exports.getMerchant = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        // Check if the merchant is in the filter
        const accessableMerchantIds = await Helpers.getAccessableMerchantIds(req);
        if (accessableMerchantIds && !accessableMerchantIds.includes(value.id)) {
            return next(new ErrorResponse('Merchant is not allowed to be accessed with current login', 403));
        }

        const merchant = await MerchantService.getMerchantById(value.id, default_populate, '', true);

        res.status(200).json({
            success: true,
            data: merchant
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new merchant
// @route   POST /api/v1/merchants
// @access  Private (Admin only)
exports.createMerchant = async (req, res, next) => {
    try {
        const schema = Joi.object({
            name: Joi.string().required(),
            dba_name: Joi.string().optional(),
            email: Joi.string().email().optional().allow(''),
            phone: Joi.string().optional(),
            website: Joi.string().uri().optional().allow(''),
            sic_detail: Joi.string().optional(),
            naics_detail: Joi.string().optional(),
            business_detail: Joi.object({
                ein: Joi.string().optional(),
                entity_type: Joi.string().optional(),
                incorporation_date: Joi.date().optional(),
                state_of_incorporation: Joi.string().optional()
            }).optional(),
            address_list: Joi.array().items(Joi.object({
                address_line_1: Joi.string().optional(),
                address_line_2: Joi.string().optional(),
                city: Joi.string().optional(),
                state: Joi.string().optional(),
                zip: Joi.string().optional()
            })).optional(),
            primary_contact: Joi.string().optional(),
            primary_owner: Joi.string().optional(),
            assigned_user: Joi.string().optional(),
            assigned_manager: Joi.string().optional(),
            contact_list: Joi.array().optional()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        if(!value.primary_contact) {
            if(req.portal === PORTAL_TYPES.MERCHANT) {
                value.primary_contact = req.id;
            }
        }

        const { contact_list, assigned_user, assigned_manager, ...data } = value;

        if (data.primary_contact && contact_list && !contact_list.includes(data.primary_contact)) {
            contact_list.push(data.primary_contact);
        }

        if (data.primary_owner && contact_list && !contact_list.includes(data.primary_owner)) {
            contact_list.push(data.primary_owner);
        }

        const merchant = await MerchantService.createMerchant(data);

        try {
            if(merchant && contact_list && contact_list.length > 0) {
                await ContactMerchantService.updateMerchantContactList(merchant._id, contact_list);
            }

            // If the merchant is created by a funder, add the funder to the merchant
            if(req.portal === PORTAL_TYPES.FUNDER) {
                if (req.filter.funder) {
                    await MerchantFunderService.createMerchantFunder(merchant._id, req.filter.funder, {
                        assigned_user,
                        assigned_manager
                    });
                }
            }

            // If the merchant is created by an ISO, add the ISO to the merchant
            if(req.portal === PORTAL_TYPES.ISO) {
                if (req.filter.iso) {
                    await ISOMerchantService.createISOMerchant(req.filter.iso, merchant._id, {});
                }
            }
        } catch (err) {
            console.error(err);
        }


        const newMerchant = await MerchantService.getMerchantById(merchant._id, default_populate, '', true);

        res.status(201).json({
            success: true,
            data: newMerchant
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update merchant
// @route   PUT /api/v1/merchants/:id
// @access  Private (Admin only)
exports.updateMerchant = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            name: Joi.string().optional(),
            dba_name: Joi.string().optional(),
            email: Joi.string().email().optional(),
            phone: Joi.string().optional(),
            website: Joi.string().uri().optional(),
            sic_detail: Joi.string().optional(),
            naics_detail: Joi.string().optional(),
            business_detail: Joi.object({
                ein: Joi.string().optional(),
                entity_type: Joi.string().optional(),
                incorporation_date: Joi.date().optional(),
                state_of_incorporation: Joi.string().optional()
            }).optional(),
            address_list: Joi.array().items(Joi.object({
                address_line_1: Joi.string().optional(),
                address_line_2: Joi.string().optional(),
                city: Joi.string().optional(),
                state: Joi.string().optional(),
                zip: Joi.string().optional()
            })).optional(),
            primary_contact: Joi.string().optional(),
            primary_owner: Joi.string().optional(),
            inactive: Joi.boolean().optional(),
            contact_list: Joi.array().optional()
        });

        // Combine params and body for validation
        const { value, error } = schema.validate({ ...req.params, ...req.body});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, contact_list, ...data } = value;

        // Check if the merchant is in the filter
        if (req.filter?.merchant_list && !req.filter.merchant_list.includes(id)) {
            return next(new ErrorResponse('Merchant is not allowed to be accessed with current login', 403));
        }

        if(data.primary_contact && contact_list && !contact_list.includes(data.primary_contact)) {
            contact_list.push(data.primary_contact);
        }

        if(data.primary_owner && contact_list && !contact_list.includes(data.primary_owner)) {
            contact_list.push(data.primary_owner);
        }

        const merchant = await MerchantService.updateMerchant(id, data);

        if(merchant && contact_list && contact_list.length > 0) {
            await ContactMerchantService.updateMerchantContactList(merchant._id, contact_list);
        }

        const updatedMerchant = await MerchantService.getMerchantById(id, default_populate, '', true);

        res.status(200).json({
            success: true,
            data: updatedMerchant
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete merchant
// @route   DELETE /api/v1/merchants/:id
// @access  Private (Admin only)
exports.deleteMerchant = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);   

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        if(req.filter?.merchant_list && !req.filter.merchant_list.includes(value.id)) {
            return next(new ErrorResponse('Merchant is not allowed to be accessed with current login', 403));
        }
            
        await MerchantService.deleteMerchant(value.id);

        res.status(200).json({
            success: true,
            message: 'Merchant deleted successfully'
        });
    } catch (err) {
        next(err);
    }
};
