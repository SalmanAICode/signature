const ApplicationStatus = require('../models/ApplicationStatus');

const ErrorResponse = require('../utils/errorResponse');
const Validators = require('../utils/validators');

/**
 * Create a new application status
 * @param {Object} data - The data object
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Object} The application status object
 */
exports.createApplicationStatus = async (data, populate = [], select = '') => {
    const applicationStatus = await ApplicationStatus.create(data);
    if (!applicationStatus) {
        throw new ErrorResponse('Failed to create application status', 500);
    }
    return await this.getApplicationStatusById(applicationStatus._id, populate, select);
};

/**
 * get application status by ID
 * @param {String} id - The application status ID
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Object} The application status object
 */
exports.getApplicationStatusById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'application status ID');

    const applicationStatus = await ApplicationStatus
        .findById(id)
        .populate(populate)
        .select(select)
        .lean();

    if (!applicationStatus) {
        throw new ErrorResponse('Application status not found', 404);
    }

    return applicationStatus;
};

/**
 * get all application status with pagination
 * @param {Object} query - The query object
 * @param {Number} page - The page number
 * @param {Number} limit - The limit number
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Object} The application status object
 */
exports.getApplicationStatuses = async (query, page = 1, limit = 10, sort = { idx: 1 }, populate = [], select = '') => {
    const skip = (page - 1) * limit;
    const [applicationStatus, count] = await Promise.all([
        ApplicationStatus.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        ApplicationStatus.countDocuments(query)
    ]);
    return {    
        docs: applicationStatus,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of application status without pagination
 * @param {Object} query - The query object
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Object} The application status object
 */
exports.getApplicationStatusList = async (query, sort = { idx: 1 }, populate = [], select = '') => {
    return await ApplicationStatus.find(query)
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();
};

/**
 * update application status by Id
 * @param {String} id - The application status ID
 * @param {Object} data - The data object
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Object} The application status object
 */
exports.updateApplicationStatus = async (id, data, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'application status ID');

    const applicationStatus = await ApplicationStatus.findById(id);

    if (!applicationStatus) {
        throw new ErrorResponse('Application status not found', 404);
    }

    if(applicationStatus.system) {
        if (data.initial !== undefined || data.approved !== undefined || data.closed !== undefined || data.inactive !== undefined) {
            throw new ErrorResponse('You can only change the name or background color of systemaic application status', 401);
        }
    }
    
    const updatedApplicationStatus = await ApplicationStatus.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    return await this.getApplicationStatusById(updatedApplicationStatus._id, populate, select);
};


/**
 * Delete application status by ID
 * @param {String} id - The application status ID
 * @returns {Object} The application status object
 */
exports.deleteApplicationStatus = async (id) => {
    Validators.checkValidateObjectId(id, 'application status ID');

    const applicationStatus = await ApplicationStatus.findById(id);

    if (!applicationStatus) {
        throw new ErrorResponse('Application status not found', 404);
    }

    if(applicationStatus.system){
        throw new ErrorResponse('You can not delete systemaic application status', 401);
    }

    const deletedApplicationStatus = await ApplicationStatus.findByIdAndUpdate(id, { inactive: true }, { new: true, runValidators: true });

    if (!deletedApplicationStatus) {
        throw new ErrorResponse('Failed to delete application status', 500);
    }

    return {
        success: true,
        message: 'Application status deleted successfully'
    };
};

/**
 * Update all application status index
 */
exports.updateApplicationStatusIndex = async (funder, ids, populate = [], select = '') => {
    let idx = 0;
    for (const id of ids) {
        await ApplicationStatus.findByIdAndUpdate(id, { idx });
        idx++;
    }

    // Update the idx of the application statuses that are not in the ids array to be put to the end of the list
    const applicationStatuses = await ApplicationStatus.find({ funder, _id: { $nin: ids } });
    for (const applicationStatus of applicationStatuses) {
        applicationStatus.idx = idx;
        await applicationStatus.save();
        idx++;
    }

    return await ApplicationStatus
        .find({ funder, _id: { $in: ids } })
        .sort({ idx: 1 })
        .populate(populate)
        .select(select)
        .lean();
};

/**
 * Get the initial application status for a funder
 * @param {String} funder - The funder ID
 * @returns {Object} The application status object
 */
exports.getInitialApplicationStatus = async (funder) => {
    return await ApplicationStatus.findOne({ funder, initial: true, inactive: false });
};

/**
 * Get the offer sent application status for a funder
 * @param {String} funder - The funder ID
 * @returns {Object} The application status object
 */
exports.getOfferSentApplicationStatus = async (funder) => {
    return await ApplicationStatus.findOne({ funder, approved: true, closed: false, inactive: false });
};

/**
 * Get the accepted application status for a funder
 * @param {String} funder - The funder ID
 * @returns {Object} The application status object
 */
exports.getAcceptedApplicationStatus = async (funder) => {
    return await ApplicationStatus.findOne({ funder, approved: true, closed: true, inactive: false });
};
