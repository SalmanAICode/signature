const ExpenseType = require('../models/ExpenseType');

const ErrorResponse = require('../utils/errorResponse');
const Validators = require('../utils/validators');

/**
 * Create a new expense type
 */
exports.createExpenseType = async (data, populate = [], select = '') => {
    const expenseType = await ExpenseType.create(data);

    if (!expenseType) {
        throw new ErrorResponse('Failed to create expense type', 500);
    }
    
    return this.getExpenseTypeById(expenseType._id, populate, select);
};

/**
 * Get a expense type by ID
 */
exports.getExpenseTypeById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'expense type ID');
    const expenseType = await ExpenseType.findById(id)
        .populate(populate)
        .select(select)
        .lean();
    if (!expenseType) {
        throw new ErrorResponse('Expense type not found', 404);
    }
    return expenseType;
};

/**
 * Get all expense types
 */
exports.getExpenseTypes = async (query, page = 1, limit = 10, sort = { name: -1 }, populate = [], select = '') => {
    const skip = (page - 1) * limit;
    const [expenseTypes, count] = await Promise.all([
        ExpenseType.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        ExpenseType.countDocuments(query)
    ]);
    return {
        docs: expenseTypes,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get List of Expense Types
 */
exports.getExpenseTypesList = async (query, sort = { name: 1 }, populate = [], select = '') => {
    return await ExpenseType.find(query)
        .select(select)
        .sort(sort)
        .populate(populate)
        .lean();
};

/**
 * Update a expense type
 */
exports.updateExpenseType = async (id, data, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'expense type ID');
    
    const expenseType = await ExpenseType.findByIdAndUpdate(id, data, { new: true, runValidators: true });

    return await this.getExpenseTypeById(expenseType._id, populate, select);
};

/**
 * Delete a expense type
 */
exports.deleteExpenseType = async (id) => {
    Validators.checkValidateObjectId(id, 'expense type ID');
    
    const expenseType = await ExpenseType.findByIdAndUpdate(id, { inactive: true }, { new: true, runValidators: true });

    if (!expenseType) {
        throw new ErrorResponse('Failed to delete expense type', 500);
    }

    return {
        success: true,
        message: 'Expense type deleted successfully'
    };
};



