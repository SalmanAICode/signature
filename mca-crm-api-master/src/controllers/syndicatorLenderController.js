const Joi = require('joi');
const SyndicatorLender = require('../models/SyndicatorLender');
const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');
const { accessControl } = require('../middleware/auth');

// Build dbQuery from query
const buildDbQuery = (req, query) => {
    const dbQuery = { $and: [] };
    
    // Add funder filter if user has funder access
    if (req.filter && req.filter.funder_list && req.filter.funder_list.length > 0) {
        dbQuery.$and.push({
            funder: { $in: req.filter.funder_list }
        });
    }
    
    // Add lender filter if user has lender access
    if (req.filter && req.filter.lender_list && req.filter.lender_list.length > 0) {
        dbQuery.$and.push({
            lender: { $in: req.filter.lender_list }
        });
    }
    
    // Add syndicator filter if user has syndicator access
    if (req.filter && req.filter.syndicator_list && req.filter.syndicator_list.length > 0) {
        dbQuery.$and.push({
            syndicator: { $in: req.filter.syndicator_list }
        });
    }
    
    // Add other query filters
    Object.keys(query).forEach(key => {
        if (query[key] !== undefined && query[key] !== null && query[key] !== '') {
            if (key === 'syndicator' || key === 'funder' || key === 'lender') {
                dbQuery.$and.push({ [key]: query[key] });
            } else if (key === 'enabled') {
                dbQuery.$and.push({ enabled: query[key] });
            }
        }
    });
    
    // If no conditions, return empty query
    if (dbQuery.$and.length === 0) {
        return {};
    }
    
    return dbQuery;
};

// Default populate for syndicator-lender
const default_populate = [
    { path: 'syndicator', select: 'name first_name last_name email phone_mobile' },
    { path: 'funder', select: 'name email phone' },
    { path: 'lender', select: 'name email phone' }
];

// Query schema for syndicator-lender
const query_schema = {
    sort: Joi.string().allow('').optional(),
    select: Joi.string().allow('').optional(),
    
    syndicator: Joi.string().optional(),
    funder: Joi.string().optional(),
    lender: Joi.string().optional(),
    enabled: Joi.boolean().optional(),
    include_inactive: Joi.boolean().default(false).optional(),
    
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional()
};

// @desc    Get all syndicator-lender relationships
// @route   GET /api/v1/syndicator-lender
// @access  Funder-ADMIN
exports.getSyndicatorLenders = async (req, res, next) => {
    try {
        const { value, error } = Joi.object(query_schema).validate(req.query);
        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const query = buildDbQuery(req, value);
        
        // Add inactive filter
        if (!value.include_inactive) {
            query.inactive = { $ne: true };
        }

        const syndicatorLenders = await SyndicatorLender.find(query)
            .populate(default_populate)
            .sort(value.sort || '-created_at')
            .select(value.select || '')
            .limit(value.limit || 50)
            .skip(((value.page || 1) - 1) * (value.limit || 50));

        const total = await SyndicatorLender.countDocuments(query);

        res.status(200).json({
            success: true,
            count: syndicatorLenders.length,
            total,
            data: syndicatorLenders
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get syndicator-lender list (no pagination)
// @route   GET /api/v1/syndicator-lenders/list
// @access  Private
exports.getSyndicatorLenderList = async (req, res, next) => {
    try {
        const { value, error } = Joi.object(query_schema).validate(req.query);
        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const query = buildDbQuery(req, value);
        
        // Add inactive filter
        if (!value.include_inactive) {
            query.inactive = { $ne: true };
        }

        const syndicatorLenders = await SyndicatorLender.find(query)
            .populate(default_populate)
            .sort(value.sort || '-created_at')
            .select(value.select || '');

        res.status(200).json({
            success: true,
            data: syndicatorLenders
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get syndicator-lender by ID
// @route   GET /api/v1/syndicator-lender/:id
// @access  Funder-ADMIN
exports.getSyndicatorLender = async (req, res, next) => {
    try {
        const syndicatorLender = await SyndicatorLender.findById(req.params.id)
            .populate(default_populate);

        if (!syndicatorLender) {
            return next(new ErrorResponse('Syndicator-lender relationship not found', 404));
        }

        // Check access control
        await accessControl(req, syndicatorLender, 'syndicator-lender');

        res.status(200).json({
            success: true,
            data: syndicatorLender
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create syndicator-lender relationship
// @route   POST /api/v1/syndicator-lender
// @access  Funder-ADMIN
exports.createSyndicatorLender = async (req, res, next) => {
    try {
        const schema = Joi.object({
            syndicator: Joi.string().required(),
            funder: Joi.string().required(),
            lender: Joi.string().required(),
            enabled: Joi.boolean().default(false).optional()
        });

        const { value, error } = schema.validate(req.body);
        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        // Check if relationship already exists
        const existingRelationship = await SyndicatorLender.findOne({
            syndicator: value.syndicator,
            funder: value.funder,
            lender: value.lender
        });

        if (existingRelationship) {
            return next(new ErrorResponse('Syndicator-lender relationship already exists', 400));
        }

        const syndicatorLender = await SyndicatorLender.create(value);
        await syndicatorLender.populate(default_populate);

        res.status(201).json({
            success: true,
            data: syndicatorLender
        });
    } catch (error) {
        if (error.code === 11000) {
            return next(new ErrorResponse('Syndicator-lender relationship already exists', 400));
        }
        next(error);
    }
};

// @desc    Update syndicator-lender relationship
// @route   PUT /api/v1/syndicator-lender/:id
// @access  Funder-ADMIN
exports.updateSyndicatorLender = async (req, res, next) => {
    try {
        const schema = Joi.object({
            enabled: Joi.boolean().optional(),
            inactive: Joi.boolean().optional()
        });

        const { value, error } = schema.validate(req.body);
        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const syndicatorLender = await SyndicatorLender.findById(req.params.id);
        if (!syndicatorLender) {
            return next(new ErrorResponse('Syndicator-lender relationship not found', 404));
        }

        // Check access control
        await accessControl(req, syndicatorLender, 'syndicator-lender');

        const updatedSyndicatorLender = await SyndicatorLender.findByIdAndUpdate(
            req.params.id,
            value,
            { new: true, runValidators: true }
        ).populate(default_populate);

        res.status(200).json({
            success: true,
            data: updatedSyndicatorLender
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete syndicator-lender relationship
// @route   DELETE /api/v1/syndicator-lender/:id
// @access  Funder-ADMIN
exports.deleteSyndicatorLender = async (req, res, next) => {
    try {
        const syndicatorLender = await SyndicatorLender.findById(req.params.id);
        if (!syndicatorLender) {
            return next(new ErrorResponse('Syndicator-lender relationship not found', 404));
        }

        // Check access control
        await accessControl(req, syndicatorLender, 'syndicator-lender');

        await SyndicatorLender.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Syndicator-lender relationship deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get enabled syndicators for funder-lender combination
// @route   GET /api/v1/syndicator-lender/enabled/:funderId/:lenderId
// @access  Funder-ADMIN
exports.getEnabledSyndicators = async (req, res, next) => {
    try {
        const { funderId, lenderId } = req.params;

        const enabledSyndicators = await SyndicatorLender.getEnabledSyndicators(funderId, lenderId);

        res.status(200).json({
            success: true,
            data: enabledSyndicators
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get syndicator relationships
// @route   GET /api/v1/syndicator-lender/syndicator/:syndicatorId
// @access  Syndicator, Funder-ADMIN
exports.getSyndicatorRelationships = async (req, res, next) => {
    try {
        const { syndicatorId } = req.params;

        const relationships = await SyndicatorLender.getSyndicatorRelationships(syndicatorId);

        res.status(200).json({
            success: true,
            data: relationships
        });
    } catch (error) {
        next(error);
    }
};
