const UserFunder = require('../models/UserFunder');

const ErrorResponse = require('../utils/errorResponse');
const Validators = require('../utils/validators');

// In-memory cache for user-funder relationships
class UserFunderCache {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 15 * 60 * 1000; // 15 minutes TTL
        this.maxCacheSize = 1000; // Maximum cache entries
    }

    // Generate cache key for single user
    _getUserCacheKey(userId) {
        return `user:${userId}`;
    }

    // Generate cache key for multiple users
    _getUsersCacheKey(userIds) {
        const sortedIds = Array.isArray(userIds) ? [...userIds].sort() : [userIds];
        return `users:${sortedIds.join(',')}`;
    }

    // Generate cache key for single funder
    _getFunderCacheKey(funderId) {
        return `funder:${funderId}`;
    }

    // Generate cache key for multiple funders
    _getFundersCacheKey(funderIds) {
        const sortedIds = Array.isArray(funderIds) ? [...funderIds].sort() : [funderIds];
        return `funders:${sortedIds.join(',')}`;
    }

    // Get cached data
    get(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        // Check if cache entry has expired
        if (Date.now() > cached.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    // Set cache data with TTL
    set(key, data) {
        // Remove oldest entries if cache is too large
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            data,
            expiresAt: Date.now() + this.cacheTimeout,
            createdAt: Date.now()
        });
    }

    // Invalidate cache entries related to specific user
    invalidateUser(userId) {
        const keysToDelete = [];
        for (const key of this.cache.keys()) {
            if (key.includes(`user:${userId}`) || key.includes(userId)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.cache.delete(key));
        console.log(`Cache invalidated for user ${userId}: ${keysToDelete.length} entries removed`);
    }

    // Invalidate cache entries related to specific funder
    invalidateFunder(funderId) {
        const keysToDelete = [];
        for (const key of this.cache.keys()) {
            if (key.includes(`funder:${funderId}`) || key.includes(funderId)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.cache.delete(key));
        console.log(`Cache invalidated for funder ${funderId}: ${keysToDelete.length} entries removed`);
    }

    // Clear all cache
    clear() {
        this.cache.clear();
        console.log('User-Funder cache cleared');
    }

    // Get cache statistics
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            timeout: this.cacheTimeout
        };
    }
}

// Create global cache instance
const userFunderCache = new UserFunderCache();

/**
 * Get all funders associated with a user (with caching)
 * @param {string} userId - The ID of the user
 * @returns {Promise<Array>} - An array of funders
 */
exports.getFundersByUserId = async (userId) => {
    const cacheKey = userFunderCache._getUserCacheKey(userId);
    
    // Try to get from cache first
    const cachedResult = userFunderCache.get(cacheKey);
    if (cachedResult) {
        return cachedResult;
    }

    // If not in cache, query database
    const funders = await UserFunder.find({ 
        user: userId,
        inactive: { $ne: true }
    });

    // Extract funder IDs and remove duplicates using Set
    const uniqueFunders = [...new Set(funders.map(funder => funder.funder.toString()))];
    
    // Cache the result
    userFunderCache.set(cacheKey, uniqueFunders);

    return uniqueFunders;
};

/**
 * Get all funders associated with a list of users (with caching)
 * @param {Array} userIds - An array of user IDs
 * @returns {Promise<Array>} - An array of funders
 */
exports.getFundersByUserIds = async (userIds) => {
    const cacheKey = userFunderCache._getUsersCacheKey(userIds);
    
    // Try to get from cache first
    const cachedResult = userFunderCache.get(cacheKey);
    if (cachedResult) {
        return cachedResult;
    }

    // If not in cache, query database
    const funders = await UserFunder.find({ 
        user: { $in: userIds },
        inactive: { $ne: true }
    });

    // Extract funder IDs and remove duplicates using Set
    const uniqueFunders = [...new Set(funders.map(funder => funder.funder.toString()))];
    
    // Cache the result
    userFunderCache.set(cacheKey, uniqueFunders);

    return uniqueFunders;
};

/**
 * Get all users associated with a funder (with caching)
 * @param {string} funderId - The ID of the funder
 * @returns {Promise<Array>} - An array of users
 */
exports.getUsersByFunderId = async (funderId) => {
    const cacheKey = userFunderCache._getFunderCacheKey(funderId);
    
    // Try to get from cache first
    const cachedResult = userFunderCache.get(cacheKey);
    if (cachedResult) {
        return cachedResult;
    }

    // If not in cache, query database
    const users = await UserFunder.find({ 
        funder: funderId,
        inactive: { $ne: true }
    });

    // Extract user IDs and remove duplicates using Set
    const uniqueUsers = [...new Set(users.map(user => user.user.toString()))];
    
    // Cache the result
    userFunderCache.set(cacheKey, uniqueUsers);

    return uniqueUsers;
};

/**
 * Get all users associated with a list of funders (with caching)
 * @param {Array} funderIds - An array of funder IDs
 * @returns {Promise<Array>} - An array of users
 */
exports.getUsersByFunderIds = async (funderIds, session = null) => {
    const cacheKey = userFunderCache._getFundersCacheKey(funderIds);
    
    // Try to get from cache first
    const cachedResult = userFunderCache.get(cacheKey);
    if (cachedResult) {
        return cachedResult;
    }

    // If not in cache, query database
    const users = await UserFunder.find({ 
        funder: { $in: funderIds },
        inactive: { $ne: true }
    }, null, { session });

    // Extract user IDs and remove duplicates using Set
    const uniqueUsers = [...new Set(users.map(user => user.user.toString()))];
    
    // Cache the result
    userFunderCache.set(cacheKey, uniqueUsers);

    return uniqueUsers;
};

/**
 * Create a new user-funder
 * @param {Object} userFunderData - The data of the user-funder
 * @returns {Promise<Object>} - The created user-funder
 */
exports.createUserFunder = async (user, funder) => {
    // Check if the user funder is already in the database
    let userFunder = await UserFunder.findOne({ user, funder });

    if (!userFunder) {
        userFunder = await UserFunder.create({ user, funder });
        
        // Invalidate cache for both user and funder
        userFunderCache.invalidateUser(user);
        userFunderCache.invalidateFunder(funder);
    }

    return userFunder;
};

/**
 * Get user-funder by ID
 * @param {string} id - The ID of the user-funder
 * @param {Array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @returns {Promise<Object>} - The user-funder
 */
exports.getUserFunderById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'user-funder ID');

    const userFunder = await UserFunder
        .findById(id)
        .populate(populate)
        .select(select)
        .lean();

    if (!userFunder) {
        throw new ErrorResponse(`User-Funder not found with id of ${id}`, 404);
    }

    return userFunder;
};

/**
 * get all user-funder
 * @param {Object} query - The query of the user-funder
 * @param {number} page - The page of the user-funder
 * @param {number} limit - The limit of the user-funder
 * @param {Object} sort - The sort of the user-funder
 * @returns {Promise<Object>} - The user-funder
 */
exports.getUserFunders = async (query, page = 1, limit = 10, sort = {}, populate = [], select = '') => {
    const skip = (page - 1) * limit;
    const [userFunder, count] = await Promise.all([
        UserFunder.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        UserFunder.countDocuments(query)
    ]);
    return {
        docs: userFunder,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of user-funder without pagination
 * @param {Object} query - The query of the user-funder
 * @param {Array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @returns {Promise<Array>} - The user-funder
 */
exports.getUserFunderList = async (query, sort = {}, populate = [], select = '') => {
    return await UserFunder.find(query)
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();
};

/**
 * Delete a user-funder
 * @param {string} user - The ID of the user
 * @param {string} funder - The ID of the funder
 * @returns {Promise<boolean>} - The deleted user-funder
 */
exports.deleteUserFunder = async (user, funder) => {
    Validators.checkValidateObjectId(user, 'user ID');
    Validators.checkValidateObjectId(funder, 'funder ID');

    const result = await UserFunder.deleteMany({ user, funder });
    
    // Invalidate cache for both user and funder
    userFunderCache.invalidateUser(user);
    userFunderCache.invalidateFunder(funder);

    return result;
};

exports.updateUserFunderWithIdAndFunderList = async (id, funder_list) => {
    await UserFunder.deleteMany({user: id});
    await UserFunder.insertMany(funder_list.map(funder => ({user: id, funder: funder})));
    
    // Invalidate cache for the user and all affected funders
    userFunderCache.invalidateUser(id);
    funder_list.forEach(funderId => {
        userFunderCache.invalidateFunder(funderId);
    });
};

// Cache management functions
/**
 * Get cache statistics
 * @returns {Object} - Cache statistics
 */
exports.getCacheStats = () => {
    return userFunderCache.getStats();
};

/**
 * Clear entire cache
 * @returns {Object} - Success message
 */
exports.clearCache = () => {
    userFunderCache.clear();
    return { message: 'User-Funder cache cleared successfully' };
};

/**
 * Invalidate cache for specific user
 * @param {string} userId - The ID of the user
 * @returns {Object} - Success message
 */
exports.invalidateUserCache = (userId) => {
    userFunderCache.invalidateUser(userId);
    return { message: `Cache invalidated for user ${userId}` };
};

/**
 * Invalidate cache for specific funder
 * @param {string} funderId - The ID of the funder
 * @returns {Object} - Success message
 */
exports.invalidateFunderCache = (funderId) => {
    userFunderCache.invalidateFunder(funderId);
    return { message: `Cache invalidated for funder ${funderId}` };
};

// Expose cache instance for direct access from controller
exports.cache = userFunderCache;