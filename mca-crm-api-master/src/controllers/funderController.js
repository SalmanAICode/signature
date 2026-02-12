const Joi = require('joi');

const FunderService = require('../services/funderService');
const AuthService = require('../services/authService');

const { getFingerprint } = require('../utils/frontendInfo');
const { PORTAL_TYPES } = require('../utils/constants');
const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');

// Default populate for funder
// This is used to populate for funder list, funder details, funder update, funder create
// To make the object structure in the response consistent and avoid to write the same code over and over again
const default_populate = [];

// query schema for funder
const query_schema = {
    sort: Joi.string().allow('').optional(),
    select: Joi.string().allow('').optional(),
    search: Joi.string().allow('').optional(),
    // Following query parameters are based on fields from funder model
    name: Joi.string().allow('').optional(),
    email: Joi.string().allow('').optional(),
    phone: Joi.string().allow('').optional(),
    website: Joi.string().allow('').optional(),
    import: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    include_inactive: Joi.boolean().default(false).optional()
};

// Build dbQuery from query
const buildDbQuery = (req, query) => {
    const dbQuery = { $and: [] };

    // Add filter for different request portal
    // This is based on the req filters
    if (req.filter?.funder) {
        dbQuery.$and.push({ _id: req.filter.funder });
    } else if (req.filter?.funder_list) {
        dbQuery.$and.push({ _id: { $in: req.filter.funder_list } });
    }

    // Handle search
    if (query.search) {
        dbQuery.$and.push(Helpers.buildSearchFilter([
            'name',
            'email',
            'phone',
            'website',
            'business_detail.ein',
            'business_detail.entity_type',
            'business_detail.state_of_incorporation',
            'address_detail.address_1',
            'address_detail.address_2',
            'address_detail.city',
            'address_detail.state',
            'address_detail.zip'
        ], query.search));
    }

    // Handle fields from funder model
    if (query.name) dbQuery.$and.push(Helpers.buildSearchFilter('name', query.name));
    if (query.email) dbQuery.$and.push(Helpers.buildSearchFilter('email', query.email));
    if (query.phone) dbQuery.$and.push(Helpers.buildSearchFilter('phone', query.phone));
    if (query.website) dbQuery.$and.push(Helpers.buildSearchFilter('website', query.website));
    
    if (query.import) dbQuery.$and.push(Helpers.buildArrayFilter('import.source', query.import));

    if (!query.include_inactive) dbQuery.$and.push({ inactive: { $ne: true } });

    // Clear empty filters
    dbQuery.$and = dbQuery.$and.filter(filter => Object.keys(filter).length > 0);

    return dbQuery;
};

// @desc    Get all funders
// @route   GET /api/v1/funders
// @access  Private
exports.getFunders = async (req, res, next) => {
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
        const dbSort = Helpers.buildSort(sort, { name: 1 });

        const result = await FunderService.getFunders(
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

// @desc    Get funder list without pagination
// @route   GET /api/v1/funders/list
// @access  Private
exports.getFunderList = async (req, res, next) => {
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
        const dbSort = Helpers.buildSort(sort, { name: 1 });

        const funders = await FunderService.getFunderList(
            dbQuery,
            dbSort,
            default_populate,
            select || 'name email phone inactive',
            true  // Enable calculate flag
        );

        res.status(200).json({
            success: true,
            data: funders
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single funder
// @route   GET /api/v1/funders/:id
// @access  Private
exports.getFunder = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        // Check if the funder is in the filter
        if (req.filter?.funder_list && !req.filter.funder_list.includes(value.id)) {
            return next(new ErrorResponse('Funder is not allowed to be accessed with current login', 403));
        }

        const funder = await FunderService.getFunderById(value.id, default_populate, '', true);
        if (!funder) {
            return next(
                new ErrorResponse(`Funder not found with id of ${value.id}`, 404)
            );
        }

        res.status(200).json({
            success: true,
            data: funder
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new funder
// @route   POST /api/v1/funders
// @access  Private (Admin only)
exports.createFunder = async (req, res, next) => {
    try {
        const schema = Joi.object({
            name: Joi.string().required(),
            email: Joi.string().email().required(),
            phone: Joi.string().required(),
            website: Joi.string().uri().optional(),
            business_detail: Joi.object().optional(),
            address_detail: Joi.object().optional(),
            bgcolor: Joi.string().optional(),
            import: Joi.object().optional(),
            user_list: Joi.array().items(Joi.string()).optional()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        // If user_list is not provided, set it to the current user's id if the request is from funder portal
        if (!value.user_list || value.user_list?.length === 0) {
            if (req.portal === PORTAL_TYPES.FUNDER) {
                value.user_list = [req.id];
            } else {
                value.user_list = [];
            }
        }

        const { user_list, ...funderData } = value;

        const funder = await FunderService.createFunder(funderData, [], '', false, user_list);

        const newFunder = await FunderService.getFunderById(funder._id, default_populate, '', true);

        res.status(201).json({
            success: true,
            data: newFunder
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update funder
// @route   PUT /api/v1/funders/:id
// @access  Private (Admin only)
exports.updateFunder = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            name: Joi.string().optional(),
            email: Joi.string().email().optional(),
            phone: Joi.string().optional(),
            website: Joi.string().uri().optional(),
            business_detail: Joi.object().optional(),
            address_detail: Joi.object().optional(),
            bgcolor: Joi.string().optional(),
            import: Joi.object().optional(),
            inactive: Joi.boolean().optional()
        });

        // Combine params and body for validation
        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, ...funderData } = value;

        // Check if the funder is in the filter
        if (req.filter?.funder_list && !req.filter.funder_list.includes(id)) {
            return next(new ErrorResponse('Funder is not allowed to be accessed with current login', 404));
        }

        const funder = await FunderService.updateFunder(id, funderData, default_populate, '', true);

        if (!funder) {
            return next(
                new ErrorResponse(`Funder not found with id of ${id}`, 404)
            );
        }

        res.status(200).json({
            success: true,
            data: funder
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete funder
// @route   DELETE /api/v1/funders/:id
// @access  Private (Admin only)
exports.deleteFunder = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        if(req.filter?.funder_list && !req.filter.funder_list.includes(value.id)) {
            return next(new ErrorResponse('Funder is not allowed to be accessed with current login', 403));
        }

        await FunderService.deleteFunder(value.id);

        res.status(200).json({
            success: true,
            message: 'Funder deleted successfully'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get current selected funder
// @route   GET /api/v1/funders/select
// @access  Private
exports.getSelectedFunder = async (req, res, next) => {
    try {
        if (!req.filter?.funder) {
            return next(new ErrorResponse('No funder selected', 404));
        }

        const funder = await FunderService.getFunderById(req.filter.funder, default_populate, '', true);

        res.status(200).json({
            success: true,
            data: funder
        });
    } catch (err) {
        next(err);
    }
};


// @desc    Select funder
// @route   POST /api/v1/funders/select
// @access  Private
// @return  Access token
exports.selectFunder = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id } = value;

        // Check if the funder is in the filter's funder_list
        if (!req.filter?.funder_list || !req.filter.funder_list.includes(id)) {
            return next(new ErrorResponse('Funder is not allowed to be selected with current login', 403));
        }

        // Revoke the refresh token
        await AuthService.revokeRefreshToken(req.cookies.refreshToken);

        // Regenerate the access token and refresh token
        const filter = { ...req.filter, funder: id };
        const fingerprint = getFingerprint(req);

        const accessToken = await AuthService.generateAccessToken(req.id, req.portal, req.role, filter, fingerprint);

        const refreshToken = await AuthService.generateRefreshToken(req.id, req.portal, req.role, filter, fingerprint);

        // Set refresh token in HttpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
        });

        res.status(200).json({
            success: true,
            accessToken,
            funder: id
        });
    } catch (err) {
        next(err);
    }
};