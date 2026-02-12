const Joi = require('joi');

const ApplicationService = require('../services/applicationService');
const UserFunderService = require('../services/userFunderService');
const ApplicationStatusService = require('../services/applicationStatusService');

const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');
const { PORTAL_TYPES } = require('../utils/constants');
const { accessControl } = require('../middleware/auth');

const default_populate = [
    { path: 'follower_list', select: 'first_name last_name email phone_mobile' },
    { path: 'stipulation_count' },
    { path: 'requested_stipulation_count' },
    { path: 'received_stipulation_count' },
    { path: 'checked_stipulation_count' },
    { path: 'document_count' },
    { path: 'generated_document_count' },
    { path: 'uploaded_document_count' },
    { path: 'offer_count' },
    { path: 'history_count' }
];

const query_schema = {
    sort: Joi.string().allow('').optional(),
    identifier: Joi.string().allow('').optional(),
    select: Joi.string().allow('').optional(),
    search: Joi.string().allow('').optional(),
    // Following query parameters are based on fields from application model
    name: Joi.string().allow('').optional(),
    merchant: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    contact: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    funder: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    iso: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    representative: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    priority: Joi.boolean().optional(),
    type: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    assigned_manager: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    assigned_user: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    follower_list: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    internal: Joi.boolean().optional(),
    request_amount_from: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    request_amount_to: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    request_date_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    request_date_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    status: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    status_date_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    status_date_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    declined_reason: Joi.string().allow('').optional(),
    closed: Joi.boolean().optional(),
    include_inactive: Joi.boolean().default(false).optional(),
    createdAt_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    createdAt_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    updatedAt_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    updatedAt_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional()
};

const buildDbQuery = (req, query) => {
    const dbQuery = {$and: []};

    // Add filter for different request portal
    // This is based on the req filters
    if (req.filter.funder) {
        dbQuery.$and.push({ 'funder.id': req.filter.funder });
    } else if (req.filter.funder_list) {
        dbQuery.$and.push({ 'funder.id': { $in: req.filter.funder_list } });
    }
    if (req.filter.merchant_list) dbQuery.$and.push({ 'merchant.id': { $in: req.filter.merchant_list } });
    if (req.filter.iso_list) dbQuery.$and.push({ 'iso.id': { $in: req.filter.iso_list } });

    // Handle search
    if (query.search) {
        dbQuery.$and.push(Helpers.buildSearchFilter([
            'name',
            'merchant.name', 'merchant.email', 'merchant.phone',
            'funder.name', 'funder.email', 'funder.phone',
            'iso.name', 'iso.email', 'iso.phone',
            'contact.first_name', 'contact.last_name', 'contact.email', 'contact.phone_mobile', 'contact.phone_work', 'contact.phone_home',
            'representative.first_name', 'representative.last_name', 'representative.email', 'representative.phone_mobile', 'representative.phone_work', 'representative.phone_home',
            'assigned_manager.first_name', 'assigned_manager.last_name', 'assigned_manager.email', 'assigned_manager.phone_mobile', 'assigned_manager.phone_work', 'assigned_manager.phone_home',
            'assigned_user.first_name', 'assigned_user.last_name', 'assigned_user.email', 'assigned_user.phone_mobile', 'assigned_user.phone_work', 'assigned_user.phone_home',
            'status.name',
            'declined_reason'
        ], query.search));
    }

    // Handle fields from application model
    if (query.name) dbQuery.$and.push(Helpers.buildSearchFilter('name', query.name));
    if (query.identifier) dbQuery.$and.push(Helpers.buildSearchFilter('identifier', query.identifier));

    if (query.funder) dbQuery.$and.push(Helpers.buildArrayFilter('funder.id', query.funder, true));
    if (query.merchant) dbQuery.$and.push(Helpers.buildArrayFilter('merchant.id', query.merchant, true));
    if (query.iso) dbQuery.$and.push(Helpers.buildArrayFilter('iso.id', query.iso, true));

    if (query.contact) dbQuery.$and.push(Helpers.buildArrayFilter('contact.id', query.contact, true));
    if (query.representative) dbQuery.$and.push(Helpers.buildArrayFilter('representative.id', query.representative, true));

    if (query.priority !== undefined) dbQuery.$and.push(Helpers.buildBooleanFilter('priority', query.priority));
    if (query.type) dbQuery.$and.push(Helpers.buildArrayFilter('type', query.type));

    if (query.assigned_manager) dbQuery.$and.push(Helpers.buildArrayFilter('assigned_manager.id', query.assigned_manager, true));
    if (query.assigned_user) dbQuery.$and.push(Helpers.buildArrayFilter('assigned_user.id', query.assigned_user, true));
    if (query.follower_list) dbQuery.$and.push(Helpers.buildArrayFilter('follower_list', query.follower_list, true, true));

    if (query.internal !== undefined) dbQuery.$and.push(Helpers.buildBooleanFilter('internal', query.internal));

    if (query.request_amount_from) dbQuery.$and.push(Helpers.buildGTEFilter('request_amount', query.request_amount_from, true));
    if (query.request_amount_to) dbQuery.$and.push(Helpers.buildLTEFilter('request_amount', query.request_amount_to, true));

    if (query.request_date_from) dbQuery.$and.push(Helpers.buildGTEFilter('request_date', query.request_date_from));
    if (query.request_date_to) dbQuery.$and.push(Helpers.buildLTEFilter('request_date', query.request_date_to));

    if (query.status) dbQuery.$and.push(Helpers.buildArrayFilter('status.id', query.status, true));

    if (query.status_date_from) dbQuery.$and.push(Helpers.buildGTEFilter('status_date', query.status_date_from));
    if (query.status_date_to) dbQuery.$and.push(Helpers.buildLTEFilter('status_date', query.status_date_to));

    if (query.closed !== undefined) dbQuery.$and.push(Helpers.buildBooleanFilter('closed', query.closed));

    if (!query.include_inactive) dbQuery.$and.push({ inactive: { $ne: true } });

    if (query.createdAt_from) dbQuery.$and.push(Helpers.buildGTEFilter('createdAt', query.createdAt_from));
    if (query.createdAt_to) dbQuery.$and.push(Helpers.buildLTEFilter('createdAt', query.createdAt_to));
    if (query.updatedAt_from) dbQuery.$and.push(Helpers.buildGTEFilter('updatedAt', query.updatedAt_from));
    if (query.updatedAt_to) dbQuery.$and.push(Helpers.buildLTEFilter('updatedAt', query.updatedAt_to));

    // Clear empty filters
    dbQuery.$and = dbQuery.$and.filter(filter => Object.keys(filter).length > 0);

    return dbQuery;
};

// @desc    Get all applications
// @route   GET /api/v1/applications
// @access  Private
exports.getApplications = async (req, res, next) => {
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
        const dbSort = Helpers.buildSort(sort, { status_date: -1 });
        
        const result = await ApplicationService.getApplications(
            dbQuery,
            page,
            limit,
            dbSort,
            default_populate,
            select
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single application
// @route   GET /api/v1/applications/:id
// @access  Private
exports.getApplication = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const application = await ApplicationService.getApplicationById(value.id, default_populate);
        accessControl(req, application);

        res.status(200).json({
            success: true,
            data: application
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get application list
// @route   GET /api/v1/applications/list
// @access  Private
exports.getApplicationList = async (req, res, next) => {
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

        const dbSort = Helpers.buildSort(sort, { status_date: -1 });

        const applications = await ApplicationService.getApplicationList(dbQuery, dbSort, [], select || 'name merchant.name funder.name iso.name status.name, request_amount');

        res.status(200).json({
            success: true,
            data: applications
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new application
// @route   POST /api/v1/applications
// @access  Private
exports.createApplication = async (req, res, next) => {
    try {
        const schema = Joi.object({
            name: Joi.string().required(),
            funder: Joi.string().optional(),
            merchant: Joi.string().required(),
            iso: Joi.string().optional(),
            contact: Joi.string().optional(),
            representative: Joi.string().optional(),
            priority: Joi.boolean().optional(),
            type: Joi.string().required(),
            assigned_manager: Joi.string().optional(),
            assigned_user: Joi.string().required(),
            follower_list: Joi.array().items(Joi.string()).optional(),
            internal: Joi.boolean().optional(),
            request_amount: Joi.number().required(),
            request_date: Joi.date().optional(),
            status: Joi.string().optional(),
            identifier: Joi.string().optional()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const data = {...value};

        if (!data.funder) {
            if (req.filter.funder) {
                data.funder = req.filter.funder;
            } else {
                throw new ErrorResponse('There is no funder selected to create application', 403);
            }
        }

        // Check permission
        accessControl(req, data, 'funder');

        // According to the portal type, set the default values for the application
        switch(req.portal){
        case PORTAL_TYPES.MERCHANT:
            if (!data.contact) data.contact = req.id;
            break;
        case PORTAL_TYPES.ISO:
            if (!data.representative) data.representative = req.id;
            break;
        }
        
        if (data.priority === undefined) data.priority = false;
        if (data.request_date === undefined) data.request_date = new Date();

        if (data.status === undefined) {
            const initialStatus = await ApplicationStatusService.getApplicationStatusList({ funder: data.funder, initial: true, inactive: false });
            data.status = initialStatus[0]._id;
        } else {
            const applicationStatus = await ApplicationStatusService.getApplicationStatusById(data.status);
            if (applicationStatus.funder.toString() !== data.funder) {
                return next(new ErrorResponse('status funder is not match', 400));
            }
        }

        data.status_date = new Date();

        const userIds = await UserFunderService.getUsersByFunderId(data.funder);

        if(data.assigned_manager){
            if(!userIds.includes(data.assigned_manager)){
                return next(new ErrorResponse('You do not have permission to access this user as assigned manager', 403));
            }
        }

        if(!userIds.includes(data.assigned_user)){
            return next(new ErrorResponse('You do not have permission to access this user as assigned user', 403));
        }

        if(data.follower_list){
            if (data.follower_list.some(follower => !userIds.includes(follower))) {
                return next(new ErrorResponse('You do not have permission to access these followers', 403));
            }
        }

        const application = await ApplicationService.createApplication(data, default_populate);

        res.status(201).json({
            success: true,
            data: application
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update application
// @route   PUT /api/v1/applications/:id
// @access  Private
exports.updateApplication = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            name: Joi.string().optional(),
            priority: Joi.boolean().optional(),
            type: Joi.string().optional(),
            contact: Joi.string().optional(),
            representative: Joi.string().optional(),
            assigned_manager: Joi.string().optional(),
            assigned_user: Joi.string().optional(),
            follower_list: Joi.array().items(Joi.string()).optional(),
            internal: Joi.boolean().optional(),
            status: Joi.string().optional(),
            declined_reason: Joi.string().optional(),
            closed: Joi.boolean().optional(),
            inactive: Joi.boolean().optional(),
            identifier: Joi.string().optional()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, ...data } = value;
        
        const application = await ApplicationService.getApplicationById(id);
        accessControl(req, application, 'application');

        // Check users included in the data are all accessable
        const userIds = await UserFunderService.getUsersByFunderId(application.funder.id);

        if(data.assigned_manager){
            if(!userIds.includes(data.assigned_manager)){
                return next(new ErrorResponse('You do not have permission to access this user as assigned manager', 403));
            }
        }

        if(data.assigned_user){
            if(!userIds.includes(data.assigned_user)){
                return next(new ErrorResponse('You do not have permission to access this user as assigned user', 403));
            }
        }

        if(data.follower_list){
            if (data.follower_list.some(follower => !userIds.includes(follower))) {
                return next(new ErrorResponse('You do not have permission to access these followers', 403));
            }
        }

        if(data.status){
            const applicationStatus = await ApplicationStatusService.getApplicationStatusById(data.status);
            if (applicationStatus.funder.toString() !== application.funder.id.toString()) {
                return next(new ErrorResponse('status funder is not match', 400));
            }
        }

        const updatedApplication = await ApplicationService.updateApplication(
            id,
            data,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: updatedApplication
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete application
// @route   DELETE /api/v1/applications/:id
// @access  Private
exports.deleteApplication = async (req, res, next) => {
    try {

        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }
        const application = await ApplicationService.getApplicationById(value.id);

        accessControl(req, application);
        
        await ApplicationService.deleteApplication(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Application deleted successfully'
        });
    } catch (err) {
        next(err);
    }
};
