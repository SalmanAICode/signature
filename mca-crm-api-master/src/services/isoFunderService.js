const ISOFunder = require('../models/ISOFunder');

const Validators = require('../utils/validators');

// In-memory cache for ISO-funder relationships
class ISOFunderCache {
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

    // Invalidate cache entries related to specific ISO
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
        console.log('ISO-Funder cache cleared');
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
const isoFunderCache = new ISOFunderCache();

/**
 * Get all funders associated with an ISO (with caching)
 * @param {string} isoId - The ID of the ISO
 * @returns {Promise<Array>} - An array of funders
 */
exports.getFundersByISOId = async (isoId) => {
    const cacheKey = isoFunderCache._getISOCacheKey(isoId);
    
    // Try to get from cache first
    const cachedResult = isoFunderCache.get(cacheKey);
    if (cachedResult) {
        return cachedResult;
    }

    // If not in cache, query database
    const funders = await ISOFunder.find({ 
        iso: isoId,
        inactive: { $ne: true }
    });
    const uniqueFunders = [...new Set(funders.map(funder => funder.funder.toString()))];
    
    // Cache the result
    isoFunderCache.set(cacheKey, uniqueFunders);
    
    return uniqueFunders;
};

/**
 * Get all funders associated with a list of ISOs (with caching)
 * @param {Array} isoIds - An array of ISO IDs
 * @returns {Promise<Array>} - An array of funders
 */
exports.getFundersByISOIds = async (isoIds, session = null) => {
    const cacheKey = isoFunderCache._getISOsCacheKey(isoIds);
    
    // Try to get from cache first
    const cachedResult = isoFunderCache.get(cacheKey);
    if (cachedResult) {
        return cachedResult;
    }

    // If not in cache, query database
    const funders = await ISOFunder.find({ 
        iso: { $in: isoIds },
        inactive: { $ne: true }
    }, null, { session });
    const uniqueFunders = [...new Set(funders.map(funder => funder.funder.toString()))];
    
    // Cache the result
    isoFunderCache.set(cacheKey, uniqueFunders);
    
    return uniqueFunders;
};

/**
 * Get all ISOs associated with a funder (with caching)
 * @param {string} funderId - The ID of the funder
 * @returns {Promise<Array>} - An array of ISOs
 */
exports.getISOsByFunderId = async (funderId) => {
    const cacheKey = isoFunderCache._getFunderCacheKey(funderId);
    
    // Try to get from cache first
    const cachedResult = isoFunderCache.get(cacheKey);
    if (cachedResult) {
        return cachedResult;
    }

    // If not in cache, query database
    const isos = await ISOFunder.find({ 
        funder: funderId,
        inactive: { $ne: true }
    });
    const uniqueIsos = [...new Set(isos.map(iso => iso.iso.toString()))];
    
    // Cache the result
    isoFunderCache.set(cacheKey, uniqueIsos);
    
    return uniqueIsos;
};

/**
 * Get all ISOs associated with a list of funders (with caching)
 * @param {Array} funderIds - An array of funder IDs
 * @returns {Promise<Array>} - An array of ISOs
 */
exports.getISOsByFunderIds = async (funderIds) => {
    const cacheKey = isoFunderCache._getFundersCacheKey(funderIds);
    
    // Try to get from cache first
    const cachedResult = isoFunderCache.get(cacheKey);
    if (cachedResult) {
        return cachedResult;
    }

    // If not in cache, query database
    const isos = await ISOFunder.find({ 
        funder: { $in: funderIds },
        inactive: { $ne: true }
    });
    const uniqueIsos = [...new Set(isos.map(iso => iso.iso.toString()))];
    
    // Cache the result
    isoFunderCache.set(cacheKey, uniqueIsos);
    
    return uniqueIsos;
};


/**
 * Create a new ISO-funder
 * @param {Object} iso - The ISO
 * @param {Object} funder - The funder
 * @param {Object} data - The data of the ISO-funder
 * @param {Array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @returns {Promise<Object>} - The created ISO-funder
 */
exports.createISOFunder = async (iso, funder, data, populate = [], select = '') => {
    let isoFunder = await ISOFunder.findOne({ iso, funder });

    if (isoFunder && isoFunder.inactive) {
        data.inactive = false;      // If the ISO funder is inactive, make it active again and update the other fields
    }

    isoFunder = await ISOFunder.findOneAndUpdate({ iso, funder }, data, { new: true, upsert: true });

    Validators.checkResourceNotFound(isoFunder, `ISO-funder with iso ${iso} and funder ${funder}`);

    // Invalidate cache for both ISO and funder
    isoFunderCache.invalidateISO(iso);
    isoFunderCache.invalidateFunder(funder);

    return await this.getISOFunderById(isoFunder._id, populate, select);
};

/**
 * Update a ISO-funder
 * @param {Object} iso - The ISO
 * @param {Object} funder - The funder
 * @param {Object} data - The data of the ISO-funder
 * @returns {Promise<Object>} - The updated ISO-funder
 */
exports.updateISOFunder = async (id, data, populate = [], select = '') => {
    const existingISOFunder = await ISOFunder.findById(id);
    const isoFunder = await ISOFunder.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
    
    Validators.checkResourceNotFound(isoFunder, `ISO-funder with id of ${id}`);

    // Invalidate cache for both ISO and funder
    if (existingISOFunder?.iso) {
        isoFunderCache.invalidateISO(existingISOFunder.iso.toString());
    }
    if (existingISOFunder?.funder) {
        isoFunderCache.invalidateFunder(existingISOFunder.funder.toString());
    }

    return await this.getISOFunderById(isoFunder._id, populate, select);
};

/**
 * Get ISO-funder by ID
 * @param {string} id - The ID of the ISO-funder
 * @param {Array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @returns {Promise<Object>} - The ISO-funder
 */
exports.getISOFunderById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'ISO-funder ID');

    const isoFunder = await ISOFunder
        .findById(id)
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(isoFunder, `ISO-funder with id of ${id}`);

    return isoFunder;
};

/**
 * get ISO-funders
 * @param {Object} query - The query of the ISO-funders
 * @param {Object} sort - The sort of the ISO-funders
 * @param {number} page - The page of the ISO-funders
 * @param {number} limit - The limit of the ISO-funders
 * @param {Array} populate - The fields to populate
 * @returns {Promise<Object>} - The ISO-funders
 */
exports.getISOFunders = async (query, sort = {}, page = 1, limit = 10, populate = [], select = '') => {
    const skip = (page - 1) * limit;
    const [isoFunder, count] = await Promise.all([
        ISOFunder.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        ISOFunder.countDocuments(query)
    ]);
    return {
        docs: isoFunder,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of ISO-funders without pagination
 * @param {Object} query - The query of the ISO-funder
 * @param {Array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @param {Object} sort - The sort of the ISO-funders
 * @returns {Promise<Array>} - The ISO-funders
 */
exports.getISOFunderList = async (query, sort = {}, populate = [], select = '') => {
    return await ISOFunder.find(query)
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();
};

/**
 * Delete an ISO-funder
 * @param {string} iso - The ID of the ISO
 * @param {string} funder - The ID of the funder
 * @returns {Promise<boolean>} - The deleted ISO-funder
 */
exports.deleteISOFunder = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'ISO-funder ID');

    const existingISOFunder = await ISOFunder.findById(id);
    const isoFunder = await ISOFunder.findByIdAndUpdate(id, { $set: { inactive: true } }, { new: true, runValidators: true });

    Validators.checkResourceNotFound(isoFunder, `ISO-funder with id of ${id}`);

    // Invalidate cache for both ISO and funder
    if (existingISOFunder?.iso) {
        isoFunderCache.invalidateISO(existingISOFunder.iso.toString());
    }
    if (existingISOFunder?.funder) {
        isoFunderCache.invalidateFunder(existingISOFunder.funder.toString());
    }

    return await this.getISOFunderById(isoFunder._id, populate, select);
};

/**
 * Get cache statistics and management functions
 * @returns {Object} - Cache management functions
 */
exports.cache = {
    getStats: () => isoFunderCache.getStats(),
    clear: () => isoFunderCache.clear(),
    invalidateISO: (isoId) => isoFunderCache.invalidateISO(isoId),
    invalidateFunder: (funderId) => isoFunderCache.invalidateFunder(funderId)
};