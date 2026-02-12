const OrgMeterApiService = require('./orgMeterApiService');
const OrgMeterMerchant = require('../../../models/OrgMeter/Merchant');
const ErrorResponse = require('../../../utils/errorResponse');

/**
 * Import OrgMeter merchants from API
 */
class ImportMerchantFromApiService {
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
     * Import all merchants from OrgMeter API
     * @param {Object} options - Import options
     * @returns {Object} Import results
     */
    async importAllMerchants(options = {}) {
        const {
            updateExisting = true,
            dryRun = false,
            progressCallback = null
        } = options;

        try {
            console.log('Starting OrgMeter API merchants import...');
            
            // Test API connection first
            const isConnected = await this.orgMeterApiService.testConnection();
            if (!isConnected) {
                throw new ErrorResponse('Failed to connect to OrgMeter API', 500);
            }

            // Fetch all merchants from API
            console.log('Fetching all merchants from OrgMeter API...');
            const merchants = await this.orgMeterApiService.fetchAllEntities('merchant');
            this.importStats.totalFetched = merchants.length;

            if (merchants.length === 0) {
                console.log('No merchants found in OrgMeter API');
                return this.getImportResults();
            }

            console.log(`Fetched ${merchants.length} merchants from OrgMeter API`);

            if (dryRun) {
                console.log('Dry run mode - not saving to database');
                return this.getImportResults();
            }

            // Process and save merchants
            for (let i = 0; i < merchants.length; i++) {
                const merchant = merchants[i];
                if (merchant.deleted) {
                    this.importStats.totalSkipped++;
                    console.log(`Skipped deleted merchant ${merchant.id}`);
                } else {
                    try {
                        // Get each merchant from the API
                        const merchantData = await this.orgMeterApiService.fetchEntityById('merchant', merchant.id);
                        await this.processMerchant(merchantData, updateExisting);
                    } catch (error) {
                        console.error(`Error processing merchant ${merchant.id}:`, error.message);
                        this.importStats.errors.push({
                            merchantId: merchant.id,
                            error: error.message
                        });
                    }
                }
                
                // Update progress once per iteration regardless of outcome
                if (progressCallback) {
                    await progressCallback(i + 1, merchants.length, merchant.businessName || merchant.businessDba || merchant.id);
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
     * Process and save a single merchant
     * @param {Object} merchantData - Merchant data from API
     * @param {boolean} updateExisting - Whether to update existing records
     */
    async processMerchant(merchantData, updateExisting = true) {
        try {
            // Check if merchant already exists for this funder
            const existingMerchant = await OrgMeterMerchant.findOne({ id: merchantData.id, 'importMetadata.funder': this.funder });

            if (existingMerchant) {
                if (updateExisting) {
                    // Update existing merchant
                    await this.updateMerchant(existingMerchant, merchantData);
                    this.importStats.totalUpdated++;
                    console.log(`Updated merchant ${merchantData.id}`);
                } else {
                    this.importStats.totalSkipped++;
                    console.log(`Skipped existing merchant ${merchantData.id}`);
                }
            } else {
                // Create new merchant
                await this.createMerchant(merchantData);
                this.importStats.totalSaved++;
                console.log(`Created new merchant ${merchantData.id}`);
            }

        } catch (error) {
            console.error(`Error processing merchant ${merchantData.id}:`, error.message);
            throw error;
        }
    }

    /**
     * Create a new merchant record
     * @param {Object} merchantData - Merchant data from API
     */
    async createMerchant(merchantData) {
        try {
            const merchant = new OrgMeterMerchant({
                ...merchantData,
                importMetadata: {
                    funder: this.funder,
                    source: 'orgmeter_api',
                    importedAt: new Date(),
                    importedBy: 'api_import_service'
                },
                syncMetadata: {
                    needsSync: !merchantData.deleted,
                    lastSyncedAt: null,
                    lastSyncedBy: null,
                    syncId: null
                }
            });

            await merchant.save();
            return merchant;

        } catch (error) {
            throw new Error(`Failed to create merchant: ${error.message}`);
        }
    }

    /**
     * Update an existing merchant record
     * @param {Object} existingMerchant - Existing merchant document
     * @param {Object} merchantData - New merchant data from API
     */
    async updateMerchant(existingMerchant, merchantData) {
        try {
            // Update fields while preserving import metadata
            Object.assign(existingMerchant, {
                ...merchantData,
                importMetadata: {
                    ...existingMerchant.importMetadata,
                    lastUpdatedAt: new Date(),
                    lastUpdatedBy: 'api_import_service'
                }
            });

            await existingMerchant.save();
            return existingMerchant;

        } catch (error) {
            throw new Error(`Failed to update merchant: ${error.message}`);
        }
    }

    /**
     * Import specific merchants by IDs
     * @param {Array} merchantIds - Array of merchant IDs to import
     * @param {Object} options - Import options
     * @returns {Object} Import results
     */
    async importMerchantsByIds(merchantIds, options = {}) {
        const { updateExisting = true, dryRun = false } = options;

        try {
            console.log(`Importing ${merchantIds.length} specific merchants...`);

            for (const merchantId of merchantIds) {
                try {
                    // Fetch individual merchant from API
                    const merchantData = await this.orgMeterApiService.fetchEntityById('merchant', merchantId);
                    this.importStats.totalFetched++;

                    if (!dryRun) {
                        await this.processMerchant(merchantData, updateExisting);
                    }

                } catch (error) {
                    console.error(`Error importing merchant ${merchantId}:`, error.message);
                    this.importStats.errors.push({
                        merchantId: merchantId,
                        error: error.message
                    });
                }
            }

            return this.getImportResults();

        } catch (error) {
            throw new ErrorResponse(`Failed to import merchants by IDs: ${error.message}`, 500);
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

module.exports = ImportMerchantFromApiService; 