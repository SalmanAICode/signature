const Merchant = require('../models/Merchant');
const Contact = require('../models/Contact');

const ContactMerchantService = require('./contactMerchantService');

const Validators = require('../utils/validators');
const ErrorResponse = require('../utils/errorResponse');
const { centsToDollars } = require('../utils/helpers');

const SIC_CODES = require('../../data/sic.json');
const NAICS_CODES = require('../../data/naics_2022.json');

/**
 * Format the merchant data to apply setters manually (needed when using lean())
 * @param {Object} merchant - The merchant
 * @returns {Object} - The formatted merchant
 */
const formatDataBeforeReturn = (merchant) => {
    return {
        ...merchant,
        application_request_amount: centsToDollars(merchant.application_request_amount) || 0,
        pending_application_request_amount: centsToDollars(merchant.pending_application_request_amount) || 0,
        funding_amount: centsToDollars(merchant.funding_amount) || 0,
        active_funding_amount: centsToDollars(merchant.active_funding_amount) || 0,
        warning_funding_amount: centsToDollars(merchant.warning_funding_amount) || 0,
        completed_funding_amount: centsToDollars(merchant.completed_funding_amount) || 0,
        default_funding_amount: centsToDollars(merchant.default_funding_amount) || 0
    };
};

/**
 * Format the merchant data to apply setters manually (needed when using lean())
 * @param {Object} merchant - The merchant
 * @returns {Object} - The formatted merchant
 */
const formatDataBeforeSave = async (merchant) => {
    const conversions = await Promise.all([
        merchant.primary_contact ? Contact.convertToEmbeddedFormat(merchant.primary_contact) : Promise.resolve(null),
        merchant.primary_owner ? Contact.convertToEmbeddedFormat(merchant.primary_owner) : Promise.resolve(null),
    ]);

    // Assign converted values back to merchantData
    if (merchant.primary_contact) merchant.primary_contact = conversions[0];
    if (merchant.primary_owner) merchant.primary_owner = conversions[1];

    // Convert sic_detail to sic_detail object
    if (merchant.sic_detail) {
        merchant.sic_detail = {
            code: merchant.sic_detail,
            description: SIC_CODES.find(sic => sic.code === merchant.sic_detail)?.description || null
        };
    }

    // Convert naics_detail to naics_detail object
    if (merchant.naics_detail) {
        merchant.naics_detail = {
            code: merchant.naics_detail,
            title: NAICS_CODES.find(naics => naics.code === merchant.naics_detail)?.title || null,
            description: NAICS_CODES.find(naics => naics.code === merchant.naics_detail)?.description || null
        };
    }

    return merchant;
};

/**
 * Get all merchants with filtering and pagination
 */
exports.getMerchants = async (query, page = 1, limit = 10, sort = { name: 1 }, populate = [], select = '', calculate = false) => {
    // Pagination
    const skip = (page - 1) * limit;
    
    // Get merchants with pagination
    const [merchants, count] = await Promise.all([
        Merchant.find(query, null, { calculate })
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        Merchant.countDocuments(query)
    ]);
    
    return {
        docs: merchants.map(formatDataBeforeReturn),
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of merchants without pagination
 */
exports.getMerchantList = async (query, sort = { name: 1 }, populate = [], select = '', calculate = false) => {
    const merchants = await Merchant.find(query, null, { calculate })
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();

    return merchants.map(formatDataBeforeReturn);
};

/**
 * Get a single merchant by ID
 */
exports.getMerchantById = async (id, populate = [], select = '', calculate = false) => {
    Validators.checkValidateObjectId(id, 'merchant ID');
    
    const merchant = await Merchant.findById(id, null, { calculate })
        .populate(populate)
        .select(select)
        .lean();
        
    Validators.checkResourceNotFound(merchant, 'Merchant');
    
    return formatDataBeforeReturn(merchant);
};

/**
 * Create a new merchant
 */
exports.createMerchant = async (data, populate = [], select = '', calculate = false) => {
    // Create the merchant
    const merchant = await Merchant.create(await formatDataBeforeSave(data));

    if (!merchant) {
        throw new ErrorResponse('Failed to create merchant', 500);
    }

    if (data.primary_contact) {
        await ContactMerchantService.createContactMerchant(merchant._id, data.primary_contact.id, {});
    }

    if (data.primary_owner) {
        await ContactMerchantService.createContactMerchant(merchant._id, data.primary_owner.id, { owner: true });
    }

    return await this.getMerchantById(merchant._id, populate, select, calculate);
};

/**
 * Update an existing merchant
 */
exports.updateMerchant = async (id, data, populate = [], select = '', calculate = false) => {
    Validators.checkValidateObjectId(id, 'merchant ID');

    const merchant = await Merchant.findByIdAndUpdate(id, await formatDataBeforeSave(data), {
        new: true,
        runValidators: true
    });

    if (data.primary_contact) {
        await ContactMerchantService.createContactMerchant(merchant._id, data.primary_contact.id, {});
    }

    if (data.primary_owner) {
        await ContactMerchantService.createContactMerchant(merchant._id, data.primary_owner.id, { owner: true });
    }

    return await this.getMerchantById(merchant._id, populate, select, calculate);
};

/**
 * Delete a merchant (soft delete by setting inactive to true)
 */
exports.deleteMerchant = async (id) => {
    Validators.checkValidateObjectId(id, 'merchant ID');
    
    const merchant = await Merchant.findById(id);
    
    Validators.checkResourceNotFound(merchant, 'Merchant');
    
    merchant.inactive = true;
    await merchant.save();
    
    return {
        success: true,
        message: 'Merchant deleted successfully'
    };
};
