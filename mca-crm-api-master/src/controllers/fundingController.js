const Joi = require('joi');

const FundingService = require('../services/fundingService');
const ApplicationService = require('../services/applicationService');
const ApplicationOfferService = require('../services/applicationOfferService');
const FundingFeeService = require('../services/fundingFeeService');
const FundingExpenseService = require('../services/fundingExpenseService');
const FundingStatusService = require('../services/fundingStatusService');

const { FUNDING_TYPES, PORTAL_TYPES } = require('../utils/constants');
const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');
const { accessControl } = require('../middleware/auth');

const default_populate = [
    { path: 'application' },
    { path: 'application_offer' },
    { path: 'follower_list', select: 'first_name last_name email phone_mobile' },
    { path: 'created_by_user', select: 'first_name last_name email phone_mobile' },
    { path: 'updated_by_user', select: 'first_name last_name email phone_mobile' }
];

// Query schema for funding
const query_schema = {
    sort: Joi.string().allow('').optional(),
    select: Joi.string().allow('').optional(),
    search: Joi.string().allow('').optional(),
    // Following query parameters are based on fields from funding model
    identifier: Joi.string().allow('').optional(),
    name: Joi.string().allow('').optional(),
    funder: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    lender: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    merchant: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    iso_list: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    syndicator_list: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    application: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    application_offer: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    type: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    status: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    assigned_manager: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    assigned_user: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    follower_list: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    created_by_user: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    updated_by_user: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    internal: Joi.boolean().optional(),
    funded_amount_from: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    funded_amount_to: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    payback_amount_from: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    payback_amount_to: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    created_date_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    created_date_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    updated_date_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    updated_date_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    include_inactive: Joi.boolean().default(false).optional(),
    createdAt_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    createdAt_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    updatedAt_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    updatedAt_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional()
};

// Build dbQuery from query
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
    if (req.filter.iso_list) dbQuery.$and.push({ 'iso_list.id': { $in: req.filter.iso_list } });
    if (req.filter.syndicator_list) dbQuery.$and.push({ 'syndicator_list.id': { $in: req.filter.syndicator_list } });

    // Handle search
    if (query.search) {
        dbQuery.$and.push(Helpers.buildSearchFilter([
            'name',
            'funder.name', 'funder.email', 'funder.phone',
            'lender.name', 'lender.email', 'lender.phone',
            'merchant.name', 'merchant.email', 'merchant.phone',
            'iso_list.name', 'iso_list.email', 'iso_list.phone',
            'syndicator_list.name', 'syndicator_list.email', 'syndicator_list.phone',
            'assigned_manager.first_name', 'assigned_manager.last_name', 'assigned_manager.email', 'assigned_manager.phone_mobile',
            'assigned_user.first_name', 'assigned_user.last_name', 'assigned_user.email', 'assigned_user.phone_mobile',
            'status.name'
        ], query.search));
    }

    if (query.identifier) dbQuery.$and.push(Helpers.buildSearchFilter('identifier', query.identifier));

    // Handle fields from funding model
    if (query.name) dbQuery.$and.push(Helpers.buildSearchFilter('name', query.name));

    if (query.funder) dbQuery.$and.push(Helpers.buildArrayFilter('funder.id', query.funder, true));
    if (query.lender) dbQuery.$and.push(Helpers.buildArrayFilter('lender.id', query.lender, true));
    if (query.merchant) dbQuery.$and.push(Helpers.buildArrayFilter('merchant.id', query.merchant, true));
    if (query.iso_list) dbQuery.$and.push(Helpers.buildArrayFilter('iso_list.id', query.iso_list, true, true));
    if (query.syndicator_list) dbQuery.$and.push(Helpers.buildArrayFilter('syndicator_list.id', query.syndicator_list, true, true));

    if (query.application) dbQuery.$and.push(Helpers.buildArrayFilter('application', query.application, true));
    if (query.application_offer) dbQuery.$and.push(Helpers.buildArrayFilter('application_offer', query.application_offer, true));

    if (query.type) dbQuery.$and.push(Helpers.buildArrayFilter('type', query.type));
    if (query.status) dbQuery.$and.push(Helpers.buildArrayFilter('status.id', query.status, true));

    if (query.assigned_manager) dbQuery.$and.push(Helpers.buildArrayFilter('assigned_manager.id', query.assigned_manager, true));
    if (query.assigned_user) dbQuery.$and.push(Helpers.buildArrayFilter('assigned_user.id', query.assigned_user, true));
    if (query.follower_list) dbQuery.$and.push(Helpers.buildArrayFilter('follower_list', query.follower_list, true, true));
    if (query.created_by_user) dbQuery.$and.push(Helpers.buildArrayFilter('created_by_user', query.created_by_user, true));
    if (query.updated_by_user) dbQuery.$and.push(Helpers.buildArrayFilter('updated_by_user', query.updated_by_user, true));

    if (query.internal !== undefined) dbQuery.$and.push(Helpers.buildBooleanFilter('internal', query.internal));

    if (query.funded_amount_from) dbQuery.$and.push(Helpers.buildGTEFilter('funded_amount', query.funded_amount_from, true));
    if (query.funded_amount_to) dbQuery.$and.push(Helpers.buildLTEFilter('funded_amount', query.funded_amount_to, true));
    if (query.payback_amount_from) dbQuery.$and.push(Helpers.buildGTEFilter('payback_amount', query.payback_amount_from, true));
    if (query.payback_amount_to) dbQuery.$and.push(Helpers.buildLTEFilter('payback_amount', query.payback_amount_to, true));

    if (query.created_date_from) dbQuery.$and.push(Helpers.buildGTEFilter('createdAt', query.created_date_from));
    if (query.created_date_to) dbQuery.$and.push(Helpers.buildLTEFilter('createdAt', query.created_date_to));
    if (query.updated_date_from) dbQuery.$and.push(Helpers.buildGTEFilter('updatedAt', query.updated_date_from));
    if (query.updated_date_to) dbQuery.$and.push(Helpers.buildLTEFilter('updatedAt', query.updated_date_to));

    if (!query.include_inactive) dbQuery.$and.push({ inactive: { $ne: true } });

    if (query.createdAt_from) dbQuery.$and.push(Helpers.buildGTEFilter('createdAt', query.createdAt_from));
    if (query.createdAt_to) dbQuery.$and.push(Helpers.buildLTEFilter('createdAt', query.createdAt_to));
    if (query.updatedAt_from) dbQuery.$and.push(Helpers.buildGTEFilter('updatedAt', query.updatedAt_from));
    if (query.updatedAt_to) dbQuery.$and.push(Helpers.buildLTEFilter('updatedAt', query.updatedAt_to));

    // Clear empty filters
    dbQuery.$and = dbQuery.$and.filter(filter => Object.keys(filter).length > 0);

    return dbQuery;
};

// @desc    Get all funding records
// @route   GET /api/v1/fundings
// @access  Private/Admin
exports.getFundings = async (req, res, next) => {
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
        const dbSort = Helpers.buildSort(sort, { createdAt: -1 });

        const result = await FundingService.getFundings(
            dbQuery,
            page,
            limit,
            dbSort,
            default_populate,
            select,
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

// @desc    Get funding list without pagination
// @route   GET /api/v1/fundings/list
// @access  Private
exports.getFundingList = async (req, res, next) => {
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

        // Handle sort
        const dbSort = Helpers.buildSort(sort, { createdAt: -1 });

        const fundings = await FundingService.getFundingList(
            dbQuery,
            dbSort,
            default_populate,
            select || 'name funder.name merchant.name iso_list.name syndicator_list.name funded_amount payback_amount status.name'
        );

        res.status(200).json({
            success: true,
            data: fundings
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create a new funding record
// @route   POST /api/v1/fundings
// @access  Private/Admin
exports.createFunding = async (req, res, next) => {
    try {
        const schema = Joi.object({
            funder: Joi.string().optional(),
            lender: Joi.string().required(),
            merchant: Joi.string().required(),
            iso_list: Joi.array().items(Joi.string()).optional(),
            application: Joi.string().optional(),
            application_offer: Joi.string().optional(),
            name: Joi.string().required(),
            type: Joi.string().required(),
            funded_amount: Joi.number().required(),
            payback_amount: Joi.number().required(),
            fee_list: Joi.array().items(Joi.object({
                name: Joi.string().optional(),
                fee_type: Joi.string().optional(),
                amount: Joi.number().required(),
                upfront: Joi.boolean().optional(),
                syndication: Joi.boolean().optional(),
                iso: Joi.string().optional()
            })).optional(),
            expense_list: Joi.array().items(Joi.object({
                name: Joi.string().optional(),
                expense_type: Joi.string().optional(),
                amount: Joi.number().required(),
                commission: Joi.boolean().optional(),
                syndication: Joi.boolean().optional(),
                iso: Joi.string().optional()
            })).optional(),
            assigned_manager: Joi.string().optional(),
            assigned_user: Joi.string().optional(),
            follower_list: Joi.array().items(Joi.string()).optional(),
            status: Joi.string().optional(),
            internal: Joi.boolean().optional(),
            position: Joi.number().optional(),
            identifier: Joi.string().optional()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { fee_list, expense_list, ...data } = value;
        
        const application = data.application ? await ApplicationService.getApplicationById(data.application) : null;
        if (application) accessControl(req, application, 'application');

        const applicationOffer = data.application_offer ? await ApplicationOfferService.getApplicationOfferById(data.application_offer) : null;
        if (applicationOffer) accessControl(req, applicationOffer, 'application offer');

        if (!data.funder) {
            if (req.portal === PORTAL_TYPES.FUNDER && req.filter?.funder) {
                data.funder = req.filter.funder;
            } else if (applicationOffer?.funder) {
                data.funder = applicationOffer.funder;
            } else if (application?.funder) {
                data.funder = application.funder;
            } else {
                throw new ErrorResponse('Funder is required', 400);
            }
        }

        // Handle expense_list iso and update iso_list if needed
        if (expense_list && Array.isArray(expense_list)) {
            for (const expense of expense_list) {
                if (expense.commission && expense.iso) {
                    // Initialize iso_list if it doesn't exist
                    if (!data.iso_list) {
                        data.iso_list = [];
                    }
                    
                    // Check if this ISO is already in the list
                    const existingIso = data.iso_list.find(iso => iso.toString() === expense.iso.toString());
                    if (!existingIso) {
                        data.iso_list.push(expense.iso);
                    }
                }
            }
        }

        if (req.portal === PORTAL_TYPES.FUNDER) {
            data.created_by_user = req.id;
        }
        if (data.type === undefined) {
            data.type = FUNDING_TYPES.NEW;
        }
        if (data.status === undefined) {
            const fundingStatus = await FundingStatusService.getInitialFundingStatus(data.funder);
            if (fundingStatus) {
                data.status = fundingStatus._id;
            } else {
                throw new ErrorResponse('Funding status is required', 400);
            }
        }

        accessControl(req, data);

        const funding = await FundingService.createFunding(data, default_populate, '', true);

        try {
            // Create the fees in funding-fee
            for (const fee of fee_list) {
                const feeData = {
                    funding: funding._id,
                    funder: Helpers.extractIdString(funding.funder),
                    lender: Helpers.extractIdString(funding.lender),
                    merchant: Helpers.extractIdString(funding.merchant),
                    ...fee,
                    fee_date: new Date(),
                    created_by_user: Helpers.extractIdString(funding.created_by_user),
                    notes: 'Created in funding creation process.'
                }
                if (fee.iso) {
                    feeData.iso = fee.iso;
                }
                await FundingFeeService.createFundingFee(feeData);
            }

            // Create the expenses in funding-expense
            for (const expense of expense_list) {
                const expenseData = {
                    funding: funding._id,
                    funder: Helpers.extractIdString(funding.funder),
                    lender: Helpers.extractIdString(funding.lender),
                    merchant: Helpers.extractIdString(funding.merchant),
                    ...expense,
                    expense_date: new Date(),
                    created_by_user: Helpers.extractIdString(funding.created_by_user),
                    notes: 'Created in funding creation process.'
                };
                
                // Only add iso field if expense has commission and iso specified
                if (expense.commission && expense.iso) {
                    expenseData.iso = expense.iso;
                }
                
                await FundingExpenseService.createFundingExpense(expenseData);
            }
        } catch (err) {
            console.error(err);
        }


        const createdFunding = await FundingService.getFundingById(funding._id, default_populate, '', true);

        res.status(201).json({
            success: true,
            data: createdFunding
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single funding
// @route   GET /api/v1/fundings/:id
// @access  Private
exports.getFunding = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id } = value;

        const funding = await FundingService.getFundingById(id, default_populate, '', true);

        accessControl(req, funding, 'funding');

        res.status(200).json({
            success: true,
            data: funding
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update funding record
// @route   PUT /api/v1/fundings/:id
// @access  Private
exports.updateFunding = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            name: Joi.string().optional(),
            type: Joi.string().optional(),
            assigned_manager: Joi.string().optional(),
            assigned_user: Joi.string().optional(),
            follower_list: Joi.array().items(Joi.string()).optional(),
            iso_list: Joi.array().items(Joi.string()).optional(),
            status: Joi.string().optional(),
            internal: Joi.boolean().optional(),
            position: Joi.number().optional(),
            identifier: Joi.string().optional(),
            inactive: Joi.boolean().optional()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, ...data } = value;

        const funding = await FundingService.getFundingById(id);
        accessControl(req, funding, 'funding');

        if (req.portal === PORTAL_TYPES.FUNDER) {
            data.updated_by_user = req.id;
        }

        // @todo when update a current payback plan, or add new disbursement intent, need to update the updated_by_user

        const updatedFunding = await FundingService.updateFunding(id, data, default_populate, '', true);

        res.status(200).json({
            success: true,
            data: updatedFunding
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete funding record
// @route   DELETE /api/v1/fundings/:id
// @access  Private
exports.deleteFunding = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const funding = await FundingService.getFundingById(value.id);
        accessControl(req, funding, 'funding');

        const deletedFunding = await FundingService.deleteFunding(value.id, default_populate, '', true);

        res.status(200).json({
            success: true,
            message: 'Funding record deleted successfully',
            data: deletedFunding
        });
    } catch (err) {
        next(err);
    }
};
