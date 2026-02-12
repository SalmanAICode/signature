const Joi = require('joi');

const SyndicatorService = require('../services/syndicatorService');
const SyndicatorFunderService = require('../services/syndicatorFunderService');
const LenderService = require('../services/lenderService');
const LenderAccountService = require('../services/lenderAccountService');
const VirtualToVirtualService = require('../services/transfer/virtualToVirtualService');

const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');
const { PORTAL_TYPES } = require('../utils/constants');

// Default populate for syndicator
// This is used to populate for syndicator list, syndicator details, syndicator update, syndicator create
// To make the object structure in the response consistent and avoid to write the same code over and over again
const default_populate = [
    { path: 'access_log_count' },
];

// query schema for syndicator
const query_schema = {
    sort: Joi.string().allow('').optional(),
    select: Joi.string().allow('').optional(),
    search: Joi.string().allow('').optional(),
    // Following query parameters are based on fields from syndicator model
    name: Joi.string().allow('').optional(),
    first_name: Joi.string().allow('').optional(),
    last_name: Joi.string().allow('').optional(),
    email: Joi.string().allow('').optional(),
    phone_mobile: Joi.string().allow('').optional(),
    phone_work: Joi.string().allow('').optional(),
    phone_home: Joi.string().allow('').optional(),
    ssn: Joi.string().allow('').optional(),
    birthday_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    birthday_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    drivers_license_number: Joi.string().allow('').optional(),
    dln_issue_date_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    dln_issue_date_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    dln_issue_state: Joi.string().allow('').optional(),
    address_detail: Joi.string().allow('').optional(),
    business_detail: Joi.string().allow('').optional(),
    include_inactive: Joi.boolean().default(false).optional(),
    createdAt_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    createdAt_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    updatedAt_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    updatedAt_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional()
};

// Build db query for syndicator
const buildDbQuery = async (req, query) => {
    const dbQuery = {$and: []};

    // Add filter for different request portal
    // This is based on the req filters
    const accessableSyndicatorIds = await Helpers.getAccessableSyndicatorIds(req);

    if (accessableSyndicatorIds) {
        dbQuery.$and.push({ _id: { $in: accessableSyndicatorIds } });
    }

    // Handle search
    if (query.search) {
        dbQuery.$and.push(Helpers.buildSearchFilter([
            'name',
            'first_name',
            'last_name',
            'email',
            'phone_mobile',
            'phone_work',
            'phone_home',
            'drivers_license_number',
            'dln_issue_state',
            'address_detail.address_1',
            'address_detail.address_2',
            'address_detail.city',
            'address_detail.state',
            'address_detail.zip',
            'business_detail.ein',
            'business_detail.entity_type',
            'business_detail.state_of_incorporation'
        ], query.search));
    }

    // Handle fields from syndicator model
    if (query.name) dbQuery.$and.push(Helpers.buildSearchFilter('name', query.name));
    if (query.first_name) dbQuery.$and.push(Helpers.buildSearchFilter('first_name', query.first_name));
    if (query.last_name) dbQuery.$and.push(Helpers.buildSearchFilter('last_name', query.last_name));
    if (query.email) dbQuery.$and.push(Helpers.buildSearchFilter('email', query.email));
    if (query.phone_mobile) dbQuery.$and.push(Helpers.buildSearchFilter('phone_mobile', query.phone_mobile));
    if (query.phone_work) dbQuery.$and.push(Helpers.buildSearchFilter('phone_work', query.phone_work));
    if (query.phone_home) dbQuery.$and.push(Helpers.buildSearchFilter('phone_home', query.phone_home));
    if (query.ssn) dbQuery.$and.push(Helpers.buildSearchFilter('ssn', query.ssn));
    if (query.drivers_license_number) dbQuery.$and.push(Helpers.buildSearchFilter('drivers_license_number', query.drivers_license_number));
    if (query.dln_issue_state) dbQuery.$and.push(Helpers.buildSearchFilter('dln_issue_state', query.dln_issue_state));
    
    if (query.birthday_from) dbQuery.$and.push(Helpers.buildGTEFilter('birthday', query.birthday_from));
    if (query.birthday_to) dbQuery.$and.push(Helpers.buildLTEFilter('birthday', query.birthday_to));
    if (query.dln_issue_date_from) dbQuery.$and.push(Helpers.buildGTEFilter('dln_issue_date', query.dln_issue_date_from));
    if (query.dln_issue_date_to) dbQuery.$and.push(Helpers.buildLTEFilter('dln_issue_date', query.dln_issue_date_to));

    if (query.address_detail) dbQuery.$and.push(Helpers.buildSearchFilter([
        'address_detail.address_1', 
        'address_detail.address_2', 
        'address_detail.city', 
        'address_detail.state', 
        'address_detail.zip'
    ], query.address_detail));

    if (query.business_detail) dbQuery.$and.push(Helpers.buildSearchFilter([
        'business_detail.ein',
        'business_detail.entity_type',
        'business_detail.state_of_incorporation'
    ], query.business_detail));

    if (!query.include_inactive) dbQuery.$and.push({ inactive: { $ne: true } });

    if (query.createdAt_from) dbQuery.$and.push(Helpers.buildGTEFilter('createdAt', query.createdAt_from));
    if (query.createdAt_to) dbQuery.$and.push(Helpers.buildLTEFilter('createdAt', query.createdAt_to));
    if (query.updatedAt_from) dbQuery.$and.push(Helpers.buildGTEFilter('updatedAt', query.updatedAt_from));
    if (query.updatedAt_to) dbQuery.$and.push(Helpers.buildLTEFilter('updatedAt', query.updatedAt_to));

    // Remove empty $and
    dbQuery.$and = dbQuery.$and.filter(item => Object.keys(item).length > 0);

    return dbQuery;
};

// @desc    Get syndicators with pagination
// @route   GET /api/v1/syndicators
// @access  Private
exports.getSyndicators = async (req, res, next) => {
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
        const dbSort = Helpers.buildSort(sort, { name: 1, first_name: 1 }); // Default sort

        const syndicators = await SyndicatorService.getSyndicators(dbQuery, dbSort, page, limit, default_populate, select, true);

        res.status(200).json({
            success: true,
            data: syndicators
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get syndicator list without pagination
// @route   GET /api/v1/syndicators/list
// @access  Private
exports.getSyndicatorList = async (req, res, next) => {
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

        const dbSort = Helpers.buildSort(sort, { name: 1, first_name: 1 });

        const syndicators = await SyndicatorService.getSyndicatorList(dbQuery, dbSort, [], select || 'name first_name last_name email phone_mobile inactive', true);

        res.status(200).json({
            success: true,
            data: syndicators
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get current logged in user
// @route   GET /api/v1/syndicators/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const syndicator = await SyndicatorService.getSyndicatorById(req.id, default_populate, '', true);

        res.status(200).json({
            success: true,
            data: syndicator
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update syndicator details
// @route   PUT /api/v1/syndicators/updatedetails
// @access  Private
exports.updateDetails = async (req, res, next) => {
    try {
        const schema = Joi.object({
            name: Joi.string().optional(),
            first_name: Joi.string().optional(),
            last_name: Joi.string().optional(),
            email: Joi.string().email().optional(),
            phone_mobile: Joi.string().optional(),
            phone_work: Joi.string().optional(),
            phone_home: Joi.string().optional(),
            birthday: Joi.date().optional(),
            ssn: Joi.string().optional(),
            drivers_license_number: Joi.string().optional(),
            dln_issue_date: Joi.date().optional(),
            dln_issue_state: Joi.string().optional(),
            address_detail: Joi.any().optional(),
            business_detail: Joi.any().optional()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const syndicator = await SyndicatorService.updateSyndicator(req.id, value, default_populate, '', true);

        res.status(200).json({
            success: true,
            data: syndicator
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update password
// @route   PUT /api/v1/syndicators/updatepassword
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

        const syndicator = await SyndicatorService.getSyndicatorById(req.id, [], '+password', false, false);  // Include password, but don't populate

        // Check current password
        if (!(await syndicator.matchPassword(value.currentPassword))) {
            return next(new ErrorResponse('Password is incorrect', 400));
        }

        const updatedSyndicator = await SyndicatorService.updateSyndicatorPassword(req.id, value.newPassword, default_populate, '', true);

        res.status(200).json({
            success: true,
            data: updatedSyndicator
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single syndicator
// @route   GET /api/v1/syndicators/:id
// @access  Private
exports.getSyndicator = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }
        
        // Check if syndicator is itself or if syndicator is in the filter
        const accessableSyndicatorIds = await Helpers.getAccessableSyndicatorIds(req);        
        if (accessableSyndicatorIds && !accessableSyndicatorIds.includes(value.id)) {
            return next(new ErrorResponse('You do not have permission to access this syndicator', 403));
        }

        const syndicator = await SyndicatorService.getSyndicatorById(value.id, default_populate, '', true, true); // Don't include password, but populate

        res.status(200).json({
            success: true,
            data: syndicator
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new syndicator
// @route   POST /api/v1/syndicators
// @access  Private
exports.createSyndicator = async (req, res, next) => {
    try {
        const schema = Joi.object({
            name: Joi.string().required(),
            first_name: Joi.string().optional(),
            last_name: Joi.string().optional(),
            email: Joi.string().email().optional(),
            phone_mobile: Joi.string().optional(),
            phone_work: Joi.string().optional(),
            phone_home: Joi.string().optional(),
            birthday: Joi.date().optional(),
            ssn: Joi.string().optional(),
            drivers_license_number: Joi.string().optional(),
            dln_issue_date: Joi.date().optional(),
            dln_issue_state: Joi.string().optional(),
            address_detail: Joi.any().optional(),
            business_detail: Joi.any().optional(),
            password: Joi.string().optional(),
            funder_list: Joi.array().optional()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        if (req.portal === PORTAL_TYPES.FUNDER) {
            if (!value.funder_list) {
                value.funder_list = [req.filter.funder];
            } else if (req.filter.funder && !value.funder_list.includes(req.filter.funder)) {
                value.funder_list.push(req.filter.funder);
            }
        }

        const { funder_list, ...data } = value;

        const syndicator = await SyndicatorService.createSyndicator(data);

        if (syndicator && funder_list && funder_list.length > 0) {
            Promise.all(funder_list.map(funder => SyndicatorFunderService.createSyndicatorFunder({
                syndicator: syndicator._id,
                funder: funder,
            })));
        }

        const newSyndicator = await SyndicatorService.getSyndicatorById(syndicator._id, default_populate, '', true);

        res.status(201).json({
            success: true,
            data: newSyndicator
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update syndicator
// @route   PUT /api/v1/syndicators/:id
// @access  Private
exports.updateSyndicator = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            name: Joi.string().optional(),
            first_name: Joi.string().optional(),
            last_name: Joi.string().optional(),
            email: Joi.string().email().optional(),
            phone_mobile: Joi.string().optional(),
            phone_work: Joi.string().optional(),
            phone_home: Joi.string().optional(),
            birthday: Joi.date().optional(),
            ssn: Joi.string().optional(),
            drivers_license_number: Joi.string().optional(),
            dln_issue_date: Joi.date().optional(),
            dln_issue_state: Joi.string().optional(),
            address_detail: Joi.any().optional(),
            business_detail: Joi.any().optional(),
            inactive: Joi.boolean().optional()
        });

        // Combine params and body for validation
        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, ...data } = value;

        const syndicator = await SyndicatorService.updateSyndicator(id, data, default_populate, '', true);

        res.status(200).json({
            success: true,
            data: syndicator
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete syndicator
// @route   DELETE /api/v1/syndicators/:id
// @access  Private
exports.deleteSyndicator = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id } = value;

        const deletedSyndicator = await SyndicatorService.deleteSyndicator(id, default_populate);

        res.status(200).json({
            success: true,
            message: 'Syndicator deleted successfully',
            data: deletedSyndicator
        });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Transfer available balance from syndicator to lender account
 * @route   POST /api/v1/syndicators/:id/funders/:funderId/transfer
 * @access  Syndicator
 */
exports.transferBalanceToFunder = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            funderId: Joi.string().required(),
            amount: Joi.number().positive().precision(2).required(),
            password: Joi.string().required()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, funderId, amount, password } = value;

        const result = await Helpers.withTransaction(async (session) => {
            const [accessableSyndicatorIds, accessableFunderIds] = await Promise.all([
                Helpers.getAccessableSyndicatorIds(req, session),
                Helpers.getAccessableFunderIds(req, session)
            ]);
            if (accessableSyndicatorIds && !accessableSyndicatorIds.includes(id)) {
                return next(new ErrorResponse('You do not have permission to access this syndicator', 403));
            }
            if (accessableFunderIds && !accessableFunderIds.includes(funderId)) {
                return next(new ErrorResponse('You do not have permission to access this funder', 403));
            }
            const [syndicatorFunders, lenders, syndicatorWithPassword] = await Promise.all([
                SyndicatorFunderService.getSyndicatorFunderList({ syndicator: id, funder: funderId, inactive: false }, [], '', false, session),
                LenderService.getLenderList({ funder: funderId, type: 'internal', inactive: false }, [], '', false, session),
                SyndicatorService.getSyndicatorById(id, [], '+password', false, false, session)
            ]);
            if (syndicatorFunders.length !== 1) {
                return next(new ErrorResponse('Syndicator-funder count is not 1', 400));
            }
            const lenderAccounts = await LenderAccountService.getLenderAccountList({ lender: { $in: lenders.map(lender => lender._id.toString()) }, inactive: false }, [], '', false, session);
            if (lenderAccounts.length === 0) {
                return next(new ErrorResponse('Lender account not found', 400));
            }

            const syndicatorFunder = syndicatorFunders[0];
            const lenderAccount = lenderAccounts[0];

            if (!(await syndicatorWithPassword.matchPassword(password))) {
                return next(new ErrorResponse('Password is incorrect', 400));
            }
            
            const transferResult = await VirtualToVirtualService.transferAvailableBalance(
                'Syndicator-Funder',
                Helpers.extractIdString(syndicatorFunder),
                'Lender-Account',
                Helpers.extractIdString(lenderAccount),
                amount,
                session
            );

            return transferResult.source;
        });

        res.status(200).json({
            success: true,
            message: `Successfully transferred $${amount} from syndicator-funder to funder account`,
            data: result
        });

    } catch (err) {
        next(err);
    }
};