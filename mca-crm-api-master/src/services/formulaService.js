const Formula = require('../models/Formula');

const { FORMULA_TIER_TYPES, FORMULA_CALCULATE_TYPES, FORMULA_BASE_ITEMS } = require('../utils/constants');
const ErrorResponse = require('../utils/errorResponse');
const Validators = require('../utils/validators');
const Helpers = require('../utils/helpers');

/**
 * Format the formula data to apply setters manually (needed when using lean())
 * @param {Object} formula - The formula
 * @returns {Object} - The formatted formula
 */
const formatDataBeforeReturn = (formula) => {
    return {
        ...formula,
        tier_list: formula.tier_list ? formula.tier_list.map(tier => (
            (formula.tier_type === FORMULA_TIER_TYPES.FUND ||
            formula.tier_type === FORMULA_TIER_TYPES.PAYBACK) ?
                {
                    ...tier,
                    min_number: Helpers.centsToDollars(tier.min_number) || 0,
                    max_number: Helpers.centsToDollars(tier.max_number) || 0,
                    amount: Helpers.centsToDollars(tier.amount) || 0
                } : {
                    ...tier,        
                    amount: Helpers.centsToDollars(tier.amount) || 0
                }
        )) : []
    };
};

/**
 * Format the formula data to apply setters manually (needed when using lean())
 * @param {Object} formula - The formula
 * @returns {Object} - The formatted formula
 */
const formatDataBeforeSave = (formula) => {
    return {
        ...formula,
        tier_list: formula.tier_list ? formula.tier_list.map(tier => (
            (formula.tier_type === FORMULA_TIER_TYPES.FUND ||
                formula.tier_type === FORMULA_TIER_TYPES.PAYBACK) ? 
                {
                    ...tier,
                    min_number: Helpers.dollarsToCents(tier.min_number) || 0,
                    max_number: Helpers.dollarsToCents(tier.max_number) || 0,
                    amount: Helpers.dollarsToCents(tier.amount) || 0
                } : {
                    ...tier,
                    amount: Helpers.dollarsToCents(tier.amount) || 0
                }
        )) : []
    };
};

/**
 * Get formulas with pagination
 * @param {Object} query - Query parameters
 * @param {Number} page - Page number
 * @param {Number} limit - Number of items per page
 * @param {Object} sort - Sort criteria
 * @returns {Object} Paginated formulas
 */
exports.getFormulas = async (query, page = 1, limit = 10, sort = { formula_name: 1 }, populate = [], select = '') => {    
    // Get formulas with pagination
    const skip = (page - 1) * limit;

    const [formulas, count] = await Promise.all([
        Formula.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate(populate)
            .select(select)
            .lean(),
        Formula.countDocuments(query)
    ]);

    return {
        docs: formulas.map(formatDataBeforeReturn),

        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get list of formulas without pagination
 * @param {Object} query - Query parameters
 * @returns {Array} List of formulas
 */
exports.getFormulaList = async (query, sort = { formula_name: 1 }, populate = [], select = '') => {
    const formulas = await Formula.find(query)
        .select(select)
        .sort(sort)
        .populate(populate)
        .lean();
    
    return formulas.map(formatDataBeforeReturn);
};

/**
 * Get formula by ID
 * @param {String} id - Formula ID
 * @param {Array} populate - Populate fields
 * @param {String} select - Select fields
 * @returns {Object} Formula
 */
exports.getFormulaById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'formula ID');

    const formula = await Formula.findById(id)
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(formula, 'formula');

    return formatDataBeforeReturn(formula);
};

/**
 * Create a new formula
 * @param {Object} formulaData - Formula data
 * @returns {Object} New formula
 */
exports.createFormula = async (data, populate = [], select = '') => {
    // Create the formula
    const formula = await Formula.create(formatDataBeforeSave(data));
    
    Validators.checkResourceCreated(formula, 'formula');

    // Return the formula without password
    return await this.getFormulaById(formula._id, populate, select);
};

/**
 * Update a formula
 * @param {String} id - Formula ID
 * @param {Object} updateData - Formula data to update
 * @returns {Object} Updated formula
 */
exports.updateFormula = async (id, data, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'formula ID');

    const formula = await Formula.findByIdAndUpdate(id, formatDataBeforeSave(data), { new: true });

    return await this.getFormulaById(formula._id, populate, select);
};

/**
 * Delete a formula
 * @param {String} id - Formula ID
 * @returns {Boolean} True if deleted, false otherwise
 */
exports.deleteFormula = async (id) => {
    Validators.checkValidateObjectId(id, 'formula ID');

    const formula = await Formula.findByIdAndUpdate(id, { inactive: true }, { new: true });

    Validators.checkResourceNotFound(formula, 'formula');

    return {
        success: true,
        message: 'Formula deleted successfully'
    };
};

/**
 * Calculate the cost of a formula with the given parameters
 * @param {String} formulaId - Formula id
 * @param {String} objectId - Object id
 * @param {String} type - Type of the object
 * @returns {Number} Cost of the formula
 */
exports.calculateFormula = async (formulaId, fund, payback) => {
    Validators.checkValidateObjectId(formulaId, 'formula ID');

    if (fund <= 0 || payback <= 0) {
        throw new ErrorResponse('Fund and payback must be greater than 0', 400);
    }
    
    const formula = await Formula.findById(formulaId);

    Validators.checkResourceNotFound(formula, 'formula');

    fund = Helpers.dollarsToCents(fund);
    payback = Helpers.dollarsToCents(payback);

    if (!formula.tier_list || formula.tier_list.length === 0) {
        throw new ErrorResponse(`Formula ${formulaId} is not valid`, 400);
    }

    const factor_rate = payback / fund;
    
    // Calculate the cost of the formula
    // 1. Find the tier (if no tier, choose the first tier)
    // 2. Based on the calculate_type, use either the amount or the percent in the tier
    // 3. Calculate the cost of the formula with the base_item
    // 4. Return the cost of the formula
    let tier;
    switch (formula.tier_type) {
    case FORMULA_TIER_TYPES.FUND:
        tier = formula.tier_list.find(tier => tier.min_number <= fund && tier.max_number >= fund);        
        break;
    case FORMULA_TIER_TYPES.PAYBACK:
        tier = formula.tier_list.find(tier => tier.min_number <= payback && tier.max_number >= payback);
        break;
    case FORMULA_TIER_TYPES.FACTOR_RATE:
        tier = formula.tier_list.find(tier => tier.min_number <= factor_rate && tier.max_number >= factor_rate);
        break;
    case FORMULA_TIER_TYPES.NONE:
    default:
        tier = formula.tier_list[0];
        break;
    }

    // If the calculate_type is amount, return the amount
    if (formula.calculate_type === FORMULA_CALCULATE_TYPES.AMOUNT) {
        return Helpers.centsToDollars(tier.amount);
    }

    // If the calculate_type is percent, return the percent
    switch (formula.base_item) {
    case FORMULA_BASE_ITEMS.FUND:
        return Helpers.centsToDollars(fund * tier.percent);
    case FORMULA_BASE_ITEMS.PAYBACK:
        return Helpers.centsToDollars(payback * tier.percent);
    case FORMULA_BASE_ITEMS.NONE:
    default:
        throw new ErrorResponse(`Invalid base item: ${formula.base_item}`, 400);
    }
};

