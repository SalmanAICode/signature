const Joi = require('joi');

const AdminService = require('../services/adminService');

const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');

// Default populate for admin
// This is used to populate for admin details, admin update, admin create
// To make the object structure in the response consistent and avoid to write the same code over and over again
const default_populate = [
    { path: 'access_log_count' }
];

// Default query schema for admin
const query_schema = {
    sort: Joi.string().allow('').optional(),
    search: Joi.string().allow('').optional(),
    include_inactive: Joi.boolean().default(false).optional()
};

// Build database query for admin
const buildDbQuery = (req, query) => {
    const dbQuery = {};

    dbQuery.$and = [];

    // Handle include_inactive
    if (!query.include_inactive) dbQuery.$and.push({ inactive: { $ne: true } });

    // Handle search
    if (query.search) {
        dbQuery.$or = [
            { first_name: { $regex: query.search, $options: 'i' } },
            { last_name: { $regex: query.search, $options: 'i' } },
            { email: { $regex: query.search, $options: 'i' } },
            { phone_mobile: { $regex: query.search, $options: 'i' } },
            { phone_work: { $regex: query.search, $options: 'i' } },
            { phone_home: { $regex: query.search, $options: 'i' } }
        ];
    }

    return dbQuery;
};

// @desc    Get current logged in admin
// @route   GET /api/v1/admins/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const admin = await AdminService.getAdminById(req.id, default_populate);

        res.status(200).json({
            success: true,
            data: admin
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update admin details, this is only for the login admin
// @route   PUT /api/v1/admins/updatedetails
// @access  Private
exports.updateDetails = async (req, res, next) => {
    try {
        const schema = Joi.object({
            first_name: Joi.string(),
            last_name: Joi.string(),
            email: Joi.string().email(),
            phone_mobile: Joi.string(),
            phone_work: Joi.string(),
            phone_home: Joi.string(),
            birthday: Joi.date(),
            address_detail: Joi.any().optional()
        });

        const { value, error } = schema.validate(req.body);
        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const admin = await AdminService.updateAdmin(req.id, value, default_populate);

        res.status(200).json({
            success: true,
            data: admin
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update password
// @route   PUT /api/v1/admins/updatepassword
// @access  Private
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

        const admin = await AdminService.getAdminById(req.id, [], '+password', false); // Include password, but don't populate access_log_list

        // Check current password
        if (!(await admin.matchPassword(value.currentPassword))) {
            return next(new ErrorResponse('Password is incorrect', 400));
        }

        await AdminService.updateAdminPassword(req.id, value.newPassword);

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all admins
// @route   GET /api/v1/admins
// @access  Private/Admin
exports.getAdmins = async (req, res, next) => {
    try {
        const schema = Joi.object({
            page: Joi.number().default(1).optional(),
            limit: Joi.number().default(10).optional(),
            ...query_schema
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { page, limit, sort, ...query } = value;

        // Build database query
        const dbQuery = buildDbQuery(req, query);
    
        // Handle sorting
        const dbSort = Helpers.buildSort(sort, { last_name: 1, first_name: 1 });
        
        const admins = await AdminService.getAdmins(
            dbQuery,
            page,
            limit,
            dbSort,
            default_populate
        );
        
        res.status(200).json({
            success: true,
            data: admins
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get admin list
// @route   GET /api/v1/admins/list
// @access  Private/Admin
exports.getAdminList = async (req, res, next) => {  
    try {
        const schema = Joi.object({
            ...query_schema
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { sort, ...query } = value;

        // Build database query
        const dbQuery = buildDbQuery(req, query);

        // Handle sorting
        const dbSort = Helpers.buildSort(sort, { last_name: 1, first_name: 1 });
        
        const admins = await AdminService.getAdminList(dbQuery, dbSort, [], 'first_name last_name email phone_mobile inactive');

        res.status(200).json({
            success: true,
            data: admins
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single admin
// @route   GET /api/v1/admins/:id
// @access  Private/Admin
exports.getAdmin = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }
        
        const { id } = value;

        const admin = await AdminService.getAdminById(id, default_populate);
        
        res.status(200).json({
            success: true,
            data: admin
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new admin
// @route   POST /api/v1/admins
// @access  Private/Admin
exports.createAdmin = async (req, res, next) => {
    try {
        const schema = Joi.object({
            first_name: Joi.string().required(),
            last_name: Joi.string().required(),
            email: Joi.string().email().required(),
            phone_mobile: Joi.string().required(),
            phone_work: Joi.string().optional(),
            phone_home: Joi.string().optional(),
            birthday: Joi.date().optional(),
            address_detail: Joi.any().optional(),
            password: Joi.string().required()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const data = { ...value };
        
        const admin = await AdminService.createAdmin(data, default_populate);
        
        res.status(201).json({
            success: true,
            data: admin
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update admin
// @route   PUT /api/v1/admins/:id
// @access  Private/Admin
exports.updateAdmin = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            first_name: Joi.string().optional(),
            last_name: Joi.string().optional(),
            email: Joi.string().email().optional(),
            phone_mobile: Joi.string().optional(),
            phone_work: Joi.string().optional(),
            phone_home: Joi.string().optional(),
            birthday: Joi.date().optional(),
            address_detail: Joi.any().optional()
        });

        const { value, error } = schema.validate({...req.params, ...req.body});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, ...data } = value;

        const admin = await AdminService.updateAdmin(id, data, default_populate);
        
        res.status(200).json({
            success: true,
            data: admin
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete admin
// @route   DELETE /api/v1/admins/:id
// @access  Private/Admin
exports.deleteAdmin = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id } = value;
        
        const deletedAdmin = await AdminService.deleteAdmin(id);
        
        res.status(200).json({
            success: true,
            message: 'Admin deleted successfully',
            data: deletedAdmin
        });
    } catch (err) {
        next(err);
    }
}; 