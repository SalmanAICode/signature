const Funder = require('../models/Funder');
const UserFunder = require('../models/UserFunder');

const ApplicationStatusService = require('./applicationStatusService');
const FundingStatusService = require('./fundingStatusService');
const StipulationTypeService = require('./stipulationTypeService');
const FeeTypeService = require('./feeTypeService');
const ExpenseTypeService = require('./expenseTypeService');
const FormulaService = require('./formulaService');

const Validators = require('../utils/validators');
const { centsToDollars } = require('../utils/helpers');

const default_application_statuses = require('../../data/default/applicationStatus');
const default_funding_statuses = require('../../data/default/fundingStatus');
const default_stipulation_types = require('../../data/default/stipulationType');
const default_fee_types = require('../../data/default/feeType');
const default_expense_types = require('../../data/default/expenseType');

/**
 * Format the funder data to apply setters manually (needed when using lean())
 * @param {Object} funder - The funder
 * @returns {Object} - The formatted funder
 */
const formatDataBeforeReturn = (funder) => {
    return {
        ...funder,
        available_balance: centsToDollars(funder.available_balance) || 0
    };
};

/**
 * Get all funders with filtering and pagination
 */
exports.getFunders = async (query, sort = { name: 1 }, page = 1, limit = 10, populate = [], select = '', calculate = false) => {
    // Pagination
    const skip = (page - 1) * limit;
    
    // Get funders with pagination
    const [funders, count] = await Promise.all([
        Funder.find(query, null, { calculate })
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        Funder.countDocuments(query)
    ]);
    
    return {
        docs: funders.map(formatDataBeforeReturn),
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of funders without pagination
 */
exports.getFunderList = async (query, sort = { name: 1 }, populate = [], select = '', calculate = false) => {
    const funders = await Funder.find(query, null, { calculate })
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();

    return funders.map(formatDataBeforeReturn);
};

/**
 * Get a single funder by ID
 */
exports.getFunderById = async (id, populate = [], select = '', calculate = false) => {
    Validators.checkValidateObjectId(id, 'funder ID');
    
    const funder = await Funder.findById(id, null, { calculate })
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(funder, 'Funder');

    return formatDataBeforeReturn(funder);
};

/**
 * Create a new funder
 */
exports.createFunder = async (data, populate = [], select = '', calculate = false, 
    user_list = [], application_statuses = [], funding_statuses = [], stipulation_types = [],
    fee_types = [], expense_types = []
) => {
    // Create the funder
    const funder = await Funder.create(data);

    Validators.checkResourceNotFound(funder, 'Funder');

    try {
        // Create the user list
        if (user_list && user_list.length > 0) {
            await UserFunder.create(user_list.map(user => ({
                funder: funder._id,
                user: user
            })));
        }
        
        // Create the application statuses
        const application_statuses_data = application_statuses.length > 0 ? application_statuses : default_application_statuses;
        for (const application_status of application_statuses_data) {
            await ApplicationStatusService.createApplicationStatus({
                ...application_status,
                funder: funder._id
            });
        }
        
        // Create the funding statuses
        const funding_statuses_data = funding_statuses.length > 0 ? funding_statuses : default_funding_statuses;
        for (const funding_status of funding_statuses_data) {
            await FundingStatusService.createFundingStatus({
                ...funding_status,
                funder: funder._id
            });
        }

        // Create the stipulation types
        const stipulation_types_data = stipulation_types.length > 0 ? stipulation_types : default_stipulation_types;
        for (const stipulation_type of stipulation_types_data) {
            await StipulationTypeService.createStipulationType({
                ...stipulation_type,
                funder: funder._id
            });
        }

        // Create the fee types
        const fee_types_data = fee_types.length > 0 ? fee_types : default_fee_types;
        for (const fee_type of fee_types_data) {
            const { formula, ...fee_type_data } = fee_type;
            const newFormula = await FormulaService.createFormula(
                {
                    ...formula,
                    funder: funder._id
                }
            );
            await FeeTypeService.createFeeType({
                ...fee_type_data,
                formula: newFormula._id,
                funder: funder._id
            });
        }

        // Create the expense types
        const expense_types_data = expense_types.length > 0 ? expense_types : default_expense_types;
        for (const expense_type of expense_types_data) {
            const { formula, ...expense_type_data } = expense_type;
            const newFormula = await FormulaService.createFormula(
                {
                    ...formula,
                    funder: funder._id
                }
            );
            await ExpenseTypeService.createExpenseType({
                ...expense_type_data,
                formula: newFormula._id,
                funder: funder._id
            });
        }
    } catch (error) {
        console.error('Error creating funder related resources:', error);
        throw error;
    }

    return await this.getFunderById(funder._id, populate, select, calculate);
};

/**
 * Update an existing funder
 */
exports.updateFunder = async (id, data, populate = [], select = '', calculate = false) => {
    Validators.checkValidateObjectId(id, 'funder ID');
        
    // Update funder
    const updatedFunder = await Funder.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true
    });

    Validators.checkResourceNotFound(updatedFunder, 'Funder');
    
    return await this.getFunderById(updatedFunder._id, populate, select, calculate);
};

/**
 * Delete a funder (soft delete by setting inactive to true)
 */
exports.deleteFunder = async (id, populate = [], select = '', calculate = false) => {
    Validators.checkValidateObjectId(id, 'funder ID');
    
    const funder = await Funder.findByIdAndUpdate(id, { inactive: true }, {
        new: true,
        runValidators: true
    });
    
    Validators.checkResourceNotFound(funder, 'Funder');
    
    return await this.getFunderById(funder._id, populate, select, calculate);
};
