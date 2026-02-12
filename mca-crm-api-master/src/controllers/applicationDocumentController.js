const Joi = require('joi');

const ApplicationDocumentService = require('../services/applicationDocumentService');
const ApplicationService = require('../services/applicationService');

const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');
const { APPLICATION_DOCUMENT_TYPES } = require('../utils/constants');
const { accessControl } = require('../middleware/auth');

const default_populate = [
    { path: 'application_stipulation', select: 'stipulation_type status' }
];

// Query schema for application documents
const query_schema = {
    id: Joi.string().required(),
    sort: Joi.string().allow('').optional(),
    search: Joi.string().allow('').optional(),
    application_stipulation: Joi.string().optional(),
    type: Joi.string().valid(...Object.values(APPLICATION_DOCUMENT_TYPES)).optional()
};

// Build database query for application documents
const buildDbQuery = (req, query) => {
    const dbQuery = {};

    dbQuery.$and = [];

    dbQuery.$and.push({ application: query.id });

    if (query.search) {
        dbQuery.$and.push({
            $or: [
                { 'document.file_name': { $regex: query.search, $options: 'i' } },
                { 'document.file_type': { $regex: query.search, $options: 'i' } }
            ]
        });
    }

    if (query.application_stipulation) dbQuery.$and.push({ application_stipulation: query.application_stipulation });

    if (query.type) dbQuery.$and.push({ type: query.type });

    return dbQuery;
};



// @desc    Get all application documents
// @route   GET /api/v1/applications/:id/documents
// @access  Private/Admin
exports.getApplicationDocuments = async (req, res, next) => {
    try {
        const schema = Joi.object({
            page: Joi.number().default(1).optional(),
            limit: Joi.number().default(10).optional(),
            ...query_schema
        });

        const { value, error } = schema.validate({ ...req.params, ...req.query });

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const { page, limit, sort, ...query } = value;

        const application = await ApplicationService.getApplicationById(query.id);
        accessControl(req, application, 'application');

        // Build database query
        const dbQuery = buildDbQuery(req, query);

        // Handle sorting
        const dbSort = Helpers.buildSort(sort, { 'document.file_name': 1 });

        // Get application documents
        const applicationDocuments = await ApplicationDocumentService.getApplicationDocuments(
            dbQuery,
            page,
            limit,
            dbSort,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: applicationDocuments
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new application document
// @route   POST /api/v1/applications/:id/documents
// @access  Private/Admin
exports.createApplicationDocument = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            application_stipulation: Joi.string().optional(),
            document: Joi.string().required()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const { id, ...data } = value;

        const application = await ApplicationService.getApplicationById(id);
        accessControl(req, application, 'application');

        data.application = id;
        data.type = APPLICATION_DOCUMENT_TYPES.UPLOADED;

        const applicationDocument = await ApplicationDocumentService.createApplicationDocument(data, default_populate);

        res.status(201).json({
            success: true,
            data: applicationDocument
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get application documents list without pagination
// @route   GET /api/v1/applications/:id/documents/list
// @access  Private
exports.getApplicationDocumentsList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            ...query_schema
        });

        const { value, error } = schema.validate({ ...req.params, ...req.query });

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const {sort, ...query} = value;

        const application = await ApplicationService.getApplicationById(query.id);
        accessControl(req, application, 'application');

        // Build database query
        const dbQuery = buildDbQuery(req, query);

        // Handle sorting
        const dbSort = Helpers.buildSort(sort, { 'document.file_name': 1 });

        const applicationDocuments = await ApplicationDocumentService.getApplicationDocumentsList(dbQuery, dbSort, default_populate);

        res.status(200).json({
            success: true,
            data: applicationDocuments
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single application document
// @route   GET /api/v1/applications/:id/documents/:documentId
// @access  Private
exports.getApplicationDocument = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            documentId: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const {id, documentId} = value;

        const application = await ApplicationService.getApplicationById(id);
        accessControl(req, application, 'application');

        // check if the document belongs to the application
        const existingDocument = await ApplicationDocumentService.getApplicationDocumentById(documentId);
        if (existingDocument.application.toString() !== id) {
            throw new ErrorResponse('Application document not found for this application', 404);
        }

        const applicationDocument = await ApplicationDocumentService.getApplicationDocumentById(documentId, default_populate);

        res.status(200).json({
            success: true,
            data: applicationDocument
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update application document
// @route   PUT /api/v1/applications/:id/documents/:documentId
// @access  Private
exports.updateApplicationDocument = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            documentId: Joi.string().required(),
            application_stipulation: Joi.string().optional(),
            type: Joi.string().valid(...Object.values(APPLICATION_DOCUMENT_TYPES)).optional()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const { id, documentId, ...data } = value;

        const application = await ApplicationService.getApplicationById(id);
        accessControl(req, application, 'application');

        // check if the document belongs to the application
        const existingDocument = await ApplicationDocumentService.getApplicationDocumentById(documentId);
        if (existingDocument.application.toString() !== id) {
            throw new ErrorResponse('Application document not found for this application', 404);
        }

        const updatedApplicationDocument = await ApplicationDocumentService.updateApplicationDocument(documentId, data, default_populate);

        res.status(200).json({
            success: true,
            data: updatedApplicationDocument
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete application document
// @route   DELETE /api/v1/applications/:id/documents/:documentId
// @access  Private
exports.deleteApplicationDocument = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            documentId: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const { id, documentId } = value;

        const application = await ApplicationService.getApplicationById(id);
        accessControl(req, application, 'application');

        // check if the document belongs to the application
        const existingDocument = await ApplicationDocumentService.getApplicationDocumentById(documentId);
        if (existingDocument.application.toString() !== id) {
            throw new ErrorResponse('Application document not found for this application', 404);
        }

        await ApplicationDocumentService.deleteApplicationDocument(documentId);

        res.status(200).json({
            success: true,
            message: 'Application document deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};