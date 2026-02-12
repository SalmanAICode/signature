const FeeType = require('../models/FeeType');

const ErrorResponse = require('../utils/errorResponse');
const Validators = require('../utils/validators');

/**
 * Create a new fee type
 */
exports.createFeeType = async (data, populate = [], select = '') => {
    const feeType = await FeeType.create(data);

    if (!feeType) {
        throw new ErrorResponse('Failed to create fee type', 500);
    }
    
    return this.getFeeTypeById(feeType._id, populate, select);
};

/**
 * Get a fee type by ID
 */
exports.getFeeTypeById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'fee type ID');
    const feeType = await FeeType.findById(id)
        .populate(populate)
        .select(select)
        .lean();
    if (!feeType) {
        throw new ErrorResponse('Fee type not found', 404);
    }
    return feeType;
};

/**
 * Get all fee types
 */
exports.getFeeTypes = async (query, sort = { name: 1 }, page = 1, limit = 10, populate = [], select = '') => {
    const skip = (page - 1) * limit;
    const [feeTypes, count] = await Promise.all([
        FeeType.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        FeeType.countDocuments(query)
    ]);
    return {
        docs: feeTypes,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get List of Fee Types
 */
exports.getFeeTypesList = async (query, sort = { name: 1 }, populate = [], select = '') => {
    return await FeeType.find(query)
        .select(select)
        .sort(sort)
        .populate(populate)
        .lean();
};

/**
 * Update a fee type
 */
exports.updateFeeType = async (id, data, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'fee type ID');
    
    const feeType = await FeeType.findByIdAndUpdate(id, data, { new: true, runValidators: true });

    return await this.getFeeTypeById(feeType._id, populate, select);
};

/**
 * Delete a fee type
 */
exports.deleteFeeType = async (id) => {
    Validators.checkValidateObjectId(id, 'fee type ID');
    
    const feeType = await FeeType.findByIdAndUpdate(id, { inactive: true }, { new: true, runValidators: true });

    if (!feeType) {
        throw new ErrorResponse('Failed to delete fee type', 500);
    }

    return {
        success: true,
        message: 'Fee type deleted successfully'
    };
};



