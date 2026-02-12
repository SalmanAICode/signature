const ApplicationOffer = require('../models/ApplicationOffer');
const Application = require('../models/Application');
const Funder = require('../models/Funder');
const Merchant = require('../models/Merchant');
const ISO = require('../models/ISO');
const Lender = require('../models/Lender');

const ApplicationService = require('./applicationService');
const FundingService = require('./fundingService');
const FundingStatusService = require('./fundingStatusService');
const FundingFeeService = require('./fundingFeeService');
const FundingExpenseService = require('./fundingExpenseService');
const ApplicationStatusService = require('./applicationStatusService');

const Validators = require('../utils/validators');
const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');
const { APPLICATION_TYPES, APPLICATION_OFFER_STATUS, FUNDING_TYPES } = require('../utils/constants');
const { centsToDollars, dollarsToCents } = require('../utils/helpers');

/**
 * Format the application offer data to apply setters manually (needed when using lean())
 * @param {Object} applicationOffer - The application offer
 * @returns {Object} - The formatted application offer
 */
const formatDataBeforeReturn = (applicationOffer) => {
    return {
        ...applicationOffer,
        application: applicationOffer.application ? Helpers.isObjectId(applicationOffer.application) ? applicationOffer.application : {
            ...applicationOffer.application,
            request_amount: centsToDollars(applicationOffer.application.request_amount) || undefined
        } : null,

        offered_amount: centsToDollars(applicationOffer.offered_amount) || undefined,
        payback_amount: centsToDollars(applicationOffer.payback_amount) || undefined,
        commission_amount: centsToDollars(applicationOffer.commission_amount) || undefined,
        fee_amount: centsToDollars(applicationOffer.fee_amount) || undefined,
        disbursement_amount: centsToDollars(applicationOffer.disbursement_amount) || undefined,
        payment_amount: centsToDollars(applicationOffer.payment_amount) || undefined,

        fee_list: applicationOffer.fee_list ? applicationOffer.fee_list.map(fee => ({
            ...fee,
            amount: centsToDollars(fee.amount) || 0
        })) : [],

        expense_list: applicationOffer.expense_list ? applicationOffer.expense_list.map(expense => ({
            ...expense,
            amount: centsToDollars(expense.amount) || 0
        })) : []
    };
};

/**
 * Format the application offer data to apply setters manually (needed when using lean())
 * @param {Object} applicationOffer - The application offer
 * @returns {Object} - The formatted application offer
 */
const formatDataBeforeSave = (applicationOffer) => {
    return {
        ...applicationOffer,
        offered_amount: dollarsToCents(applicationOffer.offered_amount) || undefined,
        payback_amount: dollarsToCents(applicationOffer.payback_amount) || undefined,
        fee_list: applicationOffer.fee_list ? applicationOffer.fee_list.map(fee => ({
            ...fee,
            amount: dollarsToCents(fee.amount) || 0
        })) : undefined,
        expense_list: applicationOffer.expense_list ? applicationOffer.expense_list.map(expense => ({
            ...expense,
            amount: dollarsToCents(expense.amount) || 0
        })) : undefined
    };
};

/**
 * Create a new application offer
 */
exports.createApplicationOffer = async (data, populate = [], select = '') => {
    // Convert the accross-related fields to the proper object structure using parallel execution
    const conversions = await Promise.all([
        data.funder ? Funder.convertToEmbeddedFormat(data.funder) : Promise.resolve(null),
        data.lender ? Lender.convertToEmbeddedFormat(data.lender) : Promise.resolve(null),
        data.merchant ? Merchant.convertToEmbeddedFormat(data.merchant) : Promise.resolve(null),
        data.iso ? ISO.convertToEmbeddedFormat(data.iso) : Promise.resolve(null)
    ]);

    // Assign converted values back to applicationOfferData
    if (data.funder) data.funder = conversions[0];
    if (data.lender) data.lender = conversions[1];
    if (data.merchant) data.merchant = conversions[2];
    if (data.iso) data.iso = conversions[3];


    const offer = await ApplicationOffer.create(formatDataBeforeSave(data));
    Validators.checkResourceCreated(offer, 'application offer');
    return await this.getApplicationOfferById(offer._id, populate, select);
};

/**
 * get application offer by ID
 * @param {string} id - The ID of the application offer
 * @param {array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @returns {Promise<Object>} The application offer
 */
exports.getApplicationOfferById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'application offer ID');

    const offer = await ApplicationOffer
        .findById(id)
        .populate(populate)
        .select(select)
        .lean();
    Validators.checkResourceNotFound(offer, 'application offer');

    return formatDataBeforeReturn(offer);
};

/**
 * get all application offer
 * @param {object} query - The query to search for
 * @param {number} page - The page number
 * @param {number} limit - The limit of the results
 * @param {object} sort - The sort of the results
 * @param {array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @returns {Promise<Object>} The application offers
 */
exports.getApplicationOffers = async (query, page = 1, limit = 10, sort = { _id: -1 }, populate = [], select = '') => {
    const skip = (page - 1) * limit;

    const [applicationOffers, count] = await Promise.all([
        ApplicationOffer.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        ApplicationOffer.countDocuments(query)
    ]);
    return {
        docs: applicationOffers.map(formatDataBeforeReturn),
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of application offer without pagination
 * @param {object} query - The query to search for
 * @param {array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @param {object} sort - The sort of the results
 * @returns {Promise<Object>} The application offers
 */
exports.getApplicationOfferList = async (query, sort = { _id: -1 }, populate = [], select = '') => {
    const applicationOffers = await ApplicationOffer.find(query)
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();

    return applicationOffers.map(formatDataBeforeReturn);
};

/**
 * Update a application offer
 * @param {string} id - The ID of the application offer
 * @param {object} data - The data to update
 * @param {array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @returns {Promise<Object>} The application offer
 */
exports.updateApplicationOffer = async (id, data, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'application offer ID');

    const updatedApplicationOffer = await ApplicationOffer.findByIdAndUpdate(id, formatDataBeforeSave(data), { new: true, runValidators: true });
    Validators.checkResourceNotFound(updatedApplicationOffer, 'application offer');

    return await this.getApplicationOfferById(updatedApplicationOffer._id, populate, select);
};

/**
 * Delete a application offer
 * @param {string} id - The ID of the application offer
 * @param {array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @returns {Promise<Object>} The application offer
 */
exports.deleteApplicationOffer = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'application offer ID');

    const applicationOffer = await ApplicationOffer.findByIdAndUpdate(id, { inactive: true }, { new: true, runValidators: true });

    Validators.checkResourceNotFound(applicationOffer, 'application offer');

    return await this.getApplicationOfferById(applicationOffer._id, populate, select);
};

/**
 * Accept an application offer
 * @param {string} id - The ID of the application offer
 * @param {object} data - The data to update
 * @param {array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @returns {Promise<Object>} The application offer
 */
exports.acceptApplicationOffer = async (id, data, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'application offer ID');

    const offer = await this.getApplicationOfferById(id);

    Validators.checkResourceNotFound(offer, 'application offer');

    if (offer.status !== APPLICATION_OFFER_STATUS.OFFERED) {
        throw new ErrorResponse('Application offer is not in offered status anymore', 400);
    }

    // Get the application information
    const application = await ApplicationService.getApplicationById(Helpers.extractIdString(offer.application));

    Validators.checkResourceNotFound(application, 'application');

    // Construct the funding information
    try {
        const fundingData = {
            funder: Helpers.extractIdString(offer.funder),
            lender: Helpers.extractIdString(offer.lender),
            merchant: Helpers.extractIdString(offer.merchant),
            iso: Helpers.extractIdString(offer.iso),
            application: application._id,
            application_offer: id,
            name: application.name,
            type: application.type === APPLICATION_TYPES.NEW ? FUNDING_TYPES.NEW : (application.type === APPLICATION_TYPES.RENEWAL ? FUNDING_TYPES.RENEWAL : FUNDING_TYPES.OTHER),
            funded_amount: offer.offered_amount,
            payback_amount: offer.payback_amount,
            status: await FundingStatusService.getInitialFundingStatus(Helpers.extractIdString(offer.funder))
        };

        const funding = await FundingService.createFunding(fundingData);

        try {
            // Create the fees in funding-fee
            for (const fee of offer.fee_list) {
                const feeData = {
                    funding: funding._id,
                    funder: Helpers.extractIdString(funding.funder),
                    lender: Helpers.extractIdString(funding.lender),
                    merchant: Helpers.extractIdString(funding.merchant),
                    iso: Helpers.extractIdString(funding.iso),
                    ...fee,
                    fee_date: new Date(),
                    notes: 'Created in application offer acceptance process.'
                };
                
                await FundingFeeService.createFundingFee(feeData);
            }

            // Create the expenses in funding-expense
            for (const expense of offer.expense_list) {
                const expenseData = {
                    funding: funding._id,
                    funder: Helpers.extractIdString(funding.funder),
                    ...expense,
                    expense_date: new Date(),
                    notes: 'Created in application offer acceptance process.'
                };

                await FundingExpenseService.createFundingExpense(expenseData);
            }
        } catch (err) {
            console.error(err);
        }
        
    } catch (err) {
        console.error(err);
        throw new ErrorResponse('Failed to create funding', 500);
    }

    await ApplicationOffer.findByIdAndUpdate(id, { status: APPLICATION_OFFER_STATUS.ACCEPTED }, { new: true, runValidators: true });

    try {
        // Update the application status
        const applicationApproveStatus = await ApplicationStatusService.getAcceptedApplicationStatus(Helpers.extractIdString(offer.funder));
        await Application.findByIdAndUpdate(application._id, { status: applicationApproveStatus }, { new: true, runValidators: true });
    } catch (err) {
        console.error(err);
    }

    return await this.getApplicationOfferById(id, populate, select);
};
