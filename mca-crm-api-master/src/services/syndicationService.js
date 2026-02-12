const Syndication = require('../models/Syndication');
const Syndicator = require('../models/Syndicator');
const SyndicatorFunder = require('../models/SyndicatorFunder');

const Helpers = require('../utils/helpers');
const FundingService = require('./fundingService');
const SyndicatorFunderService = require('./syndicatorFunderService');
const SyndicationOfferService = require('./syndicationOfferService');
const Validators = require('../utils/validators');
const { SYNDICATION_STATUS } = require('../utils/constants');

/**
 * Format the syndication data to apply getters manually (needed when using lean())
 * @param {Object} syndication - The syndication
 * @returns {Object} - The formatted syndication
 */
const formatDataBeforeReturn = (syndication) => {
    return {
        ...syndication,

        funding: syndication.funding ? Helpers.isObjectId(syndication.funding) ? syndication.funding : {
            ...syndication.funding,
            funded_amount: Helpers.centsToDollars(syndication.funding.funded_amount) || undefined,
            payback_amount: Helpers.centsToDollars(syndication.funding.payback_amount) || undefined,
            commission_amount: Helpers.centsToDollars(syndication.funding.commission_amount) || undefined
        } : null,
        
        participate_amount: Helpers.centsToDollars(syndication.participate_amount) || 0,
        payback_amount: Helpers.centsToDollars(syndication.payback_amount) || 0,
        total_funded_amount: Helpers.centsToDollars(syndication.total_funded_amount) || 0,
        total_payback_amount: Helpers.centsToDollars(syndication.total_payback_amount) || 0,
        total_fee_amount: Helpers.centsToDollars(syndication.total_fee_amount) || 0,
        total_credit_amount: Helpers.centsToDollars(syndication.total_credit_amount) || 0,
        upfront_fee_amount: Helpers.centsToDollars(syndication.upfront_fee_amount) || 0,
        upfront_credit_amount: Helpers.centsToDollars(syndication.upfront_credit_amount) || 0,
        syndicated_fee_amount: Helpers.centsToDollars(syndication.syndicated_fee_amount) || 0,
        syndicated_credit_amount: Helpers.centsToDollars(syndication.syndicated_credit_amount) || 0,
        recurring_fee_amount: Helpers.centsToDollars(syndication.recurring_fee_amount) || 0,
        recurring_credit_amount: Helpers.centsToDollars(syndication.recurring_credit_amount) || 0,
        syndicated_amount: Helpers.centsToDollars(syndication.syndicated_amount) || 0,

        payout_amount: Helpers.centsToDollars(syndication.payout_amount) || 0,
        payout_fee_amount: Helpers.centsToDollars(syndication.payout_fee_amount) || 0,
        payout_credit_amount: Helpers.centsToDollars(syndication.payout_credit_amount) || 0,
        pending_amount: Helpers.centsToDollars(syndication.pending_amount) || 0,
        redeemed_amount: Helpers.centsToDollars(syndication.redeemed_amount) || 0,

        remaining_fee_amount: Helpers.centsToDollars(syndication.remaining_fee_amount) || 0,
        remaining_credit_amount: Helpers.centsToDollars(syndication.remaining_credit_amount) || 0,
        remaining_payback_amount: Helpers.centsToDollars(syndication.remaining_payback_amount) || 0,
        remaining_balance: Helpers.centsToDollars(syndication.remaining_balance) || 0,

        fee_list: syndication.fee_list ? syndication.fee_list.map(fee => ({
            ...fee,
            amount: Helpers.centsToDollars(fee.amount) || 0
        })) : [],
        credit_list: syndication.credit_list ? syndication.credit_list.map(credit => ({
            ...credit,
            amount: Helpers.centsToDollars(credit.amount) || 0
        })) : []
    };
};

/**
 * Format the syndication data to apply setters manually (needed when using lean())
 * @param {Object} syndication - The syndication
 * @returns {Object} - The formatted syndication
 */
const formatDataBeforeSave = async (data) => {
    // Convert dollars to cents
    data.participate_amount = Helpers.dollarsToCents(data.participate_amount) || undefined;
    data.payback_amount = Helpers.dollarsToCents(data.payback_amount) || undefined;

    // Convert id to object
    if (data.fee_list) data.fee_list = await Promise.all(data.fee_list.map(async (fee) => ({
        ...fee,
        amount: Helpers.dollarsToCents(fee.amount) || 0
    })));

    if (data.credit_list) data.credit_list = await Promise.all(data.credit_list.map(async (credit) => ({
        ...credit,
        amount: Helpers.dollarsToCents(credit.amount) || 0
    })));

    return data;
};

/**
 * Check if the syndicator has enough balance to participate in the syndication
 * @param {String} syndicatorId - The ID of the syndicator
 * @param {String} funderId - The ID of the funder
 * @param {Number} participateAmount - The amount of the participate
 * @returns {Boolean} - True if the syndicator has enough balance, false otherwise
 */
const checkSyndicatorBalance = async (syndicatorId, funderId, participateAmount) => {
    const syndicatorFunder = await SyndicatorFunderService.getSyndicatorFunderBySyndicatorAndFunder(syndicatorId, funderId, [], '', true);
    Validators.checkResourceNotFound(syndicatorFunder, 'syndicator funder');

    if (syndicatorFunder.available_balance < participateAmount) {
        throw new Error(`Insufficient balance for syndicator ${syndicatorFunder.syndicator}`);
    }

    return true;
};

/**
 * Create a new syndication
 * @param {Object} data - The data to create the syndication
 * @param {Array} populate - The fields to populate
 * @param {String} select - The fields to select
 * @param {Boolean} calculate - Whether to calculate the statistics
 */
exports.createSyndication = async (data, populate = [], select = '', calculate = false, importing = false) => {
    // Make sure there is no syndication with the same funding and syndicator
    const existingSyndication = await Syndication.findOne({ funding: data.funding, syndicator: data.syndicator });
    if (existingSyndication) {
        throw new Error('Syndication already exists');
    }

    // Make sure there is enough funding to cover the syndication
    const funding = await FundingService.getFundingById(data.funding, [], '', true);
    Validators.checkResourceNotFound(funding, 'funding');

    if (!importing) {
        if ((funding.funded_amount - funding.syndication_amount) < data.participate_amount) {
            throw new Error('Insufficient funding');
        }

        // Check if the syndicator has enough balance to participate in the syndication
        await checkSyndicatorBalance(data.syndicator, data.funder, data.participate_amount);

        // First, adjust the syndicator's available balance
        await SyndicatorFunderService.updateSyndicatorFunderAvailableBalance(data.syndicator, data.funder, -data.participate_amount);
    }

    // Format the data before saving
    data = await formatDataBeforeSave(data);

    try {
        // Create the syndication
        const syndication = await Syndication.create(data);

        Validators.checkResourceCreated(syndication, 'syndication');

        try{
            // Add syndicator to the syndicator_list of the funding (if not already in the list)
            const syndicator_list = funding.syndicator_list?.map(syndicator => syndicator.id.toString()) || [];
            if (!syndicator_list.includes(data.syndicator.toString())) {
                const syndicator = await Syndicator.convertToEmbeddedFormat(data.syndicator);
                await FundingService.updateFunding(data.funding, { $push: { syndicator_list: syndicator } });
            }
        } catch (error) {
            console.error(`Failed to add syndicator to the syndicator_list of the funding: ${error.message}`);
        }

        // Return the syndication
        return await this.getSyndicationById(syndication._id, populate, select, calculate);
    } catch (error) {
        // Rollback the available balance
        if (!importing) await SyndicatorFunderService.updateSyndicatorFunderAvailableBalance(data.syndicator, data.funder, data.participate_amount);

        throw new Error(`Failed to create syndication: ${error.message}`);
    }
};


/**
 * Generate a syndication from a syndication offer
 * @param {String} offer - The ID of the syndication offer
 * @param {Array} populate - The fields to populate
 * @param {String} select - The fields to select
 * @param {Boolean} calculate - Whether to calculate the statistics
 */
exports.generateSyndicationFromOffer = async (offer, populate = [], select = '', calculate = false) => {
    Validators.checkValidateObjectId(offer, 'syndication offer ID');

    const syndicationOffer = await SyndicationOfferService.getSyndicationOfferById(offer);

    Validators.checkResourceNotFound(syndicationOffer, 'syndication offer');

    const data = {
        funding: Helpers.extractIdString(syndicationOffer.funding),
        funder: Helpers.extractIdString(syndicationOffer.funder),
        syndicator: Helpers.extractIdString(syndicationOffer.syndicator),
        syndication_offer: syndicationOffer._id,
        participate_percent: syndicationOffer.participate_percent,
        participate_amount: syndicationOffer.participate_amount,
        payback_amount: syndicationOffer.payback_amount,
        fee_list: syndicationOffer.fee_list,
        credit_list: syndicationOffer.credit_list,
        start_date: Date.now(),
        status: SYNDICATION_STATUS.ACTIVE
    };

    return await this.createSyndication(data, populate, select, calculate);
};

/**
 * Get syndication by ID
 * @param {String} id - The ID of the syndication
 * @param {Array} populate - The fields to populate
 * @param {String} select - The fields to select
 * @param {Boolean} calculate - Whether to calculate the statistics
 */
exports.getSyndicationById = async (id, populate = [], select = '', calculate = false) => {
    Validators.checkValidateObjectId(id, 'Syndication ID');

    const syndication = await Syndication.findById(id, null, { calculate })
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(syndication, 'syndication');

    return formatDataBeforeReturn(syndication);
};

/**
 * Get all syndications
 * @param {Object} query - The query to get the syndications
 * @param {Number} page - The page number
 * @param {Number} limit - The number of syndications per page
 * @param {Object} sort - The sort order
 * @param {Array} populate - The fields to populate
 * @param {String} select - The fields to select
 * @param {Boolean} calculate - Whether to calculate the statistics
 */
exports.getSyndications = async (query, sort = { start_date: -1 }, page = 1, limit = 10, populate = [], select = '', calculate = false) => {
    const skip = (page - 1) * limit;

    const [syndications, count] = await Promise.all([
        Syndication.find(query, null, { calculate })
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        Syndication.countDocuments(query)
    ]);

    return {
        docs: syndications.map(formatDataBeforeReturn),
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of syndications without pagination
 * @param {Object} query - The query to get the syndications
 * @param {Object} sort - The sort order
 * @param {Array} populate - The fields to populate
 * @param {String} select - The fields to select
 * @param {Boolean} calculate - Whether to calculate the statistics
 */
exports.getSyndicationList = async (query, sort = { start_date: -1 }, populate = [], select = '', calculate = false) => {
    const syndications = await Syndication.find(query, null, { calculate })
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();

    return syndications.map(formatDataBeforeReturn);
};

/**
 * Update a syndication
 * @param {String} id - The ID of the syndication
 * @param {Object} data - The data to update the syndication
 * @param {Array} populate - The fields to populate
 * @param {String} select - The fields to select
 * @param {Boolean} calculate - Whether to calculate the statistics
 */
exports.updateSyndication = async (id, data, populate = [], select = '', calculate = false) => {
    Validators.checkValidateObjectId(id, 'Syndication ID'); 

    const syndication = await Syndication.findByIdAndUpdate(id, data, { new: true, runValidators: true });

    Validators.checkResourceNotFound(syndication, 'syndication');

    return await this.getSyndicationById(id, populate, select, calculate);
};

/**
 * Get payout schedule with status for a syndication
 * Returns scheduled payouts with actual received amounts
 * @param {String} syndicationId - Syndication ID
 * @returns {Array} Formatted payout schedule (amounts in dollars)
 */
exports.getPayoutScheduleWithStatus = async (syndicationId) => {
    Validators.checkValidateObjectId(syndicationId, 'Syndication ID');
    
    const syndication = await Syndication.findById(syndicationId);
    Validators.checkResourceNotFound(syndication, `Syndication with id ${syndicationId}`);
    
    // Call the instance method to get the schedule
    const schedule = await syndication.getPayoutScheduleWithStatus();
    
    // Convert from cents to dollars for API response
    return schedule.map(item => ({
        payback_plan_id: item.payback_plan_id,
        scheduled_date: item.scheduled_date,
        expected_gross: Helpers.centsToDollars(item.expected_gross),
        expected_fee: Helpers.centsToDollars(item.expected_fee),
        expected_credit: Helpers.centsToDollars(item.expected_credit),
        expected_net: Helpers.centsToDollars(item.expected_net),
        received_gross: Helpers.centsToDollars(item.received_gross),
        received_fee: Helpers.centsToDollars(item.received_fee),
        received_credit: Helpers.centsToDollars(item.received_credit),
        received_net: Helpers.centsToDollars(item.received_net),
        received_date: item.received_date,
        status: item.status,
        pending: item.pending,
        redeemed_date: item.redeemed_date,
        _id: item._id
    }));
};

/**
 * Get payout schedule grouped by payback plan
 * Per Chun's requirement: "if this funding has two payback plans, you will return two lists"
 * @param {String} syndicationId - Syndication ID
 * @returns {Array} Array of {payback_plan_id, payout_schedule} objects
 */
exports.getPayoutScheduleByPaybackPlan = async (syndicationId) => {
    const schedule = await this.getPayoutScheduleWithStatus(syndicationId);
    
    // Group by payback_plan_id
    const grouped = {};
    for (const item of schedule) {
        const planId = item.payback_plan_id.toString();
        if (!grouped[planId]) {
            grouped[planId] = {
                payback_plan_id: item.payback_plan_id,
                payout_schedule: []
            };
        }
        grouped[planId].payout_schedule.push(item);
    }
    
    return Object.values(grouped);
};