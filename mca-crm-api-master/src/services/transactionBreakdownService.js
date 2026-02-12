const TransactionBreakdown = require('../models/TransactionBreakdown');
const Transaction = require('../models/Transaction');

const Validators = require('../utils/validators');
const { centsToDollars, dollarsToCents } = require('../utils/helpers');
const ErrorResponse = require('../utils/errorResponse');

/**
 * Format the transaction breakdown data to apply setters manually (needed when using lean())
 * @param {Object} breakdown - The transaction breakdown
 * @returns {Object} - The formatted transaction breakdown
 */
const formatDataBeforeReturn = (breakdown) => {
    return {
        ...breakdown,
        amount: centsToDollars(breakdown.amount) || 0
    };
};

/**
 * Format the transaction breakdown data to apply setters manually (needed when using lean())
 * @param {Object} breakdown - The transaction breakdown
 * @returns {Object} - The formatted transaction breakdown
 */
const formatDataBeforeSave = (breakdown) => {
    return {
        ...breakdown,
        amount: dollarsToCents(breakdown.amount) || undefined
    };
};

/**
 * Create a new transaction breakdown
 * @param {Object} data - The data of the transaction breakdown
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 * @returns {Promise<Object>} - The created transaction breakdown
 */
exports.createTransactionBreakdown = async (data, populate = [], select = '') => {
    // Validate required fields
    if (!data.transaction) {
        throw new ErrorResponse('Transaction is required for transaction breakdown', 400);
    }
    
    if (!data.funder) {
        throw new ErrorResponse('Funder is required for transaction breakdown', 400);
    }

    // Validate that the transaction exists
    const transaction = await Transaction.findById(data.transaction);
    if (!transaction) {
        throw new ErrorResponse('Transaction not found', 404);
    }

    // Validate that the funder matches the transaction's funder if specified
    if (transaction.funder && transaction.funder.toString() !== data.funder.toString()) {
        throw new ErrorResponse('Funder must match the transaction funder', 400);
    }

    const breakdown = await TransactionBreakdown.create(formatDataBeforeSave(data));
    
    Validators.checkResourceCreated(breakdown, 'transaction breakdown');

    return await this.getTransactionBreakdownById(breakdown._id, populate, select);
};

/**
 * Get transaction breakdown by ID
 * @param {string} id - The ID of the transaction breakdown
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 * @returns {Promise<Object>} - The transaction breakdown
 */
exports.getTransactionBreakdownById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'transaction breakdown ID');

    const breakdown = await TransactionBreakdown
        .findById(id)
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(breakdown, 'transaction breakdown');

    return formatDataBeforeReturn(breakdown);
};

/**
 * Get all transaction breakdowns with pagination
 * @param {Object} query - The query object
 * @param {number} page - The page number
 * @param {number} limit - The limit number
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 * @returns {Promise<Object>} - The transaction breakdowns with pagination
 */
exports.getTransactionBreakdowns = async (query, page = 1, limit = 10, sort = { createdAt: -1 }, populate = [], select = '') => {
    const skip = (page - 1) * limit;
    
    const [breakdowns, count] = await Promise.all([
        TransactionBreakdown.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        TransactionBreakdown.countDocuments(query)
    ]);
    
    return {
        docs: breakdowns.map(formatDataBeforeReturn),
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get list of transaction breakdowns without pagination
 * @param {Object} query - The query object
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 * @returns {Promise<Array>} - The transaction breakdowns
 */
exports.getTransactionBreakdownList = async (query, sort = { createdAt: -1 }, populate = [], select = '') => {
    const breakdowns = await TransactionBreakdown.find(query)
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();

    return breakdowns.map(formatDataBeforeReturn);
};

/**
 * Update a transaction breakdown
 * @param {string} id - The ID of the transaction breakdown
 * @param {Object} data - The data of the transaction breakdown
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 * @returns {Promise<Object>} - The updated transaction breakdown
 */
exports.updateTransactionBreakdown = async (id, data, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'transaction breakdown ID');

    const breakdown = await TransactionBreakdown.findByIdAndUpdate(id, formatDataBeforeSave(data), { new: true, runValidators: true });

    Validators.checkResourceNotFound(breakdown, 'transaction breakdown');

    return await this.getTransactionBreakdownById(breakdown._id, populate, select);
};

/**
 * Delete a transaction breakdown
 * @param {string} id - The ID of the transaction breakdown
 * @returns {Promise<boolean>} - The deletion result
 */
exports.deleteTransactionBreakdown = async (id) => {
    Validators.checkValidateObjectId(id, 'transaction breakdown ID');

    const breakdown = await TransactionBreakdown.findByIdAndDelete(id);

    Validators.checkResourceNotFound(breakdown, 'transaction breakdown');

    return true;
};

/**
 * Get transaction breakdowns by transaction ID
 * @param {string} transactionId - The ID of the transaction
 * @param {Object} additionalQuery - Additional query parameters
 * @param {number} page - The page number
 * @param {number} limit - The limit number
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 * @returns {Promise<Object>} - The transaction breakdowns with pagination
 */
exports.getBreakdownsByTransaction = async (transactionId, additionalQuery = {}, page = 1, limit = 10, sort = { createdAt: -1 }, populate = [], select = '') => {
    Validators.checkValidateObjectId(transactionId, 'transaction ID');

    const query = {
        transaction: transactionId,
        ...additionalQuery
    };

    return await this.getTransactionBreakdowns(query, page, limit, sort, populate, select);
};


/**
 * Get breakdown summary by transaction
 * @param {string} transactionId - The ID of the transaction
 * @returns {Promise<Object>} - The breakdown summary
 */
exports.getBreakdownSummaryByTransaction = async (transactionId) => {
    Validators.checkValidateObjectId(transactionId, 'transaction ID');

    const summary = await TransactionBreakdown.aggregate([
        {
            $match: {
                transaction: require('mongoose').Types.ObjectId(transactionId)
            }
        },
        {
            $group: {
                _id: null,
                total_breakdown_amount: { $sum: '$amount' },
                breakdown_count: { $sum: 1 },
                avg_breakdown_amount: { $avg: '$amount' }
            }
        },
        {
            $addFields: {
                total_breakdown_amount_dollars: { $divide: ['$total_breakdown_amount', 100] },
                avg_breakdown_amount_dollars: { $divide: ['$avg_breakdown_amount', 100] }
            }
        }
    ]);

    // Get the transaction details
    const transaction = await Transaction.findById(transactionId).lean();
    if (!transaction) {
        throw new ErrorResponse('Transaction not found', 404);
    }

    const result = summary.length > 0 ? summary[0] : {
        total_breakdown_amount: 0,
        breakdown_count: 0,
        avg_breakdown_amount: 0,
        total_breakdown_amount_dollars: 0,
        avg_breakdown_amount_dollars: 0
    };

    return {
        transaction_id: transactionId,
        transaction_amount: transaction.amount,
        transaction_amount_dollars: centsToDollars(transaction.amount),
        breakdown_summary: {
            total_breakdown_amount: result.total_breakdown_amount,
            total_breakdown_amount_dollars: result.total_breakdown_amount_dollars,
            breakdown_count: result.breakdown_count,
            avg_breakdown_amount: result.avg_breakdown_amount,
            avg_breakdown_amount_dollars: result.avg_breakdown_amount_dollars,
            variance_amount: transaction.amount - result.total_breakdown_amount,
            variance_amount_dollars: centsToDollars(transaction.amount - result.total_breakdown_amount),
            is_fully_broken_down: transaction.amount === result.total_breakdown_amount
        }
    };
};

/**
 * Validate transaction breakdown totals
 * @param {string} transactionId - The ID of the transaction
 * @returns {Promise<Object>} - The validation result
 */
exports.validateBreakdownTotals = async (transactionId) => {
    Validators.checkValidateObjectId(transactionId, 'transaction ID');

    const summary = await this.getBreakdownSummaryByTransaction(transactionId);
    
    return {
        transaction_id: transactionId,
        is_valid: summary.breakdown_summary.is_fully_broken_down,
        variance_amount: summary.breakdown_summary.variance_amount,
        variance_amount_dollars: summary.breakdown_summary.variance_amount_dollars,
        message: summary.breakdown_summary.is_fully_broken_down 
            ? 'Transaction is fully broken down'
            : `Transaction has a variance of ${summary.breakdown_summary.variance_amount_dollars} dollars`
    };
};
