const mongoose = require('mongoose');

const Contact = require('../models/Contact');
const ContactAccessLog = require('../models/ContactAccessLog');

const ErrorResponse = require('../utils/errorResponse');
const { PORTAL_OPERATIONS } = require('../utils/constants');
const Validators = require('../utils/validators');

/**
 * Login an contact
 */
exports.loginContact = async (email, password, ipAddress) => {
    const contact = await Contact.findOne({ email }).select('+password');

    if (!contact) {
        throw new ErrorResponse('Invalid email or password', 401);
    }

    if (contact.inactive) {
        throw new ErrorResponse('Contact is inactive', 401);
    }

    const isMatch = await contact.matchPassword(password);

    if (!isMatch) {
        throw new ErrorResponse('Invalid email or password', 401);
    }

    // Once the admin is logged in, we need to update the last login date and record the login in the access log
    contact.last_login = Date.now();
    contact.online = true;
    await contact.save();

    // Record the login in the access log
    const contactAccessLog = new ContactAccessLog({
        contact: contact._id,
        operation: PORTAL_OPERATIONS.LOGIN,
        access_date: Date.now(),
        ip_address: ipAddress
    });
    await contactAccessLog.save();

    return contact;
};  

/**
 * Logout an contact
 */
exports.logoutContact = async (id, ipAddress) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ErrorResponse(`Invalid contact id: ${id}`, 400);
    }

    const contact = await Contact.findById(id);
    
    if (!contact) {
        throw new ErrorResponse(`contact not found with id of ${id}`, 404);
    }

    // Record the logout in the access log
    const contactAccessLog = new ContactAccessLog({
        contact: contact._id,
        operation: PORTAL_OPERATIONS.LOGOUT,
        access_date: Date.now(),
        ip_address: ipAddress
    });
    await contactAccessLog.save();

    // Update the contact's online status
    contact.online = false;
    await contact.save();

    return contact;
};


/**
 * Get all contacts with filtering and pagination
 */
exports.getContacts = async (query, sort = { last_name: 1, first_name: 1 }, page = 1, limit = 10, populate = [], select = '') => {
    // Get contacts with pagination
    const skip = (page - 1) * limit;
    
    const [contacts, count] = await Promise.all([
        Contact.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate(populate)
            .select(select)
            .lean(),
        Contact.countDocuments(query)
    ]);
    
    return {
        docs: contacts,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of contacts without pagination
 */
exports.getContactList = async (query, sort = { last_name: 1, first_name: 1 }, populate = [], select = '') => {
    return await Contact.find(query)
        .select(select)
        .sort(sort)
        .populate(populate)
        .lean();
};


/**
 * Get a contact by id
 */
exports.getContactById = async (id, populate = [], select = '', lean = true) => {
    Validators.checkValidateObjectId(id, 'Contact ID');

    let query = Contact.findById(id)
        .populate(populate)
        .select(select);

    if (lean) query = query.lean();

    const contact = await query;

    Validators.checkResourceNotFound(contact, 'Contact');

    return contact;
};


/**
 * Create a contact
 */
exports.createContact = async (data, populate = [], select = '') => {
    // Check if contact with this email already exists
    const existingContact = await Contact.findOne({ email: data.email });
    
    if (existingContact) {
        throw new ErrorResponse(`Contact already exists with email ${data.email}`, 400);
    }
        
    // Create the contact
    const contact = await Contact.create(data);

    if (!contact) {
        throw new ErrorResponse('Failed to create contact', 500);
    }

    return await this.getContactById(contact._id, populate, select);
};

/**
 * Update a contact
 */
exports.updateContact = async (id, data, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'Contact ID');

    const contact = await Contact.findByIdAndUpdate(id, data, { new: true });

    return await this.getContactById(contact._id, populate, select);
};

/**
 * Update the password of an contact
 */
exports.updateContactPassword = async (id, password) => {
    Validators.checkValidateObjectId(id, 'Contact ID');

    const contact = await Contact.findById(id);
    
    Validators.checkResourceNotFound(contact, 'Contact');
    
    contact.password = password;
    await contact.save();
};

/**
 * Delete a contact
 */
exports.deleteContact = async (id) => {
    Validators.checkValidateObjectId(id, 'Contact ID');

    const contact = await Contact.findByIdAndUpdate(id, { inactive: true }, { new: true });

    if (!contact) {
        throw new ErrorResponse(`Contact not found with id of ${id}`, 404);
    }

    return {
        success: true,
        message: 'Contact deleted successfully'
    };
};