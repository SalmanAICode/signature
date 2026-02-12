const { model: OrgMeterSalesRepUser } = require('../../../models/OrgMeter/SalesRepUser');
const OrgMeterIso = require('../../../models/OrgMeter/Iso');
const Representative = require('../../../models/Representative');
const RepresentativeISO = require('../../../models/RepresentativeISO');
const Funder = require('../../../models/Funder');
const ErrorResponse = require('../../../utils/errorResponse');
const { ROLES } = require('../../../utils/permissions');

/**
 * Sync OrgMeter sales rep users to system representatives
 */
class SyncOrgMeterRepresentativeService {
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
     * Sync all selected OrgMeter sales rep users to system representatives
     * @param {Object} options - Sync options
     * @returns {Object} Sync results
     */
    async syncAllRepresentatives(options = {}) {
        const {
            dryRun = false,
            updateExisting = true,
            onlySelected = true,
            progressCallback = null
        } = options;

        try {
            console.log('Starting OrgMeter sales rep users sync...');
            
            // Verify funder exists
            const funder = await Funder.findById(this.funderId);
            if (!funder) {
                throw new ErrorResponse('Funder not found', 404);
            }

            // Build query for OrgMeter sales rep users to sync
            let query = {
                'importMetadata.funder': this.funderId
            };

            if (onlySelected) {
                query['syncMetadata.needsSync'] = true;
            }

            // Get all OrgMeter sales rep users that need syncing
            const orgMeterSalesReps = await OrgMeterSalesRepUser.find(query).sort({ 'importMetadata.importedAt': 1 });
            this.syncStats.totalProcessed = orgMeterSalesReps.length;

            if (orgMeterSalesReps.length === 0) {
                console.log('No OrgMeter sales rep users found for syncing');
                return this.getSyncResults();
            }

            console.log(`Found ${orgMeterSalesReps.length} OrgMeter sales rep users to sync`);

            if (dryRun) {
                console.log('Dry run mode - not saving to database');
                return this.getSyncResults();
            }

            // Process each sales rep user
            for (let i = 0; i < orgMeterSalesReps.length; i++) {
                const orgMeterSalesRep = orgMeterSalesReps[i];
                
                try {
                    const result = await this.syncRepresentative(orgMeterSalesRep, updateExisting);
                    
                    if (result.action === 'synced') {
                        this.syncStats.totalSynced++;
                    } else if (result.action === 'updated') {
                        this.syncStats.totalUpdated++;
                    } else if (result.action === 'skipped') {
                        this.syncStats.totalSkipped++;
                    }

                    // Update sync metadata
                    await this.updateSyncMetadata(orgMeterSalesRep, result.syncedRepresentative?._id);

                    // Update progress if callback provided
                    if (progressCallback) {
                        await progressCallback(i + 1, orgMeterSalesReps.length, this.getRepresentativeDisplayName(orgMeterSalesRep));
                    }

                } catch (error) {
                    console.error(`Failed to sync sales rep user ${orgMeterSalesRep.id}:`, error.message);
                    this.syncStats.totalFailed++;
                    this.syncStats.errors.push({
                        orgMeterId: orgMeterSalesRep.id,
                        name: this.getRepresentativeDisplayName(orgMeterSalesRep),
                        error: error.message
                    });

                    // Still update progress even on error
                    if (progressCallback) {
                        await progressCallback(i + 1, orgMeterSalesReps.length, this.getRepresentativeDisplayName(orgMeterSalesRep));
                    }
                }
            }

            console.log('OrgMeter sales rep users sync completed');
            return this.getSyncResults();

        } catch (error) {
            console.error('Error during sales rep users sync:', error.message);
            throw new ErrorResponse(`Sync failed: ${error.message}`, 500);
        }
    }

    /**
     * Transform OrgMeter sales rep user data to system representative format
     * @param {Object} orgMeterSalesRep - OrgMeter sales rep user document
     * @returns {Object} Transformed representative data
     */
    transform(orgMeterSalesRep) {
        return {
            title: undefined,
            first_name: orgMeterSalesRep.firstName || 'Unknown',
            last_name: orgMeterSalesRep.lastName || 'Representative',
            email: undefined, // SalesRepUser doesn't have email
            phone_mobile: undefined,
            phone_work: undefined,
            phone_home: undefined,
            birthday: undefined,
            address_detail: undefined,
            type: ROLES.ISO_SALES, // Sales rep users are ISO sales representatives
            last_login: undefined,
            online: false,
            inactive: false // Sales reps are typically active
        };
    }

    /**
     * Get display name for sales rep user
     * @param {Object} orgMeterSalesRep - OrgMeter sales rep user document
     * @returns {String} Display name
     */
    getRepresentativeDisplayName(orgMeterSalesRep) {
        if (orgMeterSalesRep.firstName && orgMeterSalesRep.lastName) {
            return `${orgMeterSalesRep.firstName} ${orgMeterSalesRep.lastName}`;
        }
        return `Sales Rep ${orgMeterSalesRep.id}`;
    }

    /**
     * Find all ISOs that contain the given sales rep user
     * @param {Object} orgMeterSalesRep - OrgMeter sales rep user document
     * @returns {Array} Array of OrgMeter ISO documents (could be empty)
     */
    async findISOForSalesRep(orgMeterSalesRep) {
        try {
            // Find all OrgMeter ISOs that contain this sales rep in their salesRepUsers array
            const orgMeterIsos = await OrgMeterIso.find({
                'importMetadata.funder': this.funderId,
                'salesRepUsers.id': orgMeterSalesRep.id
            });

            return orgMeterIsos || [];
        } catch (error) {
            console.error(`Error finding ISOs for sales rep ${orgMeterSalesRep.id}:`, error.message);
            return [];
        }
    }

    /**
     * Sync a single OrgMeter sales rep user to system representative
     * @param {Object} orgMeterSalesRep - OrgMeter sales rep user document
     * @param {boolean} updateExisting - Whether to update existing representatives
     * @returns {Object} Sync result
     */
    async syncRepresentative(orgMeterSalesRep, updateExisting = true) {
        try {
            let existingRepresentative = null;
            
            // First, check if representative already exists by syncId
            if (orgMeterSalesRep.syncMetadata?.syncId) {
                existingRepresentative = await Representative.findById(orgMeterSalesRep.syncMetadata.syncId);
            }
            
            // If not found by syncId, check by name combination (since no email available)
            if (!existingRepresentative && orgMeterSalesRep.firstName && orgMeterSalesRep.lastName) {
                existingRepresentative = await Representative.findOne({ 
                    first_name: orgMeterSalesRep.firstName,
                    last_name: orgMeterSalesRep.lastName
                });
                
                // If found by name, update the syncId in OrgMeter record
                if (existingRepresentative) {
                    console.log(`Found existing representative by name: ${orgMeterSalesRep.firstName} ${orgMeterSalesRep.lastName} (ID: ${existingRepresentative._id})`);
                    await this.updateSyncMetadata(orgMeterSalesRep, existingRepresentative._id);
                }
            }

            if (existingRepresentative) {
                if (updateExisting) {
                    // Update existing representative
                    const updatedRepresentative = await this.updateExistingRepresentative(existingRepresentative, orgMeterSalesRep);
                    return {
                        action: 'updated',
                        syncedRepresentative: updatedRepresentative,
                        message: `Updated existing representative: ${this.getRepresentativeDisplayName(orgMeterSalesRep)}`
                    };
                } else {
                    return {
                        action: 'skipped',
                        syncedRepresentative: existingRepresentative,
                        message: `Skipped existing representative: ${this.getRepresentativeDisplayName(orgMeterSalesRep)}`
                    };
                }
            } else {
                // Create new representative
                const newRepresentative = await this.createNewRepresentative(orgMeterSalesRep);
                return {
                    action: 'synced',
                    syncedRepresentative: newRepresentative,
                    message: `Created new representative: ${this.getRepresentativeDisplayName(orgMeterSalesRep)}`
                };
            }

        } catch (error) {
            throw new Error(`Failed to sync sales rep user ${this.getRepresentativeDisplayName(orgMeterSalesRep)}: ${error.message}`);
        }
    }

    /**
     * Create a new system representative from OrgMeter sales rep user
     * @param {Object} orgMeterSalesRep - OrgMeter sales rep user document
     * @returns {Object} Created representative document
     */
    async createNewRepresentative(orgMeterSalesRep) {
        try {
            const representativeData = this.transform(orgMeterSalesRep);

            const representative = new Representative(representativeData);
            await representative.save();

            console.log(`Created new representative: ${this.getRepresentativeDisplayName(orgMeterSalesRep)} (ID: ${representative._id})`);

            // Create RepresentativeISO relationship
            await this.createRepresentativeISO(representative._id, orgMeterSalesRep);

            return representative;

        } catch (error) {
            throw new Error(`Failed to create representative: ${error.message}`);
        }
    }

    /**
     * Update an existing system representative with OrgMeter sales rep user data
     * @param {Object} existingRepresentative - Existing system representative document
     * @param {Object} orgMeterSalesRep - OrgMeter sales rep user document
     * @returns {Object} Updated representative document
     */
    async updateExistingRepresentative(existingRepresentative, orgMeterSalesRep) {
        try {
            // Update fields that may have changed
            const updateData = {};
            const transformedData = this.transform(orgMeterSalesRep);

            // Compare and update changed fields (excluding email and phone_mobile which are placeholders)
            ['title', 'first_name', 'last_name', 'phone_work', 'phone_home', 'birthday', 'type', 'inactive'].forEach(key => {
                if (transformedData[key] !== undefined && existingRepresentative[key] !== transformedData[key]) {
                    updateData[key] = transformedData[key];
                }
            });

            // Only update if there are actual changes
            if (Object.keys(updateData).length > 0) {
                Object.assign(existingRepresentative, updateData);
                await existingRepresentative.save();
                console.log(`Updated representative: ${this.getRepresentativeDisplayName(orgMeterSalesRep)} (ID: ${existingRepresentative._id})`);
            } else {
                console.log(`No changes needed for representative: ${this.getRepresentativeDisplayName(orgMeterSalesRep)}`);
            }

            // Update or create RepresentativeISO relationship
            await this.updateRepresentativeISO(existingRepresentative._id, orgMeterSalesRep);

            return existingRepresentative;

        } catch (error) {
            throw new Error(`Failed to update representative: ${error.message}`);
        }
    }

    /**
     * Create RepresentativeISO relationship
     * @param {String} representativeId - System representative ID
     * @param {Object} orgMeterSalesRep - OrgMeter sales rep user document
     */
    async createRepresentativeISO(representativeId, orgMeterSalesRep) {
        try {
            // Find all OrgMeter ISOs that contain this sales rep
            const orgMeterIsos = await this.findISOForSalesRep(orgMeterSalesRep);
            
            if (!orgMeterIsos || orgMeterIsos.length === 0) {
                console.log(`No ISOs found for sales rep ${orgMeterSalesRep.id}, skipping RepresentativeISO creation`);
                return [];
            }

            const createdRelationships = [];

            // Create RepresentativeISO relationship for each ISO
            for (const orgMeterIso of orgMeterIsos) {
                if (!orgMeterIso.syncMetadata?.syncId) {
                    console.log(`ISO ${orgMeterIso.id} has no syncId, skipping RepresentativeISO creation`);
                    continue;
                }

                const mainIsoId = orgMeterIso.syncMetadata.syncId;

                // Check if RepresentativeISO already exists
                const existingRepresentativeISO = await RepresentativeISO.findOne({
                    representative: representativeId,
                    iso: mainIsoId
                });

                if (existingRepresentativeISO) {
                    console.log(`RepresentativeISO relationship already exists for representative ${representativeId}, ISO ${mainIsoId}`);
                    createdRelationships.push(existingRepresentativeISO);
                    continue;
                }

                const representativeISOData = {
                    representative: representativeId,
                    iso: mainIsoId
                };

                const representativeISO = new RepresentativeISO(representativeISOData);
                await representativeISO.save();

                console.log(`Created RepresentativeISO relationship: Representative ${representativeId}, ISO ${mainIsoId}`);
                createdRelationships.push(representativeISO);
            }

            return createdRelationships;

        } catch (error) {
            console.error(`Failed to create RepresentativeISO relationship: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update RepresentativeISO relationship
     * @param {String} representativeId - System representative ID
     * @param {Object} orgMeterSalesRep - OrgMeter sales rep user document
     */
    async updateRepresentativeISO(representativeId, orgMeterSalesRep) {
        try {
            // Find all OrgMeter ISOs that contain this sales rep
            const orgMeterIsos = await this.findISOForSalesRep(orgMeterSalesRep);
            
            if (!orgMeterIsos || orgMeterIsos.length === 0) {
                console.log(`No ISOs found for sales rep ${orgMeterSalesRep.id}, skipping RepresentativeISO update`);
                return [];
            }

            const updatedRelationships = [];

            // Process each ISO
            for (const orgMeterIso of orgMeterIsos) {
                if (!orgMeterIso.syncMetadata?.syncId) {
                    console.log(`ISO ${orgMeterIso.id} has no syncId, skipping RepresentativeISO update`);
                    continue;
                }

                const mainIsoId = orgMeterIso.syncMetadata.syncId;

                // Find existing RepresentativeISO
                let representativeISO = await RepresentativeISO.findOne({
                    representative: representativeId,
                    iso: mainIsoId
                });

                if (!representativeISO) {
                    // Create new relationship if it doesn't exist
                    const representativeISOData = {
                        representative: representativeId,
                        iso: mainIsoId
                    };

                    representativeISO = new RepresentativeISO(representativeISOData);
                    await representativeISO.save();
                    console.log(`Created RepresentativeISO relationship: Representative ${representativeId}, ISO ${mainIsoId}`);
                }
                
                // RepresentativeISO is simple - no fields to update besides the relationship itself
                updatedRelationships.push(representativeISO);
            }

            return updatedRelationships;

        } catch (error) {
            console.error(`Failed to update RepresentativeISO relationship: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update sync metadata for OrgMeter sales rep user
     * @param {Object} orgMeterSalesRep - OrgMeter sales rep user document
     * @param {String} syncedRepresentativeId - ID of the synced system representative
     */
    async updateSyncMetadata(orgMeterSalesRep, syncedRepresentativeId = null) {
        try {
            const updateData = {
                'syncMetadata.lastSyncedAt': new Date(),
                'syncMetadata.lastSyncedBy': this.userId || 'system'
            };

            if (syncedRepresentativeId) {
                updateData['syncMetadata.syncId'] = syncedRepresentativeId;
                console.log(`Updating SalesRepUser ${orgMeterSalesRep.id} syncId to: ${syncedRepresentativeId}`);
                // Don't change needsSync - it remains as user's selection
            }

            // Use findOneAndUpdate with id and funder since _id is disabled
            const result = await OrgMeterSalesRepUser.findOneAndUpdate(
                { 
                    id: orgMeterSalesRep.id,
                    'importMetadata.funder': orgMeterSalesRep.importMetadata.funder
                },
                { $set: updateData },
                { new: true }
            );

            if (result) {
                console.log(`Successfully updated SalesRepUser ${orgMeterSalesRep.id} syncMetadata`);
            } else {
                console.log(`Warning: SalesRepUser ${orgMeterSalesRep.id} not found for sync metadata update`);
            }

        } catch (error) {
            console.error(`Failed to update sync metadata for sales rep user ${orgMeterSalesRep.id}:`, error.message);
        }
    }

    /**
     * Mark specific OrgMeter sales rep users as needing sync
     * @param {Array} salesRepIds - Array of OrgMeter sales rep user IDs (numeric IDs)
     * @param {String} funderId - Funder ID to filter by
     * @returns {Object} Update result
     */
    async markRepresentativesForSync(salesRepIds, funderId) {
        try {
            const result = await OrgMeterSalesRepUser.updateMany(
                {
                    id: { $in: salesRepIds },
                    'importMetadata.funder': funderId
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
                message: `Marked ${result.modifiedCount} sales rep users for sync`,
                modifiedCount: result.modifiedCount
            };

        } catch (error) {
            throw new ErrorResponse(`Failed to mark sales rep users for sync: ${error.message}`, 500);
        }
    }

    /**
     * Get sync results summary
     * @returns {Object} Sync statistics
     */
    getSyncResults() {
        return {
            success: true,
            message: 'Sales rep user sync completed',
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
     * Get sync status for OrgMeter sales rep users
     * @param {Object} options - Query options
     * @returns {Object} Sync status data
     */
    async getSyncStatus(options = {}) {
        try {
            const {
                page = 1,
                limit = 20,
                search = null,
                syncStatus = 'all', // 'all', 'pending', 'synced', 'ignored'
                funderId = null
            } = options;

            let query = {};
            
            if (funderId) {
                query['importMetadata.funder'] = funderId;
            }

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
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } }
                ];
            }

            const skip = (page - 1) * limit;
            const salesReps = await OrgMeterSalesRepUser.find(query)
                .populate('syncMetadata.syncId', 'first_name last_name email phone_mobile')
                .sort({ 'importMetadata.importedAt': -1 })
                .skip(skip)
                .limit(limit);

            const total = await OrgMeterSalesRepUser.countDocuments(query);

            // Get overall sync statistics
            const syncStats = await OrgMeterSalesRepUser.aggregate([
                { $match: query },
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
                    salesReps,
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

module.exports = SyncOrgMeterRepresentativeService; 