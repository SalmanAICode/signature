const Lender = require('../models/Lender');

const Validators = require('../utils/validators');
const { centsToDollars } = require('../utils/helpers');

/**
 * Format the lender data to apply setters manually (needed when using lean())
 * @param {Object} lender - The lender
 * @returns {Object} - The formatted lender
 */
const formatDataBeforeReturn = (lender) => {
    return {
        ...lender,
        available_balance: centsToDollars(lender.available_balance) || 0
    };
};

/**
 * Get all lenders with filtering and pagination
 */
exports.getLenders = async (query, sort = { name: 1 }, page = 1, limit = 10, populate = [], select = '', calculate = false) => {
    // Pagination
    const skip = (page - 1) * limit;
    
    // Get lenders with pagination
    const [lenders, count] = await Promise.all([
        Lender.find(query, null, { calculate })
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        Lender.countDocuments(query)
    ]);
    
    return {
        docs: lenders.map(formatDataBeforeReturn),
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of lenders without pagination
 */
exports.getLenderList = async (query, sort = { name: 1 }, populate = [], select = '', calculate = false, session = null) => {
    const lenders = await Lender.find(query, null, { calculate, session })
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();

    return lenders.map(formatDataBeforeReturn);
};

/**
 * Get a single lender by ID
 */
exports.getLenderById = async (id, populate = [], select = '', calculate = false, session = null) => {
    Validators.checkValidateObjectId(id, 'lender ID');
    
    const lender = await Lender.findById(id, null, { calculate, session })
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(lender, 'Lender');

    return formatDataBeforeReturn(lender);
};

/**
 * Create a new lender
 */
exports.createLender = async (data, populate = [], select = '', calculate = false) => {
    const lender = await Lender.create(data);

    Validators.checkResourceNotFound(lender, 'Lender');
    
    return await this.getLenderById(lender._id, populate, select, calculate);
};

/**
 * Update an existing lender
 */
exports.updateLender = async (id, data, populate = [], select = '', calculate = false) => {
    Validators.checkValidateObjectId(id, 'lender ID');
        
    // Update lender
    const updatedLender = await Lender.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true
    });

    Validators.checkResourceNotFound(updatedLender, 'Lender');
    
    return await this.getLenderById(updatedLender._id, populate, select, calculate);
};

/**
 * Delete a lender (soft delete by setting inactive to true)
 */
exports.deleteLender = async (id, populate = [], select = '', calculate = false) => {
    Validators.checkValidateObjectId(id, 'lender ID');
    
    const lender = await Lender.findByIdAndUpdate(id, { inactive: true }, {
        new: true,
        runValidators: true
    });
    
    Validators.checkResourceNotFound(lender, 'Lender');
    
    return await this.getLenderById(lender._id, populate, select, calculate);
};
