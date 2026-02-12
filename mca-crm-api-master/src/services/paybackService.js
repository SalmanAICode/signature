const Payback = require('../models/Payback');

const PaybackLogService = require('./paybackLogService');
const PayoutService = require('./payoutService');
const SyndicationService = require('./syndicationService');

const { ACTIONS } = require('../utils/permissions');
const { PAYBACK_STATUS, SYNDICATION_STATUS, TRANSACTION_SENDER_TYPES, TRANSACTION_RECEIVER_TYPES, TRANSACTION_TYPES } = require('../utils/constants');
const Helpers = require('../utils/helpers');
const Validators = require('../utils/validators');
const ErrorResponse = require('../utils/errorResponse');
const { centsToDollars, dollarsToCents } = require('../utils/helpers');

/**
 * Format the payback data to apply setters manually (needed when using lean())
 * @param {Object} payback - The payback
 * @returns {Object} - The formatted payback
 */
const formatDataBeforeReturn = (payback) => {
    return {
        ...payback,
        payback_amount: centsToDollars(payback.payback_amount) || 0,
        funded_amount: centsToDollars(payback.funded_amount) || 0,
        fee_amount: centsToDollars(payback.fee_amount) || 0,

        funding: payback.funding ? Helpers.isObjectId(payback.funding) ? payback.funding : {
            ...payback.funding,
            funded_amount: centsToDollars(payback.funding.funded_amount) || undefined,
            payback_amount: centsToDollars(payback.funding.payback_amount) || undefined,
            commission_amount: centsToDollars(payback.funding.commission_amount) || undefined
        } : null,

        payback_plan: payback.payback_plan ? Helpers.isObjectId(payback.payback_plan) ? payback.payback_plan : {
            ...payback.payback_plan,
            total_amount: centsToDollars(payback.payback_plan.total_amount) || undefined
        } : null
    };
};

/**
 * Format the payback data to apply setters manually (needed when using lean())
 * @param {Object} payback - The payback
 * @returns {Object} - The formatted payback
 */
const formatDataBeforeSave = (payback) => {
    return {
        ...payback,
        payback_amount: dollarsToCents(payback.payback_amount) || undefined,
        funded_amount: dollarsToCents(payback.funded_amount) || undefined,
        fee_amount: dollarsToCents(payback.fee_amount) || undefined
    };
};

/**
 * Get payback by id
 * @param {string} id - The id of the payback
 * @param {array} populate - The populate array
 * @param {string} select - The select string
 * @returns {object} The payback
 */
exports.getPaybackById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'Payback ID');

    const payback = await Payback.findById(id)
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(payback, `Payback with id of ${id}`);

    return formatDataBeforeReturn(payback);
};

/**
 * Create a new payback
 * @param {object} data - The payback data
 * @param {array} populate - The populate array
 * @param {string} select - The select string
 * @returns {object} The payback
 */
exports.createPayback = async (data, populate = [], select = '', importing = false) => {
    const payback = await Payback.create(formatDataBeforeSave(data));
    Validators.checkResourceCreated(payback, 'payback');

    if (data.status === PAYBACK_STATUS.SUCCEED) {
        // Use the original data object which contains all necessary fields (funder, merchant, etc.)
        // and format it to convert cents to dollars before passing to generate functions
        const formattedData = formatDataBeforeReturn({
            ...data,
            _id: payback._id,
            created_date: payback.created_date,
            updated_date: payback.updated_date
        });
        await generateTransaction(formattedData);
        await generatePayouts(formattedData, importing);
    }
    
    // Create a new payback log
    await PaybackLogService.createPaybackLog({
        payback: payback._id,
        user: payback.created_by_user,
        event_type: ACTIONS.CREATE,
        event_date: new Date(),
        request: JSON.stringify(data),
        status: payback.status
    });
    
    return this.getPaybackById(payback._id, populate, select);
};

/**
 * get all paybacks
 * @param {object} query - The query object
 * @param {number} page - The page number
 * @param {number} limit - The limit number
 * @param {object} sort - The sort object
 * @param {array} populate - The populate array
 * @param {string} select - The select string
 * @returns {object} The paybacks
 */
exports.getPaybacks = async (query, sort = { created_date: -1 }, page = 1, limit = 10, populate = [], select = '') => {
    const skip = (page - 1) * limit;

    const [paybacks, count] = await Promise.all([
        Payback.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        Payback.countDocuments(query)
    ]);
    return {
        docs: paybacks.map(formatDataBeforeReturn),
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * get a list of paybacks without pagination
 * @param {object} query - The query object
 * @param {object} sort - The sort object
 * @param {array} populate - The populate array
 * @param {string} select - The select string
 * @returns {object} The paybacks
 */
exports.getPaybackList = async (query, sort = { created_date: -1 }, populate = [], select = '') => {
    const paybacks = await Payback.find(query)
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();

    return paybacks.map(formatDataBeforeReturn);
};

/**
 * Update a payback
 * @param {string} id - The id of the payback
 * @param {object} data - The update data
 * @param {array} populate - The populate array
 * @param {string} select - The select string
 * @returns {object} The payback
 */
exports.updatePayback = async (id, data, populate = [], select = '', importing = false) => {
    Validators.checkValidateObjectId(id, 'Payback ID');

    const payback = await this.getPaybackById(id);

    const updatedPayback = await Payback.findByIdAndUpdate(id, formatDataBeforeSave(data), { new: true, runValidators: true });

    // If the payback is successful, generate payouts
    if (importing || (updatedPayback.status === PAYBACK_STATUS.SUCCEED && payback.status !== PAYBACK_STATUS.SUCCEED && payback.payout_count === 0)) {
        // Use the original payback data which contains all necessary fields (funder, merchant, etc.)
        // and format it to convert cents to dollars before passing to generate functions
        const formattedPaybackData = formatDataBeforeReturn({
            ...payback,
            status: updatedPayback.status,
            updated_date: updatedPayback.updated_date
        });
        await generateTransaction(formattedPaybackData);
        await generatePayouts(formattedPaybackData, importing);
    }

    // Create a new payback log
    await PaybackLogService.createPaybackLog({
        payback: updatedPayback._id,
        user: data.updated_by_user,
        event_type: ACTIONS.UPDATE,
        event_date: new Date(),
        request: JSON.stringify(data),
        status: updatedPayback.status
    });

    return await this.getPaybackById(updatedPayback._id, populate, select);
};

/**
 * Generate payouts for a payback
 * @param {string} id - The id of the payback
 * @returns {object} The payouts
 */
exports.generatePayouts = async (id) => {
    Validators.checkValidateObjectId(id, 'Payback ID');

    const payback = await this.getPaybackById(id);

    Validators.checkResourceNotFound(payback, `Payback with id of ${id}`);

    if(payback.status !== PAYBACK_STATUS.SUCCEED) {
        throw new ErrorResponse('Payback is not successful', 400);
    }

    return await generatePayouts(payback);
};

/**
 * Generate payouts for a payback
 * @param {string} id - The id of the payback
 * @returns {object} The payouts
 */
async function generatePayouts(payback, importing = false) {
    console.log(`Generate payouts for payback: ${payback._id}`);
    try {
        if(payback.status !== PAYBACK_STATUS.SUCCEED) {
            throw new ErrorResponse('Payback status is not succeed, cannot generate payouts', 400);
        }

        // Check if existing payouts for this payback
        const existingPayouts = await PayoutService.getPayoutList({
            payback: payback._id
        });
        if (existingPayouts.length > 0) {
            console.log(`Payouts already exist for payback: ${payback._id}`);
            return existingPayouts;
        }

        const syndications = await SyndicationService.getSyndicationList({
            funding: Helpers.extractIdString(payback.funding),
            status: importing ? { $in: [SYNDICATION_STATUS.ACTIVE, SYNDICATION_STATUS.CLOSED] } : SYNDICATION_STATUS.ACTIVE
        }, {}, [], '', true);

        console.log(`Find Syndications for generating payouts: ${syndications.length}`);

        const payouts = await Promise.all(syndications.map(async (syndication) => {
            const payoutData = {
                payback: payback._id,
                syndication: syndication._id,
                funding: Helpers.extractIdString(payback.funding),
                funder: Helpers.extractIdString(syndication.funder),
                lender: Helpers.extractIdString(syndication.lender),
                syndicator: Helpers.extractIdString(syndication.syndicator),
                // Remove incorrect centsToDollars conversion - data is already in dollars
                payout_amount: payback.funded_amount * syndication.participate_percent,
                fee_amount: syndication.recurring_fee_amount / syndication.payback_amount * payback.funded_amount * syndication.participate_percent,
                credit_amount: syndication.recurring_credit_amount / syndication.payback_amount * payback.funded_amount * syndication.participate_percent,
                created_date: payback.responsed_date || payback.processed_date || Date.now(),
                pending: true
            };

            if (syndication.recurring_fee_amount > 0) {
                console.log(`Create payout for syndication: ${syndication._id} with fee amount: ${syndication.recurring_fee_amount}`);
                console.log(`Payout fee amount: ${payoutData.fee_amount}`);
            }
            const payout = await PayoutService.createPayout(payoutData);
            return payout;
        }));

        return payouts;
    } catch (error) {
        console.error('Error generating payouts:', error);
        return [];
    }
}

/**
 * Generate a transaction for a payback
 * @param {object} payback - The payback
 * @returns {string} The transaction id
 */
async function generateTransaction(payback) {
    try {
        // Create transaction if it doesn't exist
        if (payback.transaction)  return payback.transaction;

        // Use dynamic imports to avoid circular dependency
        const TransactionService = require('../services/transactionService');
        
        const transaction = await TransactionService.createTransaction({
            funder: Helpers.extractIdString(payback.funder),
            sender: Helpers.extractIdString(payback.merchant),
            receiver: Helpers.extractIdString(payback.funder),
            sender_type: TRANSACTION_SENDER_TYPES.MERCHANT,
            receiver_type: TRANSACTION_RECEIVER_TYPES.FUNDER,
            sender_account: payback.merchant_account,
            receiver_account: payback.funder_account,
            // Remove incorrect centsToDollars conversion - data is already in dollars
            amount: payback.payback_amount,
            transaction_date: payback.processed_date || Date.now(),
            funding: Helpers.extractIdString(payback.funding),
            type: TRANSACTION_TYPES.PAYBACK,
            source: payback._id,
            reconciled: payback.reconciled
        });

        // Update the payback with the transaction reference
        await Payback.findByIdAndUpdate(payback._id, { transaction: transaction._id });
        
        return transaction._id;
    } catch (error) {
        console.error('Error generating transaction:', error);
        return null;
    }
}