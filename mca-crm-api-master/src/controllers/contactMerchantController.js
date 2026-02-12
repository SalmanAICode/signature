const Joi = require('joi');

const ContactMerchantService = require('../services/contactMerchantService');

const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');

const default_merchant_populate = [
    { path: 'merchant', select: 'name dba_name email phone inactive' }
];

const default_contact_populate = [
    { path: 'contact', select: 'first_name last_name email phone_mobile inactive' }
];

//TODO: Add query schema and build db query
// Notice: Need to add filter for merchant and contact

// @desc    Get merchant of a contact (with pagination)
// @route   GET /api/v1/contacts/:id/merchants
// @access  Private
exports.getContactMerchants = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            include_inactive: Joi.boolean().optional(),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).default(25),
            owner: Joi.boolean().optional(),
            sort: Joi.string().allow('').optional()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.query });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, page, limit, sort, ...query } = value;

        let dbQuery = {};
        dbQuery.contact = id;

        // Handle include_inactive
        if (!query.include_inactive) {
            dbQuery.inactive = { $ne: true };
        }

        if (query.owner !== undefined) {
            dbQuery.owner = query.owner;
        }

        // Handle sort
        const dbSort = Helpers.buildSort(sort, { merchant: 1 });

        const result = await ContactMerchantService.getContactMerchants(dbQuery, page, limit, dbSort, default_merchant_populate, '-contact');

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        next(err);
    }
};

// @desc    List all merchants of a contact (without pagination)
// @route   GET /api/v1/contacts/:id/merchants/list
// @access  Private
exports.getContactMerchantsList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            include_inactive: Joi.boolean().default(false).optional(),
            sort: Joi.string().allow('').optional()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.query });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, sort, ...query } = value;

        let dbQuery = {};
        dbQuery.contact = id;

        if (!query.include_inactive) {
            dbQuery.inactive = { $ne: true };
        }

        const dbSort = Helpers.buildSort(sort, { merchant: 1 });

        const result = await ContactMerchantService.getContactMerchantList(dbQuery, dbSort, default_merchant_populate, '-contact');

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Add a merchant to a contact
// @route   POST /api/v1/contacts/:id/merchants
// @access  Private
exports.createContactMerchant = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            merchant: Joi.string().required(),
            owner: Joi.boolean().default(false).optional(),
            ownership_percentage: Joi.number().min(0).max(100).optional()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, merchant, ...data } = value;

        if (req.filter?.merchant_list) {
            if (!req.filter.merchant_list.includes(merchant)) {
                return next(new ErrorResponse('Merchant is not allowed to be accessed with current login', 403));
            }
        }

        const contactMerchant = await ContactMerchantService.createContactMerchant(id, merchant, data, default_merchant_populate, '-contact');

        res.status(201).json({
            success: true,
            data: contactMerchant
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update a merchant of a contact
// @route   PUT /api/v1/contacts/:id/merchants/:merchantId
// @access  Private
exports.updateContactMerchant = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            merchantId: Joi.string().required(),
            owner: Joi.boolean().optional(),
            ownership_percentage: Joi.number().min(0).max(100).optional(),
            inactive: Joi.boolean().optional()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, merchantId, ...data } = value;

        const contactMerchant = await ContactMerchantService.updateContactMerchant(id, merchantId, data, default_merchant_populate, '-contact');

        res.status(200).json({
            success: true,
            data: contactMerchant
        });
    } catch (err) {
        next(err);
    }
};


// @desc    Remove a merchant from a contact
// @route   DELETE /api/v1/contacts/:id/merchants/:merchantId
// @access  Private
exports.deleteContactMerchant = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            merchantId: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, merchantId } = value;

        if (req.filter?.merchant_list) {
            if (!req.filter.merchant_list.includes(merchantId)) {
                return next(new ErrorResponse('Merchant is not allowed to be accessed with current login', 403));
            }
        }

        const contactMerchant = await ContactMerchantService.deleteContactMerchant(id, merchantId, default_merchant_populate, '-contact');

        res.status(200).json({
            success: true,
            message: 'Merchant removed from contact successfully',
            data: contactMerchant
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get contact of a merchant (with pagination)
// @route   GET /api/v1/merchants/:id/contacts
// @access  Private
exports.getMerchantContacts = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            include_inactive: Joi.boolean().default(false).optional(),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).default(25),
            sort: Joi.string().allow('').optional(),
            owner: Joi.boolean().optional()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.query });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, page, limit, sort, ...query } = value;

        // Handle filter
        if (req.filter?.merchant_list) {
            if (!req.filter.merchant_list.includes(id)) {
                return next(new ErrorResponse('Merchant is not allowed to be accessed with current login', 403));
            }
        }

        let dbQuery = {};
        dbQuery.merchant = id;

        // Handle include_inactive
        if (!query.include_inactive) {
            dbQuery.inactive = { $ne: true };
        }

        if (query.owner !== undefined) {
            dbQuery.owner = query.owner;
        }

        // Handle sort
        const dbSort = Helpers.buildSort(sort, { contact: 1 });

        const result = await ContactMerchantService.getContactMerchants(
            dbQuery,
            page,
            limit,
            dbSort,
            default_contact_populate,
            '-merchant'
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        next(err);
    }
};

// @desc    List all contacts of a merchant (without pagination)
// @route   GET /api/v1/merchants/:id/contacts/list
// @access  Private
exports.getMerchantContactsList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            include_inactive: Joi.boolean().default(false).optional(),
            sort: Joi.string().allow('').optional()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.query });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, sort, ...query } = value;

        // Handle filter
        if (req.filter?.merchant_list) {
            if (!req.filter.merchant_list.includes(id)) {
                return next(new ErrorResponse('Merchant is not allowed to be accessed with current login', 403));
            }
        }

        let dbQuery = {};
        dbQuery.merchant = id;

        // Handle include_inactive
        if (!query.include_inactive) {
            dbQuery.inactive = { $ne: true };
        }

        const dbSort = Helpers.buildSort(sort, { contact: 1 });

        const result = await ContactMerchantService.getContactMerchantList(dbQuery, dbSort, default_contact_populate, '-merchant');

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Add a contact to a merchant
// @route   POST /api/v1/merchants/:id/contacts
// @access  Private
exports.createMerchantContact = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            contact: Joi.string().required(),
            owner: Joi.boolean().default(false).optional(),
            ownership_percentage: Joi.number().min(0).max(100).optional()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, contact, ...data } = value;

        if (req.filter?.merchant_list) {
            if (!req.filter.merchant_list.includes(id)) {
                return next(new ErrorResponse('Merchant is not allowed to be accessed with current login', 403));
            }
        }

        const merchantContact = await ContactMerchantService.createContactMerchant(contact, id, data, default_contact_populate, '-merchant');

        res.status(201).json({
            success: true,
            data: merchantContact
        });
        
    } catch (err) {
        next(err);
    }
};

// @desc    Update a contact of a merchant
// @route   PUT /api/v1/merchants/:id/contacts/:contactId
// @access  Private
exports.updateMerchantContact = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            contactId: Joi.string().required(),
            owner: Joi.boolean().optional(),
            ownership_percentage: Joi.number().min(0).max(100).optional(),
            inactive: Joi.boolean().optional()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, contactId, ...data } = value;

        if (req.filter?.merchant_list) {
            if (!req.filter.merchant_list.includes(id)) {
                return next(new ErrorResponse('Merchant is not allowed to be accessed with current login', 403));
            }
        }

        const merchantContact = await ContactMerchantService.updateContactMerchant(contactId, id, data, default_contact_populate, '-merchant');

        res.status(200).json({
            success: true,
            data: merchantContact
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Remove a contact from a merchant
// @route   DELETE /api/v1/merchants/:id/contacts/:contactId
// @access  Private
exports.deleteMerchantContact = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            contactId: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);
        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, contactId } = value;

        if (req.filter?.merchant_list) {
            if (!req.filter.merchant_list.includes(id)) {
                return next(new ErrorResponse('Merchant is not allowed to be accessed with current login', 403));
            }
        }

        const merchantContact = await ContactMerchantService.deleteContactMerchant(contactId, id, default_contact_populate, '-merchant');

        res.status(200).json({
            success: true,
            message: 'Contact removed from merchant successfully',
            data: merchantContact
        });
    } catch (err) {
        next(err);
    }
};