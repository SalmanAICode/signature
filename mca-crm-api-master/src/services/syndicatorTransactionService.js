const SyndicatorTransaction = require('../models/SyndicatorTransaction');

const Validators = require('../utils/validators');

/**
 * Create a new syndicator transaction
 */
exports.createSyndicatorTransaction = async (syndicatorTransactionData, populate = []) => {
    // Set created and updated dates
    syndicatorTransactionData.created_date = Date.now();
    syndicatorTransactionData.updated_date = Date.now();

    const syndicatorTransaction = await SyndicatorTransaction.create(syndicatorTransactionData);
    
    Validators.checkResourceCreated(syndicatorTransaction, 'Syndicator Transaction', populate);
    return await syndicatorTransaction.populate(populate);
};

/**
 * Get syndicator transaction by ID
 */
exports.getSyndicatorTransactionById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'Syndicator Transaction ID');

    const syndicatorTransaction = await SyndicatorTransaction
        .findById(id)
        .populate(populate)
        .select(select);

    Validators.checkResourceNotFound(syndicatorTransaction, 'Syndicator Transaction');

    return syndicatorTransaction;
};

/**
 * Get all syndicator transactions
 */
exports.getSyndicatorTransactions = async (query, page = 1, limit = 10, sort = { created_date: -1 }, populate = []) => {
    const skip = (page - 1) * limit;

    const [syndicatorTransactions, count] = await Promise.all([
        SyndicatorTransaction.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate),
        SyndicatorTransaction.countDocuments(query)
    ]);

    return {
        docs: syndicatorTransactions,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of syndicator transactions without pagination
 */
exports.getSyndicatorTransactionList = async (query, populate = [], select = '', sort = { created_date: -1 }) => {
    return await SyndicatorTransaction.find(query)
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();
};

/**
 * Update a syndicator transaction
 */
exports.updateSyndicatorTransaction = async (id, updateData, populate = []) => {
    Validators.checkValidateObjectId(id, 'Syndicator Transaction ID');

    const syndicatorTransaction = await SyndicatorTransaction.findById(id);

    Validators.checkResourceNotFound(syndicatorTransaction, 'Syndicator Transaction');

    updateData.updated_date = Date.now();

    const updatedSyndicatorTransaction = await SyndicatorTransaction.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    return await updatedSyndicatorTransaction.populate(populate);
};