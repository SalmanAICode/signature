const ISOMerchant = require('../models/ISOMerchant');

const Validators = require('../utils/validators');

// In-memory cache for ISO-merchant relationships
class ISOMerchantCache {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 15 * 60 * 1000; // 15 minutes TTL
        this.maxCacheSize = 1000; // Maximum cache entries
    }

    // Generate cache key for single ISO
    _getISOCacheKey(isoId) {
        return `iso:${isoId}`;
    }

    // Generate cache key for multiple ISOs
    _getISOsCacheKey(isoIds) {
        const sortedIds = Array.isArray(isoIds) ? [...isoIds].sort() : [isoIds];
        return `isos:${sortedIds.join(',')}`;
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

    // Invalidate cache entries related to specific ISO or merchant
    invalidateISO(isoId) {
        const keysToDelete = [];
        for (const key of this.cache.keys()) {
            if (key.includes(`iso:${isoId}`) || key.includes(isoId)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.cache.delete(key));
        console.log(`Cache invalidated for ISO ${isoId}: ${keysToDelete.length} entries removed`);
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
        console.log('ISO-Merchant cache cleared');
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
const isoMerchantCache = new ISOMerchantCache();

/**
 * Get all merchants associated with an ISO (with caching)
 * @param {string} isoId - The ID of the ISO
 * @returns {Promise<Array>} - An array of merchants
 */
exports.getMerchantsByISOId = async (isoId) => {
    const cacheKey = isoMerchantCache._getISOCacheKey(isoId);
    
    // Try to get from cache first
    const cachedResult = isoMerchantCache.get(cacheKey);
    if (cachedResult) {
        return cachedResult;
    }

    // If not in cache, query database
    const merchants = await ISOMerchant.find({ 
        iso: isoId,
        inactive: { $ne: true }
    });
    const uniqueMerchants = [...new Set(merchants.map(merchant => merchant.merchant.toString()))];
    
    // Cache the result
    isoMerchantCache.set(cacheKey, uniqueMerchants);
    
    return uniqueMerchants;
};

/**
 * Get all merchants associated with a list of ISOs (with caching)
 * @param {Array} isoIds - An array of ISO IDs
 * @returns {Promise<Array>} - An array of merchants
 */
exports.getMerchantsByISOIds = async (isoIds) => {
    const cacheKey = isoMerchantCache._getISOsCacheKey(isoIds);
    
    // Try to get from cache first
    const cachedResult = isoMerchantCache.get(cacheKey);
    if (cachedResult) {
        return cachedResult;
    }

    // If not in cache, query database
    const merchants = await ISOMerchant.find({ 
        iso: { $in: isoIds },
        inactive: { $ne: true }
    });
    const uniqueMerchants = [...new Set(merchants.map(merchant => merchant.merchant.toString()))];
    
    // Cache the result
    isoMerchantCache.set(cacheKey, uniqueMerchants);
    
    return uniqueMerchants;
};

/**
 * Get all ISOs associated with a merchant (with caching)
 * @param {string} merchantId - The ID of the merchant
 * @returns {Promise<Array>} - An array of ISOs
 */
exports.getISOsByMerchantId = async (merchantId) => {
    const cacheKey = isoMerchantCache._getMerchantCacheKey(merchantId);
    
    // Try to get from cache first
    const cachedResult = isoMerchantCache.get(cacheKey);
    if (cachedResult) {
        return cachedResult;
    }

    // If not in cache, query database
    const isos = await ISOMerchant.find({ 
        merchant: merchantId,
        inactive: { $ne: true }
    });
    const uniqueISOs = [...new Set(isos.map(iso => iso.iso.toString()))];
    
    // Cache the result
    isoMerchantCache.set(cacheKey, uniqueISOs);
    
    return uniqueISOs;
};

/**
 * Get all ISOs associated with a list of merchants (with caching)
 * @param {Array} merchantIds - An array of merchant IDs
 * @returns {Promise<Array>} - An array of ISOs
 */
exports.getISOsByMerchantIds = async (merchantIds) => {
    const cacheKey = isoMerchantCache._getMerchantsCacheKey(merchantIds);
    
    // Try to get from cache first
    const cachedResult = isoMerchantCache.get(cacheKey);
    if (cachedResult) {
        return cachedResult;
    }

    // If not in cache, query database
    const isos = await ISOMerchant.find({ 
        merchant: { $in: merchantIds },
        inactive: { $ne: true }
    });
    const uniqueISOs = [...new Set(isos.map(iso => iso.iso.toString()))];
    
    // Cache the result
    isoMerchantCache.set(cacheKey, uniqueISOs);
    
    return uniqueISOs;
};

/**
 * Create a new ISO-merchant
 * @param {string} iso - The ID of the ISO
 * @param {string} merchant - The ID of the merchant
 * @param {Object} data - The data of the ISO-merchant
 * @param {Array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @returns {Promise<Object>} - The created ISO-merchant
 */
exports.createISOMerchant = async (iso, merchant, data, populate = [], select = '') => {
    let isoMerchant = await ISOMerchant.findOne({ iso, merchant });

    if (isoMerchant && isoMerchant.inactive) {
        data.inactive = false;      // If the ISO merchant is inactive, make it active again and update the other fields
    }

    isoMerchant = await ISOMerchant.findOneAndUpdate({ iso, merchant }, data, { new: true, upsert: true });

    Validators.checkResourceNotFound(isoMerchant, `ISO-merchant with iso ${iso} and merchant ${merchant}`);

    // Invalidate cache for both ISO and merchant
    isoMerchantCache.invalidateISO(iso);
    isoMerchantCache.invalidateMerchant(merchant);

    return await this.getISOMerchantById(isoMerchant._id, populate, select);
};

/**
 * Update an ISO-merchant
 * @param {string} id - The ID of the ISO-merchant
 * @param {Object} data - The data of the ISO-merchant
 * @param {Array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @returns {Promise<Object>} - The updated ISO-merchant
 */
exports.updateISOMerchant = async (id, data, populate = [], select = '') => {
    const existingISOMerchant = await ISOMerchant.findById(id);
    const isoMerchant = await ISOMerchant.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
    
    Validators.checkResourceNotFound(isoMerchant, `ISO-merchant with id of ${id}`);

    // Invalidate cache for both ISO and merchant
    if (existingISOMerchant?.iso) {
        isoMerchantCache.invalidateISO(existingISOMerchant.iso.toString());
    }
    if (existingISOMerchant?.merchant) {
        isoMerchantCache.invalidateMerchant(existingISOMerchant.merchant.toString());
    }

    return await this.getISOMerchantById(isoMerchant._id, populate, select);
};

/**
 * Get ISO-merchant by ID
 * @param {string} id - The ID of the ISO-merchant
 * @param {Array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @returns {Promise<Object>} - The ISO-merchant
 */
exports.getISOMerchantById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'ISO-merchant ID');

    const isoMerchant = await ISOMerchant
        .findById(id)
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(isoMerchant, `ISO-merchant with id of ${id}`);

    return isoMerchant;
};

/**
 * Get all ISO-merchants
 * @param {Object} query - The query of the ISO-merchants
 * @param {number} page - The page of the ISO-merchants
 * @param {number} limit - The limit of the ISO-merchants
 * @param {Object} sort - The sort of the ISO-merchants
 * @param {Array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @returns {Promise<Object>} - The ISO-merchants
 */
exports.getISOMerchants = async (query, sort = {}, page = 1, limit = 10, populate = [], select = '') => {
    const skip = (page - 1) * limit;
    const [isoMerchant, count] = await Promise.all([
        ISOMerchant.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        ISOMerchant.countDocuments(query)
    ]);
    return {
        docs: isoMerchant,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of ISO-merchants without pagination
 * @param {Object} query - The query of the ISO-merchant
 * @param {Object} sort - The sort of the ISO-merchants
 * @param {Array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @returns {Promise<Array>} - The ISO-merchants
 */
exports.getISOMerchantList = async (query, sort = {}, populate = [], select = '') => {
    return await ISOMerchant.find(query)
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();
};

/**
 * Delete an ISO-merchant
 * @param {string} id - The ID of the ISO-merchant
 * @param {Array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @returns {Promise<Object>} - The deleted ISO-merchant
 */
exports.deleteISOMerchant = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'ISO-merchant ID');

    const existingISOMerchant = await ISOMerchant.findById(id);
    const isoMerchant = await ISOMerchant.findByIdAndUpdate(id, { $set: { inactive: true } }, { new: true, runValidators: true });

    Validators.checkResourceNotFound(isoMerchant, `ISO-merchant with id of ${id}`);

    // Invalidate cache for both ISO and merchant
    if (existingISOMerchant?.iso) {
        isoMerchantCache.invalidateISO(existingISOMerchant.iso.toString());
    }
    if (existingISOMerchant?.merchant) {
        isoMerchantCache.invalidateMerchant(existingISOMerchant.merchant.toString());
    }

    return await this.getISOMerchantById(isoMerchant._id, populate, select);
};

/**
 * Get cache statistics and management functions
 * @returns {Object} - Cache management functions
 */
exports.cache = {
    getStats: () => isoMerchantCache.getStats(),
    clear: () => isoMerchantCache.clear(),
    invalidateISO: (isoId) => isoMerchantCache.invalidateISO(isoId),
    invalidateMerchant: (merchantId) => isoMerchantCache.invalidateMerchant(merchantId)
};