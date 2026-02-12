const Syndicator = require('../models/Syndicator');

const SyndicatorAccessLog = require('../models/SyndicatorAccessLog');

const ErrorResponse = require('../utils/errorResponse');
const Validators = require('../utils/validators');
const { PORTAL_OPERATIONS } = require('../utils/constants');

const { centsToDollars } = require('../utils/helpers');

/**
 * Format the syndicator data to apply setters manually (needed when using lean())
 * @param {Object} syndicator - The syndicator
 * @returns {Object} - The formatted syndicator
 */
const formatDataBeforeReturn = (syndicator) => {
    syndicator.total_available_balance = centsToDollars(syndicator.total_available_balance) || 0;
    syndicator.syndication_offer_amount = centsToDollars(syndicator.syndication_offer_amount);
    syndicator.pending_syndication_offer_amount = centsToDollars(syndicator.pending_syndication_offer_amount) || 0;
    syndicator.accepted_syndication_offer_amount = centsToDollars(syndicator.accepted_syndication_offer_amount) || 0;
    syndicator.declined_syndication_offer_amount = centsToDollars(syndicator.declined_syndication_offer_amount) || 0;
    syndicator.cancelled_syndication_offer_amount = centsToDollars(syndicator.cancelled_syndication_offer_amount) || 0;
    syndicator.syndication_amount = centsToDollars(syndicator.syndication_amount) || 0;
    syndicator.active_syndication_amount = centsToDollars(syndicator.active_syndication_amount) || 0;
    syndicator.closed_syndication_amount = centsToDollars(syndicator.closed_syndication_amount) || 0;

    return syndicator;
};

/**
 * Login an syndicator
 * @param {String} email - Syndicator email
 * @param {String} password - Syndicator password
 * @param {String} ipAddress - IP address
 * @returns {Object} Syndicator
 */
exports.loginSyndicator = async (email, password, ipAddress) => {
    const syndicator = await Syndicator.findOne({ email }).select('+password');

    if (!syndicator) {
        throw new ErrorResponse('Invalid email or password', 401);
    }

    const isMatch = await syndicator.matchPassword(password);

    if (!isMatch) {
        throw new ErrorResponse('Invalid email or password', 401);
    }

    // Once the syndicator is logged in, we need to update the last login date and record the login in the access log
    syndicator.last_login = Date.now();
    await syndicator.save();

    // Record the login in the access log
    const syndicatorAccessLog = new SyndicatorAccessLog({
        syndicator: syndicator._id,
        operation: PORTAL_OPERATIONS.LOGIN,
        access_date: Date.now(),
        ip_address: ipAddress
    });
    await syndicatorAccessLog.save();

    return syndicator;
};  

/**
 * Logout an syndicator
 * @param {String} id - Syndicator ID
 * @param {String} ipAddress - IP address
 * @returns {Object} Syndicator
 */
exports.logoutSyndicator = async (id, ipAddress) => {
    const syndicator = await Syndicator.findById(id);
    
    if (!syndicator) {
        throw new ErrorResponse(`Syndicator not found with id of ${id}`, 404);
    }

    // Record the logout in the access log
    const syndicatorAccessLog = new SyndicatorAccessLog({
        syndicator: syndicator._id,
        operation: PORTAL_OPERATIONS.LOGOUT,
        access_date: Date.now(),
        ip_address: ipAddress
    });
    await syndicatorAccessLog.save();

    // Update the syndicator's online status
    syndicator.online = false;
    await syndicator.save();

    return syndicator;
};

/**
 * Get syndicators with pagination
 * @param {Object} query - Query parameters
 * @param {Number} page - Page number
 * @param {Number} limit - Number of items per page
 * @param {Object} sort - Sort criteria
 * @returns {Object} Paginated syndicators
 */
exports.getSyndicators = async (query, sort = { name: 1 }, page = 1, limit = 10, populate = [], select = '', calculate = false) => {    
    // Get syndicators with pagination
    const skip = (page - 1) * limit;

    const [syndicators, count] = await Promise.all([
        Syndicator.find(query, null, { calculate })
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate(populate)
            .select(select)
            .lean(),
        Syndicator.countDocuments(query)
    ]);

    return {
        docs: syndicators.map(formatDataBeforeReturn),

        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get list of syndicators without pagination
 * @param {Object} query - Query parameters
 * @param {Object} sort - Sort criteria
 * @param {Array} populate - Populate fields
 * @param {String} select - Select fields
 * @returns {Array} List of syndicators
 */
exports.getSyndicatorList = async (query, sort = { name: 1 }, populate = [], select = '', calculate = false) => {
    const syndicators = await Syndicator.find(query, null, { calculate })
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();

    return syndicators.map(formatDataBeforeReturn);
};

/**
 * Get syndicator by ID
 * @param {String} id - Syndicator ID
 * @param {Array} populate - Populate fields
 * @param {String} select - Select fields
 * @param {Boolean} calculate - Calculate statistics
 * @param {Boolean} lean - Use lean query
 * @returns {Object} Syndicator
 */
exports.getSyndicatorById = async (id, populate = [], select = '', calculate = false, lean = true, session = null) => {
    Validators.checkValidateObjectId(id, 'syndicator id');

    let query = Syndicator.findById(id, null, { calculate, session })
        .populate(populate)
        .select(select);
    
    if (lean) query = query.lean();

    const syndicator = await query;

    Validators.checkResourceNotFound(syndicator, 'Syndicator');

    return formatDataBeforeReturn(syndicator);
};

/**
 * Create a new syndicator
 * @param {Object} data - Syndicator data
 * @param {Array} populate - Populate fields
 * @param {String} select - Select fields
 * @param {Boolean} calculate - Calculate statistics
 * @returns {Object} New syndicator
 */
exports.createSyndicator = async (data, populate = [], select = '', calculate = false) => {
    // Check if syndicator with this email already exists
    const existingSyndicator = await Syndicator.findOne({ email: data.email });
    
    if (existingSyndicator) {
        throw new ErrorResponse(`Syndicator already exists with email ${data.email}`, 400);
    }
    
    // Create the syndicator
    const syndicator = await Syndicator.create(data);
    
    Validators.checkResourceCreated(syndicator, 'Syndicator');

    return await this.getSyndicatorById(syndicator._id, populate, select, calculate);
};

/**
 * Update a syndicator
 * @param {String} id - Syndicator ID
 * @param {Object} updateData - Syndicator data to update
 * @param {Array} populate - Populate fields
 * @param {String} select - Select fields
 * @param {Boolean} calculate - Calculate statistics
 * @returns {Object} Updated syndicator
 */
exports.updateSyndicator = async (id, updateData, populate = [], select = '', calculate = false) => {
    Validators.checkValidateObjectId(id, 'syndicator id');

    const syndicator = await Syndicator.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    Validators.checkResourceNotFound(syndicator, 'Syndicator');

    return await this.getSyndicatorById(syndicator._id, populate, select, calculate);
};

/**
 * Update the password of an syndicator
 * @param {String} id - Syndicator ID
 * @param {String} password - New password
 * @param {Array} populate - Populate fields
 * @returns {Object} Updated syndicator
 */
exports.updateSyndicatorPassword = async (id, password, populate = [], select = '', calculate = false) => {
    Validators.checkValidateObjectId(id, 'syndicator id');

    const syndicator = await Syndicator.findById(id);
    
    Validators.checkResourceNotFound(syndicator, 'Syndicator');
    
    syndicator.password = password;
    await syndicator.save();

    return await this.getSyndicatorById(syndicator._id, populate, select, calculate);
};

/**
 * Delete a syndicator
 * @param {String} id - Syndicator ID
 * @returns {Boolean} True if deleted, false otherwise
 */
exports.deleteSyndicator = async (id, populate = [], select = '', calculate = false) => {
    Validators.checkValidateObjectId(id, 'syndicator id');

    const syndicator = await Syndicator.findByIdAndUpdate(id, { inactive: true }, { new: true });

    Validators.checkResourceNotFound(syndicator, 'Syndicator');

    return await this.getSyndicatorById(syndicator._id, populate, select, calculate);
};
