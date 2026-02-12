const Representative = require('../models/Representative');
const RepresentativeAccessLog = require('../models/RepresentativeAccessLog');

const ErrorResponse = require('../utils/errorResponse');
const { PORTAL_OPERATIONS } = require('../utils/constants');
const Validators = require('../utils/validators');

/**
 * Login an representative
 */
exports.loginRepresentative = async (email, password, ipAddress) => {
    const representative = await Representative.findOne({ email }).select('+password');

    if (!representative) {
        throw new ErrorResponse('Invalid email or password', 401);
    }

    if (representative.inactive) {
        throw new ErrorResponse('Representative is inactive', 401);
    }

    const isMatch = await representative.matchPassword(password);

    if (!isMatch) {
        throw new ErrorResponse('Invalid email or password', 401);
    }

    // Once the admin is logged in, we need to update the last login date and record the login in the access log
    representative.last_login = Date.now();
    representative.online = true;
    await representative.save();

    // Record the login in the access log
    const representativeAccessLog = new RepresentativeAccessLog({
        representative: representative._id,
        operation: PORTAL_OPERATIONS.LOGIN,
        access_date: Date.now(),
        ip_address: ipAddress
    });
    await representativeAccessLog.save();

    return representative;
};

/**
 * Logout an representative
 */
exports.logoutRepresentative = async (id, ipAddress) => {

    Validators.checkValidateObjectId(id, 'representative ID');

    const representative = await Representative.findById(id);

    Validators.checkResourceNotFound(representative, `Representative with id of ${id}`);

    // Record the logout in the access log
    const representativeAccessLog = new RepresentativeAccessLog({
        representative: representative._id,
        operation: PORTAL_OPERATIONS.LOGOUT,
        access_date: Date.now(),
        ip_address: ipAddress
    });
    await representativeAccessLog.save();

    // Update the representative's online status
    representative.online = false;
    await representative.save();

    return representative;
};


/**
 * Get all representatives with filtering and pagination
 */
exports.getRepresentatives = async (query, sort = { last_name: 1, first_name: 1 }, page = 1, limit = 10, populate = [], select = '') => {
    // Get representatives with pagination
    const skip = (page - 1) * limit;

    const [representatives, count] = await Promise.all([
        Representative.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        Representative.countDocuments(query)
    ]);

    return {
        docs: representatives,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of representatives without pagination
 */
exports.getRepresentativeList = async (query, sort = { last_name: 1, first_name: 1 }, populate = [], select = '') => {
    return await Representative.find(query)
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();
};


/**
 * Get a representative by id
 */
exports.getRepresentativeById = async (id, populate = [], select = '', lean = true) => {

    Validators.checkValidateObjectId(id, 'representative ID');

    let query = Representative.findById(id)
        .populate(populate)
        .select(select);

    if (lean) query = query.lean();

    const representative = await query;

    Validators.checkResourceNotFound(representative, `Representative with id of ${id}`);

    return representative;
};


/**
 * Create a representative
 */
exports.createRepresentative = async (data, populate = [], select = '') => {
    const existingRepresentative = await Representative.findOne({ email: data.email });

    if (existingRepresentative) {
        throw new ErrorResponse(`Representative already exists with email ${data.email}`, 400);
    }

    // Create the representative
    const representative = await Representative.create(data);

    return await this.getRepresentativeById(representative._id, populate, select);
};

/**
 * Update a representative
 */
exports.updateRepresentative = async (id, data, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'representative ID');

    const updatedRepresentative = await Representative.findByIdAndUpdate(id, data, { new: true, runValidators: true});  

    return await this.getRepresentativeById(updatedRepresentative._id, populate, select);
};

/**
 * Update the password of an representative
 */
exports.updateRepresentativePassword = async (id, password) => {
    Validators.checkValidateObjectId(id, 'representative ID');

    const representative = await Representative.findById(id);

    Validators.checkResourceNotFound(representative, `Representative with id of ${id}`);

    representative.password = password;
    await representative.save();
};

/**
 * Delete a representative
 */
exports.deleteRepresentative = async (id) => {
    Validators.checkValidateObjectId(id, 'representative ID');

    const representative = await Representative.findById(id);

    Validators.checkResourceNotFound(representative, `Representative with id of ${id}`);

    representative.inactive = true;
    await representative.save();

    return representative;
};