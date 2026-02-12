const OrgMeterIso = require('../../../models/OrgMeter/Iso');
const ISO = require('../../../models/ISO');
const Funder = require('../../../models/Funder');
const ISOFunder = require('../../../models/ISOFunder');
const ErrorResponse = require('../../../utils/errorResponse');

/**
 * Sync OrgMeter ISOs to system ISOs
 */
class SyncOrgMeterIsoService {
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
     * Sync all selected OrgMeter ISOs to system ISOs
     * @param {Object} options - Sync options
     * @returns {Object} Sync results
     */
    async syncAllIsos(options = {}) {
        const {
            dryRun = false,
            updateExisting = true,
            onlySelected = true,
            progressCallback = null,
            resumeFromIndex = 0
        } = options;

        try {
            console.log('Starting OrgMeter ISOs sync...');
            
            // Verify funder exists
            const funder = await Funder.findById(this.funderId);
            if (!funder) {
                throw new ErrorResponse('Funder not found', 404);
            }

            // Build query for OrgMeter ISOs to sync
            let query = {
                'importMetadata.funder': this.funderId
            };

            if (onlySelected) {
                query['syncMetadata.needsSync'] = true;
            }

            // Get all OrgMeter ISOs that need syncing
            const orgMeterIsos = await OrgMeterIso.find(query).sort({ updatedAt: 1 });
            this.syncStats.totalProcessed = orgMeterIsos.length;

            if (orgMeterIsos.length === 0) {
                console.log('No OrgMeter ISOs found for syncing');
                return this.getSyncResults();
            }

            console.log(`Found ${orgMeterIsos.length} OrgMeter ISOs to sync`);
            
            if (resumeFromIndex > 0) {
                console.log(`Resuming sync from index ${resumeFromIndex} (${resumeFromIndex}/${orgMeterIsos.length} already processed)`);
            }

            if (dryRun) {
                console.log('Dry run mode - not saving to database');
                return this.getSyncResults();
            }

            // Process each ISO, starting from resumeFromIndex
            for (let i = resumeFromIndex; i < orgMeterIsos.length; i++) {
                const orgMeterIso = orgMeterIsos[i];
                
                try {
                    const result = await this.syncIso(orgMeterIso, updateExisting);
                    
                    if (result.action === 'synced') {
                        this.syncStats.totalSynced++;
                    } else if (result.action === 'updated') {
                        this.syncStats.totalUpdated++;
                    } else if (result.action === 'skipped') {
                        this.syncStats.totalSkipped++;
                    }

                    // Update sync metadata
                    await this.updateSyncMetadata(orgMeterIso, result.syncedIso?._id);

                    // Update progress if callback provided (adjust for resume index)
                    if (progressCallback) {
                        const processedCount = i - resumeFromIndex + 1;
                        await progressCallback(processedCount, orgMeterIsos.length - resumeFromIndex, orgMeterIso.name);
                    }

                } catch (error) {
                    console.error(`Failed to sync ISO ${orgMeterIso.id}:`, error.message);
                    this.syncStats.totalFailed++;
                    this.syncStats.errors.push({
                        orgMeterId: orgMeterIso.id,
                        name: orgMeterIso.name,
                        error: error.message
                    });

                    // Still update progress even on error
                    if (progressCallback) {
                        const processedCount = i - resumeFromIndex + 1;
                        await progressCallback(processedCount, orgMeterIsos.length - resumeFromIndex, orgMeterIso.name);
                    }
                }
            }

            console.log('OrgMeter ISOs sync completed');
            return this.getSyncResults();

        } catch (error) {
            console.error('Error during ISOs sync:', error.message);
            throw new ErrorResponse(`Sync failed: ${error.message}`, 500);
        }
    }

    /**
     * Transform OrgMeter ISO data to system ISO format
     * @param {Object} orgMeterIso - OrgMeter ISO document
     * @returns {Object} Transformed ISO data
     */
    transform(orgMeterIso) {
        return {
            name: orgMeterIso.name,
            email: orgMeterIso.email || null,
            phone: null, // OrgMeter ISO doesn't have phone in the schema
            website: null, // OrgMeter ISO doesn't have website in the schema
            type: orgMeterIso.type ? orgMeterIso.type.toLowerCase() : 'internal', // Convert 'Internal'/'External' to 'internal'/'external'
            business_detail: {
                ein: orgMeterIso.federalId,
            },
            address_list: [], // OrgMeter ISO doesn't have address list
            primary_representative: null, // OrgMeter ISO doesn't have primary representative
            inactive: orgMeterIso.deleted || false
        };
    }

    /**
     * Sync a single OrgMeter ISO to system ISO
     * @param {Object} orgMeterIso - OrgMeter ISO document
     * @param {boolean} updateExisting - Whether to update existing ISOs
     * @returns {Object} Sync result
     */
    async syncIso(orgMeterIso, updateExisting = true) {
        try {
            // Check if ISO already exists in our system using syncId only
            let existingIso = null;
            
            if (orgMeterIso.syncMetadata?.syncId) {
                existingIso = await ISO.findById(orgMeterIso.syncMetadata.syncId);
            }

            if (existingIso) {
                if (updateExisting) {
                    // Update existing ISO
                    const updatedIso = await this.updateExistingIso(existingIso, orgMeterIso);
                    return {
                        action: 'updated',
                        syncedIso: updatedIso,
                        message: `Updated existing ISO: ${updatedIso.name}`
                    };
                } else {
                    return {
                        action: 'skipped',
                        syncedIso: existingIso,
                        message: `Skipped existing ISO: ${existingIso.name}`
                    };
                }
            } else {
                // Create new ISO
                const newIso = await this.createNewIso(orgMeterIso);
                return {
                    action: 'synced',
                    syncedIso: newIso,
                    message: `Created new ISO: ${newIso.name}`
                };
            }

        } catch (error) {
            throw new Error(`Failed to sync ISO ${orgMeterIso.name}: ${error.message}`);
        }
    }

    /**
     * Create a new system ISO from OrgMeter ISO
     * @param {Object} orgMeterIso - OrgMeter ISO document
     * @returns {Object} Created ISO document
     */
    async createNewIso(orgMeterIso) {
        try {
            const isoData = this.transform(orgMeterIso);

            const iso = new ISO(isoData);
            await iso.save();

            // Create ISO-Funder relationship
            await this.createIsoFunder(iso._id, this.funderId);

            console.log(`Created new ISO: ${iso.name} (ID: ${iso._id})`);
            return iso;

        } catch (error) {
            throw new Error(`Failed to create ISO: ${error.message}`);
        }
    }

    /**
     * Create a new ISO-Funder relationship
     * @param {String} isoId - System ISO ID
     * @param {String} funderId - System funder ID
     * @returns {Object} Created ISOFunder document
     */
    async createIsoFunder(isoId, funderId) {
        const existingIsoFunder = await ISOFunder.findOne({
            iso: isoId,
            funder: funderId
        });

        if (existingIsoFunder) {
            return existingIsoFunder;
        }

        const isoFunder = new ISOFunder({
            iso: isoId,
            funder: funderId
        });
        await isoFunder.save();

        return isoFunder;
    }

    /**
     * Update an existing system ISO with OrgMeter ISO data
     * @param {Object} existingIso - Existing system ISO document
     * @param {Object} orgMeterIso - OrgMeter ISO document
     * @returns {Object} Updated ISO document
     */
    async updateExistingIso(existingIso, orgMeterIso) {
        try {
            // Update fields that may have changed
            const updateData = this.transform(orgMeterIso);

            // Only update if there are actual changes
            if (Object.keys(updateData).length > 0) {
                Object.assign(existingIso, updateData);
                await existingIso.save();
                console.log(`Updated ISO: ${existingIso.name} (ID: ${existingIso._id})`);
            } else {
                console.log(`No changes needed for ISO: ${existingIso.name}`);
            }

            // Update ISO-Funder relationship
            await this.createIsoFunder(existingIso._id, this.funderId);

            return existingIso;

        } catch (error) {
            throw new Error(`Failed to update ISO: ${error.message}`);
        }
    }

    /**
     * Update sync metadata for OrgMeter ISO
     * @param {Object} orgMeterIso - OrgMeter ISO document
     * @param {String} syncedIsoId - ID of the synced system ISO
     */
    async updateSyncMetadata(orgMeterIso, syncedIsoId = null) {
        try {
            const updateData = {
                'syncMetadata.lastSyncedAt': new Date(),
                'syncMetadata.lastSyncedBy': this.userId || 'system'
            };

            if (syncedIsoId) {
                updateData['syncMetadata.syncId'] = syncedIsoId;
                // Don't change needsSync - it remains as user's selection
            }

            await OrgMeterIso.findByIdAndUpdate(orgMeterIso._id, updateData);

        } catch (error) {
            console.error(`Failed to update sync metadata for ISO ${orgMeterIso.id}:`, error.message);
        }
    }

    /**
     * Mark specific OrgMeter ISOs as needing sync
     * @param {Array} isoIds - Array of OrgMeter ISO IDs (numeric IDs)
     * @returns {Object} Update result
     */
    async markIsosForSync(isoIds) {
        try {
            const result = await OrgMeterIso.updateMany(
                {
                    id: { $in: isoIds },
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
                message: `Marked ${result.nModified} ISOs for sync`,
                modifiedCount: result.nModified
            };

        } catch (error) {
            throw new ErrorResponse(`Failed to mark ISOs for sync: ${error.message}`, 500);
        }
    }

    /**
     * Get sync results summary
     * @returns {Object} Sync statistics
     */
    getSyncResults() {
        return {
            success: true,
            message: 'ISO sync completed',
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
     * Get sync status for OrgMeter ISOs
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
            const isos = await OrgMeterIso.find(query)
                .populate('syncMetadata.syncId', 'name email')
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await OrgMeterIso.countDocuments(query);

            // Get overall sync statistics
            const syncStats = await OrgMeterIso.aggregate([
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

            const stats = syncStats[0] || { total: 0, selected: 0, synced: 0, ignored: 0 };

            return {
                success: true,
                data: {
                    isos,
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

module.exports = SyncOrgMeterIsoService; 