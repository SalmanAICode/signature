const OrgMeterApiService = require('./orgMeterApiService');
const OrgMeterSyndicator = require('../../../models/OrgMeter/Syndicator');
const ErrorResponse = require('../../../utils/errorResponse');

/**
 * Import OrgMeter syndicators from API
 */
class ImportSyndicatorFromApiService {
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
     * Import all syndicators from OrgMeter API
     * @param {Object} options - Import options
     * @returns {Object} Import results
     */
    async importAllSyndicators(options = {}) {
        const {
            updateExisting = true,
            dryRun = false,
            progressCallback = null
        } = options;

        try {
            console.log('Starting OrgMeter API syndicators import...');
            
            // Test API connection first
            const isConnected = await this.orgMeterApiService.testConnection();
            if (!isConnected) {
                throw new ErrorResponse('Failed to connect to OrgMeter API', 500);
            }

            // Fetch all syndicators from API
            console.log('Fetching all syndicators from OrgMeter API...');
            const syndicators = await this.orgMeterApiService.fetchAllEntities('syndicator');
            this.importStats.totalFetched = syndicators.length;

            if (syndicators.length === 0) {
                console.log('No syndicators found in OrgMeter API');
                return this.getImportResults();
            }

            console.log(`Fetched ${syndicators.length} syndicators from OrgMeter API`);

            if (dryRun) {
                console.log('Dry run mode - not saving to database');
                return this.getImportResults();
            }

            // Process and save syndicators
            for (let i = 0; i < syndicators.length; i++) {
                const syndicator = syndicators[i];
                if (syndicator.deleted) {
                    this.importStats.totalSkipped++;
                    console.log(`Skipped deleted syndicator ${syndicator.id}`);
                } else {
                    try {
                        // Get each syndicator from the API
                        const syndicatorData = await this.orgMeterApiService.fetchEntityById('syndicator', syndicator.id);
                        await this.processSyndicator(syndicatorData, updateExisting);
                    } catch (error) {
                        console.error(`Error processing syndicator ${syndicator.id}:`, error.message);
                        this.importStats.errors.push({
                            syndicatorId: syndicator.id,
                            error: error.message
                        });
                    }
                }
                
                // Update progress once per iteration regardless of outcome
                if (progressCallback) {
                    await progressCallback(i + 1, syndicators.length, syndicator.name || syndicator.id);
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
     * Process and save a single syndicator
     * @param {Object} syndicatorData - Syndicator data from API
     * @param {boolean} updateExisting - Whether to update existing records
     */
    async processSyndicator(syndicatorData, updateExisting = true) {
        try {
            // Check if syndicator already exists for this funder
            const existingSyndicator = await OrgMeterSyndicator.findOne({ id: syndicatorData.id, 'importMetadata.funder': this.funder });

            if (existingSyndicator) {
                if (updateExisting) {
                    // Update existing syndicator
                    await this.updateSyndicator(existingSyndicator, syndicatorData);
                    this.importStats.totalUpdated++;
                    console.log(`Updated syndicator ${syndicatorData.id}`);
                } else {
                    this.importStats.totalSkipped++;
                    console.log(`Skipped existing syndicator ${syndicatorData.id}`);
                }
            } else {
                // Create new syndicator
                await this.createSyndicator(syndicatorData);
                this.importStats.totalSaved++;
                console.log(`Created new syndicator ${syndicatorData.id}`);
            }

        } catch (error) {
            console.error(`Error processing syndicator ${syndicatorData.id}:`, error.message);
            throw error;
        }
    }

    /**
     * Create a new syndicator record
     * @param {Object} syndicatorData - Syndicator data from API
     */
    async createSyndicator(syndicatorData) {
        try {
            const syndicator = new OrgMeterSyndicator({
                ...syndicatorData,
                importMetadata: {
                    funder: this.funder,
                    source: 'orgmeter_api',
                    importedAt: new Date(),
                    importedBy: 'api_import_service'
                },
                syncMetadata: {
                    needsSync: !syndicatorData.deleted,
                    lastSyncedAt: null,
                    lastSyncedBy: null,
                    syncId: null
                }
            });

            await syndicator.save();
            return syndicator;

        } catch (error) {
            throw new Error(`Failed to create syndicator: ${error.message}`);
        }
    }

    /**
     * Update an existing syndicator record
     * @param {Object} existingSyndicator - Existing syndicator document
     * @param {Object} syndicatorData - New syndicator data from API
     */
    async updateSyndicator(existingSyndicator, syndicatorData) {
        try {
            // Update fields while preserving import metadata
            Object.assign(existingSyndicator, {
                ...syndicatorData,
                importMetadata: {
                    ...existingSyndicator.importMetadata,
                    lastUpdatedAt: new Date(),
                    lastUpdatedBy: 'api_import_service'
                }
            });

            await existingSyndicator.save();
            return existingSyndicator;

        } catch (error) {
            throw new Error(`Failed to update syndicator: ${error.message}`);
        }
    }

    /**
     * Import specific syndicators by IDs
     * @param {Array} syndicatorIds - Array of syndicator IDs to import
     * @param {Object} options - Import options
     * @returns {Object} Import results
     */
    async importSyndicatorsByIds(syndicatorIds, options = {}) {
        const { updateExisting = true, dryRun = false } = options;

        try {
            console.log(`Importing ${syndicatorIds.length} specific syndicators...`);

            for (const syndicatorId of syndicatorIds) {
                try {
                    // Fetch individual syndicator from API
                    const syndicatorData = await this.orgMeterApiService.fetchEntityById('syndicator', syndicatorId);
                    this.importStats.totalFetched++;

                    if (!dryRun) {
                        await this.processSyndicator(syndicatorData, updateExisting);
                    }

                } catch (error) {
                    console.error(`Error importing syndicator ${syndicatorId}:`, error.message);
                    this.importStats.errors.push({
                        syndicatorId: syndicatorId,
                        error: error.message
                    });
                }
            }

            return this.getImportResults();

        } catch (error) {
            throw new ErrorResponse(`Failed to import syndicators by IDs: ${error.message}`, 500);
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

module.exports = ImportSyndicatorFromApiService; 