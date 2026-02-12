const Joi = require('joi');

const ApplicationStipulationService = require('../services/applicationStipulationService');
const ApplicationDocumentService = require('../services/applicationDocumentService');
const ApplicationOfferService = require('../services/applicationOfferService');
const ApplicationService = require('../services/applicationService');

const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');
const { accessControl } = require('../middleware/auth');
const { APPLICATION_OFFER_STATUS, PORTAL_TYPES, APPLICATION_DOCUMENT_TYPES, APPLICATION_STIPULATION_STATUS } = require('../utils/constants');

const default_populate = [
    { path: 'application', select: 'name request_amount' },
    { path: 'offered_by_user', select: 'first_name last_name email phone_mobile' },
    { path: 'updated_by_user', select: 'first_name last_name email phone_mobile' },
    { path: 'decided_by_contact', select: 'first_name last_name email phone_mobile' }
];

// query schema for application stipulation
const querySchema = {
    id: Joi.string().required(),
    sort: Joi.string().allow('').optional(),
    search: Joi.string().allow('').optional(),
    status: Joi.string().valid(...Object.values(APPLICATION_STIPULATION_STATUS)).optional()
};

const query_schema = {
    id: Joi.string().optional(),
    sort: Joi.string().optional(),
    select: Joi.string().optional(),
    search: Joi.string().optional(),
    // Following query parameters are based on fields from application offer model
    application: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    merchant: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    funder: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    lender: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    iso: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    offered_amount_from: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    offered_amount_to: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    payback_amount_from: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    payback_amount_to: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    installment_from: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    installment_to: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    frequency: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    avoid_holiday: Joi.boolean().optional(),
    payback_count_from: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    payback_count_to: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    offered_date_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    offered_date_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    offered_by_user: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    updated_by_user: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    decided_by_contact: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    status: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    include_inactive: Joi.boolean().optional(),
    createdAt_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    createdAt_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    updatedAt_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    updatedAt_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional()
};

const buildDbQuery = (req, query) => {
    const dbQuery = { $and: [] };

    // Add filter for different request portal
    // This is based on the req filters
    if (req.filter.funder) {
        dbQuery.$and.push({ 'funder.id': req.filter.funder });
    } else if (req.filter.funder_list) {
        dbQuery.$and.push({ 'funder.id': { $in: req.filter.funder_list } });
    }
    if (req.filter.merchant_list) dbQuery.$and.push({ 'merchant.id': { $in: req.filter.merchant_list } });
    if (req.filter.iso_list) dbQuery.$and.push({ 'iso.id': { $in: req.filter.iso_list } });


    if (query.search) dbQuery.$and.push(Helpers.buildSearchFilter([
        'merchant.name', 'merchant.email', 'merchant.phone',
        'iso.name', 'iso.email', 'iso.phone',
        'funder.name', 'funder.email', 'funder.phone',
        'lender.name', 'lender.email', 'lender.phone'
    ], query.search));


    // Handle fields from application offer model
    if (query.application) dbQuery.$and.push(Helpers.buildArrayFilter('application', query.application, true));
    if (query.merchant) dbQuery.$and.push(Helpers.buildArrayFilter('merchant.id', query.merchant, true));
    if (query.funder) dbQuery.$and.push(Helpers.buildArrayFilter('funder.id', query.funder, true));
    if (query.lender) dbQuery.$and.push(Helpers.buildArrayFilter('lender.id', query.lender, true));
    if (query.iso) dbQuery.$and.push(Helpers.buildArrayFilter('iso.id', query.iso, true));

    if (query.offered_amount_from) dbQuery.$and.push(Helpers.buildGTEFilter('offered_amount', query.offered_amount_from, true));
    if (query.offered_amount_to) dbQuery.$and.push(Helpers.buildLTEFilter('offered_amount', query.offered_amount_to, true));
    if (query.payback_amount_from) dbQuery.$and.push(Helpers.buildGTEFilter('payback_amount', query.payback_amount_from, true));
    if (query.payback_amount_to) dbQuery.$and.push(Helpers.buildLTEFilter('payback_amount', query.payback_amount_to, true));
    if (query.installment_from) dbQuery.$and.push(Helpers.buildGTEFilter('installment', query.installment_from));
    if (query.installment_to) dbQuery.$and.push(Helpers.buildLTEFilter('installment', query.installment_to));

    if (query.frequency) dbQuery.$and.push(Helpers.buildArrayFilter('frequency', query.frequency));
    if (query.avoid_holiday !== undefined) dbQuery.$and.push(Helpers.buildBooleanFilter('avoid_holiday', query.avoid_holiday));

    if (query.payback_count_from) dbQuery.$and.push(Helpers.buildGTEFilter('payback_count', query.payback_count_from));
    if (query.payback_count_to) dbQuery.$and.push(Helpers.buildLTEFilter('payback_count', query.payback_count_to));

    if (query.offered_date_from) dbQuery.$and.push(Helpers.buildGTEFilter('offered_date', query.offered_date_from));
    if (query.offered_date_to) dbQuery.$and.push(Helpers.buildLTEFilter('offered_date', query.offered_date_to));

    if (query.offered_by_user) dbQuery.$and.push(Helpers.buildArrayFilter('offered_by_user', query.offered_by_user, true));
    if (query.updated_by_user) dbQuery.$and.push(Helpers.buildArrayFilter('updated_by_user', query.updated_by_user, true));
    if (query.decided_by_contact) dbQuery.$and.push(Helpers.buildArrayFilter('decided_by_contact', query.decided_by_contact, true));

    if (query.status) dbQuery.$and.push(Helpers.buildArrayFilter('status', query.status));

    if (!query.include_inactive) dbQuery.$and.push({ inactive: { $ne: true } });

    if (query.createdAt_from) dbQuery.$and.push(Helpers.buildGTEFilter('createdAt', query.createdAt_from));
    if (query.createdAt_to) dbQuery.$and.push(Helpers.buildLTEFilter('createdAt', query.createdAt_to));
    if (query.updatedAt_from) dbQuery.$and.push(Helpers.buildGTEFilter('updatedAt', query.updatedAt_from));
    if (query.updatedAt_to) dbQuery.$and.push(Helpers.buildLTEFilter('updatedAt', query.updatedAt_to));

    return dbQuery;
};

// @desc    Get all application offers
// @route   GET /api/v1/application-offers
// @access  Private/Admin
exports.getApplicationOffers = async (req, res, next) => {
    try {
        // Construct schema by merging objects first to avoid Joi cloning issues
        const schemaDefinition = {
            page: Joi.number().default(1).optional(),
            limit: Joi.number().default(10).optional(),
            ...query_schema
        };
        
        const schema = Joi.object(schemaDefinition);

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        // Set default for include_inactive if not provided
        if (value.include_inactive === undefined) {
            value.include_inactive = false;
        }

        const { page, limit, sort, select, ...query } = value;

        // Handle query
        const dbQuery = buildDbQuery(req, query);

        // Handle sorting
        const dbSort = Helpers.buildSort(sort, { offered_date: 1 });

        const applicationOffers = await ApplicationOfferService.getApplicationOffers(
            dbQuery,
            page,
            limit,
            dbSort,
            default_populate,
            select
        );

        res.status(200).json({
            success: true,
            data: applicationOffers
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create a new application offer
// @route   POST /api/v1/application-offers
// @access  Private/Admin
exports.createApplicationOffer = async (req, res, next) => {
    try {
        const schema = Joi.object({
            application: Joi.string().required(),
            lender: Joi.string().required(),
            offered_amount: Joi.number().required(),
            payback_amount: Joi.number().required(),
            fee_list: Joi.array().items(Joi.object({
                name: Joi.string().required(),
                fee_type: Joi.string().optional(),
                amount: Joi.number().required(),
                upfront: Joi.boolean().optional(),
                syndication: Joi.boolean().optional()
            })).optional(),
            expense_list: Joi.array().items(Joi.object({
                name: Joi.string().required(),
                expense_type: Joi.string().optional(),
                amount: Joi.number().required(),
                commission: Joi.boolean().optional(),
                syndication: Joi.boolean().optional()
            })).optional(),
            installment: Joi.number().optional(),
            frequency: Joi.string().required(),
            payday_list: Joi.array().items(Joi.number()).min(1).max(31).required(),
            avoid_holiday: Joi.boolean().optional(),
            commission_amount: Joi.number().optional(), // TODO: Remove this field, it will be calculated from the expense_list
            payback_count: Joi.number().required(),
            offered_date: Joi.date().optional(),
            offered_by_user: Joi.string().optional(),
            status: Joi.string().optional()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        // eslint-disable-next-line no-unused-vars
        const { commission_amount, ...data } = value;   // TODO: Remove commission_amount from the data, it will be calculated from the expense_list

        const application = await ApplicationService.getApplicationById(data.application);
        accessControl(req, application);

        data.funder = application.funder.id;
        data.merchant = application.merchant.id;
        data.iso = application.iso?.id || undefined;

        if (!data.offered_date) data.offered_date = new Date();
        if (!data.offered_by_user) {
            if (req.portal === PORTAL_TYPES.FUNDER) {
                data.offered_by_user = req.id;
            } else {
                throw new ErrorResponse('You are not authorized to offer this application', 403);
            }
        }

        const applicationOffer = await ApplicationOfferService.createApplicationOffer(data, default_populate);

        res.status(201).json({
            success: true,
            data: applicationOffer
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all application documents
// @route   GET /api/v1/application-offers/:id/documents
// @access  Private/Admin
exports.getApplicationOfferDocuments = async (req, res, next) => {
    try {
        // Define schema fresh each time to avoid Joi corruption
        const schema = Joi.object({
            id: Joi.string().required(),
            page: Joi.number().default(1).optional(),
            limit: Joi.number().default(10).optional(),
            sort: Joi.string().optional(),
            search: Joi.string().optional(),
            // Add other query parameters you need here
        });

        const { value, error } = schema.validate({
            id: req.params.id,
            ...req.query
        });

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const { page, limit, sort, id, ...query } = value;

        const application = await ApplicationService.getApplicationOfferById(id);
        accessControl(req, application, 'application');

        // Add the application ID to the query
        query.application = id;

        // Build database query
        // const dbQuery = buildDbQuery(req, query);

        // Handle sorting
        const dbSort = Helpers.buildSort(sort, { 'document.file_name': 1 });

        // Get application documents
        const applicationDocuments = await ApplicationDocumentService.getApplicationOfferDocuments(
            query,
            page,
            limit,
            dbSort,
            ['document', 'application']
        );

        res.status(200).json({
            success: true,
            data: applicationDocuments
        });
    } catch (error) {
        console.error('Error in getApplicationOfferDocuments:', error);
        next(error);
    }
};

// @desc    Create a new application document
// @route   POST /api/v1/applications/:id/documents
// @access  Private/Admin
exports.createApplicationOfferDocument = async (req, res, next) => {
    try {

        // Manual validation instead of Joi
        const id = req.params.id;
        const document = req.body.document;
        const application_stipulation = req.body.application_stipulation;
        const document_type = req.body.document_type; // Optional: stipulation type name (e.g. "Bank Draft")

        if (!id) {
            throw new ErrorResponse('Application ID is required', 400);
        }

        if (!document) {
            throw new ErrorResponse('Document ID is required', 400);
        }

        const data = {
            document,
            application_stipulation,
            ...(document_type && document_type.trim() ? { document_type: document_type.trim() } : {})
        };

        const application = await ApplicationOfferService.getApplicationOfferById(id);
        accessControl(req, application, 'application');

        data.application = id;
        data.type = APPLICATION_DOCUMENT_TYPES.UPLOADED;

        console.log('Data being passed to service:', data);

        const applicationDocument = await ApplicationDocumentService.createApplicationOfferDocument(data, default_populate);

        res.status(201).json({
            success: true,
            data: applicationDocument
        });
    } catch (error) {
        console.error('Error in createApplicationOfferDocument:', error);
        next(error);
    }
};

// @desc    Get application offers list without pagination
// @route   GET /api/v1/application-offers/list
// @access  Private
exports.getApplicationOfferList = async (req, res, next) => {
    try {
        const schema = Joi.object(query_schema);

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { sort, select, ...query } = value;

        const dbQuery = buildDbQuery(req, query);

        const dbSort = Helpers.buildSort(sort, { offered_date: -1 });

        const applicationOffers = await ApplicationOfferService.getApplicationOfferList(dbQuery, dbSort, default_populate, select);

        res.status(200).json({
            success: true,
            data: applicationOffers
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get application stipulations list by application ID
// @route   GET /api/v1/applications/:id/stipulations/list
// @access  Private
exports.getApplicationOfferStipulationsList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            ...querySchema
        });

        const { value, error } = schema.validate({ ...req.params, ...req.query });

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const { sort, ...query } = value;

        const application = await ApplicationOfferService.getApplicationOfferById(query.id);
        accessControl(req, application, 'application');

        const dbQuery = buildDbQuery(query);

        const dbSort = Helpers.buildSort(sort, { status_date: -1 });

        const applicationStipulations = await ApplicationStipulationService.getApplicationOfferStipulationList(dbQuery, dbSort, default_populate, '', true);

        res.status(200).json({
            success: true,
            data: applicationStipulations
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update application offer
// @route   PUT /api/v1/application-offers/:id
// @access  Private
exports.updateApplicationOffer = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            offered_amount: Joi.number().optional(),
            payback_amount: Joi.number().optional(),
            fee_list: Joi.array().items(Joi.object({
                name: Joi.string().optional(),
                fee_type: Joi.string().optional(),
                amount: Joi.number().optional(),
                upfront: Joi.boolean().optional(),
                syndication: Joi.boolean().optional()
            })).optional(),
            expense_list: Joi.array().items(Joi.object({
                name: Joi.string().optional(),
                expense_type: Joi.string().optional(),
                amount: Joi.number().optional(),
                commission: Joi.boolean().optional(),
                syndication: Joi.boolean().optional()
            })).optional(),
            frequency: Joi.string().optional(),
            payday_list: Joi.array().items(Joi.number()).min(1).max(31).optional(),
            commission_amount: Joi.number().optional(), // TODO: Remove this field, it will be calculated from the expense_list
            avoid_holiday: Joi.boolean().optional(),
            payback_count: Joi.number().optional(),
            status: Joi.string().optional(),
            inactive: Joi.boolean().optional()
        });

        // Combine params and body for validation
        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        // eslint-disable-next-line no-unused-vars
        const { id, commission_amount, ...data } = value;

        const applicationOffer = await ApplicationOfferService.getApplicationOfferById(id);
        accessControl(req, applicationOffer);

        if (applicationOffer.status === APPLICATION_OFFER_STATUS.ACCEPTED) {
            return next(new ErrorResponse('Application offer is accepted and cannot be updated', 400));
        }

        if (req.portal === PORTAL_TYPES.FUNDER) {
            data.updated_by_user = req.id;
        }

        const updatedApplicationOffer = await ApplicationOfferService.updateApplicationOffer(id, data, default_populate);

        res.status(200).json({
            success: true,
            data: updatedApplicationOffer
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single application offer
// @route   GET /api/v1/application-offers/:id
// @access  Private
exports.getApplicationOffer = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const applicationOffer = await ApplicationOfferService.getApplicationOfferById(value.id, default_populate);

        accessControl(req, applicationOffer);

        res.status(200).json({
            success: true,
            data: applicationOffer
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete application offer
// @route   DELETE /api/v1/users/:id
// @access  Private
exports.deleteApplicationOffer = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id } = value;

        const applicationOffer = await ApplicationOfferService.getApplicationOfferById(id);

        accessControl(req, applicationOffer);

        await ApplicationOfferService.deleteApplicationOffer(id);

        res.status(200).json({
            success: true,
            message: 'Application offer deleted successfully'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    accept application offer
// @route   PUT /api/v1/application-offers/:id/accept
// @access  Private
exports.acceptApplicationOffer = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id } = value;

        const applicationOffer = await ApplicationOfferService.getApplicationOfferById(id);

        if (applicationOffer.status !== APPLICATION_OFFER_STATUS.OFFERED) {
            return next(new ErrorResponse('Application offer is not in OFFERED status', 400));
        }

        accessControl(req, applicationOffer);

        const updatedApplicationOffer = await ApplicationOfferService.acceptApplicationOffer(id, default_populate);

        res.status(200).json({
            success: true,
            data: updatedApplicationOffer
        });
    } catch (err) {
        next(err);
    }
};

// @desc    decline application offer
// @route   PUT /api/v1/application-offers/:id/decline
// @access  Private
exports.declineApplicationOffer = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id } = value;

        const applicationOffer = await ApplicationOfferService.getApplicationOfferById(id);

        if (applicationOffer.status !== APPLICATION_OFFER_STATUS.OFFERED) {
            return next(new ErrorResponse('Application offer is not in OFFERED status', 400));
        }

        accessControl(req, applicationOffer);

        const updateData = {
            status: APPLICATION_OFFER_STATUS.DECLINED,
            decided_by_contact: req.portal === PORTAL_TYPES.MERCHANT ? req.id : null
        };

        const updatedApplicationOffer = await ApplicationOfferService.updateApplicationOffer(id, updateData, default_populate);

        res.status(200).json({
            success: true,
            data: updatedApplicationOffer
        });
    } catch (err) {
        next(err);
    }
};