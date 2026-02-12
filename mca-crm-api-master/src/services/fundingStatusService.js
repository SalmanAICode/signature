const FundingStatus = require('../models/FundingStatus');

const ErrorResponse = require('../utils/errorResponse');
const Validators = require('../utils/validators');

/**
 * Create a new funding status
 * @param {Object} data - The data object
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Object} The funding status object
 */
exports.createFundingStatus = async (data, populate = [], select = '') => {
    const fundingStatus = await FundingStatus.create(data);
    if (!fundingStatus) {
        throw new ErrorResponse('Failed to create funding status', 500);
    }
    return await this.getFundingStatusById(fundingStatus._id, populate, select);
};

/**
 * get funding status by ID
 * @param {String} id - The funding status ID
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Object} The funding status object
 */
exports.getFundingStatusById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'funding status ID');

    const fundingStatus = await FundingStatus
        .findById(id)
        .populate(populate)
        .select(select)
        .lean();

    if (!fundingStatus) {
        throw new ErrorResponse('Funding status not found', 404);
    }

    return fundingStatus;
};

/**
 * get all funding status with pagination
 * @param {Object} query - The query object
 * @param {Number} page - The page number
 * @param {Number} limit - The limit number
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Object} The funding status object
 */
exports.getFundingStatuses = async (query, page = 1, limit = 10, sort = { idx: 1 }, populate = [], select = '') => {
    const skip = (page - 1) * limit;
    const [fundingStatus, count] = await Promise.all([
        FundingStatus.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        FundingStatus.countDocuments(query)
    ]);
    return {    
        docs: fundingStatus,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of funding status without pagination
 * @param {Object} query - The query object
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Object} The funding status object
 */
exports.getFundingStatusList = async (query, sort = { idx: 1 }, populate = [], select = '') => {
    return await FundingStatus.find(query)
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();
};

/**
 * update funding status by Id
 * @param {String} id - The funding status ID
 * @param {Object} data - The data object
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Object} The funding status object
 */
exports.updateFundingStatus = async (id, data, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'funding status ID');

    const fundingStatus = await FundingStatus.findById(id);

    if (!fundingStatus) {
        throw new ErrorResponse('Funding status not found', 404);
    }

    if(fundingStatus.system) {
        if (data.initial !== undefined || data.funded !== undefined || data.performing !== undefined || data.warning !== undefined || data.closed !== undefined || data.defaulted !== undefined || data.inactive !== undefined) {
            throw new ErrorResponse('You can only change the name or background color of systemaic funding status', 401);
        }
    }
    
    const updatedFundingStatus = await FundingStatus.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    return await this.getFundingStatusById(updatedFundingStatus._id, populate, select);
};


/**
 * Delete funding status by ID
 * @param {String} id - The funding status ID
 * @returns {Object} The funding status object
 */
exports.deleteFundingStatus = async (id) => {
    Validators.checkValidateObjectId(id, 'funding status ID');

    const fundingStatus = await FundingStatus.findById(id);

    if (!fundingStatus) {
        throw new ErrorResponse('Funding status not found', 404);
    }

    if(fundingStatus.system){
        throw new ErrorResponse('You can not delete systemaic funding status', 401);
    }

    const deletedFundingStatus = await FundingStatus.findByIdAndUpdate(id, { inactive: true }, { new: true, runValidators: true });

    if (!deletedFundingStatus) {
        throw new ErrorResponse('Failed to delete funding status', 500);
    }

    return {
        success: true,
        message: 'Funding status deleted successfully'
    };
};

/**
 * Update all funding status index
 */
exports.updateFundingStatusIndex = async (funder, ids, populate = [], select = '') => {
    let idx = 0;
    for (const id of ids) {
        await FundingStatus.findByIdAndUpdate(id, { idx });
        idx++;
    }

    // Update the idx of the funding statuses that are not in the ids array to be put to the end of the list
    const fundingStatuses = await FundingStatus.find({ funder, _id: { $nin: ids } });
    for (const fundingStatus of fundingStatuses) {
        fundingStatus.idx = idx;
        await fundingStatus.save();
        idx++;
    }

    return await FundingStatus
        .find({ funder, _id: { $in: ids } })
        .sort({ idx: 1 })
        .populate(populate)
        .select(select)
        .lean();
};

/**
 * Get the initial funding status for a funder
 * @param {String} funder - The funder ID
 * @returns {Object} The funding status object
 */
exports.getInitialFundingStatus = async (funder) => {
    return await FundingStatus.findOne({ funder, initial: true, inactive: false });
};