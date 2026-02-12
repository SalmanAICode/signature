const OrgMeterApiService = require('./orgMeterApiService');
const OrgMeterUser = require('../../../models/OrgMeter/User');
const ErrorResponse = require('../../../utils/errorResponse');

/**
 * Import OrgMeter users from API
 */
class ImportUserFromApiService {
    constructor(apiKey, funder) {
        this.importStats = {
            totalFetched: 0,
            totalSaved: 0,
            totalUpdated: 0,
            totalSkipped: 0,
            errors: []
        };
        this.orgMeterApiService = new OrgMeterApiService(apiKey);
        this.funder = funder;
    }

    /**
     * Import all users from OrgMeter API
     * @param {Object} options - Import options
     * @returns {Object} Import results
     */
    async importAllUsers(options = {}) {
        const {
            updateExisting = true,
            dryRun = false,
            progressCallback = null
        } = options;

        try {
            console.log('Starting OrgMeter API import...');
            
            // Test API connection first
            const isConnected = await this.orgMeterApiService.testConnection();
            if (!isConnected) {
                throw new ErrorResponse('Failed to connect to OrgMeter API', 500);
            }

            // Fetch all users from API
            console.log('Fetching all users from OrgMeter API...');
            const users = await this.orgMeterApiService.fetchAllEntities('user');
            this.importStats.totalFetched = users.length;

            if (users.length === 0) {
                console.log('No users found in OrgMeter API');
                return this.getImportResults();
            }

            console.log(`Fetched ${users.length} users from OrgMeter API`);

            if (dryRun) {
                console.log('Dry run mode - not saving to database');
                return this.getImportResults();
            }

            // Process and save users
            for (let i = 0; i < users.length; i++) {
                const user = users[i];
                try {
                    // Process each user from the API
                    await this.processUser(user, updateExisting);
                } catch (error) {
                    console.error(`Error processing user ${user.id}:`, error.message);
                    this.importStats.errors.push({
                        userId: user.id,
                        error: error.message
                    });
                }
                
                // Update progress once per iteration regardless of outcome
                if (progressCallback) {
                    await progressCallback(i + 1, users.length, user.firstName || user.username || user.id);
                }
                
                await this.orgMeterApiService.delay();  // Add a small delay to avoid hitting rate limits
            }

            console.log('OrgMeter API import completed');
            return this.getImportResults();

        } catch (error) {
            console.error('Error during OrgMeter API import:', error.message);
            throw new ErrorResponse(`Import failed: ${error.message}`, 500);
        }
    }

    /**
     * Process and save a single user
     * @param {Object} userData - User data from API
     * @param {boolean} updateExisting - Whether to update existing records
     */
    async processUser(userData, updateExisting = true) {
        try {
            // Skip deleted users
            if (userData.deleted) {
                this.importStats.totalSkipped++;
                console.log(`Skipped deleted user ${userData.id}`);
                return;
            }

            // Check if user already exists for this funder
            const existingUser = await OrgMeterUser.findOne({ id: userData.id, 'importMetadata.funder': this.funder });

            if (existingUser) {
                if (updateExisting) {
                    // Update existing user
                    await this.updateUser(existingUser, userData);
                    this.importStats.totalUpdated++;
                    console.log(`Updated user ${userData.id}`);
                } else {
                    this.importStats.totalSkipped++;
                    console.log(`Skipped existing user ${userData.id}`);
                }
            } else {
                // Create new user
                await this.createUser(userData);
                this.importStats.totalSaved++;
                console.log(`Created new user ${userData.id}`);
            }

        } catch (error) {
            console.error(`Error processing user ${userData.id}:`, error.message);
            throw error;
        }
    }

    /**
     * Create a new user record
     * @param {Object} userData - User data from API
     */
    async createUser(userData) {
        try {
            const user = new OrgMeterUser({
                ...userData,
                importMetadata: {
                    funder: this.funder,
                    source: 'orgmeter_api',
                    importedAt: new Date(),
                    importedBy: 'api_import_service'
                },
                syncMetadata: {
                    needsSync: userData.enabled,
                    lastSyncedAt: null,
                    lastSyncedBy: null,
                    syncId: null
                }
            });

            await user.save();
            return user;

        } catch (error) {
            throw new Error(`Failed to create user: ${error.message}`);
        }
    }

    /**
     * Update an existing user record
     * @param {Object} existingUser - Existing user document
     * @param {Object} userData - New user data from API
     */
    async updateUser(existingUser, userData) {
        try {
            // Update fields while preserving import metadata
            Object.assign(existingUser, {
                ...userData,
                importMetadata: {
                    ...existingUser.importMetadata,
                    lastUpdatedAt: new Date(),
                    lastUpdatedBy: 'api_import_service'
                }
            });

            await existingUser.save();
            return existingUser;

        } catch (error) {
            throw new Error(`Failed to update user: ${error.message}`);
        }
    }

    /**
     * Import specific users by IDs
     * @param {Array} userIds - Array of user IDs to import
     * @param {Object} options - Import options
     * @returns {Object} Import results
     */
    async importUsersByIds(userIds, options = {}) {
        const { updateExisting = true, dryRun = false } = options;

        try {
            console.log(`Importing ${userIds.length} specific users...`);

            for (const userId of userIds) {
                try {
                    // Fetch individual user from API
                    const userData = await this.orgMeterApiService.fetchEntityById('user', userId);
                    this.importStats.totalFetched++;

                    if (!dryRun) {
                        await this.processUser(userData, updateExisting);
                    }

                } catch (error) {
                    console.error(`Error importing user ${userId}:`, error.message);
                    this.importStats.errors.push({
                        userId: userId,
                        error: error.message
                    });
                }
            }

            return this.getImportResults();

        } catch (error) {
            throw new ErrorResponse(`Failed to import users by IDs: ${error.message}`, 500);
        }
    }

    /**
     * Get import results summary
     * @returns {Object} Import statistics
     */
    getImportResults() {
        return {
            success: true,
            message: 'Import completed',
            stats: {
                totalFetched: this.importStats.totalFetched,
                totalSaved: this.importStats.totalSaved,
                totalUpdated: this.importStats.totalUpdated,
                totalSkipped: this.importStats.totalSkipped,
                totalProcessed: this.importStats.totalSaved + this.importStats.totalUpdated + this.importStats.totalSkipped,
                errorCount: this.importStats.errors.length,
                errors: this.importStats.errors
            }
        };
    }

    /**
     * Reset import statistics
     */
    resetStats() {
        this.importStats = {
            totalFetched: 0,
            totalSaved: 0,
            totalUpdated: 0,
            totalSkipped: 0,
            errors: []
        };
    }
}

module.exports = ImportUserFromApiService; 