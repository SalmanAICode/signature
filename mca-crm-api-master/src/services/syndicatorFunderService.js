const SyndicatorFunder = require('../models/SyndicatorFunder');

const Validators = require('../utils/validators');
const Helpers = require('../utils/helpers');

// In-memory cache for syndicator-funder relationships
class SyndicatorFunderCache {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 15 * 60 * 1000; // 15 minutes TTL
        this.maxCacheSize = 1000; // Maximum cache entries
    }

    // Generate cache key for single syndicator
    _getSyndicatorCacheKey(syndicatorId) {
        return `syndicator:${syndicatorId}`;
    }

    // Generate cache key for multiple syndicators
    _getSyndicatorsCacheKey(syndicatorIds) {
        const sortedIds = Array.isArray(syndicatorIds) ? [...syndicatorIds].sort() : [syndicatorIds];
        return `syndicators:${sortedIds.join(',')}`;
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

    // Invalidate cache entries related to specific syndicator
    invalidateSyndicator(syndicatorId) {
        const keysToDelete = [];
        for (const key of this.cache.keys()) {
            if (key.includes(`syndicator:${syndicatorId}`) || key.includes(syndicatorId)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.cache.delete(key));
        console.log(`Cache invalidated for syndicator ${syndicatorId}: ${keysToDelete.length} entries removed`);
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
        console.log('Syndicator-Funder cache cleared');
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
const syndicatorFunderCache = new SyndicatorFunderCache();

/**
 * Format the syndicator funder data to apply setters manually (needed when using lean())
 * @param {Object} syndicatorFunder - The syndicator funder
 * @returns {Object} - The formatted syndicator funder
 */
const formatDataBeforeReturn = (syndicatorFunder) => {
    return {
        ...syndicatorFunder,
        available_balance: Helpers.centsToDollars(syndicatorFunder.available_balance) || 0
    };
};

/**
 * Format the syndicator funder data to apply setters manually (needed when using lean())
 * @param {Object} syndicatorFunder - The syndicator funder
 * @returns {Object} - The formatted syndicator funder
 */
const formatDataBeforeSave = (syndicatorFunder) => {    
    return {
        ...syndicatorFunder,
        available_balance: Helpers.dollarsToCents(syndicatorFunder.available_balance) || undefined
    };
};

/**
 * Get all funders associated with a syndicator (with caching)
 * @param {string} syndicatorId - The ID of the syndicator
 * @returns {Promise<Array>} - An array of funders
 */
exports.getFundersBySyndicatorId = async (syndicatorId) => {
    const cacheKey = syndicatorFunderCache._getSyndicatorCacheKey(syndicatorId);
    
    // Try to get from cache first
    const cachedResult = syndicatorFunderCache.get(cacheKey);
    if (cachedResult) {
        return cachedResult;
    }

    // If not in cache, query database
    const funders = await SyndicatorFunder.find({ 
        syndicator: syndicatorId,
        inactive: { $ne: true }
    });
    const uniqueFunders = funders.map(funder => funder.funder.toString());
    
    // Cache the result
    syndicatorFunderCache.set(cacheKey, uniqueFunders);
    
    return uniqueFunders;
};

/**
 * Get all funders associated with a list of syndicators (with caching)
 * @param {Array} syndicatorIds - An array of syndicator IDs
 * @returns {Promise<Array>} - An array of funders
 */
exports.getFundersBySyndicatorIds = async (syndicatorIds, session = null) => {
    const cacheKey = syndicatorFunderCache._getSyndicatorsCacheKey(syndicatorIds);
    
    // Try to get from cache first
    const cachedResult = syndicatorFunderCache.get(cacheKey);
    if (cachedResult) {
        return cachedResult;
    }

    // If not in cache, query database
    const funders = await SyndicatorFunder.find({ 
        syndicator: { $in: syndicatorIds },
        inactive: { $ne: true }
    }, null, { session });

    // Extract funder IDs and remove duplicates using Set
    const uniqueFunders = [...new Set(funders.map(funder => funder.funder.toString()))];
    
    // Cache the result
    syndicatorFunderCache.set(cacheKey, uniqueFunders);
    
    return uniqueFunders;
};

/**
 * Get all syndicators associated with a funder (with caching)
 * @param {string} funderId - The ID of the funder
 * @returns {Promise<Array>} - An array of syndicators
 */
exports.getSyndicatorsByFunderId = async (funderId, session = null) => {
    const cacheKey = syndicatorFunderCache._getFunderCacheKey(funderId);
    
    // Try to get from cache first
    const cachedResult = syndicatorFunderCache.get(cacheKey);
    if (cachedResult) {
        return cachedResult;
    }

    // If not in cache, query database
    const syndicators = await SyndicatorFunder.find({ 
        funder: funderId,
        inactive: { $ne: true }
    }, null, { session });
    const uniqueSyndicators = syndicators.map(syndicator => syndicator.syndicator.toString());
    
    // Cache the result
    syndicatorFunderCache.set(cacheKey, uniqueSyndicators);
    
    return uniqueSyndicators;
};

/**
 * Get all syndicators associated with a list of funders (with caching)
 * @param {Array} funderIds - An array of funder IDs
 * @returns {Promise<Array>} - An array of syndicators
 */
exports.getSyndicatorsByFunderIds = async (funderIds, session = null) => {
    const cacheKey = syndicatorFunderCache._getFundersCacheKey(funderIds);
    
    // Try to get from cache first
    const cachedResult = syndicatorFunderCache.get(cacheKey);
    if (cachedResult) {
        return cachedResult;
    }

    // If not in cache, query database
    const syndicators = await SyndicatorFunder.find({ 
        funder: { $in: funderIds },
        inactive: { $ne: true }
    }, null, { session });

    // Extract syndicator IDs and remove duplicates using Set
    const uniqueSyndicators = [...new Set(syndicators.map(syndicator => syndicator.syndicator.toString()))];
    
    // Cache the result
    syndicatorFunderCache.set(cacheKey, uniqueSyndicators);
    
    return uniqueSyndicators;
};


/**
 * Create a new syndicator-funder
 * @param {Object} data - The data of the syndicator-funder
 * @param {Array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @param {boolean} calculate - Whether to calculate the available balance
 * @returns {Promise<Object>} - The created syndicator-funder
 */
exports.createSyndicatorFunder = async (data, populate = [], select = '', calculate = false) => {
    // Check if the syndicator funder is already in the database
    const { syndicator, funder, ...rest } = data;
    let syndicatorFunder = await SyndicatorFunder.findOne({ syndicator, funder });

    if (syndicatorFunder && syndicatorFunder.inactive) {
        rest.inactive = false;      // If the syndicator funder is inactive, make it active again and update the other fields
    }

    syndicatorFunder = await SyndicatorFunder.findOneAndUpdate({ syndicator, funder }, formatDataBeforeSave(rest), { new: true, upsert: true, runValidators: true });

    Validators.checkResourceNotFound(syndicatorFunder, 'Syndicator-Funder');

    // Invalidate cache for both syndicator and funder
    syndicatorFunderCache.invalidateSyndicator(syndicator);
    syndicatorFunderCache.invalidateFunder(funder);

    return await this.getSyndicatorFunderById(syndicatorFunder._id, populate, select, calculate);
};

/**
 * Get syndicator-funder by ID
 * @param {string} id - The ID of the syndicator-funder
 * @param {Array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @param {boolean} calculate - Whether to calculate the available balance
 * @param {Object} session - MongoDB session for transaction support
 * @returns {Promise<Object>} - The syndicator-funder
 */
exports.getSyndicatorFunderById = async (id, populate = [], select = '', calculate = false, session = null) => {
    Validators.checkValidateObjectId(id, 'syndicator-funder ID');

    const syndicatorFunder = await SyndicatorFunder
        .findById(id, null, { calculate, session })
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(syndicatorFunder, 'Syndicator-Funder');

    return formatDataBeforeReturn(syndicatorFunder);
};

/**
 * get all syndicator-funder
 * @param {Object} query - The query of the syndicator-funder
 * @param {number} page - The page of the syndicator-funder
 * @param {number} limit - The limit of the syndicator-funder
 * @param {Object} sort - The sort of the syndicator-funder
 * @returns {Promise<Object>} - The syndicator-funder
 */
exports.getSyndicatorFunders = async (query, sort = {}, page = 1, limit = 10, populate = [], select = '', calculate = false) => {
    const skip = (page - 1) * limit;
    const [syndicatorFunder, count] = await Promise.all([
        SyndicatorFunder.find(query, null, { calculate })
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        SyndicatorFunder.countDocuments(query)
    ]);
    return {
        docs: syndicatorFunder.map(formatDataBeforeReturn),
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of syndicator-funder without pagination
 * @param {Object} query - The query of the syndicator-funder
 * @param {Object} sort - The sort of the syndicator-funder
 * @param {Array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @param {boolean} calculate - Whether to calculate the available balance
 * @returns {Promise<Array>} - The syndicator-funder
 */
exports.getSyndicatorFunderList = async (query, sort = { _id: -1 }, populate = [], select = '', calculate = false, session = null) => {
    const syndicatorFunders = await SyndicatorFunder.find(query, null, { calculate, session })
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();

    return syndicatorFunders.map(formatDataBeforeReturn);
};

/**
 * Update a syndicator-funder
 * @param {string} id - The ID of the syndicator-funder
 * @param {Object} data - The data to update
 * @returns {Promise<Object>} - The updated syndicator-funder
 */
exports.updateSyndicatorFunder = async (id, data, populate = [], select = '', calculate = false) => {
    Validators.checkValidateObjectId(id, 'syndicator-funder ID');

    const existingSyndicatorFunder = await SyndicatorFunder.findById(id);
    const updatedSyndicatorFunder = await SyndicatorFunder.findByIdAndUpdate(id, formatDataBeforeSave(data), { new: true, runValidators: true });

    Validators.checkResourceNotFound(updatedSyndicatorFunder, 'Syndicator-Funder');

    // Invalidate cache for both syndicator and funder
    if (existingSyndicatorFunder?.syndicator) {
        syndicatorFunderCache.invalidateSyndicator(existingSyndicatorFunder.syndicator.toString());
    }
    if (existingSyndicatorFunder?.funder) {
        syndicatorFunderCache.invalidateFunder(existingSyndicatorFunder.funder.toString());
    }

    return await this.getSyndicatorFunderById(updatedSyndicatorFunder._id, populate, select, calculate);
};

/**
 * Delete a syndicator-funder
 * @param {string} id - The ID of the syndicator-funder
 * @returns {Promise<Object>} - The deleted syndicator-funder
 */
exports.deleteSyndicatorFunder = async (id, populate = [], select = '', calculate = false) => {
    Validators.checkValidateObjectId(id, 'syndicator-funder ID');

    const existingSyndicatorFunder = await SyndicatorFunder.findById(id);
    const deletedSyndicatorFunder = await SyndicatorFunder.findByIdAndUpdate(id, { inactive: true }, { new: true });

    Validators.checkResourceNotFound(deletedSyndicatorFunder, 'Syndicator-Funder');

    // Invalidate cache for both syndicator and funder
    if (existingSyndicatorFunder?.syndicator) {
        syndicatorFunderCache.invalidateSyndicator(existingSyndicatorFunder.syndicator.toString());
    }
    if (existingSyndicatorFunder?.funder) {
        syndicatorFunderCache.invalidateFunder(existingSyndicatorFunder.funder.toString());
    }

    return await this.getSyndicatorFunderById(deletedSyndicatorFunder._id, populate, select, calculate);
};

/**
 * Get syndicator-funder by syndicator and funder
 * @param {string} syndicatorId - The ID of the syndicator
 * @param {string} funderId - The ID of the funder
 * @returns {Promise<Object>} - The syndicator-funder
 */
exports.getSyndicatorFunderBySyndicatorAndFunder = async (syndicatorId, funderId, populate = [], select = '', calculate = false) => {
    const syndicatorFunder = await SyndicatorFunder.findOne({ syndicator: syndicatorId, funder: funderId }, null, { calculate })
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(syndicatorFunder, 'Syndicator-Funder');

    return formatDataBeforeReturn(syndicatorFunder);
};

/**
 * Update syndicator-funder available balance
 * @param {string} id - The ID of the syndicator-funder
 * @param {number} amount - The amount to update
 * @returns {Promise<Object>} - The updated syndicator-funder
 */
exports.updateSyndicatorFunderAvailableBalance = async (syndicatorId, funderId, amount, populate = [], select = '', calculate = false) => {

    const syndicatorFunder = await SyndicatorFunder.findOneAndUpdate({ syndicator: syndicatorId, funder: funderId }, { $inc: { available_balance: Helpers.dollarsToCents(amount) } }, { new: true, runValidators: true });

    Validators.checkResourceNotFound(syndicatorFunder, 'Syndicator-Funder');

    // Invalidate cache for both syndicator and funder when balance is updated
    syndicatorFunderCache.invalidateSyndicator(syndicatorId);
    syndicatorFunderCache.invalidateFunder(funderId);

    return await this.getSyndicatorFunderById(syndicatorFunder._id, populate, select, calculate);
};

/**
 * Get cache statistics and management functions
 * @returns {Object} - Cache management functions
 */
exports.cache = {
    getStats: () => syndicatorFunderCache.getStats(),
    clear: () => syndicatorFunderCache.clear(),
    invalidateSyndicator: (syndicatorId) => syndicatorFunderCache.invalidateSyndicator(syndicatorId),
    invalidateFunder: (funderId) => syndicatorFunderCache.invalidateFunder(funderId)
};