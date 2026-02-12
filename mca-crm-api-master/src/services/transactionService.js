const Transaction = require('../models/Transaction');
const Funder = require('../models/Funder');
const Lender = require('../models/Lender');
const Merchant = require('../models/Merchant');
const ISO = require('../models/ISO');
const Syndicator = require('../models/Syndicator');

const TransactionBreakdownService = require('./transactionBreakdownService');
const FundingService = require('./fundingService');
const SyndicationService = require('./syndicationService');
const PaybackService = require('./paybackService');
const PayoutService = require('./payoutService');

const { TRANSACTION_TYPES, TRANSACTION_SENDER_TYPES, TRANSACTION_RECEIVER_TYPES } = require('../utils/constants');
const Validators = require('../utils/validators');
const Helpers = require('../utils/helpers');
const ErrorResponse = require('../utils/errorResponse');

/**
 * Format the transaction data to apply setters manually (needed when using lean())
 * @param {Object} transaction - The transaction
 * @returns {Object} - The formatted transaction
 */
const formatDataBeforeReturn = (transaction) => {
    return {
        ...transaction,
        amount: Helpers.centsToDollars(transaction.amount) || 0
    };
};

/**
 * Format the transaction data to apply setters manually (needed when using lean())
 * @param {Object} transaction - The transaction
 * @returns {Object} - The formatted transaction
 */
const formatDataBeforeSave = (transaction) => {
    return {
        ...transaction,
        amount: Helpers.dollarsToCents(transaction.amount) || undefined
    };
};

/**
 * Get all transactions with filtering and pagination
 */
exports.getTransactions = async (query, page = 1, limit = 10, sort = { transaction_date: -1 }, populate = [], select = '', calculate = false) => {
    // Pagination
    const skip = (page - 1) * limit;
    
    // Get transactions with pagination
    const [transactions, count] = await Promise.all([
        Transaction.find(query, null, { calculate })
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        Transaction.countDocuments(query)
    ]);
    
    return {
        docs: transactions.map(formatDataBeforeReturn),
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of transactions without pagination
 */
exports.getTransactionList = async (query, sort = { transaction_date: -1 }, populate = [], select = '', calculate = false) => {
    const transactions = await Transaction.find(query, null, { calculate })
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();

    return transactions.map(formatDataBeforeReturn);
};

/**
 * Get a single transaction by ID
 */
exports.getTransactionById = async (id, populate = [], select = '', calculate = false) => {
    Validators.checkValidateObjectId(id, 'transaction ID');
    
    const transaction = await Transaction.findById(id, null, { calculate })
        .populate(populate)
        .select(select)
        .lean();
        
    Validators.checkResourceNotFound(transaction, 'Transaction');
    
    return formatDataBeforeReturn(transaction);
};

/**
 * Create a new transaction
 * @param {Object} data - The data of the transaction
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 * @returns {Promise<Object>} - The created transaction
 */
exports.createTransaction = async (data, populate = [], select = '') => {
    // Validate required fields
    if (!data.funder) {
        throw new ErrorResponse('Funder is required for transaction', 400);
    }

    if (!data.sender_type && !data.receiver_type) {
        throw new ErrorResponse('Sender type and receiver type are required', 400);
    }

    if (!data.type) {
        throw new ErrorResponse('Transaction type is required', 400);
    }

    // Validate transaction type
    if (!Object.values(TRANSACTION_TYPES).includes(data.type)) {
        throw new ErrorResponse('Invalid transaction type', 400);
    }

    // Populate sender based on sender type
    switch(data.sender_type) {
    case TRANSACTION_SENDER_TYPES.FUNDER:
        data.sender = await Funder.convertToEmbeddedFormat(data.sender);
        break;
    case TRANSACTION_SENDER_TYPES.LENDER:
        data.sender = await Lender.convertToEmbeddedFormat(data.sender);
        break;
    case TRANSACTION_SENDER_TYPES.MERCHANT:
        data.sender = await Merchant.convertToEmbeddedFormat(data.sender);
        break;
    case TRANSACTION_SENDER_TYPES.ISO:
        data.sender = await ISO.convertToEmbeddedFormat(data.sender);
        break;
    case TRANSACTION_SENDER_TYPES.SYNDICATOR:
        data.sender = await Syndicator.convertToEmbeddedFormat(data.sender);
        break;
    default:
        break;
    }

    // Populate receiver based on receiver type
    switch(data.receiver_type) {
    case TRANSACTION_RECEIVER_TYPES.FUNDER:
        data.receiver = await Funder.convertToEmbeddedFormat(data.receiver);
        break;
    case TRANSACTION_RECEIVER_TYPES.LENDER:
        data.receiver = await Lender.convertToEmbeddedFormat(data.receiver);
        break;
    case TRANSACTION_RECEIVER_TYPES.MERCHANT:
        data.receiver = await Merchant.convertToEmbeddedFormat(data.receiver);
        break;
    case TRANSACTION_RECEIVER_TYPES.ISO:
        data.receiver = await ISO.convertToEmbeddedFormat(data.receiver);
        break;
    case TRANSACTION_RECEIVER_TYPES.SYNDICATOR:
        data.receiver = await Syndicator.convertToEmbeddedFormat(data.receiver);
        break;
    default:
        break;
    }

    const transaction = await Transaction.create(formatDataBeforeSave(data));
    
    Validators.checkResourceCreated(transaction, 'transaction');

    
    const newTransaction = await this.getTransactionById(transaction._id, populate, select);

    try {
        // According to different transaction types, we need to update the breakdown
        switch(data.type) {
        case TRANSACTION_TYPES.COMMISSION:
            if (data.funding) {
                const funding = await FundingService.getFundingById(data.funding, [], '', true);
                const percent = newTransaction.amount / funding.commission_amount;
                const bd_commission = {
                    funder: data.funder,
                    transaction: transaction._id, 
                    funding: data.funding, 
                    amount: funding.commission_amount * percent,
                    description: `${Math.round(percent * 100)}% of commission amount $${funding.commission_amount.toFixed(2)}`
                };
                await TransactionBreakdownService.createTransactionBreakdown(bd_commission);
            }
            break;
        case TRANSACTION_TYPES.DISBURSEMENT:
            if (data.funding) {
                const funding = await FundingService.getFundingById(data.funding, [], '', true);
                const percent = newTransaction.amount / funding.net_amount;
                const bd_fund = {
                    funder: data.funder,
                    transaction: transaction._id, 
                    funding: data.funding, 
                    amount: funding.funded_amount * percent,
                    description: `${Math.round(percent * 100)}% of total funding amount $${funding.funded_amount.toFixed(2)}`
                };
                const bd_upfront_fee = {
                    funder: data.funder,
                    transaction: transaction._id, 
                    funding: data.funding, 
                    amount: -1 * funding.upfront_fee_amount * percent,
                    description: `${Math.round(percent * 100)}% of upfront fee amount $${funding.upfront_fee_amount.toFixed(2)}`
                };
                await TransactionBreakdownService.createTransactionBreakdown(bd_fund);
                if (funding.upfront_fee_amount !== 0) await TransactionBreakdownService.createTransactionBreakdown(bd_upfront_fee);
            }
            break;
        case TRANSACTION_TYPES.PAYBACK:
            if (data.source) {
                const payback = await PaybackService.getPaybackById(data.source);
                const bd_fund = {
                    funder: data.funder,
                    transaction: transaction._id, 
                    funding: Helpers.extractIdString(payback.funding), 
                    amount: payback.funded_amount,
                    description: `$${payback.funded_amount.toFixed(2)} payback for the funding`
                };
                const bd_fee = {
                    funder: data.funder,
                    transaction: transaction._id, 
                    funding: Helpers.extractIdString(payback.funding), 
                    amount: payback.fee_amount,
                    description: `$${payback.fee_amount.toFixed(2)} payback for the fee`
                };
                if (payback.funded_amount !== 0) await TransactionBreakdownService.createTransactionBreakdown(bd_fund);
                if (payback.fee_amount !== 0) await TransactionBreakdownService.createTransactionBreakdown(bd_fee);
            }
            break;
        case TRANSACTION_TYPES.PAYOUT:
            if (data.source) {
                const payout = await PayoutService.getPayoutById(data.source);
                const bd_payout = {
                    funder: data.funder,
                    transaction: transaction._id, 
                    funding: Helpers.extractIdString(payout.funding), 
                    amount: payout.payout_amount,
                    description: `Received $${payout.payout_amount.toFixed(2)} payout in total`
                };
                const bd_fee = {
                    funder: data.funder,
                    transaction: transaction._id, 
                    funding: Helpers.extractIdString(payout.funding), 
                    amount: -payout.fee_amount,
                    description: `$${payout.fee_amount.toFixed(2)} fee deducted from available amount`
                };
                const bd_credit = {
                    funder: data.funder,
                    transaction: transaction._id, 
                    funding: Helpers.extractIdString(payout.funding), 
                    amount: payout.credit_amount,
                    description: `$${payout.credit_amount.toFixed(2)} credit added to available amount`
                };
                await TransactionBreakdownService.createTransactionBreakdown(bd_payout);
                if (payout.fee_amount !== 0) await TransactionBreakdownService.createTransactionBreakdown(bd_fee);
                if (payout.credit_amount !== 0) await TransactionBreakdownService.createTransactionBreakdown(bd_credit);
            }
            break;
        case TRANSACTION_TYPES.SYNDICATION:
            if (data.source) {
                const syndication = await SyndicationService.getSyndicationById(data.source);
                const bd_syndication = {
                    funder: data.funder,
                    transaction: transaction._id, 
                    funding: Helpers.extractIdString(syndication.funding), 
                    amount: syndication.syndicated_amount,
                    description: `$${syndication.syndicated_amount.toFixed(2)} syndication amount`
                };
                await TransactionBreakdownService.createTransactionBreakdown(bd_syndication);
            }
            break;
        default:
            break;
        }
    } catch (error) {
        console.error('❌ Error creating transaction breakdown:', error);
    }

    return newTransaction;
};

/**
 * Update an existing transaction
 */
exports.updateTransaction = async (id, data, populate = [], select = '', calculate = false) => {
    Validators.checkValidateObjectId(id, 'transaction ID');
    
    // Populate sender based on sender type if provided
    if (data.sender_type && data.sender) {
        switch(data.sender_type) {
        case TRANSACTION_SENDER_TYPES.FUNDER:
            data.sender = await Funder.convertToEmbeddedFormat(data.sender);
            break;
        case TRANSACTION_SENDER_TYPES.LENDER:
            data.sender = await Lender.convertToEmbeddedFormat(data.sender);
            break;
        case TRANSACTION_SENDER_TYPES.MERCHANT:
            data.sender = await Merchant.convertToEmbeddedFormat(data.sender);
            break;
        case TRANSACTION_SENDER_TYPES.ISO:
            data.sender = await ISO.convertToEmbeddedFormat(data.sender);
            break;
        case TRANSACTION_SENDER_TYPES.SYNDICATOR:
            data.sender = await Syndicator.convertToEmbeddedFormat(data.sender);
            break;
        default:
            break;
        }
    }

    // Populate receiver based on receiver type if provided
    if (data.receiver_type && data.receiver) {
        switch(data.receiver_type) {
        case TRANSACTION_RECEIVER_TYPES.FUNDER:
            data.receiver = await Funder.convertToEmbeddedFormat(data.receiver);
            break;
        case TRANSACTION_RECEIVER_TYPES.LENDER:
            data.receiver = await Lender.convertToEmbeddedFormat(data.receiver);
            break;
        case TRANSACTION_RECEIVER_TYPES.MERCHANT:
            data.receiver = await Merchant.convertToEmbeddedFormat(data.receiver);
            break;
        case TRANSACTION_RECEIVER_TYPES.ISO:
            data.receiver = await ISO.convertToEmbeddedFormat(data.receiver);
            break;
        case TRANSACTION_RECEIVER_TYPES.SYNDICATOR:
            data.receiver = await Syndicator.convertToEmbeddedFormat(data.receiver);
            break;
        default:
            break;
        }
    }

    const transaction = await Transaction.findByIdAndUpdate(id, formatDataBeforeSave(data), {
        new: true,
        runValidators: true
    });

    Validators.checkResourceNotFound(transaction, 'Transaction');

    return await this.getTransactionById(transaction._id, populate, select, calculate);
};

/**
 * Delete a transaction (soft delete by setting inactive to true)
 */
exports.deleteTransaction = async (id) => {
    Validators.checkValidateObjectId(id, 'transaction ID');
    
    const transaction = await Transaction.findByIdAndUpdate(id, { inactive: true }, {
        new: true,
        runValidators: true
    });
    
    Validators.checkResourceNotFound(transaction, 'Transaction');
    
    return {
        success: true,
        message: 'Transaction deleted successfully'
    };
};

/**
 * Hard delete a transaction
 * @param {string} id - The ID of the transaction
 * @returns {Promise<Object>} - The deleted transaction
 */
exports.hardDeleteTransaction = async (id) => {
    Validators.checkValidateObjectId(id, 'transaction ID');

    const transaction = await Transaction.findByIdAndDelete(id);

    Validators.checkResourceNotFound(transaction, 'transaction');

    return transaction;
};

/**
 * Mark a transaction as reconciled
 * @param {string} id - The ID of the transaction
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 * @returns {Promise<Object>} - The reconciled transaction
 */
exports.reconcileTransaction = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'transaction ID');

    const transaction = await Transaction.findByIdAndUpdate(id, { reconciled: true }, { new: true, runValidators: true });

    Validators.checkResourceNotFound(transaction, 'transaction');

    return await this.getTransactionById(transaction._id, populate, select);
};

/**
 * Mark a transaction as unreconciled
 * @param {string} id - The ID of the transaction
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 * @returns {Promise<Object>} - The unreconciled transaction
 */
exports.unreconcileTransaction = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'transaction ID');

    const transaction = await Transaction.findByIdAndUpdate(id, { reconciled: false }, { new: true, runValidators: true });

    Validators.checkResourceNotFound(transaction, 'transaction');

    return await this.getTransactionById(transaction._id, populate, select);
};
