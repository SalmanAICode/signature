const Joi = require('joi');

const TransactionService = require('../services/transactionService');

const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');

const default_populate = [
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
    select: Joi.string().allow('').optional(),
    search: Joi.string().allow('').optional(),
    // Following query parameters are based on fields from transaction model
    funder: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    sender: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    receiver: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    sender_type: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    receiver_type: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    type: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    funding: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    source: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    reconciled: Joi.boolean().optional(),
    amount_from: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    amount_to: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    transaction_date_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    transaction_date_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    include_inactive: Joi.boolean().default(false).optional(),
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
        dbQuery.$and.push({ funder: req.filter.funder });
    } else if (req.filter.funder_list) {
        dbQuery.$and.push({ funder: { $in: req.filter.funder_list } });
    }

    // Handle search
    if (query.search) {
        dbQuery.$and.push(Helpers.buildSearchFilter([
            'description',
            'notes',
            'sender.name',
            'receiver.name',
            'funder.name', 'funder.email', 'funder.phone',
            'funding.name', 'funding.merchant.name', 'funding.funder.name'
        ], query.search));
    }

    // Handle fields from transaction model
    if (query.funder) dbQuery.$and.push(Helpers.buildArrayFilter('funder', query.funder, true));
    if (query.sender) dbQuery.$and.push(Helpers.buildSearchFilter('sender.name', query.sender, true));
    if (query.receiver) dbQuery.$and.push(Helpers.buildSearchFilter('receiver.name', query.receiver, true));
    if (query.sender_type) dbQuery.$and.push(Helpers.buildArrayFilter('sender_type', query.sender_type));
    if (query.receiver_type) dbQuery.$and.push(Helpers.buildArrayFilter('receiver_type', query.receiver_type));
    if (query.type) dbQuery.$and.push(Helpers.buildArrayFilter('type', query.type));
    if (query.funding) dbQuery.$and.push(Helpers.buildArrayFilter('funding', query.funding, true));
    if (query.source) dbQuery.$and.push(Helpers.buildArrayFilter('source', query.source, true));

    if (query.reconciled !== undefined) dbQuery.$and.push(Helpers.buildBooleanFilter('reconciled', query.reconciled));

    if (query.amount_from) dbQuery.$and.push(Helpers.buildGTEFilter('amount', query.amount_from, true));
    if (query.amount_to) dbQuery.$and.push(Helpers.buildLTEFilter('amount', query.amount_to, true));

    if (query.transaction_date_from) dbQuery.$and.push(Helpers.buildGTEFilter('transaction_date', query.transaction_date_from));
    if (query.transaction_date_to) dbQuery.$and.push(Helpers.buildLTEFilter('transaction_date', query.transaction_date_to));

    if (!query.include_inactive) dbQuery.$and.push({ inactive: { $ne: true } });

    if (query.createdAt_from) dbQuery.$and.push(Helpers.buildGTEFilter('createdAt', query.createdAt_from));
    if (query.createdAt_to) dbQuery.$and.push(Helpers.buildLTEFilter('createdAt', query.createdAt_to));
    if (query.updatedAt_from) dbQuery.$and.push(Helpers.buildGTEFilter('updatedAt', query.updatedAt_from));
    if (query.updatedAt_to) dbQuery.$and.push(Helpers.buildLTEFilter('updatedAt', query.updatedAt_to));

    // Clear empty filters
    dbQuery.$and = dbQuery.$and.filter(filter => Object.keys(filter).length > 0);

    return dbQuery;
};

// @desc    Get all transactions
// @route   GET /api/v1/transactions
// @access  Private
exports.getTransactions = async (req, res, next) => {
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
        const dbSort = Helpers.buildSort(sort, { transaction_date: -1 });
        
        const result = await TransactionService.getTransactions(
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

// @desc    Get transaction list without pagination
// @route   GET /api/v1/transactions/list
// @access  Private
exports.getTransactionList = async (req, res, next) => {
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
        const dbSort = Helpers.buildSort(sort, { transaction_date: -1 });
        
        const transactions = await TransactionService.getTransactionList(
            dbQuery,
            dbSort,
            [],
            select || 'description amount transaction_date funder.name funding.name type reconciled'
        );

        res.status(200).json({
            success: true,
            data: transactions
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single transaction
// @route   GET /api/v1/transactions/:id
// @access  Private
exports.getTransaction = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const transaction = await TransactionService.getTransactionById(
            value.id,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: transaction
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new transaction
// @route   POST /api/v1/transactions
// @access  Private
exports.createTransaction = async (req, res, next) => {
    try {
        const schema = Joi.object({
            funder: Joi.string().required(),
            sender: Joi.string().optional(),
            receiver: Joi.string().optional(),
            sender_type: Joi.string().valid('FUNDER', 'LENDER', 'MERCHANT', 'ISO', 'SYNDICATOR', 'OTHER').required(),
            receiver_type: Joi.string().valid('FUNDER', 'LENDER', 'MERCHANT', 'ISO', 'SYNDICATOR', 'OTHER').required(),
            sender_account: Joi.object().optional(),
            receiver_account: Joi.object().optional(),
            amount: Joi.number().required(),
            transaction_date: Joi.date().optional(),
            funding: Joi.string().optional(),
            type: Joi.string().required(),
            source: Joi.string().optional(),
            reconciled: Joi.boolean().optional(),
            description: Joi.string().optional(),
            notes: Joi.string().optional()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const data = { ...value };

        // Set default funder if not provided
        if (!data.funder) {
            if (req.filter.funder) {
                data.funder = req.filter.funder;
            } else {
                throw new ErrorResponse('There is no funder selected to create transaction', 403);
            }
        }

        // Set default values
        if (data.transaction_date === undefined) data.transaction_date = new Date();
        if (data.reconciled === undefined) data.reconciled = false;

        const transaction = await TransactionService.createTransaction(
            data,
            default_populate
        );

        res.status(201).json({
            success: true,
            data: transaction
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update transaction
// @route   PUT /api/v1/transactions/:id
// @access  Private
exports.updateTransaction = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            funder: Joi.string().optional(),
            sender: Joi.string().optional(),
            receiver: Joi.string().optional(),
            sender_type: Joi.string().valid('FUNDER', 'LENDER', 'MERCHANT', 'ISO', 'SYNDICATOR', 'OTHER').optional(),
            receiver_type: Joi.string().valid('FUNDER', 'LENDER', 'MERCHANT', 'ISO', 'SYNDICATOR', 'OTHER').optional(),
            sender_account: Joi.object().optional(),
            receiver_account: Joi.object().optional(),
            amount: Joi.number().optional(),
            transaction_date: Joi.date().optional(),
            funding: Joi.string().optional(),
            type: Joi.string().optional(),
            source: Joi.string().optional(),
            reconciled: Joi.boolean().optional(),
            description: Joi.string().optional(),
            notes: Joi.string().optional(),
            inactive: Joi.boolean().optional()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, ...data } = value;

        const transaction = await TransactionService.updateTransaction(
            id,
            data,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: transaction
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete transaction
// @route   DELETE /api/v1/transactions/:id
// @access  Private
exports.deleteTransaction = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        await TransactionService.deleteTransaction(value.id);

        res.status(200).json({
            success: true,
            message: 'Transaction deleted successfully'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Reconcile transaction
// @route   PUT /api/v1/transactions/:id/reconcile
// @access  Private
exports.reconcileTransaction = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const transaction = await TransactionService.reconcileTransaction(
            value.id,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: transaction
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Unreconcile transaction
// @route   PUT /api/v1/transactions/:id/unreconcile
// @access  Private
exports.unreconcileTransaction = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const transaction = await TransactionService.unreconcileTransaction(
            value.id,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: transaction
        });
    } catch (err) {
        next(err);
    }
}; 