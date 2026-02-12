const OrgMeterApiService = require('./orgMeterApiService');
const OrgMeterLender = require('../../../models/OrgMeter/Lender');
const { model: OrgMeterUnderwriterUser } = require('../../../models/OrgMeter/UnderwriterUser');
const ErrorResponse = require('../../../utils/errorResponse');

/**
 * Import OrgMeter lenders from API
 */
class ImportLenderFromApiService {
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
     * Import all lenders from OrgMeter API
     * @param {Object} options - Import options
     * @returns {Object} Import results
     */
    async importAllLenders(options = {}) {
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

            // Fetch all lenders from API
            console.log('Fetching all lenders from OrgMeter API...');
            const lenders = await this.orgMeterApiService.fetchAllEntities('lender');
            this.importStats.totalFetched = lenders.length;

            if (lenders.length === 0) {
                console.log('No lenders found in OrgMeter API');
                return this.getImportResults();
            }

            console.log(`Fetched ${lenders.length} lenders from OrgMeter API`);

            if (dryRun) {
                console.log('Dry run mode - not saving to database');
                return this.getImportResults();
            }

            // Process and save lenders
            for (let i = 0; i < lenders.length; i++) {
                const lender = lenders[i];
                try {
                    // Get each lender from the API
                    await this.processLender(lender, updateExisting);
                } catch (error) {
                    console.error(`Error processing lender ${lender.id}:`, error.message);
                    this.importStats.errors.push({
                        lenderId: lender.id,
                        error: error.message
                    });
                }
                
                // Update progress once per iteration regardless of outcome
                if (progressCallback) {
                    await progressCallback(i + 1, lenders.length, lender.name || lender.id);
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
     * Process and save a single lender
     * @param {Object} lenderData - Lender data from API
     * @param {boolean} updateExisting - Whether to update existing records
     */
    async processLender(lenderData, updateExisting = true) {
        try {
            // Extract underwriter users for separate processing
            const underwriterUsers = lenderData.underwriterUsers || [];
            
            // Keep the original lender data with underwriterUsers intact
            // (We'll save them separately but also keep them in the lender record)

            // Check if lender already exists for this funder
            const existingLender = await OrgMeterLender.findOne({ id: lenderData.id, 'importMetadata.funder': this.funder });

            if (existingLender) {
                if (updateExisting) {
                    // Update existing lender (keeping underwriterUsers in the lender record)
                    await this.updateLender(existingLender, lenderData);
                    this.importStats.totalUpdated++;
                    console.log(`Updated lender ${lenderData.id}`);
                } else {
                    this.importStats.totalSkipped++;
                    console.log(`Skipped existing lender ${lenderData.id}`);
                }
            } else {
                // Create new lender (keeping underwriterUsers in the lender record)
                await this.createLender(lenderData);
                this.importStats.totalSaved++;
                console.log(`Created new lender ${lenderData.id}`);
            }

            // Process underwriter users separately if any exist
            if (underwriterUsers.length > 0) {
                await this.processBulkUnderwriterUsers(underwriterUsers, updateExisting);
                console.log(`Processed ${underwriterUsers.length} underwriter users for lender ${lenderData.id}`);
            }

        } catch (error) {
            console.error(`Error processing lender ${lenderData.id}:`, error.message);
            throw error;
        }
    }

    /**
     * Process underwriter users using bulk operations
     * @param {Array} underwriterUsers - Array of underwriter user data
     * @param {boolean} updateExisting - Whether to update existing records
     */
    async processBulkUnderwriterUsers(underwriterUsers, updateExisting = true) {
        try {
            if (!updateExisting) {
                // If not updating existing, filter out users that already exist
                const existingUserIds = await OrgMeterUnderwriterUser.distinct('id', {
                    id: { $in: underwriterUsers.map(u => u.id) },
                    'importMetadata.funder': this.funder
                });
                
                const newUsers = underwriterUsers.filter(u => !existingUserIds.includes(u.id));
                
                if (newUsers.length === 0) {
                    console.log('All underwriter users already exist, skipping');
                    return;
                }
                
                // Bulk insert new users
                const usersToInsert = newUsers.map(user => ({
                    ...user,
                    importMetadata: {
                        funder: this.funder,
                        source: 'orgmeter_api',
                        importedAt: new Date(),
                        importedBy: 'api_import_service'
                    },
                    syncMetadata: {
                        needsSync: true,
                        lastSyncedAt: null,
                        lastSyncedBy: null,
                        syncId: null
                    }
                }));

                await OrgMeterUnderwriterUser.insertMany(usersToInsert, { ordered: false });
                console.log(`Bulk inserted ${usersToInsert.length} new underwriter users`);
                return;
            }

            // For upsert operations, handle existing import metadata carefully
            const bulkOps = [];
            const currentTime = new Date();

            // Get existing users to preserve their metadata
            const existingUsers = await OrgMeterUnderwriterUser.find({
                id: { $in: underwriterUsers.map(u => u.id) },
                'importMetadata.funder': this.funder
            }).select('id importMetadata syncMetadata');

            const existingUsersMap = new Map(
                existingUsers.map(u => [u.id, { importMetadata: u.importMetadata, syncMetadata: u.syncMetadata }])
            );

            for (const user of underwriterUsers) {
                let importMetadata, syncMetadata;
                
                if (existingUsersMap.has(user.id)) {
                    // Preserve existing metadata and update timestamp
                    const existing = existingUsersMap.get(user.id);
                    importMetadata = {
                        ...existing.importMetadata,
                        lastUpdatedAt: currentTime,
                        lastUpdatedBy: 'api_import_service'
                    };
                    syncMetadata = existing.syncMetadata;
                } else {
                    // Create new metadata for new users
                    importMetadata = {
                        funder: this.funder,
                        source: 'orgmeter_api',
                        importedAt: currentTime,
                        importedBy: 'api_import_service'
                    };
                    syncMetadata = {
                        needsSync: true,
                        lastSyncedAt: null,
                        lastSyncedBy: null,
                        syncId: null
                    };
                }

                bulkOps.push({
                    updateOne: {
                        filter: { 
                            id: user.id, 
                            'importMetadata.funder': this.funder 
                        },
                        update: {
                            $set: {
                                ...user,
                                importMetadata: importMetadata,
                                syncMetadata: syncMetadata
                            }
                        },
                        upsert: true
                    }
                });
            }

            // Execute bulk operations in batches for better performance
            const batchSize = 1000;
            for (let i = 0; i < bulkOps.length; i += batchSize) {
                const batch = bulkOps.slice(i, i + batchSize);
                const result = await OrgMeterUnderwriterUser.bulkWrite(batch, { ordered: false });
                
                console.log(`Processed underwriter user batch ${Math.floor(i / batchSize) + 1}: ${result.upsertedCount} inserted, ${result.modifiedCount} updated`);
            }

            console.log(`Bulk processed ${underwriterUsers.length} underwriter users`);

        } catch (error) {
            console.error(`Failed to process bulk underwriter users: ${error.message}`);
            // Don't throw here to avoid breaking the main lender import
            this.importStats.errors.push({
                error: `Underwriter users processing failed: ${error.message}`
            });
        }
    }

    /**
     * Create a new lender record
     * @param {Object} lenderData - Lender data from API
     */
    async createLender(lenderData) {
        try {
            const lender = new OrgMeterLender({
                ...lenderData,
                importMetadata: {
                    funder: this.funder,
                    source: 'orgmeter_api',
                    importedAt: new Date(),
                    importedBy: 'api_import_service'
                },
                syncMetadata: {
                    needsSync: !lenderData.deleted,
                    lastSyncedAt: null,
                    lastSyncedBy: null,
                    syncId: null
                }
            });

            await lender.save();
            return lender;

        } catch (error) {
            throw new Error(`Failed to create lender: ${error.message}`);
        }
    }

    /**
     * Update an existing lender record
     * @param {Object} existingLender - Existing lender document
     * @param {Object} lenderData - New lender data from API
     */
    async updateLender(existingLender, lenderData) {
        try {
            // Update fields while preserving import metadata
            Object.assign(existingLender, {
                ...lenderData,
                importMetadata: {
                    ...existingLender.importMetadata,
                    lastUpdatedAt: new Date(),
                    lastUpdatedBy: 'api_import_service'
                }
            });

            await existingLender.save();
            return existingLender;

        } catch (error) {
            throw new Error(`Failed to update lender: ${error.message}`);
        }
    }

    /**
     * Import specific lenders by IDs
     * @param {Array} lenderIds - Array of lender IDs to import
     * @param {Object} options - Import options
     * @returns {Object} Import results
     */
    async importLendersByIds(lenderIds, options = {}) {
        const { updateExisting = true, dryRun = false } = options;

        try {
            console.log(`Importing ${lenderIds.length} specific lenders...`);

            for (const lenderId of lenderIds) {
                try {
                    // Fetch individual lender from API
                    const lenderData = await this.orgMeterApiService.fetchEntityById('lender', lenderId);
                    this.importStats.totalFetched++;

                    if (!dryRun) {
                        await this.processLender(lenderData, updateExisting);
                    }

                } catch (error) {
                    console.error(`Error importing lender ${lenderId}:`, error.message);
                    this.importStats.errors.push({
                        lenderId: lenderId,
                        error: error.message
                    });
                }
            }

            return this.getImportResults();

        } catch (error) {
            throw new ErrorResponse(`Failed to import lenders by IDs: ${error.message}`, 500);
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

module.exports = ImportLenderFromApiService; 