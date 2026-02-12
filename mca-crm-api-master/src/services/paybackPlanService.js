const PaybackPlan = require('../models/PaybackPlan');
const FundingService = require('./fundingService');
const MerchantAccountService = require('./merchantAccountService');
const FunderAccountService = require('./funderAccountService');
const PaybackService = require('./paybackService');

const Validators = require('../utils/validators');
const { PAYBACK_PLAN_STATUS, PAYBACK_STATUS, PAYBACK_DISTRIBUTION_PRIORITY } = require('../utils/constants');
const { centsToDollars, dollarsToCents } = require('../utils/helpers');
const Helpers = require('../utils/helpers');

/**
 * Format the payback plan data to apply setters manually (needed when using lean())
 * @param {Object} paybackPlan - The payback plan
 * @returns {Object} - The formatted payback plan
 */
const formatDataBeforeReturn = (paybackPlan) => {
    return {
        ...paybackPlan,
        total_amount: centsToDollars(paybackPlan.total_amount) || 0,

        funding: paybackPlan.funding ? Helpers.isObjectId(paybackPlan.funding) ? paybackPlan.funding : {
            ...paybackPlan.funding,
            funded_amount: centsToDollars(paybackPlan.funding.funded_amount) || undefined,
            payback_amount: centsToDollars(paybackPlan.funding.payback_amount) || undefined,
            commission_amount: centsToDollars(paybackPlan.funding.commission_amount) || undefined
        } : null,

        // Convert payback_list amounts from cents to dollars
        payback_list: paybackPlan.payback_list ? paybackPlan.payback_list.map(item => ({
            ...item,
            amount: centsToDollars(item.amount) || 0,
            paid_amount: item.paid_amount !== undefined ? centsToDollars(item.paid_amount) : undefined
        })) : undefined,

        submitted_amount: centsToDollars(paybackPlan.submitted_amount) || 0,
        processing_amount: centsToDollars(paybackPlan.processing_amount) || 0,
        failed_amount: centsToDollars(paybackPlan.failed_amount) || 0,
        succeed_amount: centsToDollars(paybackPlan.succeed_amount) || 0,
        bounced_amount: centsToDollars(paybackPlan.bounced_amount) || 0,
        disputed_amount: centsToDollars(paybackPlan.disputed_amount) || 0,
        paid_amount: centsToDollars(paybackPlan.paid_amount) || 0,
        pending_amount: centsToDollars(paybackPlan.pending_amount) || 0,
        remaining_balance: centsToDollars(paybackPlan.remaining_balance) || 0,
        next_payback_amount: centsToDollars(paybackPlan.next_payback_amount) || 0
    };
};

/**
 * Format the payback plan data to apply setters manually (needed when using lean())
 * @param {Object} paybackPlan - The payback plan
 * @returns {Object} - The formatted payback plan
 */
const formatDataBeforeSave = (paybackPlan) => {
    return {
        ...paybackPlan,
        total_amount: dollarsToCents(paybackPlan.total_amount) || undefined,
        
        // Convert payback_list amounts from dollars to cents
        payback_list: paybackPlan.payback_list ? paybackPlan.payback_list.map(item => ({
            ...item,
            amount: dollarsToCents(item.amount) || 0
        })) : undefined
    };
};

/**
 * Create a new payback plan
 * @param {Object} data - The data of the payback plan
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 * @param {boolean} calculate - The calculate boolean
 */
exports.createPaybackPlan = async (data, populate = [], select = '', calculate = false) => {
    if (!data.payday_list || data.payday_list.length === 0) {
        throw new Error('Payday list is required');
    }

    // Sort the payday_list with ascending order
    data.payday_list.sort((a, b) => a - b);

    const paybackPlan = await PaybackPlan.create(formatDataBeforeSave(data));

    Validators.checkResourceCreated(paybackPlan, 'payback plan');
    
    
    return await this.getPaybackPlanById(paybackPlan._id, populate, select, calculate);
};

/**
 * Get payback plan by ID
 * @param {string} id - The ID of the payback plan
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 * @param {boolean} calculate - The calculate boolean
 */
exports.getPaybackPlanById = async (id, populate = [], select = '', calculate = false) => {
    Validators.checkValidateObjectId(id, 'payback plan ID');

    const paybackPlan = await PaybackPlan.findById(id, null, { calculate })
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(paybackPlan, 'payback plan');

    return formatDataBeforeReturn(paybackPlan);
};

/**
 * Get all payback plans
 * @param {Object} query - The query object
 * @param {Object} sort - The sort object
 * @param {number} page - The page number
 * @param {number} limit - The limit number
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 */
exports.getPaybackPlans = async (query, sort = { start_date: -1 }, page = 1, limit = 10, populate = [], select = '', calculate = false) => {
    const skip = (page - 1) * limit;

    const [paybackPlans, count] = await Promise.all([
        PaybackPlan.find(query, null, { calculate })
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        PaybackPlan.countDocuments(query)
    ]);

    return {
        docs: paybackPlans.map(formatDataBeforeReturn),
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of payback plans without pagination
 * @param {Object} query - The query object
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 * @param {boolean} calculate - The calculate boolean
 */
exports.getPaybackPlanList = async (query, sort = { start_date: -1 }, populate = [], select = '', calculate = false) => {
    const paybackPlans = await PaybackPlan.find(query, null, { calculate })
        .select(select)
        .sort(sort)
        .populate(populate)
        .lean();

    return paybackPlans.map(formatDataBeforeReturn);
};

/**
 * Update a payback plan
 * @param {string} id - The ID of the payback plan
 * @param {Object} data - The update data
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 * @param {boolean} calculate - The calculate boolean
 */
exports.updatePaybackPlan = async (id, data, populate = [], select = '', calculate = false) => {
    Validators.checkValidateObjectId(id, 'payback plan ID');

    if (data.payday_list) {
        data.payday_list.sort((a, b) => a - b);
    }

    // If the status is changed to paused or stopped, we need to set the next payback date to null
    if (data.status === PAYBACK_PLAN_STATUS.PAUSED || data.status === PAYBACK_PLAN_STATUS.STOPPED) {
        data.next_payback_date = null;
    }

    const updatedPaybackPlan = await PaybackPlan.findByIdAndUpdate(id, formatDataBeforeSave(data), { new: true, runValidators: true });

    Validators.checkResourceNotFound(updatedPaybackPlan, 'payback plan');

    return await this.getPaybackPlanById(updatedPaybackPlan._id, populate, select, calculate);
};

/**
 * Generate next one or more paybacks according to the plan
 * @param {string} id - The ID of the payback plan
 * @returns {Array} - The generated paybacks
 */
exports.generateNextPaybacks = async (id) => {
    Validators.checkValidateObjectId(id, 'payback plan ID');

    let paybackPlan = await this.getPaybackPlanById(id, [], '', true);

    Validators.checkResourceNotFound(paybackPlan, 'payback plan');

    if (!paybackPlan.next_payback_date || paybackPlan.status !== PAYBACK_PLAN_STATUS.ACTIVE) {
        throw new Error('Payback plan is not active or next payback date is not set');
    }

    const merchant_account = await MerchantAccountService.getMerchantAccountById(paybackPlan.merchant_account);
    const funder_account = await FunderAccountService.getFunderAccountById(paybackPlan.funder_account, [], '-available_balance');

    const paybacks = [];

    while (paybackPlan.next_payback_date && paybackPlan.next_payback_date <= new Date()) {
        const payback_amount = paybackPlan.next_payback_amount;
        
        // Note: funded_amount and fee_amount are calculated as virtual fields
        // when querying PaybackPlan data, so no need to calculate them here

        // Create the payback - only use fields that exist in Payback schema
        const payback = {
            funding: paybackPlan.funding,
            payback_plan: paybackPlan._id,
            funder: paybackPlan.funder,
            lender: paybackPlan.lender,
            merchant: paybackPlan.merchant,
            due_date: paybackPlan.next_payback_date,
            payback_amount: payback_amount,
            status: PAYBACK_STATUS.SUBMITTED
        };

        const createdPayback = await PaybackService.createPayback(payback);

        paybacks.push(createdPayback);

        // Update the payback plan
        // If the remaining payback count is 1, then this is the last payback
        if (paybackPlan.remaining_count <= 1) {
            paybackPlan = await this.updatePaybackPlan(paybackPlan._id, {
                status: PAYBACK_PLAN_STATUS.STOPPED,
                end_date: new Date(),
                next_payback_date: null
            }, [], '', true);
        } else {
            // Calculate the next payback date from the current payback date
            const nextPaybackDate = PaybackPlan.calculateScheduledPaybackDate(paybackPlan, paybackPlan.next_payback_date, 2);

            paybackPlan = await this.updatePaybackPlan(paybackPlan._id, {
                next_payback_date: nextPaybackDate
            }, [], '', true);
        }
    }

    return paybacks;
};