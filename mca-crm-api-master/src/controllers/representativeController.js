const Joi = require('joi');

const RepresentativeService = require('../services/representativeService');
const RepresentativeISOService = require('../services/representativeISOService');
const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');

// Default populate for representative
// This is used to populate for representative list, representative details, representative update, representative create
// To make the object structure in the response consistent and avoid to write the same code over and over again
const default_populate = [
    { path: 'iso_count' },
    { path: 'access_log_count' }
];

// query schema for representative
const query_schema = {
    sort: Joi.string().allow('').optional(),
    select: Joi.string().allow('').optional(),
    iso: Joi.string().optional(),
    search: Joi.string().allow('').optional(),
    // Following query parameters are based on fields from representative model
    title: Joi.string().allow('').optional(),
    first_name: Joi.string().allow('').optional(),
    last_name: Joi.string().allow('').optional(),
    email: Joi.string().allow('').optional(),
    phone_mobile: Joi.string().allow('').optional(),
    phone_work: Joi.string().allow('').optional(),
    phone_home: Joi.string().allow('').optional(),
    birthday_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    birthday_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    address_detail: Joi.string().allow('').optional(),
    type: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    last_login_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    last_login_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    online: Joi.boolean().optional(),
    include_inactive: Joi.boolean().default(false).optional(),
    createdAt_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    createdAt_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    updatedAt_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    updatedAt_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional()
};

// Build db query for representative
const buildDbQuery = async (req, query) => {
    const dbQuery = {$and: []};

    // Add filter for different request portal
    // This is based on the req filters
    const accessableIsoIds = await Helpers.getAccessableIsoIds(req);

    if (accessableIsoIds) {
        if (query.iso) {
            if (accessableIsoIds.includes(query.iso)) {
                const representativeIds = await RepresentativeISOService.getRepresentativesByISOIds([query.iso]);
                dbQuery.$and.push({ _id: { $in: representativeIds } });
            } else {
                throw new ErrorResponse(`You are not allowed to access this ISO ${query.iso}`, 403);
            }
        } else {
            const representativeIds = await RepresentativeISOService.getRepresentativesByISOIds(accessableIsoIds);
            dbQuery.$and.push({ _id: { $in: representativeIds } });
        }
    } else if (query.iso) {
        const representativeIds = await RepresentativeISOService.getRepresentativesByISOIds([query.iso]);
        dbQuery.$and.push({ _id: { $in: representativeIds } });
    }

    // Handle search
    if (query.search) {
        dbQuery.$and.push(Helpers.buildSearchFilter([
            'title',
            'first_name',
            'last_name',
            'email',
            'phone_mobile',
            'phone_work',
            'phone_home',
            'address_detail.address_1',
            'address_detail.address_2',
            'address_detail.city',
            'address_detail.state',
            'address_detail.zip'
        ], query.search));
    }

    // Handle fields from representative model
    if (query.title) dbQuery.$and.push(Helpers.buildSearchFilter('title', query.title));
    if (query.first_name) dbQuery.$and.push(Helpers.buildSearchFilter('first_name', query.first_name));
    if (query.last_name) dbQuery.$and.push(Helpers.buildSearchFilter('last_name', query.last_name));
    if (query.email) dbQuery.$and.push(Helpers.buildSearchFilter('email', query.email));
    if (query.phone_mobile) dbQuery.$and.push(Helpers.buildSearchFilter('phone_mobile', query.phone_mobile));
    if (query.phone_work) dbQuery.$and.push(Helpers.buildSearchFilter('phone_work', query.phone_work));
    if (query.phone_home) dbQuery.$and.push(Helpers.buildSearchFilter('phone_home', query.phone_home));
    
    if (query.birthday_from) dbQuery.$and.push(Helpers.buildGTEFilter('birthday', query.birthday_from));
    if (query.birthday_to) dbQuery.$and.push(Helpers.buildLTEFilter('birthday', query.birthday_to));

    if (query.address_detail) dbQuery.$and.push(Helpers.buildSearchFilter([
        'address_detail.address_1', 
        'address_detail.address_2', 
        'address_detail.city', 
        'address_detail.state', 
        'address_detail.zip'
    ], query.address_detail));

    if (query.type) dbQuery.$and.push(Helpers.buildArrayFilter('type', query.type));

    if (query.last_login_from) dbQuery.$and.push(Helpers.buildGTEFilter('last_login', query.last_login_from));
    if (query.last_login_to) dbQuery.$and.push(Helpers.buildLTEFilter('last_login', query.last_login_to));

    if (query.online !== undefined) dbQuery.$and.push(Helpers.buildBooleanFilter('online', query.online));

    if (!query.include_inactive) dbQuery.$and.push({ inactive: { $ne: true } });

    if (query.createdAt_from) dbQuery.$and.push(Helpers.buildGTEFilter('createdAt', query.createdAt_from));
    if (query.createdAt_to) dbQuery.$and.push(Helpers.buildLTEFilter('createdAt', query.createdAt_to));
    if (query.updatedAt_from) dbQuery.$and.push(Helpers.buildGTEFilter('updatedAt', query.updatedAt_from));
    if (query.updatedAt_to) dbQuery.$and.push(Helpers.buildLTEFilter('updatedAt', query.updatedAt_to));

    // Remove empty $and
    dbQuery.$and = dbQuery.$and.filter(item => Object.keys(item).length > 0);

    return dbQuery;
};

// @desc    Get all representatives
// @route   GET /api/v1/representatives
// @access  Bookkeeper Admin ISO_SALES ISO_MANAGER
exports.getRepresentatives = async (req, res, next) => {
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
        const dbSort = Helpers.buildSort(sort, { last_name: 1, first_name: 1 }); // Default sort

        const representatives = await RepresentativeService.getRepresentatives(dbQuery, dbSort, page, limit, default_populate, select);

        res.status(200).json({
            success: true,
            data: representatives
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get representative list without pagination
// @route   GET /api/v1/representatives/list
// @access  Bookkeeper Admin ISO_SALES ISO_MANAGER
exports.getRepresentativeList = async (req, res, next) => {
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

        const dbSort = Helpers.buildSort(sort, { last_name: 1, first_name: 1 });

        const representatives = await RepresentativeService.getRepresentativeList(dbQuery, dbSort, [], select || 'first_name last_name email phone_mobile inactive');

        res.status(200).json({
            success: true,
            data: representatives
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get current logged in representative
// @route   GET /api/v1/representatives/me
// @access  ISO_SALES ISO_MANAGER
exports.getMe = async (req, res, next) => {
    try {
        const representative = await RepresentativeService.getRepresentativeById(req.id, default_populate);

        res.status(200).json({
            success: true,
            data: representative
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update representative details
// @route   PUT /api/v1/representatives/updatedetails
// @access  ISO_SALES ISO_MANAGER
exports.updateDetails = async (req, res, next) => {
    try {
        const schema = Joi.object({
            title: Joi.string().optional(),
            first_name: Joi.string().optional(),
            last_name: Joi.string().optional(),
            email: Joi.string().email().optional(),
            phone_mobile: Joi.string().optional(),
            phone_work: Joi.string().optional(),
            phone_home: Joi.string().optional(),
            birthday: Joi.date().optional(),
            address_detail: Joi.object({
                address_1: Joi.string().optional(),
                address_2: Joi.string().optional(),
                city: Joi.string().optional(),
                state: Joi.string().optional(),
                zip: Joi.string().optional()
            }).optional()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const representative = await RepresentativeService.updateRepresentative(req.id, value, default_populate);

        res.status(200).json({
            success: true,
            data: representative
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update password
// @route   PUT /api/v1/representatives/updatepassword
// @access  ISO_SALES ISO_MANAGER
exports.updatePassword = async (req, res, next) => {
    try {
        const schema = Joi.object({
            currentPassword: Joi.string().required(),
            newPassword: Joi.string().required()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const representative = await RepresentativeService.getRepresentativeById(req.id, [], '+password', false);  // Include password, but don't populate

        // Check current password
        if (!(await representative.matchPassword(value.currentPassword))) {
            return next(new ErrorResponse('Password is incorrect', 400));
        }

        await RepresentativeService.updateRepresentativePassword(req.id, value.newPassword);

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single representative
// @route   GET /api/v1/representatives/:id
// @access  Bookkeeper Admin ISO_SALES ISO_MANAGER
exports.getRepresentative = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }


        if (req.filter?.iso_list) {
            const representativeList = await RepresentativeISOService.getRepresentativesByISOIds(req.filter.iso_list);
            if (!representativeList.includes(value.id)) {
                return next(new ErrorResponse('Representative is not allowed to be accessed with current login', 403));
            }
        }

        const representative = await RepresentativeService.getRepresentativeById(value.id, default_populate);

        if (!representative) {
            return next(
                new ErrorResponse(`Representative not found with id of ${value.id}`, 404)
            );
        }

        res.status(200).json({
            success: true,
            data: representative
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new representative
// @route   POST /api/v1/representatives
// @access  Admin ISO_MANAGER
exports.createRepresentative = async (req, res, next) => {
    try {
        const schema = Joi.object({
            title: Joi.string().optional(),
            first_name: Joi.string().required(),
            last_name: Joi.string().required(),
            email: Joi.string().email().required(),
            phone_mobile: Joi.string().required(),
            phone_work: Joi.string().optional(),
            phone_home: Joi.string().optional(),
            birthday: Joi.date().optional(),
            address_detail: Joi.object().optional(),
            password: Joi.string().required(),
            type: Joi.string().optional(),
            iso_list: Joi.array().items(Joi.string()).optional()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { iso_list, ...data } = value;

        if (iso_list) {
            if (req.filter?.iso_list && iso_list.some(iso => !req.filter.iso_list.includes(iso))) {
                return next(new ErrorResponse('Representative is not allowed to be created with current login', 403));
            }
        }

        const representative = await RepresentativeService.createRepresentative(data);

        if (representative && iso_list && iso_list.length > 0) {
            await RepresentativeISOService.updateRepresentativeISOList(representative._id, iso_list);
        }

        const createdRepresentative = await RepresentativeService.getRepresentativeById(representative._id, default_populate);

        res.status(201).json({
            success: true,
            data: createdRepresentative
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update representative
// @route   PUT /api/v1/representatives/:id
// @access  Admin ISO_MANAGER
exports.updateRepresentative = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            title: Joi.string().optional(),
            first_name: Joi.string().optional(),
            last_name: Joi.string().optional(),
            email: Joi.string().email().optional(),
            phone_mobile: Joi.string().optional(),
            phone_work: Joi.string().optional(),
            phone_home: Joi.string().optional(),
            birthday: Joi.date().optional(),
            type: Joi.string().optional(),
            address_detail: Joi.object().optional(),
            inactive: Joi.boolean().optional(),
            iso_list: Joi.array().items(Joi.string()).optional()
        });


        // Combine params and body for validation
        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, iso_list, ...data } = value;

        if(req.filter?.iso_list) {
            const representativeList = await RepresentativeISOService.getRepresentativesByISOIds(req.filter.iso_list);
            if (!representativeList.includes(id)) {
                return next(new ErrorResponse('Representative is not allowed to be updated with current login', 403));
            }
        }

        const representative = await RepresentativeService.updateRepresentative(id, data);

        if (iso_list) {
            await RepresentativeISOService.updateRepresentativeISOList(representative._id, iso_list);
        }

        const updatedRepresentative = await RepresentativeService.getRepresentativeById(representative._id, default_populate);

        res.status(200).json({
            success: true,
            data: updatedRepresentative
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete representative
// @route   DELETE /api/v1/representatives/:id
// @access  Admin ISO_MANAGER
exports.deleteRepresentative = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id } = value;

        if(req.filter?.iso_list) {
            const representativeList = await RepresentativeISOService.getRepresentativesByISOIds(req.filter.iso_list);
            if (!representativeList.includes(id)) {
                return next(new ErrorResponse('Representative is not allowed to be deleted with current login', 403));
            }
        }

        await RepresentativeService.deleteRepresentative(id);

        res.status(200).json({
            success: true,
            message: 'Representative deleted successfully'
        });
    } catch (err) {
        next(err);
    }
};
