const Participation = require('../models/Participation');

const Helpers = require('../utils/helpers');
const FundingService = require('./fundingService');
const Validators = require('../utils/validators');

// Import models for convertToEmbeddedFormat
const Funding = require('../models/Funding');
const Funder = require('../models/Funder');
const Lender = require('../models/Lender');

/**
 * Format the participation data to apply getters manually (needed when using lean())
 * @param {Object} participation - The participation
 * @returns {Object} - The formatted participation
 */
const formatDataBeforeReturn = (participation) => {
    return {
        ...participation,

        funding: participation.funding ? Helpers.isObjectId(participation.funding) ? participation.funding : {
            ...participation.funding,
            funded_amount: Helpers.centsToDollars(participation.funding.funded_amount) || undefined,
            payback_amount: Helpers.centsToDollars(participation.funding.payback_amount) || undefined
        } : null,
        
        participate_amount: Helpers.centsToDollars(participation.participate_amount) || 0,
        participate_percent: participation.participate_percent || 0,
        profit_percent: participation.profit_percent || 0,
        profit_amount: Helpers.centsToDollars(participation.profit_amount) || null,

        // Calculated fields from funding totals
        total_funded_amount: Helpers.centsToDollars(participation.total_funded_amount) || 0,
        total_payback_amount: Helpers.centsToDollars(participation.total_payback_amount) || 0,
        total_expected_profit_amount: Helpers.centsToDollars(participation.total_expected_profit_amount) || 0,
        total_current_profit_amount: Helpers.centsToDollars(participation.total_current_profit_amount) || 0,

        // Calculated amounts
        fee_amount: Helpers.centsToDollars(participation.fee_amount) || 0,
        expense_amount: Helpers.centsToDollars(participation.expense_amount) || 0,
        purchase_amount: Helpers.centsToDollars(participation.purchase_amount) || 0,
        expect_profit_amount: Helpers.centsToDollars(participation.expect_profit_amount) || 0,
        expect_return_amount: Helpers.centsToDollars(participation.expect_return_amount) || 0,

        fee_list: participation.fee_list ? participation.fee_list.map(fee => ({
            ...fee,
            amount: Helpers.centsToDollars(fee.amount) || 0
        })) : [],
        expense_list: participation.expense_list ? participation.expense_list.map(expense => ({
            ...expense,
            amount: Helpers.centsToDollars(expense.amount) || 0
        })) : []
    };
};

/**
 * Format the participation data to apply setters manually (needed when using lean())
 * @param {Object} participation - The participation
 * @returns {Object} - The formatted participation
 */
const formatDataBeforeSave = async (data) => {
    // Convert dollars to cents
    data.participate_amount = Helpers.dollarsToCents(data.participate_amount) || undefined;
    data.profit_amount = Helpers.dollarsToCents(data.profit_amount) || undefined;

    // Convert simple IDs to embedded format using model methods
    const conversions = await Promise.all([
        data.funding ? Funding.convertToEmbeddedFormat(data.funding) : Promise.resolve(null),
        data.funder ? Funder.convertToEmbeddedFormat(data.funder) : Promise.resolve(null),
        data.lender ? Lender.convertToEmbeddedFormat(data.lender) : Promise.resolve(null)
    ]);

    // Assign converted values back to data
    if (data.funding) data.funding = conversions[0];
    if (data.funder) data.funder = conversions[1];
    if (data.lender) data.lender = conversions[2];

    // Process fee_list with convertToEmbeddedFormat for fee_type
    if (data.fee_list) {
        data.fee_list = await Promise.all(data.fee_list.map(async (fee) => ({
            ...fee,
            amount: Helpers.dollarsToCents(fee.amount) || 0
            // fee_type remains as ObjectId - no conversion needed
        })));
    }

    // Process expense_list with convertToEmbeddedFormat for expense_type
    if (data.expense_list) {
        data.expense_list = await Promise.all(data.expense_list.map(async (expense) => ({
            ...expense,
            amount: Helpers.dollarsToCents(expense.amount) || 0
            // expense_type remains as ObjectId - no conversion needed
        })));
    }

    return data;
};

/**
 * Check if the funding has enough available amount for participation
 * @param {String} fundingId - The ID of the funding
 * @param {Number} participateAmount - The amount of the participate
 * @returns {Boolean} - True if the funding has enough available amount, false otherwise
 */
const checkFundingAvailability = async (fundingId, participateAmount) => {
    const funding = await FundingService.getFundingById(fundingId, [], '', true);
    Validators.checkResourceNotFound(funding, 'funding');

    // Check if there's enough funding available
    const existingParticipations = await Participation.find({ 
        'funding.id': fundingId
    });
    
    const totalParticipated = existingParticipations.reduce((sum, participation) => 
        sum + (participation.participate_amount || 0), 0);

    if ((funding.funded_amount - Helpers.centsToDollars(totalParticipated)) < participateAmount) {
        throw new Error('Insufficient funding available for participation');
    }

    return true;
};

/**
 * Create a new participation
 * @param {Object} data - The data to create the participation
 * @param {Array} populate - The fields to populate
 * @param {String} select - The fields to select
 */
exports.createParticipation = async (data, populate = [], select = '') => {
    // Make sure there is no participation with the same funding, funder, and lender
    const existingParticipation = await Participation.findOne({ 
        'funding.id': data.funding, 
        'funder.id': data.funder, 
        'lender.id': data.lender
    });
    if (existingParticipation) {
        throw new Error('Participation already exists for this funding, funder, and lender combination');
    }

    // Check if the funding has enough available amount for participation
    await checkFundingAvailability(data.funding, data.participate_amount);

    // Format the data before saving
    data = await formatDataBeforeSave(data);

    try {
        // Create the participation
        const participation = await Participation.create(data);

        Validators.checkResourceCreated(participation, 'participation');

        // Return the participation
        return await this.getParticipationById(participation._id, populate, select);
    } catch (error) {
        throw new Error(`Failed to create participation: ${error.message}`);
    }
};

/**
 * Get participation by ID
 * @param {String} id - The ID of the participation
 * @param {Array} populate - The fields to populate
 * @param {String} select - The fields to select
 */
exports.getParticipationById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'Participation ID');

    const participation = await Participation.findById(id)
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(participation, 'participation');

    return formatDataBeforeReturn(participation);
};

/**
 * Get all participations
 * @param {Object} query - The query to get the participations
 * @param {Object} sort - The sort order
 * @param {Number} page - The page number
 * @param {Number} limit - The number of participations per page
 * @param {Array} populate - The fields to populate
 * @param {String} select - The fields to select
 */
exports.getParticipations = async (query, sort = { createdAt: -1 }, page = 1, limit = 10, populate = [], select = '') => {
    const skip = (page - 1) * limit;

    const [participations, count] = await Promise.all([
        Participation.find(query, null, { calculate: true })
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        Participation.countDocuments(query)
    ]);

    return {
        docs: participations.map(formatDataBeforeReturn),
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of participations without pagination
 * @param {Object} query - The query to get the participations
 * @param {Object} sort - The sort order
 * @param {Array} populate - The fields to populate
 * @param {String} select - The fields to select
 */
exports.getParticipationList = async (query, sort = { createdAt: -1 }, populate = [], select = '') => {
    const participations = await Participation.find(query, null, { calculate: true })
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();

    return participations.map(formatDataBeforeReturn);
};

/**
 * Update a participation
 * @param {String} id - The ID of the participation
 * @param {Object} data - The data to update the participation
 * @param {Array} populate - The fields to populate
 * @param {String} select - The fields to select
 */
exports.updateParticipation = async (id, data, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'Participation ID'); 

    // Format the data before saving
    data = await formatDataBeforeSave(data);

    const participation = await Participation.findByIdAndUpdate(id, data, { new: true, runValidators: true });

    Validators.checkResourceNotFound(participation, 'participation');

    return await this.getParticipationById(id, populate, select);
};

