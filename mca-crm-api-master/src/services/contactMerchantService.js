const ContactMerchant = require('../models/ContactMerchant');

const Validators = require('../utils/validators');


/**
 * Get all Contacts associated with a merchant
 * @param {string} merchantId - The ID of the merchant
 * @returns {Promise<Array>} - An array of contacts
 */
exports.getContactsByMerchantId = async (merchantId) => {
    const contacts = await ContactMerchant.find({ merchant: merchantId });
    const uniqueContacts = [...new Set(contacts.map(contact => contact.contact.toString()))];
    return uniqueContacts;
};

/**
 * Get all Contacts associated with a list of merchants
 * @param {Array} merchantIds - An array of merchant IDs
 * @returns {Promise<Array>} - An array of contact IDs
 */
exports.getContactsByMerchantIds = async (merchantIds) => {
    const contacts = await ContactMerchant.find({ merchant: { $in: merchantIds } });
    const uniqueContacts = [...new Set(contacts.map(contact => contact.contact.toString()))];
    return uniqueContacts;
};

/**
 * Get all merchants associated with a contact
 * @param {string} contactId - The ID of the contact
 * @returns {Promise<Array>} - An array of merchant IDs
 */
exports.getMerchantsByContactId = async (contactId) => {
    const merchants = await ContactMerchant.find({ contact: contactId });
    const uniqueMerchants = [...new Set(merchants.map(merchant => merchant.merchant.toString()))];
    return uniqueMerchants;
};

/**
 * Get all merchants associated with a list of contacts
 * @param {Array} contactIds - An array of contact IDs
 * @returns {Promise<Array>} - An array of merchant IDs
 */
exports.getMerchantsByContactIds = async (contactIds) => {
    const merchants = await ContactMerchant.find({ contact: { $in: contactIds } });
    const uniqueMerchants = [...new Set(merchants.map(merchant => merchant.merchant.toString()))];
    return uniqueMerchants;
};



/**
 * Get a contact-merchant by ID
 * @param {string} id - The ID of the contact-merchant
 * @param {Array} populate - The populate of the contact-merchant
 * @param {string} select - The select of the contact-merchant
 * @returns {Promise<Object>} - The contact-merchant
 */
exports.getContactMerchantById = async (id, populate = [], select = '') => {
    const contactMerchant = await ContactMerchant.findById(id)
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(contactMerchant, `Contact-merchant with id ${id}`);

    return contactMerchant;
};


/**
 * Get all contact-merchant
 * @param {Object} query - The query of the contact-merchant
 * @param {number} page - The page of the contact-merchant
 * @param {number} limit - The limit of the contact-merchant
 * @param {Object} sort - The sort of the contact-merchant
 * @returns {Promise<Object>} - The contact-merchant
 */
exports.getContactMerchants = async (query, page = 1, limit = 10, sort = {}, populate = [], select = '') => {
    const skip = (page - 1) * limit;
    const [contactMerchant, count] = await Promise.all([
        ContactMerchant.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        ContactMerchant.countDocuments(query)
    ]);
    return {
        docs: contactMerchant,
        pagination: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit)
        }
    };
};

/**
 * Get a list of contact-merchant with pagination
 * @param {Object} query - The query of the contact-merchant
 * @param {Array} populate - The populate of the contact-merchant
 * @param {string} select - The select of the contact-merchant
 * @param {Object} sort - The sort of the contact-merchant
 * @returns {Promise<Object>} - The contact-merchant
 */
exports.getContactMerchantList = async (query, sort = {}, populate = [], select = '') => {
    return ContactMerchant.find(query)
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();
};

/**
 * Create a new contact-merchant
 * @param {Object} data - The data of the contact-merchant
 * @returns {Promise<Object>} - The created contact-merchant
 */
exports.createContactMerchant = async (contact, merchant, data, populate = [], select = '') => {
    let contactMerchant = await ContactMerchant.findOne({ merchant, contact });
    if (!contactMerchant) {
        contactMerchant = await ContactMerchant.create({ merchant, contact, ...data });
    } else {
        contactMerchant = await ContactMerchant.findOneAndUpdate({ _id: contactMerchant._id }, { $set: data }, { new: true });
    }

    Validators.checkResourceNotFound(contactMerchant, `Contact-merchant with contact ${contact} and merchant ${merchant}`);

    return await this.getContactMerchantById(contactMerchant._id, populate, select);
};

/**
 * Update a contact-merchant
 * @param {string} merchant - The ID of the merchant
 * @param {string} contact - The ID of the contact
 * @param {Object} data - The data of the contact-merchant
 * @returns {Promise<Object>} - The updated contact-merchant
 */
exports.updateContactMerchant = async (contact, merchant, data, populate = [], select = '') => {
    const contactMerchant = await ContactMerchant.findOneAndUpdate({ contact, merchant }, { $set: data }, { new: true });

    Validators.checkResourceNotFound(contactMerchant, `Contact-merchant with merchant ${merchant} and contact ${contact}`);

    return await this.getContactMerchantById(contactMerchant._id, populate, select);
};

/**
 * Delete a contact-merchant
 * @param {string} merchant - The ID of the merchant
 * @param {string} contact - The ID of the contact
 * @returns {Promise<Object>} - The deleted contact-merchant
 */
exports.deleteContactMerchant = async (contact, merchant, populate = [], select = '') => {
    Validators
        .checkValidateObjectId(merchant, 'merchant ID')
        .checkValidateObjectId(contact, 'contact ID');

    const contactMerchant = await ContactMerchant.findOneAndUpdate({ contact, merchant }, { $set: { inactive: true } }, { new: true });

    Validators.checkResourceNotFound(contactMerchant, `Contact-merchant with merchant ${merchant} and contact ${contact}`);

    return await this.getContactMerchantById(contactMerchant._id, populate, select);
};


/**
 * Update the merchant list of a contact
 * @param {string} contact - The ID of the contact
 * @param {Array} merchantList - The list of merchant IDs
 * @returns {Promise<Object>} - The updated contact-merchant
 */
exports.updateContactMerchantList = async (contact, merchantList, populate = [], select = '') => {
    await ContactMerchant.deleteMany({ contact, merchant: { $nin: merchantList } });
    
    const existingMerchants = await ContactMerchant.find({ contact: contact }).select('merchant').lean();
    const existingMerchantIds = existingMerchants.map(merchant => merchant.merchant.toString());
    
    const newMerchants = merchantList.filter(merchant => !existingMerchantIds.includes(merchant));
    
    await Promise.all(newMerchants.map(merchant => this.createContactMerchant(contact, merchant, {}, populate, select)));
};

/**
 * Update the contact list of a merchant
 * @param {string} merchant - The ID of the merchant
 * @param {Array} contactList - The list of contact IDs
 * @returns {Promise<Object>} - The updated merchant-contact
 */
exports.updateMerchantContactList = async (merchant, contactList, populate = [], select = '') => {
    await ContactMerchant.deleteMany({ merchant, contact: { $nin: contactList } });

    const existingContacts = await ContactMerchant.find({ merchant: merchant }).select('contact').lean();
    const existingContactIds = existingContacts.map(contact => contact.contact.toString());
    
    const newContacts = contactList.filter(contact => !existingContactIds.includes(contact));

    await Promise.all(newContacts.map(contact => this.createContactMerchant(contact, merchant, {}, populate, select)));
};
