const Joi = require('joi');

const bookkeeperService = require('../services/bookkeeperService');

const ErrorResponse = require('../utils/errorResponse');

// @desc    Get current logged in bookkeeper
// @route   GET /api/v1/bookkeepers/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const bookkeeper = await bookkeeperService.getBookkeeperById(req.id);

        res.status(200).json({
            success: true,
            data: bookkeeper
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update bookkeeper details, this is only for the login bookkeeper
// @route   PUT /api/v1/bookkeepers/updatedetails
// @access  Private
exports.updateDetails = async (req, res, next) => {
    try {
        const schema = Joi.object({
            first_name: Joi.string(),
            last_name: Joi.string(),
            email: Joi.string().email(),
            phone_mobile: Joi.string()
        });

        const { value, error } = schema.validate(req.body);
        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const bookkeeper = await bookkeeperService.updateBookkeeper(req.id, value);

        res.status(200).json({
            success: true,
            data: bookkeeper
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update password
// @route   PUT /api/v1/bookkeepers/updatepassword
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

        const bookkeeper = await bookkeeperService.getBookkeeperById(req.id, [], '+password'); // Include password, but don't populate access_log_list

        // Check current password
        if (!(await bookkeeper.matchPassword(value.currentPassword))) {
            return next(new ErrorResponse('Password is incorrect', 400));
        }

        await bookkeeperService.updateBookkeeperPassword(req.id, value.newPassword);

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all bookkeepers
// @route   GET /api/v1/bookkeepers
// @access  Private/Bookkeeper
exports.getBookkeepers = async (req, res, next) => {
    try {
        const schema = Joi.object({
            page: Joi.number().default(1).optional(),
            limit: Joi.number().default(10).optional(),
            sort: Joi.string().optional(),
            search: Joi.string().optional(),
            include_inactive: Joi.boolean().default(false).optional()
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { page, limit, sort, ...query } = value;

        // Handle query
        let dbQuery = {};
    
        // Filter by include inactive
        if (!query.include_inactive) {
            dbQuery.inactive = false;
        }

        // Search by name or email
        if (query.search) {
            dbQuery.$or = [
                { first_name: { $regex: query.search, $options: 'i' } },
                { last_name: { $regex: query.search, $options: 'i' } },
                { email: { $regex: query.search, $options: 'i' } },
                { phone_mobile: { $regex: query.search, $options: 'i' } }
            ];
        }
        
        // Handle sorting
        let dbSort = {};
        if (sort) {
            const sortFields = sort.split(',');
            sortFields.forEach(field => {
                // Check if field starts with '-' for descending sort
                if (field.startsWith('-')) {
                    dbSort[field.substring(1)] = -1;
                } else {
                    dbSort[field] = 1;
                }
            });
        } else {
            dbSort = { last_name: 1, first_name: 1 }; // Default sort
        }
        
        const bookkeepers = await bookkeeperService.getBookkeepers(
            dbQuery,
            page,
            limit,
            dbSort
        );
        
        res.status(200).json({
            success: true,
            data: bookkeepers
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get bookkeeper list
// @route   GET /api/v1/bookkeepers/list
// @access  Private/Bookkeeper
exports.getBookkeeperList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            include_inactive: Joi.boolean().default(false).optional()
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { include_inactive } = value;

        let dbQuery = {};

        if (!include_inactive) {
            dbQuery.inactive = false;
        }
        
        const bookkeepers = await bookkeeperService.getBookkeeperList(dbQuery);

        res.status(200).json({
            success: true,
            data: bookkeepers
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single bookkeeper
// @route   GET /api/v1/bookkeepers/:id
// @access  Private/Bookkeeper
exports.getBookkeeper = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }
        
        const bookkeeper = await bookkeeperService.getBookkeeperById(value.id);
        
        res.status(200).json({
            success: true,
            data: bookkeeper
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new bookkeeper
// @route   POST /api/v1/bookkeepers
// @access  Private/Bookkeeper
exports.createBookkeeper = async (req, res, next) => {
    try {
        const schema = Joi.object({
            first_name: Joi.string().required(),
            last_name: Joi.string().required(),
            email: Joi.string().email().required(),
            phone_mobile: Joi.string().required(),
            password: Joi.string().required()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }
        
        const bookkeeper = await bookkeeperService.createBookkeeper(value);
        
        res.status(201).json({
            success: true,
            data: bookkeeper
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update bookkeeper
// @route   PUT /api/v1/bookkeepers/:id
// @access  Private/Bookkeeper
exports.updateBookkeeper = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            first_name: Joi.string().optional(),
            last_name: Joi.string().optional(),
            email: Joi.string().email().optional(),
            phone_mobile: Joi.string().optional()
        });

        const { value, error } = schema.validate({...req.params, ...req.body});

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, ...bookkeeperData } = value;

        const bookkeeper = await bookkeeperService.updateBookkeeper(
            id,
            bookkeeperData
        );
        
        res.status(200).json({
            success: true,
            data: bookkeeper
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete bookkeeper
// @route   DELETE /api/v1/bookkeepers/:id
// @access  Private/Bookkeeper
exports.deleteBookkeeper = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }
        
        await bookkeeperService.deleteBookkeeper(value.id);
        
        res.status(200).json({
            success: true,
            message: 'Bookkeeper deleted successfully'
        });
    } catch (err) {
        next(err);
    }
}; 