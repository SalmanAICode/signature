const SyndicationOffer = require('../models/SyndicationOffer');

const Helpers = require('../utils/helpers');

const Validators = require('../utils/validators');

/**
 * Format the syndication offer data to apply getters manually (needed when using lean())
 * @param {Object} offer - The syndication offer
 * @returns {Object} - The formatted syndication offer
 */
const formatDataBeforeReturn = (offer) => {
    return {
        ...offer,

        funding: offer.funding ? Helpers.isObjectId(offer.funding) ? offer.funding : {
            ...offer.funding,
            funded_amount: Helpers.centsToDollars(offer.funding.funded_amount) || undefined,
            payback_amount: Helpers.centsToDollars(offer.funding.payback_amount) || undefined,
            commission_amount: Helpers.centsToDollars(offer.funding.commission_amount) || undefined
        } : null,
        
        participate_amount: Helpers.centsToDollars(offer.participate_amount) || 0,
        payback_amount: Helpers.centsToDollars(offer.payback_amount) || 0,
        total_funded_amount: Helpers.centsToDollars(offer.total_funded_amount) || 0,
        total_payback_amount: Helpers.centsToDollars(offer.total_payback_amount) || 0,
        total_fee_amount: Helpers.centsToDollars(offer.total_fee_amount) || 0,
        total_credit_amount: Helpers.centsToDollars(offer.total_credit_amount) || 0,
        upfront_fee_amount: Helpers.centsToDollars(offer.upfront_fee_amount) || 0,
        upfront_credit_amount: Helpers.centsToDollars(offer.upfront_credit_amount) || 0,
        recurring_fee_amount: Helpers.centsToDollars(offer.recurring_fee_amount) || 0,
        recurring_credit_amount: Helpers.centsToDollars(offer.recurring_credit_amount) || 0,
        syndicated_amount: Helpers.centsToDollars(offer.syndicated_amount) || 0,

        fee_list: offer.fee_list ? offer.fee_list.map(fee => ({
            ...fee,
            amount: Helpers.centsToDollars(fee.amount) || 0
        })) : [],
        credit_list: offer.credit_list ? offer.credit_list.map(credit => ({
            ...credit,
            amount: Helpers.centsToDollars(credit.amount)
        })) : []
    };
};

/**
 * Format the syndication offer data to apply setters manually (needed when using lean())
 * @param {Object} offer - The syndication offer
 * @returns {Object} - The formatted syndication offer
 */
const formatDataBeforeSave = async (data) => {
    // Convert dollars to cents
    data.participate_amount = Helpers.dollarsToCents(data.participate_amount) || undefined;
    data.payback_amount = Helpers.dollarsToCents(data.payback_amount) || undefined;

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
 * Create a new syndication offer
 * @param {Object} data - The data to create the syndication offer
 * @param {Array} populate - The fields to populate
 * @param {String} select - The fields to select
 * @param {Boolean} calculate - Whether to calculate the statistics
 */
exports.createSyndicationOffer = async (data, populate = [], select = '', calculate = false) => {
    if (!data.offered_date) data.offered_date = Date.now();
    
    data.status_date = data.offered_date;
    
    data = await formatDataBeforeSave(data);

    const offer = await SyndicationOffer.create(data);

    Validators.checkResourceCreated(offer, 'syndication offer');

    return await this.getSyndicationOfferById(offer._id, populate, select, calculate);
};

/**
 * Get syndication offer by ID
 * @param {String} id - The ID of the syndication offer
 * @param {Array} populate - The fields to populate
 * @param {String} select - The fields to select
 * @param {Boolean} calculate - Whether to calculate the statistics
 */
exports.getSyndicationOfferById = async (id, populate = [], select = '', calculate = false) => {
    Validators.checkValidateObjectId(id, 'syndication offer ID');

    const offer = await SyndicationOffer.findById(id, null, { calculate })
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(offer, 'syndication offer');

    return formatDataBeforeReturn(offer);
};

/**
 * Get all syndication offers with pagination
 * @param {Object} query - The query to get the syndication offers
 * @param {Number} page - The page number
 * @param {Number} limit - The number of syndication offers per page
 * @param {Object} sort - The sort order
 * @param {Array} populate - The fields to populate
 * @param {String} select - The fields to select
 * @param {Boolean} calculate - Whether to calculate the statistics
 */
exports.getSyndicationOffers = async (query, sort = { created_date: -1 }, page = 1, limit = 10, populate = [], select = '', calculate = false) => {
    const skip = (page - 1) * limit;

    const [syndicationOffer, count] = await Promise.all([
        SyndicationOffer.find(query, null, { calculate })
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        SyndicationOffer.countDocuments(query)
    ]);

    return {
        docs: syndicationOffer.map(formatDataBeforeReturn),
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of syndication offers without pagination
 * @param {Object} query - The query to get the syndication offers
 * @param {Object} sort - The sort order
 * @param {Array} populate - The fields to populate
 * @param {String} select - The fields to select
 * @param {Boolean} calculate - Whether to calculate the statistics
 */
exports.getSyndicationOfferList = async (query, sort = { created_date: -1 }, populate = [], select = '', calculate = false) => {
    const syndicationOffers = await SyndicationOffer.find(query, null, { calculate })
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();

    return syndicationOffers.map(formatDataBeforeReturn);
};

/**
 * Update a syndication offer
 * @param {String} id - The ID of the syndication offer
 * @param {Object} data - The data to update the syndication offer
 * @param {Array} populate - The fields to populate
 * @param {String} select - The fields to select
 * @param {Boolean} calculate - Whether to calculate the statistics
 */
exports.updateSyndicationOffer = async (id, data, populate = [], select = '', calculate = false) => {
    Validators.checkValidateObjectId(id, 'syndication offer ID');

    const syndicationOffer = await SyndicationOffer.findById(id);

    Validators.checkResourceNotFound(syndicationOffer, 'syndication offer');

    if (data.status && data.status !== syndicationOffer.status) {
        data.status_date = Date.now();
    }

    data = await formatDataBeforeSave(data);

    const updatedSyndicationOffer = await SyndicationOffer.findByIdAndUpdate(id, data, { new: true, runValidators: true });

    Validators.checkResourceNotFound(updatedSyndicationOffer, 'syndication offer');

    return await this.getSyndicationOfferById(updatedSyndicationOffer._id, populate, select, calculate);
};

/**
 * Delete a syndication offer
 * @param {String} id - The ID of the syndication offer
 * @param {Array} populate - The fields to populate
 * @param {String} select - The fields to select
 * @param {Boolean} calculate - Whether to calculate the statistics
 */
exports.deleteSyndicationOffer = async (id, populate = [], select = '', calculate = false) => {
    Validators.checkValidateObjectId(id, 'syndication offer ID');

    const deletedSyndicationOffer = await SyndicationOffer.findByIdAndUpdate(id, { inactive: true }, { new: true });

    Validators.checkResourceNotFound(deletedSyndicationOffer, 'syndication offer');

    return this.getSyndicationOfferById(id, populate, select, calculate);
};