const StipulationType = require('../models/StipulationType');

const ErrorResponse = require('../utils/errorResponse');
const Validators = require('../utils/validators');


/**
 * Create a new stipulation type    
 */
exports.createStipulationType = async (data, populate = [], select = '') => {
    const stipulationType = await StipulationType.create(data);

    if (!stipulationType) {
        throw new ErrorResponse('Failed to create stipulation type', 500);
    }
    return await this.getStipulationTypeById(stipulationType._id, populate, select);
};

/**
 * Get stipulation type by ID
 */
exports.getStipulationTypeById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'stipulation type ID');

    const stipulationType = await StipulationType
        .findById(id)
        .populate(populate)
        .select(select)
        .lean();

    if (!stipulationType) {
        throw new ErrorResponse('Stipulation type not found', 404);
    }
    return stipulationType;
};

/**
 * Get all stipulation types with pagination
 */
exports.getStipulationTypes = async (query, sort = { name: 1 }, page = 1, limit = 10, populate = [], select = '') => {
    const skip = (page - 1) * limit;
    const [stipulationTypes, count] = await Promise.all([
        StipulationType.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        StipulationType.countDocuments(query)
    ]);
    return {
        docs: stipulationTypes,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of stipulation types without pagination
 */
exports.getStipulationTypesList = async (query, sort = { name: 1 }, populate = [], select = '') => {
    return await StipulationType.find(query)
        .select(select)
        .sort(sort)
        .populate(populate)
        .lean();
};

/**
 * Update a stipulation type
 */
exports.updateStipulationType = async (id, data, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'stipulation type ID');

    const updatedStipulationType = await StipulationType.findByIdAndUpdate(id, data, { new: true, runValidators: true });

    return await this.getStipulationTypeById(updatedStipulationType._id, populate, select);
};

/**
 * Delete a stipulation type
 */
exports.deleteStipulationType = async (id) => {
    Validators.checkValidateObjectId(id, 'stipulation type ID');

    const updatedStipulationType = await StipulationType.findByIdAndUpdate(id, { inactive: true }, { new: true, runValidators: true });

    if (!updatedStipulationType) {
        throw new ErrorResponse('Failed to delete stipulation type', 500);
    }

    return {
        success: true,
        message: 'Stipulation type deleted successfully'
    };
};
