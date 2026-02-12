const OrgMeterMerchant = require('../../../models/OrgMeter/Merchant');
const Merchant = require('../../../models/Merchant');
const Funder = require('../../../models/Funder');
const MerchantFunder = require('../../../models/MerchantFunder');
const ErrorResponse = require('../../../utils/errorResponse');
const { ENTITY_TYPES } = require('../../../utils/constants');

const SIC_CODES = require('../../../../data/sic.json');
const NAICS_CODES = require('../../../../data/naics_2022.json');

/**
 * Sync OrgMeter Merchants to system Merchants
 */
class SyncOrgMeterMerchantService {
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
     * Sync all selected OrgMeter Merchants to system Merchants
     * @param {Object} options - Sync options
     * @returns {Object} Sync results
     */
    async syncAllMerchants(options = {}) {
        const {
            dryRun = false,
            updateExisting = true,
            onlySelected = true,
            progressCallback = null,
            resumeFromIndex = 0
        } = options;

        try {
            console.log('Starting OrgMeter Merchants sync...');
            
            // Verify funder exists
            const funder = await Funder.findById(this.funderId);
            if (!funder) {
                throw new ErrorResponse('Funder not found', 404);
            }

            // Build query for OrgMeter Merchants to sync
            let query = {
                'importMetadata.funder': this.funderId
            };

            if (onlySelected) {
                query['syncMetadata.needsSync'] = true;
            }

            // Get all OrgMeter Merchants that need syncing
            const orgMeterMerchants = await OrgMeterMerchant.find(query).sort({ updatedAt: 1 });
            this.syncStats.totalProcessed = orgMeterMerchants.length;

            if (orgMeterMerchants.length === 0) {
                console.log('No OrgMeter Merchants found for syncing');
                return this.getSyncResults();
            }

            console.log(`Found ${orgMeterMerchants.length} OrgMeter Merchants to sync`);
            
            if (resumeFromIndex > 0) {
                console.log(`Resuming sync from index ${resumeFromIndex} (${resumeFromIndex}/${orgMeterMerchants.length} already processed)`);
            }

            if (dryRun) {
                console.log('Dry run mode - not saving to database');
                return this.getSyncResults();
            }

            // Process each Merchant, starting from resumeFromIndex
            for (let i = resumeFromIndex; i < orgMeterMerchants.length; i++) {
                const orgMeterMerchant = orgMeterMerchants[i];
                
                try {
                    const result = await this.syncMerchant(orgMeterMerchant, updateExisting);
                    
                    if (result.action === 'synced') {
                        this.syncStats.totalSynced++;
                    } else if (result.action === 'updated') {
                        this.syncStats.totalUpdated++;
                    } else if (result.action === 'skipped') {
                        this.syncStats.totalSkipped++;
                    }

                    // Update sync metadata
                    await this.updateSyncMetadata(orgMeterMerchant, result.syncedMerchant?._id);

                    // Update progress if callback provided (adjust for resume index)
                    if (progressCallback) {
                        const processedCount = i - resumeFromIndex + 1;
                        await progressCallback(processedCount, orgMeterMerchants.length - resumeFromIndex, orgMeterMerchant.businessName);
                    }

                } catch (error) {
                    console.error(`Failed to sync Merchant ${orgMeterMerchant.id}:`, error.message);
                    this.syncStats.totalFailed++;
                    this.syncStats.errors.push({
                        orgMeterId: orgMeterMerchant.id,
                        name: orgMeterMerchant.businessName,
                        error: error.message
                    });

                    // Still update progress even on error
                    if (progressCallback) {
                        const processedCount = i - resumeFromIndex + 1;
                        await progressCallback(processedCount, orgMeterMerchants.length - resumeFromIndex, orgMeterMerchant.businessName);
                    }
                }
            }

            console.log('OrgMeter Merchants sync completed');
            return this.getSyncResults();

        } catch (error) {
            console.error('Error during Merchants sync:', error.message);
            throw new ErrorResponse(`Sync failed: ${error.message}`, 500);
        }
    }

    /**
     * Sync a single OrgMeter Merchant to system Merchant
     * @param {Object} orgMeterMerchant - OrgMeter Merchant document
     * @param {boolean} updateExisting - Whether to update existing Merchants
     * @returns {Object} Sync result
     */
    async syncMerchant(orgMeterMerchant, updateExisting = true) {
        try {
            // Check if Merchant already exists in our system using syncId only
            let existingMerchant = null;
            
            if (orgMeterMerchant.syncMetadata?.syncId) {
                existingMerchant = await Merchant.findById(orgMeterMerchant.syncMetadata.syncId);
            }

            if (existingMerchant) {
                if (updateExisting) {
                    // Update existing Merchant
                    const updatedMerchant = await this.updateExistingMerchant(existingMerchant, orgMeterMerchant);
                    return {
                        action: 'updated',
                        syncedMerchant: updatedMerchant,
                        message: `Updated existing Merchant: ${updatedMerchant.name}`
                    };
                } else {
                    return {
                        action: 'skipped',
                        syncedMerchant: existingMerchant,
                        message: `Skipped existing Merchant: ${existingMerchant.name}`
                    };
                }
            } else {
                // Create new Merchant
                const newMerchant = await this.createNewMerchant(orgMeterMerchant);
                return {
                    action: 'synced',
                    syncedMerchant: newMerchant,
                    message: `Created new Merchant: ${newMerchant.name}`
                };
            }

        } catch (error) {
            throw new Error(`Failed to sync Merchant ${orgMeterMerchant.businessName}: ${error.message}`);
        }
    }

    /**
     * Transform OrgMeter Merchant data to system Merchant format
     * @param {Object} orgMeterMerchant - OrgMeter Merchant document
     * @returns {Object} Transformed merchant data
     */
    transform(orgMeterMerchant) {
        // Extract business email from businessEmails array
        // If there is any email is primary, use that one
        // Otherwise, use the first one
        const businessEmail = orgMeterMerchant.businessEmails?.length > 0 
            ? orgMeterMerchant.businessEmails.find(email => email.primary)?.email || orgMeterMerchant.businessEmails[0].email 
            : null;

        // Extract business phone from businessPhones array
        // If there is any phone is primary, use that one
        // Otherwise, use the first one
        const businessPhone = orgMeterMerchant.businessPhones?.length > 0 
            ? orgMeterMerchant.businessPhones.find(phone => phone.primary)?.number || orgMeterMerchant.businessPhones[0].number 
            : null;

        // Extract Federal ID from federalIds array
        // If there is any federalId is primary, use that one
        // Otherwise, use the first one
        const federalId = orgMeterMerchant.federalIds?.length > 0 
            ? orgMeterMerchant.federalIds.find(federalId => federalId.primary)?.number || orgMeterMerchant.federalIds[0].number
            : null;
        
        // Match businessType to entity_type
        // OrgMeter businessType is a string, with the following values:
        // '', 'Corporation', 'Limited Liability Company', 'Sole Proprietor'
        // We need to map these to the corresponding entity_type values
        const entityType = orgMeterMerchant.businessType === 'Corporation' ? ENTITY_TYPES.C_CORP :
            orgMeterMerchant.businessType === 'Limited Liability Company' ? ENTITY_TYPES.LLC :
                orgMeterMerchant.businessType === 'Sole Proprietor' ? ENTITY_TYPES.SOLE_PROP : null;

        // Map addresses from businessAddresses
        const addressList = orgMeterMerchant.businessAddresses?.map(addr => ({
            type: addr.type || 'physical',
            address_1: addr.address1,
            address_2: addr.address2 || null,
            city: addr.city,
            state: addr.state,
            zip: addr.zip,
            primary: addr.primary || false,
            verified: addr.verified || false
        })) || [];

        return {
            name: orgMeterMerchant.businessName,
            dba_name: orgMeterMerchant.businessDba || null,
            email: businessEmail,
            phone: businessPhone,
            website: orgMeterMerchant.businessWebsite || null,
            sic_detail: {
                code: orgMeterMerchant.sicCode || null,
                description: SIC_CODES.find(sic => sic.code === orgMeterMerchant.sicCode)?.description || null
            },
            naics_detail: {
                code: orgMeterMerchant.naicsCode || null,
                title: NAICS_CODES.find(naics => naics.code === orgMeterMerchant.naicsCode)?.title || null,
                description: NAICS_CODES.find(naics => naics.code === orgMeterMerchant.naicsCode)?.description || null
            },
            business_detail: {
                ein: federalId,
                entity_type: entityType || undefined,
                incorporation_date: orgMeterMerchant.businessStartDate || undefined
            },
            address_list: addressList,
            primary_contact: null, // Will be set later when contacts are synced
            primary_owner: null, // Will be set later when contacts are synced
            inactive: orgMeterMerchant.deleted || false
        };
    }

    /**
     * Create a new system Merchant from OrgMeter Merchant
     * @param {Object} orgMeterMerchant - OrgMeter Merchant document
     * @returns {Object} Created Merchant document
     */
    async createNewMerchant(orgMeterMerchant) {
        try {
            const merchantData = this.transform(orgMeterMerchant);
            const merchant = new Merchant(merchantData);
            await merchant.save();

            // Create Merchant funder relationship
            await this.createMerchantFunder(merchant._id, this.funderId);

            console.log(`Created new Merchant: ${merchant.name} (ID: ${merchant._id})`);
            return merchant;

        } catch (error) {
            throw new Error(`Failed to create Merchant: ${error.message}`);
        }
    }

    /**
     * Create a new MerchantFunder relationship
     * @param {String} merchantId - System merchant ID
     * @param {String} funderId - System funder ID
     * @returns {Object} Created MerchantFunder document
     */
    async createMerchantFunder(merchantId, funderId) {
        const existingMerchantFunder = await MerchantFunder.findOne({
            merchant: merchantId,
            funder: funderId
        });

        if (existingMerchantFunder) {
            return existingMerchantFunder;
        }

        const merchantFunder = new MerchantFunder({
            merchant: merchantId,
            funder: funderId
        });
        await merchantFunder.save();
    }

    /**
     * Update an existing system Merchant with OrgMeter Merchant data
     * @param {Object} existingMerchant - Existing system Merchant document
     * @param {Object} orgMeterMerchant - OrgMeter Merchant document
     * @returns {Object} Updated Merchant document
     */
    async updateExistingMerchant(existingMerchant, orgMeterMerchant) {
        try {
            // Get transformed merchant data
            const transformedData = this.transform(orgMeterMerchant);
            
            // Update fields that may have changed
            const updateData = {};

            if (transformedData.name && existingMerchant.name !== transformedData.name) {
                updateData.name = transformedData.name;
            }

            if (transformedData.dba_name && existingMerchant.dba_name !== transformedData.dba_name) {
                updateData.dba_name = transformedData.dba_name;
            }

            if (transformedData.email && existingMerchant.email !== transformedData.email) {
                updateData.email = transformedData.email;
            }

            if (transformedData.phone && existingMerchant.phone !== transformedData.phone) {
                updateData.phone = transformedData.phone;
            }

            if (transformedData.website && existingMerchant.website !== transformedData.website) {
                updateData.website = transformedData.website;
            }

            // Update SIC detail
            if (transformedData.sic_detail?.code && 
                (existingMerchant.sic_detail?.code !== transformedData.sic_detail.code ||
                 existingMerchant.sic_detail?.description !== transformedData.sic_detail.description)) {
                updateData.sic_detail = transformedData.sic_detail;
            }

            // Update NAICS detail
            if (transformedData.naics_detail?.code && 
                (existingMerchant.naics_detail?.code !== transformedData.naics_detail.code ||
                 existingMerchant.naics_detail?.title !== transformedData.naics_detail.title ||
                 existingMerchant.naics_detail?.description !== transformedData.naics_detail.description)) {
                updateData.naics_detail = transformedData.naics_detail;
            }

            // Update business details
            if (transformedData.business_detail) {
                const businessDetailUpdates = {};
                
                if (transformedData.business_detail.ein && 
                    existingMerchant.business_detail?.ein !== transformedData.business_detail.ein) {
                    businessDetailUpdates.ein = transformedData.business_detail.ein;
                }

                if (transformedData.business_detail.entity_type && 
                    existingMerchant.business_detail?.entity_type !== transformedData.business_detail.entity_type) {
                    businessDetailUpdates.entity_type = transformedData.business_detail.entity_type;
                }

                if (transformedData.business_detail.incorporation_date && 
                    existingMerchant.business_detail?.incorporation_date !== transformedData.business_detail.incorporation_date) {
                    businessDetailUpdates.incorporation_date = transformedData.business_detail.incorporation_date;
                }

                if (Object.keys(businessDetailUpdates).length > 0) {
                    updateData.business_detail = {
                        ...existingMerchant.business_detail,
                        ...businessDetailUpdates
                    };
                }
            }

            // Update addresses
            if (transformedData.address_list?.length > 0) {
                updateData.address_list = transformedData.address_list;
            }

            // Update inactive status
            if (existingMerchant.inactive !== transformedData.inactive) {
                updateData.inactive = transformedData.inactive;
            }

            // Only update if there are actual changes
            if (Object.keys(updateData).length > 0) {
                Object.assign(existingMerchant, updateData);
                await existingMerchant.save();
                console.log(`Updated Merchant: ${existingMerchant.name} (ID: ${existingMerchant._id})`);
            } else {
                console.log(`No changes needed for Merchant: ${existingMerchant.name}`);
            }

            // Update MerchantFunder relationship
            await this.createMerchantFunder(existingMerchant._id, this.funderId);

            return existingMerchant;

        } catch (error) {
            throw new Error(`Failed to update Merchant: ${error.message}`);
        }
    }

    /**
     * Update sync metadata for OrgMeter Merchant
     * @param {Object} orgMeterMerchant - OrgMeter Merchant document
     * @param {String} syncedMerchantId - ID of the synced system Merchant
     */
    async updateSyncMetadata(orgMeterMerchant, syncedMerchantId = null) {
        try {
            const updateData = {
                'syncMetadata.lastSyncedAt': new Date(),
                'syncMetadata.lastSyncedBy': this.userId || 'system'
            };

            if (syncedMerchantId) {
                updateData['syncMetadata.syncId'] = syncedMerchantId;
                // Don't change needsSync - it remains as user's selection
            }

            await OrgMeterMerchant.findByIdAndUpdate(orgMeterMerchant._id, updateData);

        } catch (error) {
            console.error(`Failed to update sync metadata for Merchant ${orgMeterMerchant.id}:`, error.message);
        }
    }

    /**
     * Mark specific OrgMeter Merchants as needing sync
     * @param {Array} merchantIds - Array of OrgMeter Merchant IDs (numeric IDs)
     * @returns {Object} Update result
     */
    async markMerchantsForSync(merchantIds) {
        try {
            const result = await OrgMeterMerchant.updateMany(
                {
                    id: { $in: merchantIds },
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
                message: `Marked ${result.nModified} Merchants for sync`,
                modifiedCount: result.nModified
            };

        } catch (error) {
            throw new ErrorResponse(`Failed to mark Merchants for sync: ${error.message}`, 500);
        }
    }

    /**
     * Get sync results summary
     * @returns {Object} Sync statistics
     */
    getSyncResults() {
        return {
            success: true,
            message: 'Merchant sync completed',
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
     * Get sync status for OrgMeter Merchants
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
                    { businessName: { $regex: search, $options: 'i' } },
                    { businessDba: { $regex: search, $options: 'i' } },
                    { 'businessEmails.email': { $regex: search, $options: 'i' } }
                ];
            }

            const skip = (page - 1) * limit;
            const merchants = await OrgMeterMerchant.find(query)
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await OrgMeterMerchant.countDocuments(query);

            // Get overall sync statistics
            const syncStats = await OrgMeterMerchant.aggregate([
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
                    merchants,
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

module.exports = SyncOrgMeterMerchantService; 