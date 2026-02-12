const Admin = require('../models/Admin');
const AdminAccessLog = require('../models/AdminAccessLog');

const ErrorResponse = require('../utils/errorResponse');
const Validators = require('../utils/validators');
const { PORTAL_OPERATIONS } = require('../utils/constants');

/**
 * Login an admin
 * @param {string} email - The email of the admin
 * @param {string} password - The password of the admin
 * @param {string} ipAddress - The IP address of the admin
 * @returns {Promise<Admin>} - The admin object
 */
exports.loginAdmin = async (email, password, ipAddress) => {
    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin) {
        throw new ErrorResponse('Invalid email or password', 401);
    }

    if (admin.inactive) {
        throw new ErrorResponse('Admin is inactive', 401);
    }

    const isMatch = await admin.matchPassword(password);

    if (!isMatch) {
        throw new ErrorResponse('Invalid email or password', 401);
    }

    // Once the admin is logged in, we need to update the last login date and record the login in the access log
    admin.last_login = Date.now();
    admin.online = true;
    await admin.save();

    // Record the login in the access log
    const adminAccessLog = new AdminAccessLog({
        admin: admin._id,
        operation: PORTAL_OPERATIONS.LOGIN,
        access_date: Date.now(),
        ip_address: ipAddress
    });
    await adminAccessLog.save();

    return admin;
};  

/**
 * Logout an admin
 * @param {string} id - The ID of the admin
 * @param {string} ipAddress - The IP address of the admin
 * @returns {Promise<Admin>} - The admin object
 */
exports.logoutAdmin = async (id, ipAddress) => {
    Validators.checkValidateObjectId(id, 'Admin ID');

    const admin = await Admin.findById(id);
    
    if (!admin) {
        throw new ErrorResponse(`Admin not found with id of ${id}`, 404);
    }

    // Record the logout in the access log
    const adminAccessLog = new AdminAccessLog({
        admin: admin._id,
        operation: PORTAL_OPERATIONS.LOGOUT,
        access_date: Date.now(),
        ip_address: ipAddress
    });
    await adminAccessLog.save();

    // Update the admin's online status
    admin.online = false;
    await admin.save();

    return admin;
};

/**
 * Get all admins with filtering and pagination
 * @param {Object} query - The query object
 * @param {number} page - The page number
 * @param {number} limit - The limit number
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 * @returns {Promise<Object>} - The admins object
 */
exports.getAdmins = async (query, page = 1, limit = 10, sort = { last_name: 1, first_name: 1 }, populate = [], select = '') => {    
    // Pagination
    const skip = (page - 1) * limit;
    
    const [admins, count] = await Promise.all([
        Admin.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        Admin.countDocuments(query)
    ]);
    
    return {
        docs: admins,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of all active admins without pagination
 * @param {Object} query - The query object
 * @param {Object} sort - The sort object
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 * @returns {Promise<Array>} - The admins array
 */
exports.getAdminList = async (query, sort = { last_name: 1, first_name: 1 }, populate = [], select = '') => {
    return await Admin.find(query)
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();
};

/**
 * Get a single admin by ID
 * @param {string} id - The ID of the admin
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 * @param {boolean} lean - The lean flag
 * @returns {Promise<Admin>} - The admin object
 */
exports.getAdminById = async (id, populate = [], select = '', lean = true) => {
    Validators.checkValidateObjectId(id, 'Admin ID');

    let query = Admin.findById(id)
        .populate(populate)
        .select(select);

    if (lean) query = query.lean();

    const admin = await query;

    Validators.checkResourceNotFound(admin, `Admin with id of ${id}`);
    
    return admin;
};

/**
 * Create a new admin
 * @param {Object} data - The data object
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 * @returns {Promise<Admin>} - The admin object
 */
exports.createAdmin = async (data, populate = [], select = '') => {
    // Check if admin with this email already exists
    const existingAdmin = await Admin.findOne({ email: data.email });
    
    if (existingAdmin) {
        throw new ErrorResponse(`Admin already exists with email ${data.email}`, 400);
    }
        
    // Create the admin
    const newAdmin = await Admin.create(data);

    Validators.checkResourceNotFound(newAdmin, 'Admin');
    
    // Return the admin without password
    return await this.getAdminById(newAdmin._id, populate, select);
};

/**
 * Update an existing admin
 * @param {string} id - The ID of the admin
 * @param {Object} data - The data object
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 * @returns {Promise<Admin>} - The admin object
 */
exports.updateAdmin = async (id, data, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'Admin ID');

    const admin = await Admin.findById(id);
    
    if (!admin) {
        throw new ErrorResponse(`Admin not found with id of ${id}`, 404);
    }
    
    // If updating email, check if it's already in use
    if (data.email && data.email !== admin.email) {
        const existingAdmin = await Admin.findOne({ email: data.email });
        
        if (existingAdmin) {
            throw new ErrorResponse(`Email ${data.email} is already in use`, 400);
        }
    }
        
    // Update admin
    const updatedAdmin = await Admin.findByIdAndUpdate(id, data, { new: true, runValidators: true });

    Validators.checkResourceNotFound(updatedAdmin, 'Admin');
    
    return await this.getAdminById(updatedAdmin._id, populate, select);
};

/**
 * Update the password of an admin
 * @param {string} id - The ID of the admin
 * @param {string} password - The password of the admin
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 * @returns {Promise<Admin>} - The admin object
 */
exports.updateAdminPassword = async (id, password, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'Admin ID');

    const admin = await Admin.findById(id);
    
    if (!admin) {
        throw new ErrorResponse(`Admin not found with id of ${id}`, 404);
    }
    
    admin.password = password;
    await admin.save();

    Validators.checkResourceNotFound(admin, 'Admin');

    return await this.getAdminById(admin._id, populate, select);
};

/**
 * Delete an admin
 * @param {string} id - The ID of the admin
 * @param {Array} populate - The populate array
 * @param {string} select - The select string
 * @returns {Promise<Admin>} - The admin object
 */
exports.deleteAdmin = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'Admin ID');

    const deletedAdmin = await Admin.findByIdAndUpdate(id, { inactive: true }, { new: true });

    Validators.checkResourceNotFound(deletedAdmin, 'Admin');

    return await this.getAdminById(deletedAdmin._id, populate, select);
};

