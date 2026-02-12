const Joi = require('joi');

const UserLenderService = require('../services/userLenderService');
const LenderService = require('../services/lenderService');
const UserService = require('../services/userService');

const ErrorResponse = require('../utils/errorResponse');

// Default populate for lenders
// It should be the same as the lender controller
const default_lender_populate = [];

// Default populate for users
// It should be the same as the user controller
const default_user_populate = [];

// @desc    Get lenders of a user (with pagination)
// @route   GET /api/v1/users/:id/lenders
// @access  Private
exports.getUserLenders = async (req, res, next) => {
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

        let lenderIds = await UserLenderService.getLendersByUserId(value.id);

        let dbQuery = {};
        dbQuery._id = { $in: lenderIds };
        
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
        let dbSort = {};
        if (value.sort) {
            const sortFields = value.sort.split(',');
            sortFields.forEach(field => {
                if (field.startsWith('-')) {
                    dbSort[field.substring(1)] = -1;
                } else {
                    dbSort[field] = 1;
                }
            });
        }

        const result = await LenderService.getLenders(
            dbQuery,
            dbSort,
            value.page,
            value.limit,
            default_lender_populate
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        next(err);
    }
};

// @desc    List all lenders of a user (without pagination)
// @route   GET /api/v1/users/:id/lenders/list
// @access  Private
exports.getUserLenderList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            include_inactive: Joi.boolean().default(false).optional(),
        });

        const { value, error } = schema.validate({...req.params, ...req.query});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        let lenderIds = await UserLenderService.getLendersByUserId(value.id);

        let dbQuery = {};
        dbQuery._id = { $in: lenderIds };

        // Handle include_inactive
        if (!value.include_inactive) {
            dbQuery.inactive = { $ne: true };
        }

        const lenders = await LenderService.getLenderList(dbQuery, [],'name email phone inactive', { name: 1 });

        res.status(200).json({
            success: true,
            data: lenders
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Add a lender to user
// @route   POST /api/v1/users/:id/lenders
// @access  Private
exports.createUserLender = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            lender: Joi.string().required()
        });

        const { value, error } = schema.validate({...req.params, ...req.body});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const userLender = await UserLenderService.createUserLender(value.id, value.lender);

        const lender = await LenderService.getLenderById(userLender.lender, default_lender_populate);

        res.status(201).json({
            success: true,
            data: lender
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Remove a lender from user
// @route   DELETE /api/v1/users/:id/lenders/:lenderId
// @access  Private
exports.deleteUserLender = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            lenderId: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        await UserLenderService.deleteUserLender(value.id, value.lenderId);

        res.status(200).json({
            success: true,
            message: 'Lender removed from user successfully'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get users of a lender (with pagination)
// @route   GET /api/v1/lenders/:id/users
// @access  Private
exports.getLenderUsers = async (req, res, next) => {
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

        let userIds = await UserLenderService.getUsersByLenderId(value.id);

        let dbQuery = {};
        dbQuery._id = { $in: userIds };

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
        let dbSort = {};
        if (value.sort) {
            const sortFields = value.sort.split(',');
            sortFields.forEach(field => {
                if (field.startsWith('-')) {
                    dbSort[field.substring(1)] = -1;
                } else {
                    dbSort[field] = 1;
                }
            });
        }

        const result = await UserService.getUsers(
            dbQuery,
            dbSort,
            value.page,
            value.limit,
            default_user_populate
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        next(err);
    }
};

// @desc    List all users of a lender (without pagination)
// @route   GET /api/v1/lenders/:id/users/list
// @access  Private
exports.getLenderUsersList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            include_inactive: Joi.boolean().default(false).optional()
        });

        const { value, error } = schema.validate({...req.params, ...req.query});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        let userIds = await UserLenderService.getUsersByLenderId(value.id);

        let dbQuery = {};
        dbQuery._id = { $in: userIds };

        // Handle include_inactive
        if (!value.include_inactive) {
            dbQuery.inactive = { $ne: true };
        }

        const users = await UserService.getUserList(dbQuery, [], 'first_name last_name email phone_mobile inactive', { first_name: 1, last_name: 1 });

        res.status(200).json({
            success: true,
            data: users
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Add a user to lender
// @route   POST /api/v1/lenders/:id/users
// @access  Private
exports.createLenderUser = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            user: Joi.string().required()
        });

        const { value, error } = schema.validate({...req.params, ...req.body});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const userLender = await UserLenderService.createUserLender(value.user, value.id);

        const user = await UserService.getUserById(userLender.user, default_user_populate);

        res.status(201).json({
            success: true,
            data: user
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Remove a user from lender
// @route   DELETE /api/v1/lenders/:id/users/:userId
// @access  Private
exports.deleteLenderUser = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            userId: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        await UserLenderService.deleteUserLender(value.userId, value.id);

        res.status(200).json({
            success: true,
            message: 'User removed from lender successfully'
        });
    } catch (err) {
        next(err);
    }
};

