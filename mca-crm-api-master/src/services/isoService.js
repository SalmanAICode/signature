const ISO = require('../models/ISO');
const Representative = require('../models/Representative');
const RepresentativeISO = require('../models/RepresentativeISO');

const ErrorResponse = require('../utils/errorResponse');
const Validators = require('../utils/validators');
const { centsToDollars } = require('../utils/helpers');

/**
 * Format the iso data to apply setters manually (needed when using lean())
 * @param {Object} iso - The iso
 * @returns {Object} - The formatted iso
 */
const formatDataBeforeReturn = (iso) => {
    return {
        ...iso,
        application_request_amount: centsToDollars(iso.application_request_amount) || 0,
        pending_application_request_amount: centsToDollars(iso.pending_application_request_amount) || 0,
        funding_amount: centsToDollars(iso.funding_amount) || 0,
        active_funding_amount: centsToDollars(iso.active_funding_amount) || 0,
        warning_funding_amount: centsToDollars(iso.warning_funding_amount) || 0,
        completed_funding_amount: centsToDollars(iso.completed_funding_amount) || 0,
        default_funding_amount: centsToDollars(iso.default_funding_amount) || 0,
        commission_amount: centsToDollars(iso.commission_amount) || 0,
        pending_commission_amount: centsToDollars(iso.pending_commission_amount) || 0,
        paid_commission_amount: centsToDollars(iso.paid_commission_amount) || 0,
        cancelled_commission_amount: centsToDollars(iso.cancelled_commission_amount) || 0
    };
};

/**
 * Format the iso data to apply setters manually (needed when using lean())
 * @param {Object} iso - The iso
 * @returns {Object} - The formatted iso
 */
const formatDataBeforeSave = async (iso) => {
    const conversions = await Promise.all([
        iso.primary_representative ? Representative.convertToEmbeddedFormat(iso.primary_representative) : Promise.resolve(null),
    ]);

    // Assign converted values back to isoData
    if (iso.primary_representative) iso.primary_representative = conversions[0];

    return iso;
};

/**
 * Get all isos with filtering and pagination
 */
exports.getISOs = async (query, sort = { name: 1 }, page = 1, limit = 10, populate = [], select = '', calculate = false) => {
    const skip = (page - 1) * limit;
    const [isos, count] = await Promise.all([
        ISO.find(query, null, { calculate })
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        ISO.countDocuments(query)
    ]);

    return {
        docs: isos.map(formatDataBeforeReturn),
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of isos without pagination
 */
exports.getISOList = async (query, sort = { name: 1 }, populate = [], select = '', calculate = false) => {
    const isos = await ISO.find(query, null, { calculate })
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();

    return isos.map(formatDataBeforeReturn);
};

/**
 * Get a single iso by ID
 */
exports.getISOById = async (id, populate = [], select = '', calculate = false) => {
    Validators.checkValidateObjectId(id, 'iso ID');

    const iso = await ISO
        .findById(id, null, { calculate })
        .populate(populate)
        .select(select)
        .lean();

    if (!iso) {
        throw new ErrorResponse(`ISO not found with id of ${id}`, 404);
    }

    return formatDataBeforeReturn(iso);
};


/**
 * Create a new iso
 */
exports.createISO = async (data, populate = [], select = '', calculate = false) => {
    const iso = await ISO.create(await formatDataBeforeSave(data));
    
    if (!iso) {
        throw new ErrorResponse('Failed to create iso', 500);
    }

    // If primary representative is provided, create a new representativeISO
    if (data.primary_representative) {
        await RepresentativeISO.create({
            representative: data.primary_representative.id,
            iso: iso._id
        });
    }
    
    return await this.getISOById(iso._id, populate, select, calculate);
};

/**
 * Update an existing iso
 */
exports.updateISO = async (id, data, populate = [], select = '', calculate = false) => {
    Validators.checkValidateObjectId(id, 'ISO ID');

    // Update iso
    const updatedISO = await ISO.findByIdAndUpdate(id, await formatDataBeforeSave(data), {
        new: true,
        runValidators: true
    });

    return await this.getISOById(updatedISO._id, populate, select, calculate);
};

/**
 * Delete a iso (soft delete by setting inactive to true)
 */
exports.deleteISO = async (id) => {
    Validators.checkValidateObjectId(id, 'ISO ID');

    const iso = await ISO.findById(id);

    if (!iso) {
        throw new ErrorResponse(`ISO not found with id of ${id}`, 404);
    }

    iso.inactive = true;
    await iso.save();

    return iso;
};