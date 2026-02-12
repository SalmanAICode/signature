const OrgMeterApiService = require('./orgMeterApiService');
const OrgMeterIso = require('../../../models/OrgMeter/Iso');
const { model: OrgMeterSalesRepUser } = require('../../../models/OrgMeter/SalesRepUser');
const ErrorResponse = require('../../../utils/errorResponse');

/**
 * Import OrgMeter isos from API
 */
class ImportIsoFromApiService {
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
     * Import all isos from OrgMeter API
     * @param {Object} options - Import options
     * @returns {Object} Import results
     */
    async importAllIsos(options = {}) {
        const {
            updateExisting = true,
            dryRun = false,
            progressCallback = null
        } = options;

        try {
            console.log('Starting OrgMeter API isos import...');
            
            // Test API connection first
            const isConnected = await this.orgMeterApiService.testConnection();
            if (!isConnected) {
                throw new ErrorResponse('Failed to connect to OrgMeter API', 500);
            }

            // Fetch all isos from API
            console.log('Fetching all isos from OrgMeter API...');
            const isos = await this.orgMeterApiService.fetchAllEntities('iso');
            this.importStats.totalFetched = isos.length;

            if (isos.length === 0) {
                console.log('No isos found in OrgMeter API');
                return this.getImportResults();
            }

            console.log(`Fetched ${isos.length} isos from OrgMeter API`);

            if (dryRun) {
                console.log('Dry run mode - not saving to database');
                return this.getImportResults();
            }

            // Process and save isos
            for (let i = 0; i < isos.length; i++) {
                const iso = isos[i];
                if (iso.deleted) {
                    this.importStats.totalSkipped++;
                    console.log(`Skipped deleted iso ${iso.id}`);
                } else {
                    try {
                        // Get each iso from the API
                        const isoData = await this.orgMeterApiService.fetchEntityById('iso', iso.id);
                        await this.processIso(isoData, updateExisting);
                    } catch (error) {
                        console.error(`Error processing iso ${iso.id}:`, error.message);
                        this.importStats.errors.push({
                            isoId: iso.id,
                            error: error.message
                        });
                    }
                }
                
                // Update progress once per iteration regardless of outcome
                if (progressCallback) {
                    await progressCallback(i + 1, isos.length, iso.name || iso.id);
                }
                
                await this.orgMeterApiService.delay(100);  // Add a small delay to avoid hitting rate limits
            }

            console.log('OrgMeter API import completed');
            return this.getImportResults();

        } catch (error) {
            console.error('Error during OrgMeter API import:', error.message);
            throw new ErrorResponse(`Import failed: ${error.message}`, 500);
        }
    }

    /**
     * Process and save a single iso
     * @param {Object} isoData - Iso data from API
     * @param {boolean} updateExisting - Whether to update existing records
     */
    async processIso(isoData, updateExisting = true) {
        try {
            // Extract sales rep users for separate processing
            const salesRepUsers = isoData.salesRepUsers || [];
            
            // Keep the original iso data with salesRepUsers intact
            // (We'll save them separately but also keep them in the iso record)

            // Check if iso already exists for this funder
            const existingIso = await OrgMeterIso.findOne({ id: isoData.id, 'importMetadata.funder': this.funder });

            if (existingIso) {
                if (updateExisting) {
                    // Update existing iso (keeping salesRepUsers in the iso record)
                    await this.updateIso(existingIso, isoData);
                    this.importStats.totalUpdated++;
                    console.log(`Updated iso ${isoData.id}`);
                } else {
                    this.importStats.totalSkipped++;
                    console.log(`Skipped existing iso ${isoData.id}`);
                }
            } else {
                // Create new iso (keeping salesRepUsers in the iso record)
                await this.createIso(isoData);
                this.importStats.totalSaved++;
                console.log(`Created new iso ${isoData.id}`);
            }

            // Process sales rep users separately if any exist
            if (salesRepUsers.length > 0) {
                await this.processBulkSalesRepUsers(salesRepUsers, updateExisting);
                console.log(`Processed ${salesRepUsers.length} sales rep users for iso ${isoData.id}`);
            }

        } catch (error) {
            console.error(`Error processing iso ${isoData.id}:`, error.message);
            throw error;
        }
    }

    /**
     * Process sales rep users using bulk operations
     * @param {Array} salesRepUsers - Array of sales rep user data
     * @param {boolean} updateExisting - Whether to update existing records
     */
    async processBulkSalesRepUsers(salesRepUsers, updateExisting = true) {
        try {
            if (!updateExisting) {
                // If not updating existing, filter out users that already exist
                const existingUserIds = await OrgMeterSalesRepUser.distinct('id', {
                    id: { $in: salesRepUsers.map(u => u.id) },
                    'importMetadata.funder': this.funder
                });
                
                const newUsers = salesRepUsers.filter(u => !existingUserIds.includes(u.id));
                
                if (newUsers.length === 0) {
                    console.log('All sales rep users already exist, skipping');
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

                await OrgMeterSalesRepUser.insertMany(usersToInsert, { ordered: false });
                console.log(`Bulk inserted ${usersToInsert.length} new sales rep users`);
                return;
            }

            // For upsert operations, handle existing import metadata carefully
            const bulkOps = [];
            const currentTime = new Date();

            // Get existing users to preserve their metadata
            const existingUsers = await OrgMeterSalesRepUser.find({
                id: { $in: salesRepUsers.map(u => u.id) },
                'importMetadata.funder': this.funder
            }).select('id importMetadata syncMetadata');

            const existingUsersMap = new Map(
                existingUsers.map(u => [u.id, { importMetadata: u.importMetadata, syncMetadata: u.syncMetadata }])
            );

            for (const user of salesRepUsers) {
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
                const result = await OrgMeterSalesRepUser.bulkWrite(batch, { ordered: false });
                
                console.log(`Processed sales rep user batch ${Math.floor(i / batchSize) + 1}: ${result.upsertedCount} inserted, ${result.modifiedCount} updated`);
            }

            console.log(`Bulk processed ${salesRepUsers.length} sales rep users`);

        } catch (error) {
            console.error(`Failed to process bulk sales rep users: ${error.message}`);
            // Don't throw here to avoid breaking the main iso import
            this.importStats.errors.push({
                error: `Sales rep users processing failed: ${error.message}`
            });
        }
    }

    /**
     * Create a new iso record
     * @param {Object} isoData - Iso data from API
     */
    async createIso(isoData) {
        try {
            const iso = new OrgMeterIso({
                ...isoData,
                importMetadata: {
                    funder: this.funder,
                    source: 'orgmeter_api',
                    importedAt: new Date(),
                    importedBy: 'api_import_service'
                },
                syncMetadata: {
                    needsSync: !isoData.deleted,
                    lastSyncedAt: null,
                    lastSyncedBy: null,
                    syncId: null
                }
            });

            await iso.save();
            return iso;

        } catch (error) {
            throw new Error(`Failed to create iso: ${error.message}`);
        }
    }

    /**
     * Update an existing iso record
     * @param {Object} existingIso - Existing iso document
     * @param {Object} isoData - New iso data from API
     */
    async updateIso(existingIso, isoData) {
        try {
            // Update fields while preserving import metadata
            Object.assign(existingIso, {
                ...isoData,
                importMetadata: {
                    ...existingIso.importMetadata,
                    lastUpdatedAt: new Date(),
                    lastUpdatedBy: 'api_import_service'
                }
            });

            await existingIso.save();
            return existingIso;

        } catch (error) {
            throw new Error(`Failed to update iso: ${error.message}`);
        }
    }

    /**
     * Import specific isos by IDs
     * @param {Array} isoIds - Array of iso IDs to import
     * @param {Object} options - Import options
     * @returns {Object} Import results
     */
    async importIsosByIds(isoIds, options = {}) {
        const { updateExisting = true, dryRun = false } = options;

        try {
            console.log(`Importing ${isoIds.length} specific isos...`);

            for (const isoId of isoIds) {
                try {
                    // Fetch individual iso from API
                    const isoData = await this.orgMeterApiService.fetchEntityById('iso', isoId);
                    this.importStats.totalFetched++;

                    if (!dryRun) {
                        await this.processIso(isoData, updateExisting);
                    }

                } catch (error) {
                    console.error(`Error importing iso ${isoId}:`, error.message);
                    this.importStats.errors.push({
                        isoId: isoId,
                        error: error.message
                    });
                }
            }

            return this.getImportResults();

        } catch (error) {
            throw new ErrorResponse(`Failed to import isos by IDs: ${error.message}`, 500);
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

module.exports = ImportIsoFromApiService; 