const Joi = require('joi');
    
const ContactService = require('../services/contactService');
const ContactMerchantService = require('../services/contactMerchantService');

const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');

// Default populate for contact - enhanced to include merchant relationships
const default_populate = [
    { path: 'merchant_count' },
    { path: 'access_log_count' }
];

// Enhanced query schema for contacts based on user controller patterns
const query_schema = {
    sort: Joi.string().allow('').optional(),
    select: Joi.string().allow('').optional(),
    search: Joi.string().allow('').optional(),
    merchant: Joi.string().optional(),
    // Following query parameters are based on fields from contact model
    title: Joi.string().allow('').optional(),
    first_name: Joi.string().allow('').optional(),
    last_name: Joi.string().allow('').optional(),
    email: Joi.string().allow('').optional(),
    phone_mobile: Joi.string().allow('').optional(),
    phone_work: Joi.string().allow('').optional(),
    phone_home: Joi.string().allow('').optional(),
    ssn: Joi.string().allow('').optional(),
    fico_score_from: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    fico_score_to: Joi.alternatives().try(Joi.number(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    birthday_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    birthday_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    drivers_license_number: Joi.string().allow('').optional(),
    dln_issue_date_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    dln_issue_date_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    dln_issue_state: Joi.string().allow('').optional(),
    address_detail: Joi.string().allow('').optional(),
    last_login_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    last_login_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    online: Joi.boolean().optional(),
    include_inactive: Joi.boolean().default(false).optional(),
    createdAt_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    createdAt_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    updatedAt_from: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional(),
    updatedAt_to: Joi.alternatives().try(Joi.date(), Joi.string().valid('EMPTY', '-EMPTY')).optional()
};

// Enhanced buildDbQuery function based on user controller patterns
const buildDbQuery = async (req, query) => {
    const dbQuery = { $and: [] };

    // Add filter for different request portal
    // This is based on the req filters
    const merchantIds = await Helpers.getAccessableMerchantIds(req);

    if (merchantIds) {
        if (query.merchant) {
            if (merchantIds.includes(query.merchant)) {
                const contactIds = await ContactMerchantService.getContactsByMerchantIds(query.merchant);
                dbQuery.$and.push({ _id: { $in: contactIds } });
            } else {
                throw new ErrorResponse(`You are not allowed to access this merchant ${query.merchant}`, 403);
            }
        } else {
            const contactIds = await ContactMerchantService.getContactsByMerchantIds(merchantIds);
            dbQuery.$and.push({ _id: { $in: contactIds } });
        }
    } else if (query.merchant) {
        const contactIds = await ContactMerchantService.getContactsByMerchantIds(query.merchant);
        dbQuery.$and.push({ _id: { $in: contactIds } });
    }

    // Handle search using Helper method
    if (query.search) {
        dbQuery.$and.push(Helpers.buildSearchFilter([
            'title',
            'first_name',
            'last_name',
            'email',
            'phone_mobile',
            'phone_work',
            'phone_home',
            'drivers_license_number',
            'dln_issue_state',
            'address_detail.address_1',
            'address_detail.address_2',
            'address_detail.city',
            'address_detail.state',
            'address_detail.zip'
        ], query.search));
    }

    // Handle individual field filters using Helper methods
    if (query.title) dbQuery.$and.push(Helpers.buildSearchFilter('title', query.title));
    if (query.first_name) dbQuery.$and.push(Helpers.buildSearchFilter('first_name', query.first_name));
    if (query.last_name) dbQuery.$and.push(Helpers.buildSearchFilter('last_name', query.last_name));
    if (query.email) dbQuery.$and.push(Helpers.buildSearchFilter('email', query.email));
    if (query.phone_mobile) dbQuery.$and.push(Helpers.buildSearchFilter('phone_mobile', query.phone_mobile));
    if (query.phone_work) dbQuery.$and.push(Helpers.buildSearchFilter('phone_work', query.phone_work));
    if (query.phone_home) dbQuery.$and.push(Helpers.buildSearchFilter('phone_home', query.phone_home));
    if (query.ssn) dbQuery.$and.push(Helpers.buildSearchFilter('ssn', query.ssn));
    if (query.drivers_license_number) dbQuery.$and.push(Helpers.buildSearchFilter('drivers_license_number', query.drivers_license_number));
    if (query.dln_issue_state) dbQuery.$and.push(Helpers.buildSearchFilter('dln_issue_state', query.dln_issue_state));

    // Handle date range filters
    if (query.birthday_from) dbQuery.$and.push(Helpers.buildGTEFilter('birthday', query.birthday_from));
    if (query.birthday_to) dbQuery.$and.push(Helpers.buildLTEFilter('birthday', query.birthday_to));
    if (query.dln_issue_date_from) dbQuery.$and.push(Helpers.buildGTEFilter('dln_issue_date', query.dln_issue_date_from));
    if (query.dln_issue_date_to) dbQuery.$and.push(Helpers.buildLTEFilter('dln_issue_date', query.dln_issue_date_to));
    if (query.last_login_from) dbQuery.$and.push(Helpers.buildGTEFilter('last_login', query.last_login_from));
    if (query.last_login_to) dbQuery.$and.push(Helpers.buildLTEFilter('last_login', query.last_login_to));

    // Handle number range filters
    if (query.fico_score_from) dbQuery.$and.push(Helpers.buildGTEFilter('fico_score', query.fico_score_from));
    if (query.fico_score_to) dbQuery.$and.push(Helpers.buildLTEFilter('fico_score', query.fico_score_to));

    // Handle address search
    if (query.address_detail) {
        dbQuery.$and.push(Helpers.buildSearchFilter([
            'address_detail.address_1', 
            'address_detail.address_2', 
            'address_detail.city', 
            'address_detail.state', 
            'address_detail.zip'
        ], query.address_detail));
    }

    // Handle boolean filters
    if (query.online !== undefined) dbQuery.$and.push(Helpers.buildBooleanFilter('online', query.online));

    // Handle contact inactive filter (separate from contact-merchant inactive)
    if (!query.include_inactive) dbQuery.$and.push({ inactive: { $ne: true } });

    // Handle timestamp filters
    if (query.createdAt_from) dbQuery.$and.push(Helpers.buildGTEFilter('createdAt', query.createdAt_from));
    if (query.createdAt_to) dbQuery.$and.push(Helpers.buildLTEFilter('createdAt', query.createdAt_to));
    if (query.updatedAt_from) dbQuery.$and.push(Helpers.buildGTEFilter('updatedAt', query.updatedAt_from));
    if (query.updatedAt_to) dbQuery.$and.push(Helpers.buildLTEFilter('updatedAt', query.updatedAt_to));

    // Remove empty $and filters
    dbQuery.$and = dbQuery.$and.filter(item => Object.keys(item).length > 0);

    return dbQuery;
};

// @desc    Get all contacts
// @route   GET /api/v1/contacts
// @access  Private
exports.getContacts = async (req, res, next) => {
    try {
        const schema = Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).default(10),
            ...query_schema
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { page, limit, sort, select, ...query } = value;

        // Handle query
        const dbQuery = await buildDbQuery(req, query);

        // Handle sorting
        const dbSort = Helpers.buildSort(sort, { last_name: 1, first_name: 1 });

        const contacts = await ContactService.getContacts(dbQuery, dbSort, page, limit, default_populate, select);

        res.status(200).json({
            success: true,
            data: contacts
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get contact list without pagination
// @route   GET /api/v1/contacts/list
// @access  Private
exports.getContactList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            ...query_schema
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { sort, select, ...query } = value;

        // Handle query
        const dbQuery = await buildDbQuery(req, query);

        // Handle sorting
        const dbSort = Helpers.buildSort(sort, { last_name: 1, first_name: 1 });

        const contacts = await ContactService.getContactList(dbQuery, dbSort, [], select || 'first_name last_name email phone_mobile inactive');

        res.status(200).json({
            success: true,
            data: contacts
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get current logged in contact
// @route   GET /api/v1/contacts/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const contact = await ContactService.getContactById(req.id, default_populate);

        res.status(200).json({
            success: true,
            data: contact
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update contact details
// @route   PUT /api/v1/contacts/updatedetails
// @access  Private
exports.updateDetails = async (req, res, next) => {
    try {
        const schema = Joi.object({
            title: Joi.string().optional(),
            first_name: Joi.string().optional(),
            last_name: Joi.string().optional(),
            email: Joi.string().email().optional(),
            phone_mobile: Joi.string().optional(),
            phone_work: Joi.string().optional(),
            phone_home: Joi.string().optional(),
            birthday: Joi.date().optional(),
            address_detail: Joi.any().optional(),
            inactive: Joi.boolean().optional()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const contact = await ContactService.updateContact(req.id, value);

        res.status(200).json({
            success: true,
            data: contact
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update password
// @route   PUT /api/v1/contacts/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
    try {
        const schema = Joi.object({
            currentPassword: Joi.string().required(),
            newPassword: Joi.string().required()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const contact = await ContactService.getContactById(req.id, [], '+password', false);  // Include password, but don't populate

        // Check current password
        if (!(await contact.matchPassword(value.currentPassword))) {
            return next(new ErrorResponse('Password is incorrect', 400));
        }

        await ContactService.updateContactPassword(req.id, value.newPassword);

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single contact
// @route   GET /api/v1/contacts/:id
// @access  Private
exports.getContact = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }
        
        // Check if contact is himself or if contact is accessible through merchant relationships
        if (req.id !== value.id) {
            const merchantIds = await Helpers.getAccessableMerchantIds(req);

            if (merchantIds.length > 0) {
                const contacts = await ContactMerchantService.getContactsByMerchantIds(merchantIds);
                if (!contacts.includes(value.id)) {
                    return next(new ErrorResponse('Contact is not allowed to be accessed with current login', 403));
                }
            } else {
                throw new ErrorResponse('You do not have permission to access any contact', 403);
            }
        }

        const contact = await ContactService.getContactById(value.id, default_populate);

        if (!contact) {
            return next(
                new ErrorResponse(`Contact not found with id of ${value.id}`, 404)
            );
        }

        res.status(200).json({
            success: true,
            data: contact
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new contact
// @route   POST /api/v1/contacts
// @access  Private
exports.createContact = async (req, res, next) => {
    try {
        const schema = Joi.object({
            title: Joi.string().optional(),
            first_name: Joi.string().required(),
            last_name: Joi.string().required(),
            email: Joi.string().email().required(),
            phone_mobile: Joi.string().required(),
            phone_work: Joi.string().allow('').optional(),
            phone_home: Joi.string().allow('').optional(),
            ssn: Joi.string().allow('').optional(),
            fico_score: Joi.number().optional(),
            birthday: Joi.date().optional(),
            drivers_license_number: Joi.string().allow('').optional(),
            dln_issue_date: Joi.date().optional(),
            dln_issue_state: Joi.string().allow('').optional(),
            address_detail: Joi.any().optional(),
            password: Joi.string().required(),
            merchant_list: Joi.array().items(Joi.object({
                merchant: Joi.string().required(),
                owner: Joi.boolean().optional(),
                ownership_percentage: Joi.number().min(0).max(100).optional()
            })).optional()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { merchant_list, ...data } = value;

        const merchantIds = await Helpers.getAccessableMerchantIds(req);

        if (merchantIds && merchant_list) {
            const requestedMerchants = merchant_list.map(item => item.merchant);
            if (requestedMerchants.some(merchant => !merchantIds.includes(merchant))) {
                return next(new ErrorResponse('You do not have permission to create a contact for one of the merchants', 403));
            }
        }

        const contact = await ContactService.createContact(data);

        if (contact && merchant_list && merchant_list.length > 0) {
            // Update contact-merchant relationships with details
            const merchantIds = merchant_list.map(item => item.merchant);
            await ContactMerchantService.updateContactMerchantList(contact._id, merchantIds);
            
            // Update individual contact-merchant records with specific details
            for (const merchantItem of merchant_list) {
                const details = {};
                if (merchantItem.owner !== undefined) details.owner = merchantItem.owner;
                if (merchantItem.ownership_percentage !== undefined) details.ownership_percentage = merchantItem.ownership_percentage;
                
                if (Object.keys(details).length > 0) {
                    await ContactMerchantService.updateContactMerchant(contact._id, merchantItem.merchant, details);
                }
            }
        }

        const createdContact = await ContactService.getContactById(contact._id, default_populate);

        res.status(201).json({
            success: true,
            data: createdContact
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update contact
// @route   PUT /api/v1/contacts/:id
// @access  Private
exports.updateContact = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            title: Joi.string().optional(),
            first_name: Joi.string().optional(),
            last_name: Joi.string().optional(),
            email: Joi.string().email().optional(),
            phone_mobile: Joi.string().allow('').optional(),
            phone_work: Joi.string().allow('').optional(),
            phone_home: Joi.string().allow('').optional(),
            ssn: Joi.string().allow('').optional(),
            fico_score: Joi.number().optional(),
            birthday: Joi.date().optional(),
            drivers_license_number: Joi.string().allow('').optional(),
            dln_issue_date: Joi.date().optional(),
            dln_issue_state: Joi.string().allow('').optional(),
            address_detail: Joi.any().optional(),
            inactive: Joi.boolean().optional(),
            merchant_list: Joi.array().items(Joi.object({
                merchant: Joi.string().required(),
                owner: Joi.boolean().optional(),
                ownership_percentage: Joi.number().min(0).max(100).optional()
            })).optional()
        });

        // Combine params and body for validation
        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, merchant_list, ...data } = value;

        const merchantIds = await Helpers.getAccessableMerchantIds(req);

        if (merchantIds.length > 0) {
            const contacts = await ContactMerchantService.getContactsByMerchantIds(merchantIds);
            if (!contacts.includes(id)) {
                return next(new ErrorResponse(`Access denied: You are not authorized to update this contact with ID ${id}.`, 403));
            }
        }

        // Validate merchant access for new merchant_list
        if (merchant_list) {
            const requestedMerchants = merchant_list.map(item => item.merchant);
            if (requestedMerchants.some(merchant => !merchantIds.includes(merchant))) {
                return next(new ErrorResponse('You do not have permission to assign this contact to one of the merchants', 403));
            }
        }

        const contact = await ContactService.updateContact(id, data);

        if (!contact) {
            return next(
                new ErrorResponse(`Contact not found with id of ${id}`, 404)
            );
        }

        if (merchant_list && merchant_list.length > 0) {
            // Update contact-merchant relationships with details
            const merchantIds = merchant_list.map(item => item.merchant);
            await ContactMerchantService.updateContactMerchantList(id, merchantIds);
            
            // Update individual contact-merchant records with specific details
            for (const merchantItem of merchant_list) {
                const details = {};
                if (merchantItem.owner !== undefined) details.owner = merchantItem.owner;
                if (merchantItem.ownership_percentage !== undefined) details.ownership_percentage = merchantItem.ownership_percentage;
                
                if (Object.keys(details).length > 0) {
                    await ContactMerchantService.updateContactMerchant(id, merchantItem.merchant, details);
                }
            }
        }

        const updatedContact = await ContactService.getContactById(id, default_populate);

        res.status(200).json({
            success: true,
            data: updatedContact
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete contact
// @route   DELETE /api/v1/contacts/:id
// @access  Private
exports.deleteContact = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id } = value;

        const merchantIds = await Helpers.getAccessableMerchantIds(req);
        
        if (merchantIds.length > 0) {
            const contacts = await ContactMerchantService.getContactsByMerchantIds(merchantIds);
            if (!contacts.includes(id)) {
                return next(new ErrorResponse(`Access denied: You are not authorized to delete this contact with ID ${id}.`, 403));
            }
        }

        await ContactService.deleteContact(id);

        res.status(200).json({
            success: true,
            message: 'Contact deleted successfully'
        });
    } catch (err) {
        next(err);
    }
};
