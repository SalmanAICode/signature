const Funding = require('../models/Funding');
const Funder = require('../models/Funder');
const Lender = require('../models/Lender');
const Merchant = require('../models/Merchant');
const ISO = require('../models/ISO');
const User = require('../models/User');
const FundingStatus = require('../models/FundingStatus');

const Validators = require('../utils/validators');
const Helpers = require('../utils/helpers');
const { centsToDollars, dollarsToCents } = require('../utils/helpers');

/**
 * Format the funding data to apply setters manually (needed when using lean())
 * @param {Object} funding - The funding
 * @returns {Object} - The formatted funding
 */
const formatDataBeforeReturn = (funding) => {

    return {
        ...funding,
        funded_amount: centsToDollars(funding.funded_amount) || 0,
        payback_amount: centsToDollars(funding.payback_amount) || 0,

        application_offer: funding.application_offer ? Helpers.isObjectId(funding.application_offer) ? funding.application_offer : {
            ...funding.application_offer,
            offered_amount: centsToDollars(funding.application_offer.offered_amount) || 0,
            payback_amount: centsToDollars(funding.application_offer.payback_amount) || 0,
            commission_amount: centsToDollars(funding.application_offer.commission_amount) || 0,
            disbursement_amount: centsToDollars(funding.application_offer.disbursement_amount) || 0,
            payment_amount: centsToDollars(funding.application_offer.payment_amount) || 0
        } : null,

        net_amount: centsToDollars(funding.net_amount) || 0,
        upfront_fee_amount: centsToDollars(funding.upfront_fee_amount) || 0,
        residual_fee_amount: centsToDollars(funding.residual_fee_amount) || 0,
        total_fee_amount: centsToDollars(funding.total_fee_amount) || 0,

        commission_amount: centsToDollars(funding.commission_amount) || 0,
        total_expense_amount: centsToDollars(funding.total_expense_amount) || 0,

        credit_amount: centsToDollars(funding.credit_amount) || 0,
        disbursement_scheduled_amount: centsToDollars(funding.disbursement_scheduled_amount) || 0,
        disbursement_paid_amount: centsToDollars(funding.disbursement_paid_amount) || 0,
        disbursement_unscheduled_amount: centsToDollars(funding.disbursement_unscheduled_amount) || 0,
        disbursement_remaining_amount: centsToDollars(funding.disbursement_remaining_amount) || 0,
        commission_scheduled_amount: centsToDollars(funding.commission_scheduled_amount) || 0,
        commission_paid_amount: centsToDollars(funding.commission_paid_amount) || 0,
        commission_unscheduled_amount: centsToDollars(funding.commission_unscheduled_amount) || 0,
        commission_remaining_amount: centsToDollars(funding.commission_remaining_amount) || 0,
        payback_plan_amount: centsToDollars(funding.payback_plan_amount) || 0,
        payback_submitted_amount: centsToDollars(funding.payback_submitted_amount) || 0,
        payback_processing_amount: centsToDollars(funding.payback_processing_amount) || 0,
        payback_failed_amount: centsToDollars(funding.payback_failed_amount) || 0,
        payback_succeed_amount: centsToDollars(funding.payback_succeed_amount) || 0,
        payback_bounced_amount: centsToDollars(funding.payback_bounced_amount) || 0,
        payback_disputed_amount: centsToDollars(funding.payback_disputed_amount) || 0,
        syndication_offer_amount: centsToDollars(funding.syndication_offer_amount) || 0,
        pending_syndication_offer_amount: centsToDollars(funding.pending_syndication_offer_amount) || 0,
        accepted_syndication_offer_amount: centsToDollars(funding.accepted_syndication_offer_amount) || 0,
        declined_syndication_offer_amount: centsToDollars(funding.declined_syndication_offer_amount) || 0,
        cancelled_syndication_offer_amount: centsToDollars(funding.cancelled_syndication_offer_amount) || 0,
        expired_syndication_offer_amount: centsToDollars(funding.expired_syndication_offer_amount) || 0,
        syndication_amount: centsToDollars(funding.syndication_amount) || 0,
        payout_amount: centsToDollars(funding.payout_amount) || 0,
        management_amount: centsToDollars(funding.management_amount) || 0,
        paid_amount: centsToDollars(funding.paid_amount) || 0,
        pending_amount: centsToDollars(funding.pending_amount) || 0,
        unschduled_amount: centsToDollars(funding.unschduled_amount) || 0,
        remaining_balance: centsToDollars(funding.remaining_balance) || 0,
        paid_payback_funded_amount: centsToDollars(funding.paid_payback_funded_amount) || 0,
        pending_payback_funded_amount: centsToDollars(funding.pending_payback_funded_amount) || 0,
        remaining_payback_amount: centsToDollars(funding.remaining_payback_amount) || 0,
        paid_payback_fee_amount: centsToDollars(funding.paid_payback_fee_amount) || 0,
        pending_payback_fee_amount: centsToDollars(funding.pending_payback_fee_amount) || 0,
        remaining_fee_amount: centsToDollars(funding.remaining_fee_amount) || 0
    };
};

/**
 * Format the funding data to apply setters manually (needed when using lean())
 * @param {Object} funding - The funding
 * @returns {Object} - The formatted funding
 */
const formatDataBeforeSave = async (funding) => {
    if (funding.follower_list) {
        if (funding.assigned_manager && !funding.follower_list.includes(funding.assigned_manager)) {
            funding.follower_list.push(funding.assigned_manager);
        }
        if (funding.assigned_user && !funding.follower_list.includes(funding.assigned_user)) {
            funding.follower_list.push(funding.assigned_user);
        }
    }

    const conversions = await Promise.all([
        funding.funder ? Funder.convertToEmbeddedFormat(funding.funder) : Promise.resolve(null),
        funding.lender ? Lender.convertToEmbeddedFormat(funding.lender) : Promise.resolve(null),
        funding.merchant ? Merchant.convertToEmbeddedFormat(funding.merchant) : Promise.resolve(null),
        funding.iso_list ? Promise.all(funding.iso_list.map(iso => {
            // If iso is already an object with id, name, email, phone, return it directly
            if (iso && typeof iso === 'object' && iso.id && iso.name) {
                return Promise.resolve(iso);
            }
            // Otherwise convert it using ISO.convertToEmbeddedFormat
            return ISO.convertToEmbeddedFormat(iso);
        })) : Promise.resolve([]),
        funding.assigned_manager ? User.convertToEmbeddedFormat(funding.assigned_manager) : Promise.resolve(null),
        funding.assigned_user ? User.convertToEmbeddedFormat(funding.assigned_user) : Promise.resolve(null),
        funding.status ? FundingStatus.convertToEmbeddedFormat(funding.status) : Promise.resolve(null)
    ]);

    // Assign converted values back to fundingData
    if (funding.funder) funding.funder = conversions[0];
    if (funding.lender) funding.lender = conversions[1];
    if (funding.merchant) funding.merchant = conversions[2];
    if (funding.iso_list) funding.iso_list = conversions[3];
    if (funding.assigned_manager) funding.assigned_manager = conversions[4];
    if (funding.assigned_user) funding.assigned_user = conversions[5];
    if (funding.status) funding.status = conversions[6];

    return {
        ...funding,
        funded_amount: dollarsToCents(funding.funded_amount) || undefined,
        payback_amount: dollarsToCents(funding.payback_amount) || undefined
    };
};

/**
 * Get all fundings with filtering and pagination
 * @param {Object} query - The query object
 * @param {Number} page - The page number
 * @param {Number} limit - The limit number
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @param {Boolean} calculate - The calculate stats boolean
 */
exports.getFundings = async (query, page = 1, limit = 10, sort = { created_date: -1 }, populate = [], select = '', calculate = false) => {
    const skip = (page - 1) * limit;

    const [fundings, count] = await Promise.all([
        Funding
            .find(query, null, { calculate })
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        Funding.countDocuments(query)
    ]);

    return {
        docs: fundings.map(formatDataBeforeReturn),
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get funding list (no pagination)
 * @param {Object} query - The query object
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @param {Boolean} calculate - The calculate stats boolean
 */
exports.getFundingList = async (query, sort = { created_date: -1 }, populate = [], select = '', calculate = false) => {
    const fundings = await Funding
        .find(query, null, { calculate })
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();

    return fundings.map(formatDataBeforeReturn);
};

/**
 * Get a single funding by ID
 * @param {String} id - The funding ID
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @param {Boolean} calculate - The calculate stats boolean
 */
exports.getFundingById = async (id, populate = [], select = '', calculate = false) => {
    Validators.checkValidateObjectId(id, 'funding ID');

    const funding = await Funding.findById(id, null, { calculate })
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(funding, 'Funding');

    return formatDataBeforeReturn(funding);
};

/**
 * Create a new funding
 * @param {Object} data - The data object
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @param {Boolean} calculate - The calculate stats boolean
 */
exports.createFunding = async (data, populate = [], select = '', calculate = false) => {
    // Make sure follower_list is an array, and assigned_manager and assigned_user are added to it
    if (data.follower_list === undefined || data.follower_list === null) {
        data.follower_list = []; 
    }

    const funding = await Funding.create(await formatDataBeforeSave(data));
    
    Validators.checkResourceCreated(funding, 'Funding');
    
    return await this.getFundingById(funding._id, populate, select, calculate);
};

/**
 * Update a funding
 * @param {String} id - The funding ID
 * @param {Object} data - The data object
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @param {Boolean} calculate - The calculate stats boolean
 */
exports.updateFunding = async (id, data, populate = [], select = '', calculate = false) => {
    Validators.checkValidateObjectId(id, 'Funding ID');

    const funding = await Funding.findById(id);

    Validators.checkResourceNotFound(funding, 'Funding');

    
    // Check if assignee changed
    const assigneeChanged = (data.assigned_user && data.assigned_user !== funding.assigned_user?.id?.toString()) || 
        (data.assigned_manager && data.assigned_manager !== funding.assigned_manager?.id?.toString());

    // If assignee changed, make sure follower_list is in the updated data
    if ( assigneeChanged ) {
        if (data.follower_list === undefined || data.follower_list === null) {
            data.follower_list = funding.follower_list;
        }
    }

    const updatedFunding = await Funding.findByIdAndUpdate(id, await formatDataBeforeSave(data), {
        new: true,
        runValidators: true
    });

    return await this.getFundingById(updatedFunding._id, populate, select, calculate);
};

/**
 * delete funding status by ID
 * @param {String} id - The funding ID
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @param {Boolean} calculateStats - The calculate stats boolean
 */
exports.deleteFunding = async (id, populate = [], select = '', calculate = false) => {
    Validators.checkValidateObjectId(id, 'Funding ID');

    const funding = await Funding.findByIdAndUpdate(id, { inactive: true }, { new: true });

    Validators.checkResourceNotFound(funding, 'Funding');

    return await this.getFundingById(funding._id, populate, select, calculate);
};


