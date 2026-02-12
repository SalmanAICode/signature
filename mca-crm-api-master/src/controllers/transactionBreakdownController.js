const Joi = require('joi');

const TransactionBreakdownService = require('../services/transactionBreakdownService');

const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');

const default_populate = [
    {
        path: 'transaction',
        select: 'amount type transaction_date description'
    },
    {
        path: 'funder',
        select: 'name email phone'
    },
    {
        path: 'funding',
        select: 'name merchant funder amount'
    }
];

const query_schema = {
    sort: Joi.string().allow('').optional(),
    search: Joi.string().allow('').optional(),
    funder: Joi.string().allow('').optional(),
    transaction: Joi.string().allow('').optional(),
    funding: Joi.string().allow('').optional(),
    amount_from: Joi.number().allow('').optional(),
    amount_to: Joi.number().allow('').optional()
};

const buildDbQuery = (req, query) => {
    const dbQuery = {};

    dbQuery.$and = [];

    // Handle search
    if (query.search) {
        dbQuery.$and.push({
            $or: [
                { description: { $regex: query.search, $options: 'i' } }
            ]
        });
    }

    // Handle funder filter
    const funderFilter = Helpers.buildFunderFilter(req, query.funder);
    if (funderFilter) dbQuery.$and.push({ funder: funderFilter });

    // Handle transaction
    if (query.transaction) dbQuery.$and.push({ transaction: query.transaction });

    // Handle funding
    if (query.funding) dbQuery.$and.push({ funding: query.funding });

    // Handle amount_from, amount_to
    if (query.amount_from) dbQuery.$and.push({ amount: { $gte: Helpers.dollarsToCents(query.amount_from) } });
    if (query.amount_to) dbQuery.$and.push({ amount: { $lte: Helpers.dollarsToCents(query.amount_to) } });

    return dbQuery;
};

// @desc    Get all transaction breakdowns
// @route   GET /api/v1/transaction-breakdowns
// @access  Private
exports.getTransactionBreakdowns = async (req, res, next) => {
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

        const { page, limit, sort, ...query } = value;

        const dbQuery = buildDbQuery(req, query);

        // Handle sort
        const dbSort = Helpers.buildSort(sort, { createdAt: -1 });
        
        const result = await TransactionBreakdownService.getTransactionBreakdowns(
            dbQuery,
            page,
            limit,
            dbSort,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get transaction breakdown list without pagination
// @route   GET /api/v1/transaction-breakdowns/list
// @access  Private
exports.getTransactionBreakdownList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            ...query_schema
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const dbQuery = buildDbQuery(req, value);

        // Handle sort
        const dbSort = Helpers.buildSort(value.sort, { createdAt: -1 });
        
        const breakdowns = await TransactionBreakdownService.getTransactionBreakdownList(
            dbQuery,
            dbSort,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: breakdowns
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single transaction breakdown
// @route   GET /api/v1/transaction-breakdowns/:id
// @access  Private
exports.getTransactionBreakdown = async (req, res, next) => {
    try {
        const breakdown = await TransactionBreakdownService.getTransactionBreakdownById(
            req.params.id,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: breakdown
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new transaction breakdown
// @route   POST /api/v1/transaction-breakdowns
// @access  Private
exports.createTransactionBreakdown = async (req, res, next) => {
    try {
        const schema = Joi.object({
            transaction: Joi.string().required(),
            funder: Joi.string().required(),
            funding: Joi.string().optional(),
            amount: Joi.number().required(),
            description: Joi.string().optional()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const breakdown = await TransactionBreakdownService.createTransactionBreakdown(
            value,
            default_populate
        );

        res.status(201).json({
            success: true,
            data: breakdown
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update transaction breakdown
// @route   PUT /api/v1/transaction-breakdowns/:id
// @access  Private
exports.updateTransactionBreakdown = async (req, res, next) => {
    try {
        const schema = Joi.object({
            funder: Joi.string().optional(),
            funding: Joi.string().optional(),
            amount: Joi.number().optional(),
            description: Joi.string().optional()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const breakdown = await TransactionBreakdownService.updateTransactionBreakdown(
            req.params.id,
            value,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: breakdown
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete transaction breakdown
// @route   DELETE /api/v1/transaction-breakdowns/:id
// @access  Private
exports.deleteTransactionBreakdown = async (req, res, next) => {
    try {
        const result = await TransactionBreakdownService.deleteTransactionBreakdown(req.params.id);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get breakdowns by transaction
// @route   GET /api/v1/transaction-breakdowns/transaction/:transactionId
// @access  Private
exports.getBreakdownsByTransaction = async (req, res, next) => {
    try {
        const schema = Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).default(25),
            sort: Joi.string().allow('').optional()
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { page, limit, sort } = value;

        // Handle sort
        const dbSort = Helpers.buildSort(sort, { createdAt: -1 });
        
        const result = await TransactionBreakdownService.getBreakdownsByTransaction(
            req.params.transactionId,
            {},
            page,
            limit,
            dbSort,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get breakdown summary by transaction
// @route   GET /api/v1/transaction-breakdowns/transaction/:transactionId/summary
// @access  Private
exports.getBreakdownSummaryByTransaction = async (req, res, next) => {
    try {
        const summary = await TransactionBreakdownService.getBreakdownSummaryByTransaction(
            req.params.transactionId
        );

        res.status(200).json({
            success: true,
            data: summary
        });
    } catch (err) {
        next(err);
    }
}; 