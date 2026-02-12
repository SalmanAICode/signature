const Joi = require('joi');

const ApplicationStipulationService = require('../services/applicationStipulationService');
const ApplicationService = require('../services/applicationService');

const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');
const { APPLICATION_STIPULATION_STATUS, PORTAL_TYPES } = require('../utils/constants');
const { accessControl } = require('../middleware/auth');

const default_populate = [
    { path: 'status_by', select: 'first_name last_name email' }
];

// query schema for application stipulation
const querySchema = {
    id: Joi.string().required(),
    sort: Joi.string().allow('').optional(),
    search: Joi.string().allow('').optional(),
    status: Joi.string().valid(...Object.values(APPLICATION_STIPULATION_STATUS)).optional()
};

// build db query from query schema
const buildDbQuery = (query) => {
    const dbQuery = {};

    dbQuery.$and = [];

    dbQuery.$and.push({ application: query.id });

    if (query.status) {
        dbQuery.$and.push({ status: query.status });
    }

    if (query.search) {
        dbQuery.$and.push({ $or: [
            { 'stipulation_type.name': { $regex: query.search, $options: 'i' } },
            { note: { $regex: query.search, $options: 'i' } },
            { status: { $regex: query.search, $options: 'i' } }
        ] });
    }

    return dbQuery;
};

// @desc    Get application stipulations by application ID
// @route   GET /api/v1/applications/:id/stipulations
// @access  Private
exports.getApplicationStipulations = async (req, res, next) => {
    try {
        const schema = Joi.object({
            ...querySchema,
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).default(10)
        });

        const { value, error } = schema.validate({ ...req.params, ...req.query });

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const { page, limit, sort, ...query } = value;

        const application = await ApplicationService.getApplicationById(query.id);
        accessControl(req, application, 'application');

        const dbQuery = buildDbQuery(query);

        // Handle sort
        const dbSort = Helpers.buildSort(sort, { status_date: -1 });
        
        const result = await ApplicationStipulationService.getApplicationStipulations(
            dbQuery,
            page,
            limit,
            dbSort,
            default_populate,
            '',
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

// @desc    Get single application stipulation
// @route   GET /api/v1/applications/:id/stipulations/:stipulationId
// @access  Private
exports.getApplicationStipulation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            stipulationId: Joi.string().required()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.query });

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const { id, stipulationId } = value;

        const application = await ApplicationService.getApplicationById(id);
        accessControl(req, application, 'application');

        const applicationStipulation = await ApplicationStipulationService.getApplicationStipulationById(stipulationId, default_populate, '', true);

        res.status(200).json({
            success: true,
            data: applicationStipulation
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get application stipulations list by application ID
// @route   GET /api/v1/applications/:id/stipulations/list
// @access  Private
exports.getApplicationStipulationsList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            ...querySchema
        });

        const { value, error } = schema.validate({ ...req.params, ...req.query });

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const { sort, ...query } = value;

        const application = await ApplicationService.getApplicationById(query.id);
        accessControl(req, application, 'application');

        const dbQuery = buildDbQuery(query);

        const dbSort = Helpers.buildSort(sort, { status_date: -1 });

        const applicationStipulations = await ApplicationStipulationService.getApplicationStipulationList(dbQuery, dbSort, default_populate, '', true);

        res.status(200).json({
            success: true,
            data: applicationStipulations
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create application stipulation
// @route   POST /api/v1/applications/:id/stipulations
// @access  Private
exports.createApplicationStipulation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            stipulation_type: Joi.string().required(),
            status: Joi.string().valid(...Object.values(APPLICATION_STIPULATION_STATUS)).default(APPLICATION_STIPULATION_STATUS.REQUESTED),
            note: Joi.string().allow('').optional()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const { id, ...data } = value;

        data.application = id;

        const application = await ApplicationService.getApplicationById(id);
        accessControl(req, application, 'application');

        data.status_date = new Date();
        if (req.portal === PORTAL_TYPES.FUNDER) {
            data.status_by = req.id;
        }

        const applicationStipulation = await ApplicationStipulationService.createApplicationStipulation(data, default_populate, '', true);

        res.status(201).json({
            success: true,
            data: applicationStipulation
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update application stipulation
// @route   PUT /api/v1/applications/:id/stipulations/:stipulationId
// @access  Private
exports.updateApplicationStipulation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            stipulationId: Joi.string().required(),
            status: Joi.string().valid(...Object.values(APPLICATION_STIPULATION_STATUS)).optional(),
            note: Joi.string().allow('').optional()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const { id, stipulationId, ...data } = value;

        const application = await ApplicationService.getApplicationById(id);
        accessControl(req, application, 'application');

        // check if the stipulation belongs to the application
        const existingStipulation = await ApplicationStipulationService.getApplicationStipulationById(stipulationId);
        if (existingStipulation.application.toString() !== id) {
            throw new ErrorResponse('Application stipulation not found for this application', 404);
        }

        data.status_date = new Date();
        if (req.portal === PORTAL_TYPES.FUNDER) {
            data.status_by = req.id;
        }

        const applicationStipulation = await ApplicationStipulationService.updateApplicationStipulation(stipulationId, data, default_populate, '', true);

        res.status(200).json({
            success: true,
            data: applicationStipulation
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete application stipulation
// @route   DELETE /api/v1/applications/:id/stipulations/:stipulationId
// @access  Private
exports.deleteApplicationStipulation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            stipulationId: Joi.string().required()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.query });

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const { id, stipulationId } = value;

        const application = await ApplicationService.getApplicationById(id);
        accessControl(req, application, 'application');

        // Verify that the stipulation belongs to the specified application
        const existingStipulation = await ApplicationStipulationService.getApplicationStipulationById(stipulationId);
        if (existingStipulation.application.toString() !== id) {
            throw new ErrorResponse('Application stipulation not found for this application', 404);
        }

        const result = await ApplicationStipulationService.deleteApplicationStipulation(stipulationId);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        next(err);
    }
};