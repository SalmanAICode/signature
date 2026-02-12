const User = require('../models/User');
const UserAccessLog = require('../models/UserAccessLog');

const ErrorResponse = require('../utils/errorResponse');
const Validators = require('../utils/validators');
const { PORTAL_OPERATIONS } = require('../utils/constants');

/**
 * Login an user
 */
exports.loginUser = async (email, password, ipAddress) => {
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        throw new ErrorResponse('Invalid email or password', 401);
    }

    if (user.inactive) {
        throw new ErrorResponse('User is inactive', 401);
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
        throw new ErrorResponse('Invalid email or password', 401);
    }

    // Once the admin is logged in, we need to update the last login date and record the login in the access log
    user.last_login = Date.now();
    user.online = true;
    await user.save();

    // Record the login in the access log
    const userAccessLog = new UserAccessLog({
        user: user._id,
        operation: PORTAL_OPERATIONS.LOGIN,
        access_date: Date.now(),
        ip_address: ipAddress
    });
    await userAccessLog.save();

    return user;
};  

/**
 * Logout an user
 */
exports.logoutUser = async (id, ipAddress) => {
    Validators.checkValidateObjectId(id, 'User ID');

    const user = await User.findById(id);
    
    if (!user) {
        throw new ErrorResponse(`User not found with id of ${id}`, 404);
    }

    // Record the logout in the access log
    const userAccessLog = new UserAccessLog({
        user: user._id,
        operation: PORTAL_OPERATIONS.LOGOUT,
        access_date: Date.now(),
        ip_address: ipAddress
    });
    await userAccessLog.save();

    // Update the user's online status
    user.online = false;
    await user.save();

    return user;
};


/**
 * Get all users with filtering and pagination
 */
exports.getUsers = async (query, sort = { last_name: 1, first_name: 1 }, page = 1, limit = 10, populate = [], select = '') => {
    // Get users with pagination
    const skip = (page - 1) * limit;
    
    const [users, count] = await Promise.all([
        User.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        User.countDocuments(query)
    ]);
    
    return {
        docs: users,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of users without pagination
 */
exports.getUserList = async (query, sort = { last_name: 1, first_name: 1 }, populate = [], select = '') => {
    return await User.find(query)
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();
};


/**
 * Get a user by id
 */
exports.getUserById = async (id, populate = [], select = '', lean = true, session = null) => {
    Validators.checkValidateObjectId(id, 'User ID');

    let query = User.findById(id, null, { session })
        .populate(populate)
        .select(select);

    if (lean) query = query.lean();

    const user = await query;

    Validators.checkResourceNotFound(user, `User with id of ${id}`);

    return user;
};

/**
 * Create a user
 */
exports.createUser = async (data, populate = [], select = '') => {
    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: data.email });
    
    if (existingUser) {
        throw new ErrorResponse(`User already exists with email ${data.email}`, 400);
    }
    
    // Create the user
    const newUser = await User.create(data);

    // Return the user without password
    return await this.getUserById(newUser._id, populate, select);
};

/**
 * Update a user
 */
exports.updateUser = async (id, data, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'User ID');

    const updatedUser = await User.findByIdAndUpdate(id, data, { new: true });

    return await this.getUserById(updatedUser._id, populate, select);
};

/**
 * Update the password of an user
 */
exports.updateUserPassword = async (id, password) => {
    Validators.checkValidateObjectId(id, 'User ID');

    const user = await User.findById(id);
    
    if (!user) {
        throw new ErrorResponse(`User not found with id of ${id}`, 404);
    }
    
    user.password = password;
    await user.save();
};

/**
 * Delete a user
 */
exports.deleteUser = async (id) => {
    Validators.checkValidateObjectId(id, 'User ID');

    const deletedUser = await User.findByIdAndUpdate(id, { inactive: true }, { new: true });

    return deletedUser;
};