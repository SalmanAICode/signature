const Joi = require('joi');

const FundingExpenseService = require('../services/fundingExpenseService');
const FundingService = require('../services/fundingService');
const ExpenseTypeService = require('../services/expenseTypeService');

const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');
const { accessControl } = require('../middleware/auth');
const { PORTAL_TYPES } = require('../utils/constants');

const default_populate = [
    { path: 'funding', select: 'name' },
    { path: 'funder', select: 'name email phone' },
    { path: 'lender', select: 'name email phone' },
    { path: 'merchant', select: 'name email phone' },
    { path: 'iso', select: 'name email phone' },
    { path: 'expense_type', select: 'name' },
    { path: 'created_by_user', select: 'first_name last_name email phone_mobile' },
    { path: 'updated_by_user', select: 'first_name last_name email phone_mobile' },
];

// Query schema for funding expense
const query_schema = {
    sort: Joi.string().optional(),
    search: Joi.string().optional(),
    include_inactive: Joi.boolean().optional(),
    funding: Joi.string().optional(),
    funder: Joi.string().optional(),
    lender: Joi.string().optional(),
    merchant: Joi.string().optional(),
    iso: Joi.string().optional(),
    expense_type: Joi.string().optional(),
    commission: Joi.boolean().optional(),
    syndication: Joi.boolean().optional()
};

// Build dbQuery from query
const buildDbQuery = (req, query) => {
    let dbQuery = {};

    dbQuery.$and = [];

    const funderFilter = Helpers.buildFunderFilter(req, query.funder);
    const lenderFilter = Helpers.buildLenderFilter(req, query.lender);
    const merchantFilter = Helpers.buildMerchantFilter(req, query.merchant);
    const isoFilter = Helpers.buildIsoFilter(req, query.iso);

    if (funderFilter) dbQuery.$and.push({ funder: funderFilter });
    if (lenderFilter) dbQuery.$and.push({ lender: lenderFilter });
    if (merchantFilter) dbQuery.$and.push({ merchant: merchantFilter });
    if (isoFilter) dbQuery.$and.push({ iso: isoFilter });

    if (query.search) dbQuery.$and.push({ $or: [
        { 'name': { $regex: query.search, $options: 'i' } },
        { 'note': { $regex: query.search, $options: 'i' } }
    ] });

    if (!query.include_inactive) dbQuery.$and.push({ inactive: { $ne: true } });

    if (query.funding) dbQuery.$and.push({ funding: query.funding });

    if (query.expense_type) dbQuery.$and.push({ expense_type: query.expense_type });

    if (query.commission !== undefined) dbQuery.$and.push({ commission: query.commission });

    if (query.syndication !== undefined) dbQuery.$and.push({ syndication: query.syndication });

    return dbQuery;
};

// @desc    Get all funding expenses
// @route   GET /api/v1/funding-expenses
// @access  Private
exports.getFundingExpenses = async (req, res, next) => {
    try {
        const schema = Joi.object({
            page: Joi.number().default(1).optional(),
            limit: Joi.number().default(10).optional(),
            ...query_schema
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const { page, limit, sort, ...query } = value;

        // Handle query
        const dbQuery = buildDbQuery(req, query);

        // Handle sort
        const dbSort = Helpers.buildSort(sort, { expense_date: -1 });

        const fundingExpenses = await FundingExpenseService.getFundingExpenses(dbQuery, page, limit, dbSort, default_populate);

        res.status(200).json({
            success: true,
            data: fundingExpenses
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get funding expense list without pagination
// @route   GET /api/v1/funding-expenses/list
// @access  Private
exports.getFundingExpenseList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            ...query_schema
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const { sort, ...query } = value;

        // Handle query
        const dbQuery = buildDbQuery(req, query);

        // Handle sort
        const dbSort = Helpers.buildSort(sort, { expense_date: -1 });

        const fundingExpenses = await FundingExpenseService.getFundingExpenseList(dbQuery, dbSort, default_populate);

        res.status(200).json({
            success: true,
            data: fundingExpenses
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new funding expense
// @route   POST /api/v1/funding-expenses
// @access  Private
exports.createFundingExpense = async (req, res, next) => {
    try {
        const schema = Joi.object({
            funding: Joi.string().required(),
            iso: Joi.string().optional(),
            name: Joi.string().required(),
            expense_type: Joi.string().optional(),
            amount: Joi.number().required(),
            expense_date: Joi.date().optional(),
            commission: Joi.boolean().optional(),
            syndication: Joi.boolean().optional(),
            note: Joi.string().optional(),
            created_by_user: Joi.string().optional()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const data = { ...value };

        // Handle filter
        const funding = await FundingService.getFundingById(data.funding);
        accessControl(req, funding, 'funding');

        if (data.expense_type) {
            const expenseType = await ExpenseTypeService.getExpenseTypeById(data.expense_type);
            accessControl(req, expenseType, 'expense type');
        }

        if (data.iso && funding.iso_list.length > 0) {
            const iso = funding.iso_list.find(iso => Helpers.extractIdString(iso) === data.iso);
            if (!iso) {
                //@ need add it in iso_list and check access control but throw error
                throw new ErrorResponse('ISO not found in funding', 400);
            }
            data.iso = Helpers.extractIdString(iso || funding.iso_list[0]);
        }

        data.funder = Helpers.extractIdString(funding.funder);
        data.lender = Helpers.extractIdString(funding.lender);
        data.merchant = Helpers.extractIdString(funding.merchant);
        data.expense_date = data.expense_date || new Date();

        if (!data.created_by_user) {
            if (req.portal === PORTAL_TYPES.FUNDER) {
                data.created_by_user = req.id;
            }
        }

        const fundingExpense = await FundingExpenseService.createFundingExpense(data, default_populate);
        res.status(201).json({
            success: true,
            data: fundingExpense
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get a funding expense by id
// @route   GET /api/v1/funding-expenses/:id
// @access  Private
exports.getFundingExpense = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const { id } = value;

        // fundingExpense check whether it is null in Service
        const fundingExpense = await FundingExpenseService.getFundingExpenseById(id, default_populate);
        accessControl(req, fundingExpense, 'funding expense');

        res.status(200).json({
            success: true,
            data: fundingExpense
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Update a funding expense
// @route   PUT /api/v1/funding-expenses/:id
// @access  Private
exports.updateFundingExpense = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            name: Joi.string().optional(),
            expense_type: Joi.string().optional(),
            iso: Joi.string().optional(),
            amount: Joi.number().optional(),
            commission: Joi.boolean().optional(),
            syndication: Joi.boolean().optional(),
            expense_date: Joi.date().optional(),
            note: Joi.string().optional(),
            inactive: Joi.boolean().optional()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const { id, ...data } = value;

        const fundingExpense = await FundingExpenseService.getFundingExpenseById(id);
        accessControl(req, fundingExpense, 'funding expense');

        if (data.expense_type) {
            const expenseType = await ExpenseTypeService.getExpenseTypeById(data.expense_type);
            accessControl(req, expenseType, 'expense type');
        }

        const funding = await FundingService.getFundingById(fundingExpense.funding);

        if (data.iso && funding.iso_list.length > 0) {
            const iso = funding.iso_list.find(iso => Helpers.extractIdString(iso) === data.iso);
            if (!iso) {
                //@TODO need add it in iso_list and check access control but throw error
                throw new ErrorResponse('ISO not found in funding', 400);
            }
            data.iso = Helpers.extractIdString(iso || funding.iso_list[0]);
        }

        if (req.portal === PORTAL_TYPES.FUNDER) {
            data.updated_by_user = req.id;
        }

        const updatedFundingExpense = await FundingExpenseService.updateFundingExpense(id, data, default_populate);

        res.status(200).json({
            success: true,
            data: updatedFundingExpense
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a funding expense
// @route   DELETE /api/v1/funding-expenses/:id
// @access  Private
exports.deleteFundingExpense = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            throw new ErrorResponse(error.message, 400);
        }

        const { id } = value;

        const fundingExpense = await FundingExpenseService.getFundingExpenseById(id);
        accessControl(req, fundingExpense, 'funding expense');

        await FundingExpenseService.deleteFundingExpense(id, default_populate);

        res.status(200).json({
            success: true,
            message: 'Funding expense deleted successfully',
            data: fundingExpense
        });
    } catch (error) {
        next(error);
    }
}; 