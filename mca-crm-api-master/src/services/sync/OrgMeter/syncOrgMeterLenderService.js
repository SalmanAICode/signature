const OrgMeterLender = require('../../../models/OrgMeter/Lender');
const Lender = require('../../../models/Lender');
const Funder = require('../../../models/Funder');
const ErrorResponse = require('../../../utils/errorResponse');

/**
 * Sync OrgMeter lenders to system lenders
 */
class SyncOrgMeterLenderService {
    constructor(funderId, userId = null) {
        this.funderId = funderId;
        this.userId = userId;
        this.syncStats = {
            totalProcessed: 0,
            totalSynced: 0,
            totalUpdated: 0,
            totalSkipped: 0,
            totalFailed: 0,
            errors: []
        };
    }

    /**
     * Sync all selected OrgMeter lenders to system lenders
     * @param {Object} options - Sync options
     * @returns {Object} Sync results
     */
    async syncAllLenders(options = {}) {
        const {
            dryRun = false,
            updateExisting = true,
            onlySelected = true,
            progressCallback = null,
            resumeFromIndex = 0
        } = options;

        try {
            console.log('Starting OrgMeter lenders sync...');
            
            // Verify funder exists
            const funder = await Funder.findById(this.funderId);
            if (!funder) {
                throw new ErrorResponse('Funder not found', 404);
            }

            // Build query for OrgMeter lenders to sync
            let query = {
                'importMetadata.funder': this.funderId
            };

            if (onlySelected) {
                query['syncMetadata.needsSync'] = true;
            }

            // Get all OrgMeter lenders that need syncing
            const orgMeterLenders = await OrgMeterLender.find(query).sort({ updatedAt: 1 });
            this.syncStats.totalProcessed = orgMeterLenders.length;

            if (orgMeterLenders.length === 0) {
                console.log('No OrgMeter lenders found for syncing');
                return this.getSyncResults();
            }

            console.log(`Found ${orgMeterLenders.length} OrgMeter lenders to sync`);
            
            if (resumeFromIndex > 0) {
                console.log(`Resuming sync from index ${resumeFromIndex} (${resumeFromIndex}/${orgMeterLenders.length} already processed)`);
            }

            if (dryRun) {
                console.log('Dry run mode - not saving to database');
                return this.getSyncResults();
            }

            // Process each lender, starting from resumeFromIndex
            for (let i = resumeFromIndex; i < orgMeterLenders.length; i++) {
                const orgMeterLender = orgMeterLenders[i];
                
                try {
                    const result = await this.syncLender(orgMeterLender, updateExisting);
                    
                    if (result.action === 'synced') {
                        this.syncStats.totalSynced++;
                    } else if (result.action === 'updated') {
                        this.syncStats.totalUpdated++;
                    } else if (result.action === 'skipped') {
                        this.syncStats.totalSkipped++;
                    }

                    // Update sync metadata
                    await this.updateSyncMetadata(orgMeterLender, result.syncedLender?._id);

                    // Update progress if callback provided (adjust for resume index)
                    if (progressCallback) {
                        const processedCount = i - resumeFromIndex + 1;
                        await progressCallback(processedCount, orgMeterLenders.length - resumeFromIndex, orgMeterLender.name);
                    }

                } catch (error) {
                    console.error(`Failed to sync lender ${orgMeterLender.id}:`, error.message);
                    this.syncStats.totalFailed++;
                    this.syncStats.errors.push({
                        orgMeterId: orgMeterLender.id,
                        name: orgMeterLender.name,
                        error: error.message
                    });

                    // Still update progress even on error
                    if (progressCallback) {
                        const processedCount = i - resumeFromIndex + 1;
                        await progressCallback(processedCount, orgMeterLenders.length - resumeFromIndex, orgMeterLender.name);
                    }
                }
            }

            console.log('OrgMeter lenders sync completed');
            return this.getSyncResults();

        } catch (error) {
            console.error('Error during lenders sync:', error.message);
            throw new ErrorResponse(`Sync failed: ${error.message}`, 500);
        }
    }

    /**
     * Transform OrgMeter lender data to system lender format
     * @param {Object} orgMeterLender - OrgMeter lender document
     * @returns {Object} Transformed lender data
     */
    transform(orgMeterLender) {
        return {
            funder: this.funderId, // Required field
            name: orgMeterLender.name,
            email: orgMeterLender.email || null,
            phone: null, // OrgMeter lender doesn't have phone in the schema
            website: null, // OrgMeter lender doesn't have website in the schema
            type: orgMeterLender.type, // 'internal' or 'external'
            business_detail: null, // OrgMeter lender doesn't have business details
            address_detail: null, // OrgMeter lender doesn't have address details
            inactive: orgMeterLender.deleted || false
        };
    }

    /**
     * Sync a single OrgMeter lender to system lender
     * @param {Object} orgMeterLender - OrgMeter lender document
     * @param {boolean} updateExisting - Whether to update existing lenders
     * @returns {Object} Sync result
     */
    async syncLender(orgMeterLender, updateExisting = true) {
        try {
            // Check if lender already exists in our system using syncId only
            let existingLender = null;
            
            if (orgMeterLender.syncMetadata?.syncId) {
                existingLender = await Lender.findById(orgMeterLender.syncMetadata.syncId);
            }

            if (existingLender) {
                if (updateExisting) {
                    // Update existing lender
                    const updatedLender = await this.updateExistingLender(existingLender, orgMeterLender);
                    return {
                        action: 'updated',
                        syncedLender: updatedLender,
                        message: `Updated existing lender: ${updatedLender.name}`
                    };
                } else {
                    return {
                        action: 'skipped',
                        syncedLender: existingLender,
                        message: `Skipped existing lender: ${existingLender.name}`
                    };
                }
            } else {
                // Create new lender
                const newLender = await this.createNewLender(orgMeterLender);
                return {
                    action: 'synced',
                    syncedLender: newLender,
                    message: `Created new lender: ${newLender.name}`
                };
            }

        } catch (error) {
            throw new Error(`Failed to sync lender ${orgMeterLender.name}: ${error.message}`);
        }
    }

    /**
     * Create a new system lender from OrgMeter lender
     * @param {Object} orgMeterLender - OrgMeter lender document
     * @returns {Object} Created lender document
     */
    async createNewLender(orgMeterLender) {
        try {
            const lenderData = this.transform(orgMeterLender);

            const lender = new Lender(lenderData);
            await lender.save();

            console.log(`Created new lender: ${lender.name} (ID: ${lender._id})`);
            return lender;

        } catch (error) {
            throw new Error(`Failed to create lender: ${error.message}`);
        }
    }

    /**
     * Update an existing system lender with OrgMeter lender data
     * @param {Object} existingLender - Existing system lender document
     * @param {Object} orgMeterLender - OrgMeter lender document
     * @returns {Object} Updated lender document
     */
    async updateExistingLender(existingLender, orgMeterLender) {
        try {
            // Update fields that may have changed
            const updateData = this.transform(orgMeterLender);

            // Only update if there are actual changes
            if (Object.keys(updateData).length > 0) {
                Object.assign(existingLender, updateData);
                await existingLender.save();
                console.log(`Updated lender: ${existingLender.name} (ID: ${existingLender._id})`);
            } else {
                console.log(`No changes needed for lender: ${existingLender.name}`);
            }

            return existingLender;

        } catch (error) {
            throw new Error(`Failed to update lender: ${error.message}`);
        }
    }

    /**
     * Update sync metadata for OrgMeter lender
     * @param {Object} orgMeterLender - OrgMeter lender document
     * @param {String} syncedLenderId - ID of the synced system lender
     */
    async updateSyncMetadata(orgMeterLender, syncedLenderId = null) {
        try {
            const updateData = {
                'syncMetadata.lastSyncedAt': new Date(),
                'syncMetadata.lastSyncedBy': this.userId || 'system'
            };

            if (syncedLenderId) {
                updateData['syncMetadata.syncId'] = syncedLenderId;
                console.log(`Updating Lender ${orgMeterLender.id} syncId to: ${syncedLenderId}`);
                // Don't change needsSync - it remains as user's selection
            }

            // Use findOneAndUpdate with id and funder since _id is disabled
            const result = await OrgMeterLender.findOneAndUpdate(
                { 
                    id: orgMeterLender.id,
                    'importMetadata.funder': orgMeterLender.importMetadata.funder
                },
                { $set: updateData },
                { new: true }
            );

            if (result) {
                console.log(`Successfully updated Lender ${orgMeterLender.id} syncMetadata`);
            } else {
                console.log(`Warning: Lender ${orgMeterLender.id} not found for sync metadata update`);
            }

        } catch (error) {
            console.error(`Failed to update sync metadata for lender ${orgMeterLender.id}:`, error.message);
        }
    }

    /**
     * Mark specific OrgMeter lenders as needing sync
     * @param {Array} lenderIds - Array of OrgMeter lender IDs (numeric IDs)
     * @returns {Object} Update result
     */
    async markLendersForSync(lenderIds) {
        try {
            const result = await OrgMeterLender.updateMany(
                {
                    id: { $in: lenderIds },
                    'importMetadata.funder': this.funderId
                },
                {
                    $set: {
                        'syncMetadata.needsSync': true,
                        'syncMetadata.lastSyncedAt': null,
                        'syncMetadata.syncId': null
                    }
                }
            );

            return {
                success: true,
                message: `Marked ${result.nModified} lenders for sync`,
                modifiedCount: result.nModified
            };

        } catch (error) {
            throw new ErrorResponse(`Failed to mark lenders for sync: ${error.message}`, 500);
        }
    }

    /**
     * Get sync results summary
     * @returns {Object} Sync statistics
     */
    getSyncResults() {
        return {
            success: true,
            message: 'Lender sync completed',
            stats: {
                totalProcessed: this.syncStats.totalProcessed,
                totalSynced: this.syncStats.totalSynced,
                totalUpdated: this.syncStats.totalUpdated,
                totalSkipped: this.syncStats.totalSkipped,
                totalFailed: this.syncStats.totalFailed,
                errorCount: this.syncStats.errors.length,
                errors: this.syncStats.errors
            }
        };
    }

    /**
     * Get sync status for OrgMeter lenders
     * @param {Object} options - Query options
     * @returns {Object} Sync status data
     */
    async getSyncStatus(options = {}) {
        try {
            const {
                page = 1,
                limit = 20,
                search = null,
                syncStatus = 'all' // 'all', 'pending', 'synced', 'ignored'
            } = options;

            let query = {
                'importMetadata.funder': this.funderId
            };

            // Apply sync status filter
            if (syncStatus === 'pending') {
                query['syncMetadata.needsSync'] = true;
                query['syncMetadata.syncId'] = { $exists: false };
            } else if (syncStatus === 'synced') {
                query['syncMetadata.syncId'] = { $exists: true, $ne: null };
            } else if (syncStatus === 'ignored') {
                query['syncMetadata.needsSync'] = false;
            }

            // Apply search filter
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ];
            }

            const skip = (page - 1) * limit;
            const lenders = await OrgMeterLender.find(query)
                .populate('syncMetadata.syncId', 'name email')
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await OrgMeterLender.countDocuments(query);

            // Get overall sync statistics
            const syncStats = await OrgMeterLender.aggregate([
                { $match: { 'importMetadata.funder': this.funderId } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        selected: {
                            $sum: {
                                $cond: [{ $eq: ['$syncMetadata.needsSync', true] }, 1, 0]
                            }
                        },
                        synced: {
                            $sum: {
                                $cond: [{ $ne: ['$syncMetadata.syncId', null] }, 1, 0]
                            }
                        },
                        ignored: {
                            $sum: {
                                $cond: [{ $eq: ['$syncMetadata.needsSync', false] }, 1, 0]
                            }
                        }
                    }
                }
            ]);

            const stats = syncStats[0] || { total: 0, pending: 0, synced: 0, ignored: 0 };

            return {
                success: true,
                data: {
                    lenders,
                    pagination: {
                        current: page,
                        pages: Math.ceil(total / limit),
                        total,
                        limit
                    },
                    stats: {
                        total: stats.total,
                        selected: stats.selected,
                        pending: stats.selected - stats.synced,
                        synced: stats.synced,
                        ignored: stats.ignored
                    }
                }
            };

        } catch (error) {
            throw new ErrorResponse(`Failed to get sync status: ${error.message}`, 500);
        }
    }
}

module.exports = SyncOrgMeterLenderService;
