const Joi = require('joi');

const UserService = require('../services/userService');
const UserFunderService = require('../services/userFunderService');

const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');
const { ROLES } = require('../utils/permissions');

// Default populate for user
// This is used to populate for user list, user details, user update, user create
// To make the object structure in the response consistent and avoid to write the same code over and over again
const default_populate = [
    { path: 'funder_count' },
    { path: 'access_log_count' }
];

// query schema for user
const query_schema = {
    sort: Joi.string().allow('').optional(),
    select: Joi.string().allow('').optional(),
    funder: Joi.string().optional(),
    search: Joi.string().allow('').optional(),
    // Following query parameters are based on fields from user model
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

// Build db query for user
const buildDbQuery = async (req, query) => {
    const dbQuery = {$and: []};

    // Add filter for different request portal
    // This is based on the req filters
    const funderIds = await Helpers.getAccessableFunderIds(req);

    if (funderIds) {
        if (query.funder) {
            if (funderIds.includes(query.funder)) {
                const userIds = await UserFunderService.getUsersByFunderId(query.funder);
                dbQuery.$and.push({ _id: { $in: userIds } });
            } else {
                throw new ErrorResponse(`You are not allowed to access this funder ${query.funder}`, 403);
            }
        } else {
            const userIds = await UserFunderService.getUsersByFunderIds(funderIds);
            dbQuery.$and.push({ _id: { $in: userIds } });
        }
    } else if (query.funder) {
        const userIds = await UserFunderService.getUsersByFunderId(query.funder);
        dbQuery.$and.push({ _id: { $in: userIds } });
    }

    // Handle search
    if (query.search) {
        dbQuery.$and.push(Helpers.buildSearchFilter([
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

    // Handle fields from user model
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

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private
exports.getUsers = async (req, res, next) => {
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

        const users = await UserService.getUsers(dbQuery, dbSort, page, limit, default_populate, select);

        res.status(200).json({
            success: true,
            data: users
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get user list without pagination
// @route   GET /api/v1/users/list
// @access  Private
exports.getUserList = async (req, res, next) => {
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

        const users = await UserService.getUserList(dbQuery, dbSort, [], select || 'first_name last_name email phone_mobile inactive');

        res.status(200).json({
            success: true,
            data: users
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get current logged in user
// @route   GET /api/v1/users/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const user = await UserService.getUserById(req.id, default_populate);

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update user details
// @route   PUT /api/v1/users/updatedetails
// @access  Private
exports.updateDetails = async (req, res, next) => {
    try {
        const schema = Joi.object({
            first_name: Joi.string().optional(),
            last_name: Joi.string().optional(),
            email: Joi.string().email().optional(),
            phone_mobile: Joi.string().optional(),
            phone_work: Joi.string().optional(),
            phone_home: Joi.string().optional(),
            birthday: Joi.date().optional(),
            address_detail: Joi.any().optional(),
            permission_list: Joi.array().items(Joi.string()).optional()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const user = await UserService.updateUser(req.id, value, default_populate);

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update password
// @route   PUT /api/v1/users/updatepassword
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

        const user = await UserService.getUserById(req.id, [], '+password', false);  // Include password, but don't populate

        // Check current password
        if (!(await user.matchPassword(value.currentPassword))) {
            return next(new ErrorResponse('Password is incorrect', 400));
        }

        await UserService.updateUserPassword(req.id, value.newPassword);

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private
exports.getUser = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }
        
        // Check if user is himself or if user is in the filter
        if (req.id !== value.id) {
            if (req.filter?.funder_list) {
                const userFunders = await UserFunderService.getUsersByFunderIds(req.filter.funder_list);
                if (!userFunders.includes(value.id)) {
                    return next(new ErrorResponse('User is not allowed to be accessed with current login', 403));
                }
            }
        }

        const user = await UserService.getUserById(value.id, default_populate); // Don't include password, but populate

        if (!user) {
            return next(
                new ErrorResponse(`User not found with id of ${value.id}`, 404)
            );
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new user
// @route   POST /api/v1/users
// @access  Private
exports.createUser = async (req, res, next) => {
    try {
        const schema = Joi.object({
            first_name: Joi.string().required(),
            last_name: Joi.string().required(),
            email: Joi.string().email().required(),
            phone_mobile: Joi.string().required(),
            phone_work: Joi.string().allow('').optional(),
            phone_home: Joi.string().allow('').optional(),
            birthday: Joi.date().optional(),
            address_detail: Joi.any().optional(),
            type: Joi.string().optional(),
            permission_list: Joi.array().items(Joi.string()).optional(),
            password: Joi.string().required(),
            funder_list: Joi.array().items(Joi.string()).optional()
        });

        const { value, error } = schema.validate(req.body);

         if (error) {
             return next(new ErrorResponse(error.message, 400));
         }

         // For email verification flow, ensure the email matches the verified email
         if (req.role === ROLES.PENDING_USER) {
             if (value.email !== req.verifiedEmail) {
                 return next(
                     new ErrorResponse(
                         "Email in request body must match the verified email",
                         400
                     )
                 );
             }
         }

         // Add current funder to funder_list if it is not provided
        if (req.filter?.funder) {
            if (!value.funder_list) {
                value.funder_list = [req.filter.funder];
            } else if (!value.funder_list.includes(req.filter.funder)) {
                value.funder_list.push(req.filter.funder);
            }
        }

        const { funder_list, ...userData } = value;

        const user = await UserService.createUser(userData);

        // Create user funder relations if funder_list is provided
        if (user && funder_list) {
            for (const funder of funder_list) {
                await UserFunderService.createUserFunder(user._id, funder);
            }
        }

        const newUser = await UserService.getUserById(user._id, default_populate);

        res.status(201).json({
            success: true,
            data: newUser
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private
exports.updateUser = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            first_name: Joi.string().optional(),
            last_name: Joi.string().optional(),
            email: Joi.string().email().optional(),
            phone_mobile: Joi.string().allow('').optional(),
            phone_work: Joi.string().allow('').optional(),
            phone_home: Joi.string().allow('').optional(),
            birthday: Joi.date().optional(),
            address_detail: Joi.any().optional(),
            type: Joi.string().optional(),
            permission_list: Joi.array().items(Joi.string()).optional(),
            inactive: Joi.boolean().optional(),
            funder_list: Joi.array().items(Joi.string()).optional()
        });

        // Combine params and body for validation
        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, ...userData } = value;

        // Check filter for funder permission
        if (req.filter?.funder_list) {
            const userFunder = await UserFunderService.getUsersByFunderIds(req.filter.funder_list);
            if (!userFunder.includes(id)) {
                return next(new ErrorResponse(`Access denied: You are not authorized to update this user with ID ${id}.`, 403));
            }
        }
        if(userData.funder_list) {
            if(req.filter?.funder_list) {
                if(!userData.funder_list.every(funder => req.filter.funder_list.includes(funder))) {
                    return next(new ErrorResponse(`You do not have permission to access the funder ${userData.funder_list.find(funder => !req.filter.funder_list.includes(funder))}.`, 403));
                }
            }
            await UserFunderService.updateUserFunderWithIdAndFunderList(id, userData.funder_list);
        }
        const user = await UserService.updateUser(id, userData, default_populate);

        if (!user) {
            return next(
                new ErrorResponse(`User not found with id of ${id}`, 404)
            );
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private
exports.deleteUser = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id } = value;

        // Check filter for funder permission
        if (req.filter?.funder_list) {
            const userFunder = await UserFunderService.getUsersByFunderIds(req.filter.funder_list);
            if (!userFunder.includes(id)) {
                return next(new ErrorResponse(`Access denied: You are not authorized to delete this user with ID ${id}.`, 403));
            }
        }

        await UserService.deleteUser(id);

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (err) {
        next(err);
    }
};
