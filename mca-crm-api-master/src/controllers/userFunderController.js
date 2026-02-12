const Joi = require('joi');

const UserFunderService = require('../services/userFunderService');
const FunderService = require('../services/funderService');
const UserService = require('../services/userService');

const ErrorResponse = require('../utils/errorResponse');

// Default populate for funders
// It should be the same as the funder controller
const default_funder_populate = [];

// Default populate for users
// It should be the same as the user controller
const default_user_populate = [];

// @desc    Get funders of a user (with pagination)
// @route   GET /api/v1/users/:id/funders
// @access  Private
exports.getUserFunders = async (req, res, next) => {
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

        let funderIds = await UserFunderService.getFundersByUserId(value.id);

        // Handle filter
        if (req.filter?.funder_list) {
            funderIds = funderIds.filter(funder => req.filter.funder_list.includes(funder));
        }

        let dbQuery = {};
        dbQuery._id = { $in: funderIds };
        
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

        const result = await FunderService.getFunders(
            dbQuery,
            dbSort,
            value.page,
            value.limit,
            default_funder_populate
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        next(err);
    }
};

// @desc    List all funders of a user (without pagination)
// @route   GET /api/v1/users/:id/funders/list
// @access  Private
exports.getUserFunderList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            include_inactive: Joi.boolean().default(false).optional(),
        });

        const { value, error } = schema.validate({...req.params, ...req.query});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        let funderIds = await UserFunderService.getFundersByUserId(value.id);

        // Handle filter
        if (req.filter?.funder_list) {
            funderIds = funderIds.filter(funder => req.filter.funder_list.includes(funder));
        }

        let dbQuery = {};
        dbQuery._id = { $in: funderIds };

        // Handle include_inactive
        if (!value.include_inactive) {
            dbQuery.inactive = { $ne: true };
        }

        const funders = await FunderService.getFunderList(dbQuery, [],'name email phone inactive', { name: 1 });

        res.status(200).json({
            success: true,
            data: funders
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Add a funder to user
// @route   POST /api/v1/users/:id/funders
// @access  Private
exports.createUserFunder = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            funder: Joi.string().required()
        });

        const { value, error } = schema.validate({...req.params, ...req.body});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const userFunder = await UserFunderService.createUserFunder(value.id, value.funder);

        const funder = await FunderService.getFunderById(userFunder.funder, default_funder_populate);

        res.status(201).json({
            success: true,
            data: funder
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Remove a funder from user
// @route   DELETE /api/v1/users/:id/funders/:funderId
// @access  Private
exports.deleteUserFunder = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            funderId: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        await UserFunderService.deleteUserFunder(value.id, value.funderId);

        res.status(200).json({
            success: true,
            message: 'Funder removed from user successfully'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get users of a funder (with pagination)
// @route   GET /api/v1/funders/:id/users
// @access  Private
exports.getFunderUsers = async (req, res, next) => {
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
        if (req.filter?.funder_list) {
            if (!req.filter.funder_list.includes(value.id)) {
                return next(new ErrorResponse('Funder is not allowed to be accessed with current login', 403));
            }
        }

        let userIds = await UserFunderService.getUsersByFunderId(value.id);

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

// @desc    List all users of a funder (without pagination)
// @route   GET /api/v1/funders/:id/users/list
// @access  Private
exports.getFunderUsersList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            include_inactive: Joi.boolean().default(false).optional()
        });

        const { value, error } = schema.validate({...req.params, ...req.query});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        // Handle filter
        if (req.filter?.funder_list) {
            if (!req.filter.funder_list.includes(value.id)) {
                return next(new ErrorResponse('Funder is not allowed to be accessed with current login', 403));
            }
        }

        let userIds = await UserFunderService.getUsersByFunderId(value.id);

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

// @desc    Add a user to funder
// @route   POST /api/v1/funders/:id/users
// @access  Private
exports.createFunderUser = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            user: Joi.string().required()
        });

        const { value, error } = schema.validate({...req.params, ...req.body});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const userFunder = await UserFunderService.createUserFunder(value.user, value.id);

        const user = await UserService.getUserById(userFunder.user, default_user_populate);

        res.status(201).json({
            success: true,
            data: user
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Remove a user from funder
// @route   DELETE /api/v1/funders/:id/users/:userId
// @access  Private
exports.deleteFunderUser = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            userId: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        await UserFunderService.deleteUserFunder(value.userId, value.id);

        res.status(200).json({
            success: true,
            message: 'User removed from funder successfully'
        });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Get cache statistics
 * @route   GET /api/v1/user-funders/cache/stats
 * @access  Private (Admin only)
 */
exports.getCacheStats = async (req, res) => {
    try {
        const stats = UserFunderService.cache.getStats();
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
 * @route   DELETE /api/v1/user-funders/cache
 * @access  Private (Admin only)
 */
exports.clearCache = async (req, res) => {
    try {
        UserFunderService.cache.clear();
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
 * @desc    Invalidate cache for specific user
 * @route   DELETE /api/v1/user-funders/cache/user/:userId
 * @access  Private (Admin only)
 */
exports.invalidateUserCache = async (req, res) => {
    try {
        const { userId } = req.params;
        UserFunderService.cache.invalidateUser(userId);
        res.json({
            success: true,
            message: `Cache invalidated for user ${userId}`
        });
    } catch (error) {
        console.error('Error invalidating user cache:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to invalidate user cache',
            error: error.message
        });
    }
};

/**
 * @desc    Invalidate cache for specific funder
 * @route   DELETE /api/v1/user-funders/cache/funder/:funderId
 * @access  Private (Admin only)
 */
exports.invalidateFunderCache = async (req, res) => {
    try {
        const { funderId } = req.params;
        UserFunderService.cache.invalidateFunder(funderId);
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

