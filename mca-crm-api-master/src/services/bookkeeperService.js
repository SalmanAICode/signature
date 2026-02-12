const mongoose = require('mongoose');

const Bookkeeper = require('../models/Bookkeeper');

const BookkeeperAccessLog = require('../models/BookkeeperAccessLog');

const ErrorResponse = require('../utils/errorResponse');
const { PORTAL_OPERATIONS } = require('../utils/constants');

/**
 * Login an bookkeeper
 */
exports.loginBookkeeper = async (email, password, ipAddress) => {
    const bookkeeper = await Bookkeeper.findOne({ email }).select('+password');

    if (!bookkeeper) {
        throw new ErrorResponse('Invalid email or password', 401);
    }

    if (bookkeeper.inactive) {
        throw new ErrorResponse('Bookkeeper is inactive', 401);
    }

    const isMatch = await bookkeeper.matchPassword(password);

    if (!isMatch) {
        throw new ErrorResponse('Invalid email or password', 401);
    }

    // Once the bookkeeper is logged in, we need to update the last login date and record the login in the access log
    bookkeeper.last_login = Date.now();
    await bookkeeper.save();

    // Record the login in the access log
    const bookkeeperAccessLog = new BookkeeperAccessLog({
        bookkeeper: bookkeeper._id,
        operation: PORTAL_OPERATIONS.LOGIN,
        access_date: Date.now(),
        ip_address: ipAddress
    });
    await bookkeeperAccessLog.save();

    return bookkeeper;
};  

/**
 * Logout an bookkeeper
 */
exports.logoutBookkeeper = async (id, ipAddress) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ErrorResponse(`Invalid bookkeeper ID: ${id}`, 400);
    }

    const bookkeeper = await Bookkeeper.findById(id);
    
    if (!bookkeeper) {
        throw new ErrorResponse(`Bookkeeper not found with id of ${id}`, 404);
    }

    // Record the logout in the access log
    const bookkeeperAccessLog = new BookkeeperAccessLog({
        bookkeeper: bookkeeper._id,
        operation: PORTAL_OPERATIONS.LOGOUT,
        access_date: Date.now(),
        ip_address: ipAddress
    });
    await bookkeeperAccessLog.save();

    // Update the bookkeeper's online status
    bookkeeper.online = false;
    await bookkeeper.save();

    return bookkeeper;
};

/**
 * Get all bookkeepers with filtering and pagination
 */
exports.getBookkeepers = async (query, page = 1, limit = 10, sort = { last_name: 1, first_name: 1 }) => {    
    // Pagination
    const skip = (page - 1) * limit;
    
    const [bookkeepers, count] = await Promise.all([
        Bookkeeper.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .lean(),
        Bookkeeper.countDocuments(query)
    ]);
    
    return {
        docs: bookkeepers,

        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of all active bookkeepers without pagination
 */
exports.getBookkeeperList = async (query) => {
    return await Bookkeeper.find(query)
        .select('first_name last_name email phone_mobile')
        .sort({ last_name: 1, first_name: 1 })
        .lean();
};

/**
 * Get a single bookkeeper by ID
 */
exports.getBookkeeperById = async (id, populate = [], select = '') => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ErrorResponse(`Invalid bookkeeper ID: ${id}`, 400);
    }

    const bookkeeper = await Bookkeeper.findById(id)
        .select(select)
        .populate(populate);
    
    if (!bookkeeper) {
        throw new ErrorResponse(`Bookkeeper not found with id of ${id}`, 404);
    }
    
    return bookkeeper;
};

/**
 * Create a new bookkeeper
 */
exports.createBookkeeper = async (bookkeeperData) => {
    // Check if bookkeeper with this email already exists
    const existingBookkeeper = await Bookkeeper.findOne({ email: bookkeeperData.email });
    
    if (existingBookkeeper) {
        throw new ErrorResponse(`Bookkeeper already exists with email ${bookkeeperData.email}`, 400);
    }
    
    // Create the bookkeeper
    const bookkeeper = await Bookkeeper.create(bookkeeperData);
    
    // Return the bookkeeper without password
    return await Bookkeeper.findById(bookkeeper._id);
};

/**
 * Update an existing bookkeeper
 */
exports.updateBookkeeper = async (id, updateData) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ErrorResponse(`Invalid bookkeeper ID: ${id}`, 400);
    }

    const bookkeeper = await Bookkeeper.findById(id);
    
    if (!bookkeeper) {
        throw new ErrorResponse(`Bookkeeper not found with id of ${id}`, 404);
    }
    
    // If updating email, check if it's already in use
    if (updateData.email && updateData.email !== bookkeeper.email) {
        const existingBookkeeper = await Bookkeeper.findOne({ email: updateData.email });
        
        if (existingBookkeeper) {
            throw new ErrorResponse(`Email ${updateData.email} is already in use`, 400);
        }
    }
    
    // Update bookkeeper
    const updatedBookkeeper = await Bookkeeper.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
    });
    
    return updatedBookkeeper;
};

/**
 * Update the password of an bookkeeper
 */
exports.updateBookkeeperPassword = async (id, password) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ErrorResponse(`Invalid bookkeeper ID: ${id}`, 400);
    }

    const bookkeeper = await Bookkeeper.findById(id);
    
    if (!bookkeeper) {
        throw new ErrorResponse(`Bookkeeper not found with id of ${id}`, 404);
    }
    
    bookkeeper.password = password;
    await bookkeeper.save();
};

/**
 * Delete an bookkeeper
 */
exports.deleteBookkeeper = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ErrorResponse(`Invalid bookkeeper ID: ${id}`, 400);
    }

    const bookkeeper = await Bookkeeper.findById(id);
    
    if (!bookkeeper) {
        throw new ErrorResponse(`Bookkeeper not found with id of ${id}`, 404);
    }
    
    // Instead of deleting, we'll just set the inactive flag to true
    bookkeeper.inactive = true;
    await bookkeeper.save();
    
    return { success: true };
};

