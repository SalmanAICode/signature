const MerchantFunder = require('../models/MerchantFunder');

const Validators = require('../utils/validators');

// In-memory cache for merchant-funder relationships
class MerchantFunderCache {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 15 * 60 * 1000; // 15 minutes TTL
        this.maxCacheSize = 1000; // Maximum cache entries
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

    // Generate cache key for single merchant
    _getMerchantCacheKey(merchantId) {
        return `merchant:${merchantId}`;
    }

    // Generate cache key for multiple merchants
    _getMerchantsCacheKey(merchantIds) {
        const sortedIds = Array.isArray(merchantIds) ? [...merchantIds].sort() : [merchantIds];
        return `merchants:${sortedIds.join(',')}`;
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

    // Invalidate cache entries related to specific funder or merchant
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

    // Invalidate cache entries related to specific merchant

    invalidateMerchant(merchantId) {
        const keysToDelete = [];
        for (const key of this.cache.keys()) {
            if (key.includes(`merchant:${merchantId}`) || key.includes(merchantId)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.cache.delete(key));
        console.log(`Cache invalidated for merchant ${merchantId}: ${keysToDelete.length} entries removed`);
    }

    // Clear all cache
    clear() {
        this.cache.clear();
        console.log('Merchant-Funder cache cleared');
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
const merchantFunderCache = new MerchantFunderCache();

/**
 * Get all funders associated with a merchant
 * @param {string} merchantId - The ID of the merchant
 * @returns {Promise<Array>} - An array of funders
 */
exports.getFundersByMerchantId = async (merchantId) => {
    const cacheKey = merchantFunderCache._getMerchantCacheKey(merchantId);

    // Try to get from cache first
    const cachedResult = merchantFunderCache.get(cacheKey);
    if (cachedResult) {
        return cachedResult;
    }

    // If not in cache, query database
    const funders = await MerchantFunder.find({ 
        merchant: merchantId,
        inactive: { $ne: true }
    });
    const uniqueFunders = [...new Set(funders.map(funder => funder.funder.toString()))];

    // Cache the result
    merchantFunderCache.set(cacheKey, uniqueFunders);

    return uniqueFunders;
};

/**
 * Get all funders associated with a list of merchants
 * @param {Array} merchantIds - An array of merchant IDs
 * @returns {Promise<Array>} - An array of funders
 */
exports.getFundersByMerchantIds = async (merchantIds, session = null) => {
    const cacheKey = merchantFunderCache._getMerchantsCacheKey(merchantIds);

    // Try to get from cache first
    const cachedResult = merchantFunderCache.get(cacheKey);
    if (cachedResult) {
        return cachedResult;
    }

    // If not in cache, query database
    const funders = await MerchantFunder.find({ 
        merchant: { $in: merchantIds },
        inactive: { $ne: true }
    }, null, { session });
    const uniqueFunders = [...new Set(funders.map(funder => funder.funder.toString()))];

    // Cache the result
    merchantFunderCache.set(cacheKey, uniqueFunders);

    return uniqueFunders;
};

/**
 * Get all merchants associated with a funder (with caching)
 * @param {string} funderId - The ID of the funder
 * @returns {Promise<Array>} - An array of merchants
 */
exports.getMerchantsByFunderId = async (funderId) => {
    const cacheKey = merchantFunderCache._getFunderCacheKey(funderId);
    
    // Try to get from cache first
    const cachedResult = merchantFunderCache.get(cacheKey);
    if (cachedResult) {
        return cachedResult;
    }

    // If not in cache, query database
    const merchants = await MerchantFunder.find({ 
        funder: funderId,
        inactive: { $ne: true }
    });
    const uniqueMerchants = [...new Set(merchants.map(merchant => merchant.merchant.toString()))];
    
    // Cache the result
    merchantFunderCache.set(cacheKey, uniqueMerchants);
    
    return uniqueMerchants;
};

/**
 * Get all merchants associated with a list of funders (with caching)
 * @param {Array} funderIds - An array of funder IDs
 * @returns {Promise<Array>} - An array of merchants
 */
exports.getMerchantsByFunderIds = async (funderIds) => {
    const cacheKey = merchantFunderCache._getFundersCacheKey(funderIds);
    
    // Try to get from cache first
    const cachedResult = merchantFunderCache.get(cacheKey);
    if (cachedResult) {
        return cachedResult;
    }

    // If not in cache, query database
    const merchants = await MerchantFunder.find({ 
        funder: { $in: funderIds },
        inactive: { $ne: true }
    });
    const uniqueMerchants = [...new Set(merchants.map(merchant => merchant.merchant.toString()))];
    
    // Cache the result
    merchantFunderCache.set(cacheKey, uniqueMerchants);
    
    return uniqueMerchants;
};


/**
 * Create a new merchant-funder
 * @param {string} merchant - The ID of the merchant
 * @param {string} funder - The ID of the funder
 * @param {Object} data - The data of the merchant-funder
 * @param {Array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @returns {Promise<Object>} - The created merchant-funder
 */
exports.createMerchantFunder = async (merchant, funder, data, populate = [], select = '') => {
    let merchantFunder = await MerchantFunder.findOne({ merchant, funder });
    if (!merchantFunder) {
        merchantFunder = await MerchantFunder.create({ merchant, funder, ...data });
    } else {
        merchantFunder = await MerchantFunder.findOneAndUpdate({ _id: merchantFunder._id }, { $set: data }, { new: true });
    }

    Validators.checkResourceNotFound(merchantFunder, `Merchant-funder with merchant ${merchant} and funder ${funder}`);

    // Invalidate cache for this funder and merchant
    merchantFunderCache.invalidateFunder(funder);
    merchantFunderCache.invalidateMerchant(merchant);

    return await this.getMerchantFunderById(merchantFunder._id, populate, select);
};

/**
 * Update a merchant-funder
 * @param {string} id - The ID of the merchant-funder
 * @param {Object} data - The data of the merchant-funder
 * @param {Array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @returns {Promise<Object>} - The updated merchant-funder
 */
exports.updateMerchantFunder = async (id, data, populate = [], select = '') => {
    const existingMerchantFunder = await MerchantFunder.findById(id);
    const merchantFunder = await MerchantFunder.findOneAndUpdate({ _id: id }, { $set: data }, { new: true });

    Validators.checkResourceNotFound(merchantFunder, `Merchant-funder with id of ${id}`);

    // Invalidate cache for the funder
    if (existingMerchantFunder?.funder) {
        merchantFunderCache.invalidateFunder(existingMerchantFunder.funder.toString());
    }

    // Invalidate cache for the merchant
    if (existingMerchantFunder?.merchant) {
        merchantFunderCache.invalidateMerchant(existingMerchantFunder.merchant.toString());
    }

    return await this.getMerchantFunderById(merchantFunder._id, populate, select);
};

/**
 * Get merchant-funder by ID
 * @param {string} id - The ID of the merchant-funder
 * @param {Array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @returns {Promise<Object>} - The merchant-funder
 */
exports.getMerchantFunderById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'Merchant-funder ID');

    const merchantFunder = await MerchantFunder
        .findById(id)
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(merchantFunder, `Merchant-funder with id of ${id}`);

    return merchantFunder;
};

/**
 * get merchant-funders
 * @param {Object} query - The query of the merchant-funders
 * @param {number} page - The page of the merchant-funders
 * @param {number} limit - The limit of the merchant-funders
 * @param {Object} sort - The sort of the merchant-funders
 * @param {Array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @returns {Promise<Object>} - The merchant-funders
 */
exports.getMerchantFunders = async (query, sort = { name: -1 }, page = 1, limit = 10, populate = [], select = '') => {
    const skip = (page - 1) * limit;
    const [merchantFunder, count] = await Promise.all([
        MerchantFunder.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        MerchantFunder.countDocuments(query)
    ]);
    return {
        docs: merchantFunder,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of merchant-funders without pagination
 * @param {Object} query - The query of the merchant-funder
 * @param {Array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @param {Object} sort - The sort of the merchant-funders
 * @returns {Promise<Array>} - The merchant-funders
 */
exports.getMerchantFunderList = async (query, sort = {}, populate = [], select = '') => {
    return await MerchantFunder.find(query)
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();
};

/**
 * Delete a merchant-funder
 * @param {string} id - The ID of the merchant-funder
 * @param {Array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @returns {Promise<boolean>} - The deleted merchant-funder
 */
exports.deleteMerchantFunder = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'Merchant-funder ID');

    const existingMerchantFunder = await MerchantFunder.findById(id);
    const merchantFunder = await MerchantFunder.findOneAndUpdate({ _id: id }, { $set: { inactive: true } }, { new: true, runValidators: true });

    Validators.checkResourceNotFound(merchantFunder, `Merchant-funder with id of ${id}`);

    // Invalidate cache for the funder
    if (existingMerchantFunder?.funder) {
        merchantFunderCache.invalidateFunder(existingMerchantFunder.funder.toString());
    }

    // Invalidate cache for the merchant
    if (existingMerchantFunder?.merchant) {
        merchantFunderCache.invalidateMerchant(existingMerchantFunder.merchant.toString());
    }

    return await this.getMerchantFunderById(merchantFunder._id, populate, select);
};

/**
 * Get cache statistics and management functions
 * @returns {Object} - Cache management functions
 */
exports.cache = {
    getStats: () => merchantFunderCache.getStats(),
    clear: () => merchantFunderCache.clear(),
    invalidateFunder: (funderId) => merchantFunderCache.invalidateFunder(funderId),
    invalidateMerchant: (merchantId) => merchantFunderCache.invalidateMerchant(merchantId)
};