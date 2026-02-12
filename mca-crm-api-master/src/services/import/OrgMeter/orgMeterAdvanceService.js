const OrgMeterApiService = require('./orgMeterApiService');
const OrgMeterAdvance = require('../../../models/OrgMeter/Advance');
const OrgMeterPayment = require('../../../models/OrgMeter/Payment');
const OrgMeterAdvanceUnderwriting = require('../../../models/OrgMeter/AdvanceUnderwriting');
const ErrorResponse = require('../../../utils/errorResponse');

/**
 * Import OrgMeter advances from API
 */
class ImportAdvanceFromApiService {
    constructor(apiKey, funder) {
        // Only track advances, not payments/underwritings separately
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
     * Import all advances from OrgMeter API
     * @param {Object} options - Import options
     * @returns {Object} Import results
     */
    async importAllAdvances(options = {}) {
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

            // Fetch all advances from API
            console.log('Fetching all advances from OrgMeter API...');
            const advances = await this.orgMeterApiService.fetchAllEntities('advance');
            this.importStats.totalFetched = advances.length;

            if (advances.length === 0) {
                console.log('No advances found in OrgMeter API');
                return this.getImportResults();
            }

            console.log(`Fetched ${advances.length} advances from OrgMeter API`);

            if (dryRun) {
                console.log('Dry run mode - not saving to database');
                return this.getImportResults();
            }

            // Process and save advances
            for (let i = 0; i < advances.length; i++) {
                const advance = advances[i];
                if (advance.deleted) {
                    // Deleted advances cannot be obtained from the API advance/:advanceId, so we skip them
                    this.importStats.totalSkipped++;
                    console.log(`Skipped deleted advance ${advance.id}`);
                } else {
                    try {
                        // Get each advance from the API
                        const advanceData = await this.orgMeterApiService.fetchEntityById('advance', advance.id);
                        await this.processAdvance(advanceData, updateExisting);

                        // Import advance payments using bulk operations
                        await this.importAllAdvancePaymentsBulk(advance.id, { updateExisting, dryRun });

                        // Import advance underwriting
                        await this.importAdvanceUnderwriting(advance.id, { updateExisting, dryRun });

                    } catch (error) {
                        console.error(`Error processing advance ${advance.id}:`, error.message);
                        this.importStats.errors.push({
                            advanceId: advance.id,
                            error: error.message
                        });
                    }
                }
                
                // Update progress once per iteration regardless of outcome
                if (progressCallback) {
                    await progressCallback(i + 1, advances.length, `Advance ${advance.id}`);
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
     * Process and save a single advance
     * @param {Object} advanceData - Advance data from API
     * @param {boolean} updateExisting - Whether to update existing records
     */
    async processAdvance(advanceData, updateExisting = true) {
        try {
            // Check if advance already exists
            const existingAdvance = await OrgMeterAdvance.findOne({ id: advanceData.id, 'importMetadata.funder': this.funder });

            if (existingAdvance) {
                if (updateExisting) {
                    // Update existing advance
                    await this.updateAdvance(existingAdvance, advanceData);
                    this.importStats.totalUpdated++;
                    console.log(`Updated advance ${advanceData.id}`);
                } else {
                    this.importStats.totalSkipped++;
                    console.log(`Skipped existing advance ${advanceData.id}`);
                }
            } else {
                // Create new advance
                await this.createAdvance(advanceData);
                this.importStats.totalSaved++;
                console.log(`Created new advance ${advanceData.id}`);
            }

        } catch (error) {
            console.error(`Error processing advance ${advanceData.id}:`, error.message);
            throw error;
        }
    }

    /**
     * Create a new advance record
     * @param {Object} advanceData - Advance data from API
     */
    async createAdvance(advanceData) {
        try {
            const advance = new OrgMeterAdvance({
                ...advanceData,
                importMetadata: {
                    funder: this.funder,
                    source: 'orgmeter_api',
                    importedAt: new Date(),
                    importedBy: 'api_import_service'
                },
                syncMetadata: {
                    needsSync: !advanceData.deleted,
                    lastSyncedAt: null,
                    lastSyncedBy: null,
                    syncId: null
                }
            });

            await advance.save();
            return advance;

        } catch (error) {
            throw new Error(`Failed to create advance: ${error.message}`);
        }
    }

    /**
     * Update an existing advance record
     * @param {Object} existingAdvance - Existing advance document
     * @param {Object} advanceData - New advance data from API
     */
    async updateAdvance(existingAdvance, advanceData) {
        try {
            // Update fields while preserving import metadata
            Object.assign(existingAdvance, {
                ...advanceData,
                importMetadata: {
                    ...existingAdvance.importMetadata,
                    lastUpdatedAt: new Date(),
                    lastUpdatedBy: 'api_import_service'
                }
            });

            await existingAdvance.save();
            return existingAdvance;

        } catch (error) {
            throw new Error(`Failed to update advance: ${error.message}`);
        }
    }

    /**
     * Import all advance payments from OrgMeter API using bulk operations
     * @param {Object} advanceId - The advance ID
     * @param {Object} options - Import options
     * @returns {Object} Import results
     */
    async importAllAdvancePaymentsBulk(advanceId, options = {}) {
        const {
            updateExisting = true,
            dryRun = false
        } = options;

        try {
            // Fetch all advance payments from API
            console.log(`Fetching advance payments for advance ${advanceId}...`);
            const advancePayments = await this.orgMeterApiService.fetchAllSubEntities('advance', advanceId, 'payment');

            if (advancePayments.length === 0) {
                console.log(`No advance payments found for advance ${advanceId}`);
                return;
            }

            console.log(`Fetched ${advancePayments.length} advance payments for advance ${advanceId}`);

            if (dryRun) {
                console.log('Dry run mode - not saving payments to database');
                return;
            }

            // Use bulk operations for better performance
            await this.processBulkPayments(advancePayments, updateExisting);

        } catch (error) {
            console.error(`Error during advance payments import for advance ${advanceId}:`, error.message);
            this.importStats.errors.push({
                advanceId: advanceId,
                error: `Payment import failed: ${error.message}`
            });
        }
    }

    /**
     * Process payments using bulk operations with upsert
     * @param {Array} payments - Array of payment data
     * @param {boolean} updateExisting - Whether to update existing records
     */
    async processBulkPayments(payments, updateExisting = true) {
        try {
            if (!updateExisting) {
                // If not updating existing, filter out payments that already exist
                const existingPaymentIds = await OrgMeterPayment.distinct('id', {
                    id: { $in: payments.map(p => p.id) },
                    'importMetadata.funder': this.funder
                });
                
                const newPayments = payments.filter(p => !existingPaymentIds.includes(p.id));
                
                if (newPayments.length === 0) {
                    console.log('All payments already exist, skipping');
                    return;
                }
                
                // Bulk insert new payments
                const paymentsToInsert = newPayments.map(payment => ({
                    ...payment,
                    importMetadata: {
                        funder: this.funder,
                        source: 'orgmeter_api',
                        importedAt: new Date(),
                        importedBy: 'api_import_service'
                    }
                }));

                await OrgMeterPayment.insertMany(paymentsToInsert, { ordered: false });
                console.log(`Bulk inserted ${paymentsToInsert.length} new payments`);
                return;
            }

            // For upsert operations, we need to handle existing import metadata carefully
            const bulkOps = [];
            const currentTime = new Date();

            // Get existing payments to preserve their import metadata
            const existingPayments = await OrgMeterPayment.find({
                id: { $in: payments.map(p => p.id) },
                'importMetadata.funder': this.funder
            }).select('id importMetadata');

            const existingPaymentsMap = new Map(
                existingPayments.map(p => [p.id, p.importMetadata])
            );

            for (const payment of payments) {
                let importMetadata;
                if (existingPaymentsMap.has(payment.id)) {
                    // Preserve existing import metadata and update timestamp
                    importMetadata = {
                        ...existingPaymentsMap.get(payment.id),
                        lastUpdatedAt: currentTime,
                        lastUpdatedBy: 'api_import_service'
                    };
                } else {
                    // Create new import metadata
                    importMetadata = {
                        funder: this.funder,
                        source: 'orgmeter_api',
                        importedAt: currentTime,
                        importedBy: 'api_import_service'
                    };
                }

                bulkOps.push({
                    updateOne: {
                        filter: { 
                            id: payment.id, 
                            'importMetadata.funder': this.funder 
                        },
                        update: {
                            $set: {
                                ...payment,
                                importMetadata: importMetadata
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
                const result = await OrgMeterPayment.bulkWrite(batch, { ordered: false });
                
                console.log(`Processed batch ${Math.floor(i / batchSize) + 1}: ${result.upsertedCount} inserted, ${result.modifiedCount} updated`);
            }

            console.log(`Bulk processed ${payments.length} payments`);

        } catch (error) {
            throw new Error(`Failed to process bulk payments: ${error.message}`);
        }
    }
    
    /**
     * Process and save a single advance payment (deprecated - use bulk operations instead)
     * @param {Object} paymentData - Payment data from API
     * @param {boolean} updateExisting - Whether to update existing records
     * @deprecated Use processBulkPayments instead for better performance
     */
    async processPayment(paymentData, updateExisting = true) {
        try {
            // Check if advance already exists
            const existingPayment = await OrgMeterPayment.findOne({ id: paymentData.id, 'importMetadata.funder': this.funder });

            if (existingPayment) {
                if (updateExisting) {
                    // Update existing payment
                    await this.updatePayment(existingPayment, paymentData);
                    console.log(`Updated payment ${paymentData.id}`);
                } else {
                    console.log(`Skipped existing payment ${paymentData.id}`);
                }
            } else {
                // Create new payment
                await this.createPayment(paymentData);
                console.log(`Created new payment ${paymentData.id}`);
            }

        } catch (error) {
            console.error(`Error processing payment ${paymentData.id}:`, error.message);
            throw error;
        }
    }

    
    /**
     * Create a new payment record
     * @param {Object} paymentData - Payment data from API
     */
    async createPayment(paymentData) {
        try {
            const payment = new OrgMeterPayment({
                ...paymentData,
                importMetadata: {
                    funder: this.funder,
                    source: 'orgmeter_api',
                    importedAt: new Date(),
                    importedBy: 'api_import_service'
                }
            });

            await payment.save();
            return payment;

        } catch (error) {
            throw new Error(`Failed to create payment: ${error.message}`);
        }
    }

    /**
     * Update an existing payment record
     * @param {Object} existingPayment - Existing payment document
     * @param {Object} paymentData - New payment data from API
     */
    async updatePayment(existingPayment, paymentData) {
        try {
            // Update fields while preserving import metadata
            Object.assign(existingPayment, {
                ...paymentData,
                importMetadata: {
                    ...existingPayment.importMetadata,
                    lastUpdatedAt: new Date(),
                    lastUpdatedBy: 'api_import_service'
                }
            });

            await existingPayment.save();
            return existingPayment;

        } catch (error) {
            throw new Error(`Failed to update payment: ${error.message}`);
        }
    }

    
    /**
     * Import all advance underwriting from OrgMeter API
     * @param {Object} advanceId - The advance ID
     * @param {Object} options - Import options
     * @returns {Object} Import result
     */
    async importAdvanceUnderwriting(advanceId, options = {}) {
        const {
            updateExisting = true,
            dryRun = false
        } = options;

        try {            
            // Fetch all advance underwriting from API
            console.log(`Fetching advance underwriting for advance ${advanceId}...`);
            const advanceUnderwriting = await this.orgMeterApiService.fetchOneSubEntity('advance', advanceId, 'underwriting');

            if (advanceUnderwriting && typeof advanceUnderwriting === 'object') {
                await this.processUnderwriting(advanceUnderwriting, updateExisting);
                console.log(`Processed underwriting for advance ${advanceId}`);
            } else {
                console.warn(`Invalid underwriting data for advance ${advanceId}:`, advanceUnderwriting);
            }

            console.log('OrgMeter API advance underwriting import completed');
            return advanceUnderwriting;
        } catch (error) {
            console.error(`Error during OrgMeter API advance underwriting import for advance ${advanceId}:`, error.message);
            this.importStats.errors.push({
                advanceId: advanceId,
                error: `Underwriting import failed: ${error.message}`
            });
        }
    }
    
    /**
     * Process and save a single advance underwriting
     * @param {Object} underwritingData - Underwriting data from API
     * @param {boolean} updateExisting - Whether to update existing records
     */
    async processUnderwriting(underwritingData, updateExisting = true) {
        try {
            // Check if underwriting already exists
            const existingUnderwriting = await OrgMeterAdvanceUnderwriting.findOne({ 
                advanceId: underwritingData.advanceId, 
                'importMetadata.funder': this.funder 
            });

            if (existingUnderwriting) {
                if (updateExisting) {
                    // Update existing underwriting
                    await this.updateUnderwriting(existingUnderwriting, underwritingData);
                    console.log(`Updated underwriting for advance ${underwritingData.advanceId}`);
                } else {
                    console.log(`Skipped existing underwriting for advance ${underwritingData.advanceId}`);
                }
            } else {
                // Create new underwriting
                await this.createUnderwriting(underwritingData);
                console.log(`Created new underwriting for advance ${underwritingData.advanceId}`);
            }

        } catch (error) {
            console.error(`Error processing underwriting for advance ${underwritingData?.advanceId || 'unknown'}:`, error.message);
            throw error;
        }
    }

    
    /**
     * Create a new underwriting record
     * @param {Object} underwritingData - Underwriting data from API
     */
    async createUnderwriting(underwritingData) {
        try {
            const underwriting = new OrgMeterAdvanceUnderwriting({
                ...underwritingData,
                importMetadata: {
                    funder: this.funder,
                    source: 'orgmeter_api',
                    importedAt: new Date(),
                    importedBy: 'api_import_service'
                }
            });

            await underwriting.save();
            return underwriting;

        } catch (error) {
            throw new Error(`Failed to create underwriting: ${error.message}`);
        }
    }

    /**
     * Update an existing underwriting record
     * @param {Object} existingUnderwriting - Existing underwriting document
     * @param {Object} underwritingData - New underwriting data from API
     */
    async updateUnderwriting(existingUnderwriting, underwritingData) {
        try {
            // Update fields while preserving import metadata
            Object.assign(existingUnderwriting, {
                ...underwritingData,
                importMetadata: {
                    ...existingUnderwriting.importMetadata,
                    lastUpdatedAt: new Date(),
                    lastUpdatedBy: 'api_import_service'
                }
            });

            await existingUnderwriting.save();
            return existingUnderwriting;

        } catch (error) {
            throw new Error(`Failed to update underwriting: ${error.message}`);
        }
    }

    /**
     * Import specific advances by IDs
     * @param {Array} advanceIds - Array of advance IDs to import
     * @param {Object} options - Import options
     * @returns {Object} Import results
     */
    async importAdvancesByIds(advanceIds, options = {}) {
        const { updateExisting = true, dryRun = false } = options;

        try {
            console.log(`Importing ${advanceIds.length} specific advances...`);

            for (const advanceId of advanceIds) {
                try {
                    // Fetch individual advance from API
                    const advanceData = await this.orgMeterApiService.fetchEntityById('advance', advanceId);
                    this.importStats.totalFetched++;

                    if (!dryRun) {
                        await this.processAdvance(advanceData, updateExisting);
                    }

                } catch (error) {
                    console.error(`Error importing advance ${advanceId}:`, error.message);
                    this.importStats.errors.push({
                        advanceId: advanceId,
                        error: error.message
                    });
                }
            }

            return this.getImportResults();

        } catch (error) {
            throw new ErrorResponse(`Failed to import advances by IDs: ${error.message}`, 500);
        }
    }

    /**
     * Get import results summary - tracks only advances (not individual payments/underwritings)
     * @returns {Object} Import statistics for advances only
     */
    getImportResults() {
        return {
            success: true,
            message: 'Advance import completed',
            stats: {
                totalAdvancesFetched: this.importStats.totalFetched,
                totalAdvancesSaved: this.importStats.totalSaved,
                totalAdvancesUpdated: this.importStats.totalUpdated,
                totalAdvancesSkipped: this.importStats.totalSkipped,
                totalAdvancesProcessed: this.importStats.totalSaved + this.importStats.totalUpdated + this.importStats.totalSkipped,
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

module.exports = ImportAdvanceFromApiService; 