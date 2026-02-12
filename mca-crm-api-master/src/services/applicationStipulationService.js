const ApplicationStipulation = require('../models/ApplicationStipulation');
const StipulationType = require('../models/StipulationType');
const ApplicationDocument = require('../models/ApplicationDocument');

const Validators = require('../utils/validators');
const ApplicationOfferStipulation = require('../models/ApplicationOfferStipulation');

/**
 * Get application stipulations with query, pagination and sort
 * @param {Object} query - The query object
 * @param {Number} page - The page number
 * @param {Number} limit - The limit number
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @param {boolean} calculate - The calculate boolean
 * @returns {Object} The application stipulations object
 */
exports.getApplicationStipulations = async (query, page = 1, limit = 10, sort = { status_date: -1 }, populate = [], select = '', calculate = false) => {
    // Get application stipulations with pagination
    const skip = (page - 1) * limit;

    const [applicationStipulations, count] = await Promise.all([
        ApplicationStipulation.find(query, null, { calculate })
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate(populate)
            .select(select)
            .lean(),
        ApplicationStipulation.countDocuments(query)
    ]);

    return {
        docs: applicationStipulations,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get application stipulation list without pagination  
 * @param {Object} query - The query object
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @param {boolean} calculate - The calculate boolean
 * @returns {Array} The application stipulations array
 */
exports.getApplicationStipulationList = async (query, sort = { status_date: -1 }, populate = [], select = '', calculate = false) => {
    return await ApplicationStipulation.find(query, null, { calculate })
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();
};

/**
 * Get application stipulation list without pagination  
 * @param {Object} query - The query object
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @param {boolean} calculate - The calculate boolean
 * @returns {Array} The application stipulations array
 */
exports.getApplicationOfferStipulationList = async (query, sort = { status_date: -1 }, populate = [], select = '', calculate = false) => {
    return await ApplicationOfferStipulation.find(query, null, { calculate })
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();
};

/**
 * Get a single application stipulation by ID
 * @param {String} id - The application stipulation ID
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @param {boolean} calculate - The calculate boolean
 * @returns {Object} The application stipulation object
 */
exports.getApplicationStipulationById = async (id, populate = [], select = '', calculate = false) => {
    Validators.checkValidateObjectId(id, 'application stipulation ID');

    const applicationStipulation = await ApplicationStipulation.findById(id, null, { calculate })
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(applicationStipulation, 'Application Stipulation');

    return applicationStipulation;
};

/**
 * Create a new application stipulation
 * @param {Object} data - The application stipulation data
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @param {boolean} calculate - The calculate boolean
 * @returns {Object} The application stipulation object
 */
exports.createApplicationStipulation = async (data, populate = [], select = '', calculate = false) => {
    // check if the stipulation type exists with this application
    const existingStipulation = await ApplicationStipulation.findOne({
        application: data.application,
        'stipulation_type.id': data.stipulation_type
    });

    Validators.ensureResourceNotExists(existingStipulation, 'Stipulation already exists in this application');

    if (data.stipulation_type) data.stipulation_type = await StipulationType.convertToEmbeddedFormat(data.stipulation_type);

    const applicationStipulation = await ApplicationStipulation.create(data);

    Validators.checkResourceCreated(applicationStipulation, 'Application Stipulation');

    return await this.getApplicationStipulationById(applicationStipulation._id, populate, select, calculate);
};

/**
 * Update an existing application stipulation
 * @param {String} id - The application stipulation ID
 * @param {Object} data - The application stipulation data
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @param {boolean} calculate - The calculate boolean
 * @returns {Object} The application stipulation object
 */
exports.updateApplicationStipulation = async (id, data, populate = [], select = '', calculate = false) => {
    Validators.checkValidateObjectId(id, 'application stipulation ID');

    // Update the application stipulation
    const updatedApplicationStipulation = await ApplicationStipulation.findByIdAndUpdate(id, data, { new: true, runValidators: true });

    Validators.checkResourceNotFound(updatedApplicationStipulation, 'Application Stipulation');

    return await this.getApplicationStipulationById(updatedApplicationStipulation._id, populate, select, calculate);
};

/**
 * Delete an application stipulation
 * @param {String} id - The application stipulation ID
 * @returns {Object} The deleted application stipulation object
 */
exports.deleteApplicationStipulation = async (id) => {
    Validators.checkValidateObjectId(id, 'application stipulation ID');

    const applicationStipulation = await ApplicationStipulation.findById(id);
    Validators.checkResourceNotFound(applicationStipulation, 'Application Stipulation');

    // Update application documents with this stipulation to null
    await ApplicationDocument.updateMany({ application_stipulation: id }, { application_stipulation: null });

    await ApplicationStipulation.findByIdAndDelete(id);

    return { message: 'Application Stipulation deleted successfully' };
};

/**
 * Bulk create application stipulations
 * @param {Array} data - Array of application stipulation data
 * @param {boolean} calculate - The calculate boolean
 * @returns {Array} The created application stipulations array
 */
exports.bulkCreateApplicationStipulations = async (data, populate = [], select = '', calculate = false) => {
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Stipulations data must be a non-empty array');
    }

    const createdStipulations = [];
    await Promise.all(data.map(async (item) => {
        const createdStipulation = await this.createApplicationStipulation(item, populate, select, calculate);
        createdStipulations.push(createdStipulation);
    }));

    return createdStipulations;
};
