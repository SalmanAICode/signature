const UserLender = require('../models/UserLender');

const ErrorResponse = require('../utils/errorResponse');
const Validators = require('../utils/validators');

/**
 * Get all lenders associated with a user
 * @param {string} userId - The ID of the user
 * @returns {Promise<Array>} - An array of lenders
 */
exports.getLendersByUserId = async (userId) => {
    const lenders = await UserLender.find({ user: userId });

    // Extract lender IDs and remove duplicates using Set
    const uniqueLenders = [...new Set(lenders.map(lender => lender.lender.toString()))];

    return uniqueLenders;
};

/**
 * Get all lenders associated with a list of users
 * @param {Array} userIds - An array of user IDs
 * @returns {Promise<Array>} - An array of lenders
 */
exports.getLendersByUserIds = async (userIds) => {
    const lenders = await UserLender.find({ user: { $in: userIds } });

    // Extract lender IDs and remove duplicates using Set
    const uniqueLenders = [...new Set(lenders.map(lender => lender.lender.toString()))];

    return uniqueLenders;
};

/**
 * Get all users associated with a lender
 * @param {string} lenderId - The ID of the lender
 * @returns {Promise<Array>} - An array of users
 */
exports.getUsersByLenderId = async (lenderId) => {
    const users = await UserLender.find({ lender: lenderId });

    // Extract user IDs and remove duplicates using Set
    const uniqueUsers = [...new Set(users.map(user => user.user.toString()))];

    return uniqueUsers;
};

/**
 * Get all users associated with a list of lenders
 * @param {Array} lenderIds - An array of lender IDs
 * @returns {Promise<Array>} - An array of users
 */
exports.getUsersByLenderIds = async (lenderIds, session = null) => {
    const users = await UserLender.find({ lender: { $in: lenderIds } }, null, { session });

    // Extract user IDs and remove duplicates using Set
    const uniqueUsers = [...new Set(users.map(user => user.user.toString()))];

    return uniqueUsers;
};


/**
 * Create a new user-lender
 * @param {Object} userLenderData - The data of the user-lender
 * @returns {Promise<Object>} - The created user-lender
 */
exports.createUserLender = async (user, lender) => {
    // Check if the user lender is already in the database
    let userLender = await UserLender.findOne({ user, lender });

    if (!userLender) {
        userLender = await UserLender.create({ user, lender });
    }

    return userLender;
};

/**
 * Get user-lender by ID
 * @param {string} id - The ID of the user-lender
 * @param {Array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @returns {Promise<Object>} - The user-lender
 */
exports.getUserLenderById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'user-lender ID');

    const userLender = await UserLender
        .findById(id)
        .populate(populate)
        .select(select)
        .lean();

    if (!userLender) {
        throw new ErrorResponse(`User-Lender not found with id of ${id}`, 404);
    }

    return userLender;
};

/**
 * get all user-lender
 * @param {Object} query - The query of the user-lender
 * @param {number} page - The page of the user-lender
 * @param {number} limit - The limit of the user-lender
 * @param {Object} sort - The sort of the user-lender
 * @returns {Promise<Object>} - The user-lender
 */
exports.getUserLenders = async (query, page = 1, limit = 10, sort = {}, populate = [], select = '') => {
    const skip = (page - 1) * limit;
    const [userLender, count] = await Promise.all([
        UserLender.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        UserLender.countDocuments(query)
    ]);
    return {
        docs: userLender,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of user-lender without pagination
 * @param {Object} query - The query of the user-lender
 * @param {Array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @returns {Promise<Array>} - The user-lender
 */
exports.getUserLenderList = async (query, sort = {}, populate = [], select = '') => {
    return await UserLender.find(query)
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();
};

/**
 * Delete a user-lender
 * @param {string} user - The ID of the user
 * @param {string} lender - The ID of the lender
 * @returns {Promise<boolean>} - The deleted user-lender
 */
exports.deleteUserLender = async (user, lender) => {
    Validators.checkValidateObjectId(user, 'user ID');
    Validators.checkValidateObjectId(lender, 'lender ID');

    return await UserLender.deleteMany({ user, lender });
};

exports.updateUserLenderWithIdAndLenderList = async (id, lender_list) => {
    await UserLender.deleteMany({user: id});
    await UserLender.insertMany(lender_list.map(lender => ({user: id, lender: lender})));
};