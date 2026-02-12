const Application = require('../models/Application');
const { APPLICATION_STIPULATION_STATUS } = require('../utils/constants');

const ApplicationStatus = require('../models/ApplicationStatus');
const Funder = require('../models/Funder');
const Merchant = require('../models/Merchant');
const ISO = require('../models/ISO');
const Contact = require('../models/Contact');
const Representative = require('../models/Representative');
const User = require('../models/User');

const ApplicationHistoryService = require('../services/applicationHistoryService');
const ApplicationStipulationService = require('../services/applicationStipulationService');
const StipulationTypeService = require('../services/stipulationTypeService');

const Validators = require('../utils/validators');
const { centsToDollars, dollarsToCents } = require('../utils/helpers');
const ApplicationOffer = require('../models/ApplicationOffer');

/**
 * Format the funder account data to apply setters manually (needed when using lean())
 * @param {Object} funderAccount - The funder account
 * @returns {Object} - The formatted funder account
 */
const formatDataBeforeReturn = (application) => {
    application.request_amount = centsToDollars(application.request_amount) || undefined;
    return application;
};

/**
 * Format the funder account data to apply setters manually (needed when using lean())
 * @param {Object} funderAccount - The funder account
 * @returns {Object} - The formatted funder account
 */
const formatDataBeforeSave = async (application) => {
    application.request_amount = dollarsToCents(application.request_amount) || undefined;

    if (application.follower_list) {
        if (application.assigned_manager && !application.follower_list.includes(application.assigned_manager)) {
            application.follower_list.push(application.assigned_manager);  
        }
        if (application.assigned_user && !application.follower_list.includes(application.assigned_user)) {
            application.follower_list.push(application.assigned_user); 
        }
    }


    const conversions = await Promise.all([
        application.funder ? Funder.convertToEmbeddedFormat(application.funder) : Promise.resolve(null),
        application.merchant ? Merchant.convertToEmbeddedFormat(application.merchant) : Promise.resolve(null),
        application.iso ? ISO.convertToEmbeddedFormat(application.iso) : Promise.resolve(null),
        application.contact ? Contact.convertToEmbeddedFormat(application.contact) : Promise.resolve(null),
        application.representative ? Representative.convertToEmbeddedFormat(application.representative) : Promise.resolve(null),
        application.assigned_manager ? User.convertToEmbeddedFormat(application.assigned_manager) : Promise.resolve(null),
        application.assigned_user ? User.convertToEmbeddedFormat(application.assigned_user) : Promise.resolve(null),
        application.status ? ApplicationStatus.convertToEmbeddedFormat(application.status) : Promise.resolve(null)
    ]);

    // Assign converted values back to applicationData
    if (application.funder) application.funder = conversions[0];
    if (application.merchant) application.merchant = conversions[1];
    if (application.iso) application.iso = conversions[2];
    if (application.contact) application.contact = conversions[3];
    if (application.representative) application.representative = conversions[4];
    if (application.assigned_manager) application.assigned_manager = conversions[5];
    if (application.assigned_user) application.assigned_user = conversions[6];
    if (application.status) application.status = conversions[7];

    if (application.status?.closed) {
        application.closed = true;
    }

    return application;
};

/**
 * Get applications with query, pagination and sort
 * @param {Object} query - The query object
 * @param {Number} page - The page number
 * @param {Number} limit - The limit number
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Object} The applications object
 */
exports.getApplications = async (query, page = 1, limit = 10, sort = { status_date: -1 }, populate = [], select = '') => {
    // Get applications with pagination
    const skip = (page - 1) * limit;

    const [applications, count] = await Promise.all([
        Application.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate(populate)
            .select(select)
            .lean(),
        Application.countDocuments(query)
    ]);

    return {
        docs: applications.map(formatDataBeforeReturn),
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get application list without pagination  
 * @param {Object} query - The query object
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Object} The applications object
 */
exports.getApplicationList = async (query, sort = { status_date: -1 }, populate = [], select = '') => {
    const applications = await Application.find(query)
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();

    return applications.map(formatDataBeforeReturn);
};

/**
 * Get a single application by ID
 * @param {String} id - The application ID
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Object} The application object
 */
exports.getApplicationById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'application ID');

    const application = await Application.findById(id)
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(application, 'Application');

    return formatDataBeforeReturn(application);
};

/**
 * Get a single application Offer by ID
 * @param {String} id - The application ID
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Object} The application object
 */
exports.getApplicationOfferById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'application offer ID');

    const application = await ApplicationOffer.findById(id)
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(application, 'Application Offer');

    return formatDataBeforeReturn(application);
};

/**
 * Create a new application
 * @param {Object} data - The application data
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Object} The application object
 */
exports.createApplication = async (data, populate = [], select = '') => {
    // Make sure follower_list is an array, and assigned_manager and assigned_user are added to it
    if (data.follower_list === undefined || data.follower_list === null) {
        data.follower_list = []; 
    }

    const application = await Application.create(await formatDataBeforeSave(data));

    Validators.checkResourceNotFound(application, 'Application');

    try {
        // Create default required stipulations
        const requiredStipulations = await StipulationTypeService.getStipulationTypesList({ funder: application.funder.id, required: true, inactive: {$ne: true}} );
        await Promise.all(requiredStipulations.map(stipulation => ApplicationStipulationService.createApplicationStipulation({
            application: application._id,
            stipulation_type: stipulation._id,
            status: APPLICATION_STIPULATION_STATUS.REQUESTED
        })));
    } catch (error) {
        console.error('❌ Error creating default required stipulations:', error);
    }

    try {
        // Create application history record
        await ApplicationHistoryService.createApplicationHistory({
            application: application._id,
            status: application.status,
            assigned_manager: application.assigned_manager,
            assigned_user: application.assigned_user,
            assigned_timestamp: Date.now(),
            note: 'Application created'
        });
    } catch (error) {
        console.error('❌ Error creating application history record:', error);
    }

    return await this.getApplicationById(application._id, populate, select);
};

/**
 * Update an existing application
 * @param {String} id - The application ID
 * @param {Object} data - The application data
 * @param {Array} populate - The populate array
 * @param {String} select - The select string
 * @returns {Object} The application object
 */
exports.updateApplication = async (id, data, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'application ID');

    const application = await Application.findById(id);

    Validators.checkResourceNotFound(application, 'Application');

    // Check if status changed
    const statusChanged = data.status && application.status.id?.toString() !== data.status;
    const assigneeChanged = (data.assigned_user && data.assigned_user !== application.assigned_user?.id?.toString()) || 
        (data.assigned_manager && data.assigned_manager !== application.assigned_manager?.id?.toString());

    if (statusChanged || assigneeChanged) {
        data.status_date = Date.now();
    }

    // If assignee changed, make sure follower_list is in the updated data
    if ( assigneeChanged ) {
        if (data.follower_list === undefined || data.follower_list === null) {
            data.follower_list = application.follower_list;
        }
    }
    
    // Update application
    const updatedApplication = await Application.findByIdAndUpdate(id, await formatDataBeforeSave(data), {
        new: true,
        runValidators: true
    });

    try {
        // Create history record if status or assignee changed
        if (statusChanged || assigneeChanged) {
            await ApplicationHistoryService.createApplicationHistory({
                application: application._id,
                status: data.status || application.status,
                assigned_manager: data.assigned_manager || application.assigned_manager,
                assigned_user: data.assigned_user || application.assigned_user,
                assigned_timestamp: data.status_date || Date.now(),
                note: 'Application updated'
            });
        }
    } catch (error) {
        console.error('❌ Error creating application history record:', error);
    }

    return await this.getApplicationById(updatedApplication._id, populate, select);
};

/**
 * Delete an application by ID
 * @param {String} id - The application ID
 * @returns {Object} The success object
 */
exports.deleteApplication = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'application ID');

    const application = await Application.findById(id);

    Validators.checkResourceNotFound(application, 'Application');

    // Instead of deleting, we'll just set the inactive flag to true
    application.inactive = true;
    await application.save();

    return await this.getApplicationById(id, populate, select);
};