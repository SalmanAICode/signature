const axios = require('axios');

/**
 * OrgMeter API Service
 * Handles all API calls to the OrgMeter platform
 */
class OrgMeterApiService {
    constructor(apiKey) {
        this.baseURL = process.env.ORGMETER_API_URL || 'https://app.orgmeter.com/api/main/v1';
        this.apiKey = apiKey;
        
        // Create axios instance with default configuration
        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authorization': `${this.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 30000 // 30 second timeout
        });

        // Add request interceptor for logging
        this.client.interceptors.request.use(
            (config) => {
                console.log(`OrgMeter API Request: ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                console.error('OrgMeter API Request Error:', error);
                return Promise.reject(error);
            }
        );

        // Add response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => {
                console.log(`OrgMeter API Response: ${response.status} ${response.config.url}`);
                return response;
            },
            (error) => {
                console.error('OrgMeter API Response Error:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    url: error.config?.url,
                    message: error.message
                });
                return Promise.reject(error);
            }
        );
    }

    /**
     * Generic function to fetch data from OrgMeter API
     * @param {string} endpoint - API endpoint (e.g., '/advances')
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} API response data
     */
    async fetchData(endpoint, params = {}) {
        try{
            const response = await this.client.get(endpoint, { params });
            return response.data;
        } catch (error) {
            throw new Error(`Failed to fetch data from ${endpoint}: ${error.message}`);
        }
    }

    /**
     * Generic function to fetch entities from a specific page
     * @param {string} entityType - Type of entity (advance, iso, merchant, lender)
     * @param {number} page - Page number (starts from 1)
     * @returns {Promise<Array>} Array of entity objects
     */
    async fetchEntityPage(entityType, page = 1) {
        const params = { page };
        const endpoint = `/${entityType}`;
        const data = await this.fetchData(endpoint, params);
        
        if (Array.isArray(data)) {
            return data;
        } else if (data.data && Array.isArray(data.data)) {
            return data.data;
        }
        return [];
    }

    /**
     * Generic function to fetch one sub-entity from a specific page
     * @param {string} entityType - Type of entity (advance, iso, merchant, lender)
     * @param {number} entityId - The entity ID
     * @param {string} subEntityType - Type of sub-entity (payment)
     * @param {number} page - Page number (starts from 1)
     * @returns {Promise<Object>} Sub-entity object
     */
    async fetchOneSubEntity(entityType, entityId, subEntityType, page = 1) {
        const params = { page };
        const endpoint = `/${entityType}/${entityId}/${subEntityType}`;
        const data = await this.fetchData(endpoint, params);
        return data;
    }

    /**
     * Generic function to fetch sub-entities from a specific page
     * @param {string} entityType - Type of entity (advance, iso, merchant, lender)
     * @param {number} entityId - The entity ID
     * @param {string} subEntityType - Type of sub-entity (payment)
     * @param {number} page - Page number (starts from 1)
     * @returns {Promise<Array>} Array of sub-entity objects
     */
    async fetchSubEntityPage(entityType, entityId, subEntityType, page = 1) {
        const params = { page };
        const endpoint = `/${entityType}/${entityId}/${subEntityType}`;
        const data = await this.fetchData(endpoint, params);
        return data;
    }

    /**
     * Generic function to fetch all entities by iterating through all pages
     * @param {string} entityType - Type of entity (advance, iso, merchant, lender)
     * @param {number} startPage - Starting page number (default: 1)
     * @param {number} limit - Limit number of records (optional)
     * @returns {Promise<Array>} Array of all entity objects
     */
    async fetchAllEntities(entityType, startPage = 1, limit = undefined) {
        const allEntities = [];
        let currentPage = startPage;
        let hasMoreData = true;
        const entityTypePlural = `${entityType}s`;

        console.log(`Starting to fetch all ${entityTypePlural} from OrgMeter API...`);

        try {
            while (hasMoreData) {
                const pageData = await this.fetchEntityPage(entityType, currentPage);
                
                if (!pageData || pageData.length === 0) {
                    console.log(`No more data found at page ${currentPage}. Stopping.`);
                    hasMoreData = false;
                } else {
                    console.log(`Fetched ${pageData.length} ${entityTypePlural} from page ${currentPage}`);
                    const leftToFetch = limit ? limit - allEntities.length : pageData.length;
                    if (leftToFetch <= 0) {
                        console.log(`Reached limit of ${limit} ${entityTypePlural}. Stopping.`);
                        hasMoreData = false;
                    } else {
                        console.log(`Fetched ${leftToFetch} ${entityTypePlural} from page ${currentPage}`);
                        allEntities.push(...pageData.slice(0, leftToFetch));
                    }

                    currentPage++;
                    
                    // Add a small delay to avoid hitting rate limits
                    await this.delay(100);
                }
            }

            console.log(`Successfully fetched ${allEntities.length} total ${entityTypePlural} from ${currentPage - 1} pages`);
            return allEntities;
        } catch (error) {
            console.error(`Error fetching all ${entityTypePlural}:`, error.message);
            throw new Error(`Failed to fetch all ${entityTypePlural}: ${error.message}`);
        }
    }

    /**
     * Generic function to fetch all sub-entities by iterating through all pages
     * @param {string} entityType - Type of entity (advance, iso, merchant, lender)
     * @param {number} entityId - The entity ID
     * @param {string} subEntityType - Type of sub-entity (payment, underwriting)
     * @param {number} startPage - Starting page number (default: 1)
     * @param {number} limit - Limit number of records (optional)
     * @returns {Promise<Array>} Array of all entity objects
     */
    async fetchAllSubEntities(entityType, entityId, subEntityType, startPage = 1, limit = undefined) {
        const allEntities = [];
        let currentPage = startPage;
        let hasMoreData = true;
        const subEntityTypePlural = `${subEntityType}s`;

        console.log(`Starting to fetch all ${subEntityTypePlural} for ${entityType} ${entityId} from OrgMeter API...`);

        try {
            while (hasMoreData) {
                const pageData = await this.fetchSubEntityPage(entityType, entityId, subEntityType, currentPage);
                
                // Handle different API response structures
                let dataArray;
                if (Array.isArray(pageData)) {
                    dataArray = pageData;
                } else if (pageData && typeof pageData === 'object') {
                    // For single objects (like underwriting), wrap in array
                    if (pageData.data && Array.isArray(pageData.data)) {
                        dataArray = pageData.data;
                    } else if (pageData.id || pageData._id) {
                        // Single object with ID, treat as single item
                        dataArray = [pageData];
                    } else {
                        // No recognizable data structure
                        dataArray = [];
                    }
                } else {
                    dataArray = [];
                }
                
                if (!dataArray || dataArray.length === 0) {
                    console.log(`No more data found at page ${currentPage}. Stopping.`);
                    hasMoreData = false;
                } else {
                    console.log(`Fetched ${dataArray.length} ${subEntityTypePlural} from page ${currentPage}`);
                    const leftToFetch = limit ? limit - allEntities.length : dataArray.length;
                    if (leftToFetch <= 0) {
                        console.log(`Reached limit of ${limit} ${subEntityTypePlural}. Stopping.`);
                        hasMoreData = false;
                    } else {
                        const itemsToAdd = dataArray.slice(0, leftToFetch);
                        console.log(`Adding ${itemsToAdd.length} ${subEntityTypePlural} from page ${currentPage}`);
                        allEntities.push(...itemsToAdd);
                    }

                    // For single object responses (like underwriting), stop after first page
                    if (dataArray.length === 1 && !Array.isArray(pageData)) {
                        console.log(`Single ${subEntityType} response detected, stopping pagination.`);
                        hasMoreData = false;
                    } else {
                        currentPage++;
                    }
                    
                    // Add a small delay to avoid hitting rate limits
                    await this.delay(100);
                }
            }

            console.log(`Successfully fetched ${allEntities.length} total ${subEntityTypePlural} from ${currentPage - 1} pages`);
            return allEntities;
        } catch (error) {
            console.error(`Error fetching all ${subEntityTypePlural} for ${entityType} ${entityId}:`, error.message);
            throw new Error(`Failed to fetch all ${subEntityTypePlural}: ${error.message}`);
        }
    }

    /**
     * Generic function to fetch a specific entity by ID
     * @param {string} entityType - Type of entity (advance, iso, merchant, lender)
     * @param {number} entityId - The entity ID
     * @returns {Promise<Object>} Entity object
     */
    async fetchEntityById(entityType, entityId) {
        try {
            console.log(`Fetching ${entityType} with ID: ${entityId}`);
            const data = await this.fetchData(`/${entityType}/${entityId}`);
            return data;
        } catch (error) {
            console.error(`Error fetching ${entityType} ${entityId}:`, error.message);
            throw error;
        }
    }



    /**
     * Get total count of entities available in the API
     * @param {string} entityType - Type of entity (advance, iso, merchant, lender, etc.)
     * @returns {Promise<number>} Total count of entities
     */
    async getTotalCount(entityType) {
        try {
            console.log(`Getting total count for ${entityType}...`);
            
            // First, try to get count from API metadata if available
            const firstPageData = await this.fetchData(`/${entityType}`, { page: 1 });
            
            // If API returns pagination metadata, use it
            if (firstPageData.total) {
                return firstPageData.total;
            }
            
            // If API returns count metadata, use it
            if (firstPageData.count) {
                return firstPageData.count;
            }
            
            // Otherwise, estimate by fetching pages until we find the end
            let totalCount = 0;
            let currentPage = 1;
            let hasMoreData = true;
            
            while (hasMoreData) {
                const pageData = await this.fetchEntityPage(entityType, currentPage);
                
                if (!pageData || pageData.length === 0) {
                    hasMoreData = false;
                } else {
                    totalCount += pageData.length;
                    currentPage++;
                    
                    // Add a delay to avoid rate limiting
                    await this.delay(50);
                    
                    // Safety check to prevent infinite loops
                    if (currentPage > 1000) {
                        console.warn(`Stopped counting at page ${currentPage} for safety`);
                        break;
                    }
                }
            }
            
            console.log(`Total count for ${entityType}: ${totalCount}`);
            return totalCount;
            
        } catch (error) {
            console.error(`Error getting total count for ${entityType}:`, error.message);
            // Return 0 if we can't determine the count
            return 0;
        }
    }

    /**
     * Get API information for debugging
     * @returns {Object} API configuration info
     */
    getApiInfo() {
        return {
            baseURL: this.baseURL,
            hasApiKey: !!this.apiKey,
            timeout: this.client.defaults.timeout
        };
    }

    /**
     * Test API connectivity
     * @returns {Promise<boolean>} True if API is accessible
     */
    async testConnection() {
        try {
            console.log('Testing OrgMeter API connection...');
            await this.fetchData('/lender', { page: 1 });
            console.log('OrgMeter API connection successful');
            return true;
        } catch (error) {
            console.error('OrgMeter API connection failed:', error.message);
            return false;
        }
    }

    /**
     * Utility function to add delay
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export the class directly
module.exports = OrgMeterApiService; 