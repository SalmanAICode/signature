const OrgMeterAdvance = require('../../../models/OrgMeter/Advance');
const Funding = require('../../../models/Funding');
const Funder = require('../../../models/Funder');
const Merchant = require('../../../models/Merchant');
const Lender = require('../../../models/Lender');
const ISO = require('../../../models/ISO');
const User = require('../../../models/User');
const FundingStatus = require('../../../models/FundingStatus');
const PaybackPlan = require('../../../models/PaybackPlan');
const FundingFee = require('../../../models/FundingFee');
const FundingExpense = require('../../../models/FundingExpense');

const ErrorResponse = require('../../../utils/errorResponse');
const { FUNDING_TYPES } = require('../../../utils/constants');
const SyncOrgMeterPaybackPlanService = require('./syncOrgMeterPaybackPlanService');
const SyncOrgMeterFundingFeeService = require('./syncOrgMeterFundingFeeService');
const SyncOrgMeterFundingExpenseService = require('./syncOrgMeterFundingExpenseService');
const SyncOrgMeterDisbursementService = require('./syncOrgMeterDisbursementService');
const SyncOrgMeterCommissionService = require('./syncOrgMeterCommissionService');
const SyncOrgMeterSyndicationService = require('./syncOrgMeterSyndicationService');
const SyncOrgMeterPaybackService = require('./syncOrgMeterPaybackService');

/**
 * Format the funding data before saving (convert IDs to embedded objects)
 * @param {Object} funding - The funding data
 * @returns {Object} - The formatted funding data
 */
const formatDataBeforeSave = async (funding) => {
    if (funding.follower_list) {
        if (funding.assigned_manager && !funding.follower_list.includes(funding.assigned_manager)) {
            funding.follower_list.push(funding.assigned_manager);
        }
        if (funding.assigned_user && !funding.follower_list.includes(funding.assigned_user)) {
            funding.follower_list.push(funding.assigned_user);
        }
    }

    const conversions = await Promise.all([
        funding.funder ? Funder.convertToEmbeddedFormat(funding.funder) : Promise.resolve(null),
        funding.merchant ? Merchant.convertToEmbeddedFormat(funding.merchant) : Promise.resolve(null),
        funding.lender ? Lender.convertToEmbeddedFormat(funding.lender) : Promise.resolve(null),
        funding.iso ? ISO.convertToEmbeddedFormat(funding.iso) : Promise.resolve(null),
        funding.assigned_manager ? User.convertToEmbeddedFormat(funding.assigned_manager) : Promise.resolve(null),
        funding.assigned_user ? User.convertToEmbeddedFormat(funding.assigned_user) : Promise.resolve(null),
        funding.status ? FundingStatus.convertToEmbeddedFormat(funding.status) : Promise.resolve(null)
    ]);

    // Assign converted values back to funding data
    if (funding.funder) funding.funder = conversions[0];
    if (funding.merchant) funding.merchant = conversions[1];
    if (funding.lender) funding.lender = conversions[2];
    if (funding.iso) funding.iso = conversions[3];
    if (funding.assigned_manager) funding.assigned_manager = conversions[4];
    if (funding.assigned_user) funding.assigned_user = conversions[5];
    if (funding.status) funding.status = conversions[6];

    return funding;
};

/**
 * Sync OrgMeter advances to system fundings
 */
class SyncOrgMeterAdvanceService {
    constructor(funderId, userId = null) {
        this.funderId = funderId;
        this.userId = userId;
        this.paybackPlanService = new SyncOrgMeterPaybackPlanService(funderId, userId);
        this.fundingFeeService = new SyncOrgMeterFundingFeeService(funderId, userId);
        this.fundingExpenseService = new SyncOrgMeterFundingExpenseService(funderId, userId);
        this.disbursementService = new SyncOrgMeterDisbursementService(funderId, userId);
        this.commissionService = new SyncOrgMeterCommissionService(funderId, userId);
        this.syndicationService = new SyncOrgMeterSyndicationService(funderId, userId);
        this.paybackService = new SyncOrgMeterPaybackService(funderId, userId);
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
     * Sync all selected OrgMeter advances to system fundings
     * @param {Object} options - Sync options
     * @returns {Object} Sync results
     */
    async syncAllAdvances(options = {}) {
        const {
            dryRun = false,
            updateExisting = true,
            onlySelected = true,
            progressCallback = null,
            resumeFromIndex = 0
        } = options;

        try {
            console.log('Starting OrgMeter advances sync...');
            
            // Verify funder exists
            const funder = await Funder.findById(this.funderId);
            if (!funder) {
                throw new ErrorResponse('Funder not found', 404);
            }

            // Build query for OrgMeter advances to sync
            let query = {
                'importMetadata.funder': this.funderId,
                deleted: false
            };

            if (onlySelected) {
                query['syncMetadata.needsSync'] = true;
            }

            // Get all OrgMeter advances that need syncing
            const orgMeterAdvances = await OrgMeterAdvance.find(query).sort({ updatedAt: 1 });
            this.syncStats.totalProcessed = orgMeterAdvances.length;

            if (orgMeterAdvances.length === 0) {
                console.log('No OrgMeter advances found for syncing');
                return this.getSyncResults();
            }

            console.log(`Found ${orgMeterAdvances.length} OrgMeter advances to sync`);
            
            if (resumeFromIndex > 0) {
                console.log(`Resuming sync from index ${resumeFromIndex} (${resumeFromIndex}/${orgMeterAdvances.length} already processed)`);
            }

            if (dryRun) {
                console.log('Dry run mode - not saving to database');
                return this.getSyncResults();
            }

            // Process each advance, starting from resumeFromIndex
            for (let i = resumeFromIndex; i < orgMeterAdvances.length; i++) {
                const orgMeterAdvance = orgMeterAdvances[i];
                
                try {
                    const result = await this.syncAdvance(orgMeterAdvance, updateExisting);
                    
                    if (result.action === 'synced') {
                        this.syncStats.totalSynced++;
                    } else if (result.action === 'updated') {
                        this.syncStats.totalUpdated++;
                    } else if (result.action === 'skipped') {
                        this.syncStats.totalSkipped++;
                    }

                    // Update sync metadata
                    await this.updateSyncMetadata(orgMeterAdvance, result.syncedFunding?._id);

                    // Update progress if callback provided (adjust for resume index)
                    if (progressCallback) {
                        const processedCount = i - resumeFromIndex + 1;
                        await progressCallback(processedCount, orgMeterAdvances.length - resumeFromIndex, this.getAdvanceDisplayName(orgMeterAdvance));
                    }

                } catch (error) {
                    console.error(`Failed to sync advance ${orgMeterAdvance.id}:`, error.message);
                    this.syncStats.totalFailed++;
                    this.syncStats.errors.push({
                        orgMeterId: orgMeterAdvance.id,
                        name: this.getAdvanceDisplayName(orgMeterAdvance),
                        error: error.message
                    });

                    // Still update progress even on error
                    if (progressCallback) {
                        const processedCount = i - resumeFromIndex + 1;
                        await progressCallback(processedCount, orgMeterAdvances.length - resumeFromIndex, this.getAdvanceDisplayName(orgMeterAdvance));
                    }
                }
            }

            console.log('OrgMeter advances sync completed');
            return this.getSyncResults();

        } catch (error) {
            console.error('Error during advances sync:', error.message);
            throw new ErrorResponse(`Sync failed: ${error.message}`, 500);
        }
    }

    /**
     * Sync a single OrgMeter advance to system funding
     * @param {Object} orgMeterAdvance - OrgMeter advance document
     * @param {boolean} updateExisting - Whether to update existing fundings
     * @returns {Object} Sync result
     */
    async syncAdvance(orgMeterAdvance, updateExisting = true) {
        try {
            let existingFunding = null;
            
            // First, check if funding already exists by syncId
            if (orgMeterAdvance.syncMetadata?.syncId) {
                existingFunding = await Funding.findById(orgMeterAdvance.syncMetadata.syncId);
            }
            
            // If not found by syncId, check by advance ID text or name
            if (!existingFunding && (orgMeterAdvance.idText || orgMeterAdvance.name)) {
                const searchName = orgMeterAdvance.idText || orgMeterAdvance.name;
                existingFunding = await Funding.findOne({ 
                    name: searchName,
                    'funder.id': this.funderId
                });
                
                // If found by name, update the syncId in OrgMeter record
                if (existingFunding) {
                    console.log(`Found existing funding by name: ${searchName} (ID: ${existingFunding._id})`);
                    await this.updateSyncMetadata(orgMeterAdvance, existingFunding._id);
                }
            }

            if (existingFunding) {
                if (updateExisting) {
                    // Update existing funding
                    const updatedFunding = await this.updateExistingFunding(existingFunding, orgMeterAdvance);
                    return {
                        action: 'updated',
                        syncedFunding: updatedFunding,
                        message: `Updated existing funding: ${updatedFunding.name}`
                    };
                } else {
                    return {
                        action: 'skipped',
                        syncedFunding: existingFunding,
                        message: `Skipped existing funding: ${existingFunding.name}`
                    };
                }
            } else {
                // Create new funding
                const newFunding = await this.createNewFunding(orgMeterAdvance);
                return {
                    action: 'synced',
                    syncedFunding: newFunding,
                    message: `Created new funding: ${newFunding.name}`
                };
            }

        } catch (error) {
            throw new Error(`Failed to sync advance ${this.getAdvanceDisplayName(orgMeterAdvance)}: ${error.message}`);
        }
    }

    /**
     * Safely extract ID from an object or Mongoose document
     * @param {Object|Number} obj - Object that might have an id property or be an ID itself
     * @returns {Number|null} The ID value or null
     */
    extractId(obj) {
        if (!obj) return null;
        
        // If it's already a number, return it
        if (typeof obj === 'number') return obj;
        
        // If it's an object with an id property
        if (typeof obj === 'object') {
            // Handle Mongoose documents where .id is a getter function
            if (typeof obj.id === 'function') {
                // Try to get the actual id value
                const idValue = obj.id();
                return typeof idValue === 'number' ? idValue : parseInt(idValue) || null;
            }
            // Handle plain objects with id property
            if (obj.id !== undefined) {
                return typeof obj.id === 'number' ? obj.id : parseInt(obj.id) || null;
            }
            // Handle objects with _id property
            if (obj._id !== undefined) {
                return typeof obj._id === 'number' ? obj._id : parseInt(obj._id) || null;
            }
        }
        
        return null;
    }

    /**
     * Transform OrgMeter Advance data to system Funding format
     * @param {Object} orgMeterAdvance - OrgMeter Advance document
     * @returns {Object} Transformed funding data
     */
    async transformFunding(orgMeterAdvance) {
        // Find synced entity IDs
        let merchantId = null;
        if (orgMeterAdvance.merchantId) {
            const orgMeterMerchant = await require('../../../models/OrgMeter/Merchant').findOne({
                id: orgMeterAdvance.merchantId,
                'importMetadata.funder': this.funderId,
                'syncMetadata.syncId': { $exists: true }
            });
            merchantId = orgMeterMerchant?.syncMetadata?.syncId;
        }

        let lenderId = null;
        let internal = false;
        const lenderIdValue = this.extractId(orgMeterAdvance.lender);
        if (lenderIdValue) {
            const orgMeterLender = await require('../../../models/OrgMeter/Lender').findOne({
                id: lenderIdValue,
                'importMetadata.funder': this.funderId,
                'syncMetadata.syncId': { $exists: true }
            });
            lenderId = orgMeterLender?.syncMetadata?.syncId;
            internal = orgMeterLender?.type?.toLowerCase() === 'internal' || false;
        }

        let isoId = null;
        const isoIdValue = this.extractId(orgMeterAdvance.iso);
        if (isoIdValue) {
            const orgMeterIso = await require('../../../models/OrgMeter/Iso').findOne({
                id: isoIdValue,
                'importMetadata.funder': this.funderId,
                'syncMetadata.syncId': { $exists: true }
            });
            isoId = orgMeterIso?.syncMetadata?.syncId;
        }

        // Find assigned user (underwriter)
        let assignedUserId = null;
        const underwriterIdValue = this.extractId(orgMeterAdvance.underwriter);
        if (underwriterIdValue) {
            const orgMeterUnderwriter = await require('../../../models/OrgMeter/UnderwriterUser').model.findOne({
                id: underwriterIdValue,
                'importMetadata.funder': this.funderId,
                'syncMetadata.syncId': { $exists: true }
            });
            assignedUserId = orgMeterUnderwriter?.syncMetadata?.syncId;
        }

        // Find assigned manager (assignedTo)
        let assignedManagerId = null;
        const assignedToIdValue = this.extractId(orgMeterAdvance.assignedTo);
        if (assignedToIdValue) {
            const orgMeterAssignedTo = await require('../../../models/OrgMeter/User').findOne({
                id: assignedToIdValue,
                'importMetadata.funder': this.funderId,
                'syncMetadata.syncId': { $exists: true }
            });
            assignedManagerId = orgMeterAssignedTo?.syncMetadata?.syncId;
        }

        // Find representative (salesRep)
        let representativeId = null;
        const salesRepIdValue = this.extractId(orgMeterAdvance.salesRep);
        if (salesRepIdValue) {
            const orgMeterSalesRep = await require('../../../models/OrgMeter/SalesRepUser').model.findOne({
                id: salesRepIdValue,
                'importMetadata.funder': this.funderId,
                'syncMetadata.syncId': { $exists: true }
            });
            representativeId = orgMeterSalesRep?.syncMetadata?.syncId;
        }

        // Find created by user
        let createdByUserId = null;
        const createdByIdValue = this.extractId(orgMeterAdvance.createdBy);
        if (createdByIdValue) {
            const orgMeterCreatedBy = await require('../../../models/OrgMeter/User').findOne({
                id: createdByIdValue,
                'importMetadata.funder': this.funderId,
                'syncMetadata.syncId': { $exists: true }
            });
            createdByUserId = orgMeterCreatedBy?.syncMetadata?.syncId;
        }

        // Find updated by user
        let updatedByUserId = null;
        const updatedByIdValue = this.extractId(orgMeterAdvance.updatedBy);
        if (updatedByIdValue) {
            const orgMeterUpdatedBy = await require('../../../models/OrgMeter/User').findOne({
                id: updatedByIdValue,
                'importMetadata.funder': this.funderId,
                'syncMetadata.syncId': { $exists: true }
            });
            updatedByUserId = orgMeterUpdatedBy?.syncMetadata?.syncId;
        }

        // Get funding type (CAPITALIZE)
        const fundingType = orgMeterAdvance.type ? orgMeterAdvance.type.toUpperCase() : 'NEW';
        
        // Map funding status from advance status by name
        const fundingStatus = await this.mapAdvanceStatusToFundingStatus(orgMeterAdvance.status);

        // Extract funding amounts
        const fundedAmount = orgMeterAdvance.funding?.principalAmount ? 
            Math.round(parseFloat(orgMeterAdvance.funding.principalAmount.toString()) * 100) : 0;
        const paybackAmount = orgMeterAdvance.funding?.paybackAmount ? 
            Math.round(parseFloat(orgMeterAdvance.funding.paybackAmount.toString()) * 100) : 0;

        // Build follower list with assigned user and manager
        const followerList = [];
        if (assignedUserId) followerList.push(assignedUserId);
        if (assignedManagerId && !followerList.includes(assignedManagerId)) {
            followerList.push(assignedManagerId);
        }

        // Build funding data with IDs only - convertToEmbeddedFormat will be called in formatDataBeforeSave
        const fundingData = {
            funder: this.funderId,
            lender: lenderId,
            merchant: merchantId,
            iso: isoId,
            syndicator_list: [], // Will be handled in the syndication service
            //application: No application is created for now
            //application_offer: No application offer is created for now
            name: orgMeterAdvance.name || `Advance ${orgMeterAdvance.id}`,
            type: fundingType,
            funded_amount: fundedAmount,
            payback_amount: paybackAmount,
            assigned_manager: assignedManagerId,
            assigned_user: assignedUserId,
            follower_list: followerList,
            created_by_user: createdByUserId,
            updated_by_user: updatedByUserId,
            status: fundingStatus,
            representative: representativeId,
            internal: internal,
            //position: No position is created for now
            inactive: orgMeterAdvance.deleted || false
            
        };

        return fundingData;
    }

    /**
     * Map OrgMeter advance type to system funding type
     * @param {String} advanceType - OrgMeter advance type
     * @returns {String} System funding type
     */
    mapAdvanceTypeToFundingType(advanceType) {
        const typeMapping = {
            'new': FUNDING_TYPES.NEW,
            'renewal': FUNDING_TYPES.RENEWAL,
            'refinance': FUNDING_TYPES.REFINANCE,
            'buyout': FUNDING_TYPES.BUYOUT
        };
        
        return typeMapping[advanceType] || FUNDING_TYPES.NEW;
    }

    /**
     * Map OrgMeter advance status to system funding status by name
     * @param {String} advanceStatus - OrgMeter advance status name
     * @returns {String} System funding status ID
     */
    async mapAdvanceStatusToFundingStatus(advanceStatus) {
        try {
            if (advanceStatus) {
                // Find funding status by name for this funder
                const fundingStatus = await FundingStatus.findOne({
                    funder: this.funderId,
                    name: { $regex: new RegExp(`^${advanceStatus}$`, 'i') } // Case insensitive match
                });

                if (fundingStatus) {
                    return fundingStatus._id;
                }
            }

            // Find default/initial status for this funder
            const initialStatus = await FundingStatus.findOne({
                funder: this.funderId,
                initial: true
            });
            
            if (initialStatus) {
                return initialStatus._id;
            }
                
            // If no initial status, get any status for this funder
            const anyStatus = await FundingStatus.findOne({
                funder: this.funderId
            });
            
            return anyStatus ? anyStatus._id : null;
        } catch (error) {
            console.error(`Error mapping advance status "${advanceStatus}":`, error.message);
            return null;
        }
    }

    /**
     * Create ISO-Merchant relationship if both ISO and Merchant exist
     * @param {Object} orgMeterAdvance - OrgMeter advance document
     * @param {Object} funding - System funding document
     */
    async createIsoMerchantRelationship(orgMeterAdvance, funding) {
        try {
            // Check if both ISO and Merchant exist in the funding
            const isoId = funding.iso?.id || null;
            const merchantId = funding.merchant?.id || null;

            if (!isoId || !merchantId) {
                console.log(`Skipping ISO-Merchant relationship creation for advance ${this.getAdvanceDisplayName(orgMeterAdvance)}: ISO or Merchant missing`);
                return;
            }

            // Use dynamic import to avoid circular dependency
            const ISOMerchantService = require('../../isoMerchantService');
            
            // Create or reactivate the ISO-Merchant relationship
            const isoMerchant = await ISOMerchantService.createISOMerchant(
                isoId,
                merchantId,
                { inactive: false } // Ensure it's active
            );

            console.log(`Created/Updated ISO-Merchant relationship for advance ${this.getAdvanceDisplayName(orgMeterAdvance)} (ISO: ${isoId}, Merchant: ${merchantId})`);
            return isoMerchant;

        } catch (error) {
            console.error(`Failed to create ISO-Merchant relationship for advance ${this.getAdvanceDisplayName(orgMeterAdvance)}:`, error.message);
            // Don't throw error to prevent breaking the sync process
        }
    }

    /**
     * Get display name for advance
     * @param {Object} orgMeterAdvance - OrgMeter advance document
     * @returns {String} Display name
     */
    getAdvanceDisplayName(orgMeterAdvance) {
        return orgMeterAdvance.idText || orgMeterAdvance.name || `Advance ${orgMeterAdvance.id}`;
    }

    /**
     * Create a new system funding from OrgMeter advance
     * @param {Object} orgMeterAdvance - OrgMeter advance document
     * @returns {Object} Created funding document
     */
    async createNewFunding(orgMeterAdvance) {
        try {
            const fundingData = await this.transformFunding(orgMeterAdvance);

            const formattedData = await formatDataBeforeSave(fundingData);

            const funding = await Funding.create(formattedData);

            console.log(`Created new funding: ${this.getAdvanceDisplayName(orgMeterAdvance)} (ID: ${funding._id})`);

            // Create payback plan for the new funding
            await this.paybackPlanService.createPaybackPlan(orgMeterAdvance, funding);

            // Create funding fees for the new funding
            await this.fundingFeeService.createFundingFees(orgMeterAdvance, funding);

            // Create funding expenses for the new funding
            await this.fundingExpenseService.createFundingExpenses(orgMeterAdvance, funding);

            // Create disbursement intent and disbursement for the new funding
            await this.disbursementService.createDisbursement(orgMeterAdvance, funding);

            // Create commission intents for the new funding
            await this.commissionService.createCommission(orgMeterAdvance, funding);

            // Create syndications for the new funding
            await this.syndicationService.createSyndications(orgMeterAdvance, funding);

            // Create paybacks for the new funding
            await this.paybackService.createPaybacks(orgMeterAdvance, funding);

            // Create ISO-Merchant relationship
            await this.createIsoMerchantRelationship(orgMeterAdvance, funding);

            return funding;

        } catch (error) {
            throw new Error(`Failed to create funding: ${error.message}`);
        }
    }

    /**
     * Update an existing system funding with OrgMeter advance data
     * @param {Object} existingFunding - Existing system funding document
     * @param {Object} orgMeterAdvance - OrgMeter advance document
     * @returns {Object} Updated funding document
     */
    async updateExistingFunding(existingFunding, orgMeterAdvance) {
        try {
            const transformedData = await this.transformFunding(orgMeterAdvance);

            // Check if assignee changed
            const assigneeChanged = (transformedData.assigned_user && transformedData.assigned_user !== existingFunding.assigned_user?.id?.toString()) || 
                (transformedData.assigned_manager && transformedData.assigned_manager !== existingFunding.assigned_manager?.id?.toString());

            // If assignee changed, make sure follower_list is in the updated data
            if (assigneeChanged) {
                if (transformedData.follower_list === undefined || transformedData.follower_list === null) {
                    transformedData.follower_list = existingFunding.follower_list;
                }
            }

            const formattedData = await formatDataBeforeSave(transformedData);
            
            const updatedFunding = await Funding.findByIdAndUpdate(existingFunding._id, formattedData, {
                new: true,
                runValidators: true
            });

            console.log(`Updated funding: ${this.getAdvanceDisplayName(orgMeterAdvance)} (ID: ${updatedFunding._id})`);

            // Remove all payback plans for the funding and create a new one
            await PaybackPlan.deleteMany({ funding: existingFunding._id });
            await this.paybackPlanService.createPaybackPlan(orgMeterAdvance, updatedFunding);

            // Remove all funding fees for the funding and create new ones
            await FundingFee.deleteMany({ funding: existingFunding._id });
            await this.fundingFeeService.createFundingFees(orgMeterAdvance, updatedFunding);

            // Remove all funding expenses for the funding and create new ones
            await FundingExpense.deleteMany({ funding: existingFunding._id });
            await this.fundingExpenseService.createFundingExpenses(orgMeterAdvance, updatedFunding);

            // Create disbursement intent and disbursement for the updated funding
            await this.disbursementService.createDisbursement(orgMeterAdvance, updatedFunding);

            // Create commission intent and commission for the updated funding
            await this.commissionService.createCommission(orgMeterAdvance, updatedFunding);

            // Create syndications for the updated funding
            await this.syndicationService.createSyndications(orgMeterAdvance, updatedFunding);

            // Create paybacks for the updated funding
            await this.paybackService.createPaybacks(orgMeterAdvance, updatedFunding);

            // Create ISO-Merchant relationship
            await this.createIsoMerchantRelationship(orgMeterAdvance, updatedFunding);

            return updatedFunding;

        } catch (error) {
            throw new Error(`Failed to update funding: ${error.message}`);
        }
    }

    /**
     * Update sync metadata for OrgMeter advance
     * @param {Object} orgMeterAdvance - OrgMeter advance document
     * @param {String} syncedFundingId - ID of the synced system funding
     */
    async updateSyncMetadata(orgMeterAdvance, syncedFundingId = null) {
        try {
            const updateData = {
                'syncMetadata.lastSyncedAt': new Date(),
                'syncMetadata.lastSyncedBy': this.userId || 'system'
            };

            if (syncedFundingId) {
                updateData['syncMetadata.syncId'] = syncedFundingId;
                console.log(`Updating Advance ${orgMeterAdvance.id} syncId to: ${syncedFundingId}`);
                // Don't change needsSync - it remains as user's selection
            }

            // Use findOneAndUpdate with id and funder since _id is disabled
            const result = await OrgMeterAdvance.findOneAndUpdate(
                { 
                    id: orgMeterAdvance.id,
                    'importMetadata.funder': orgMeterAdvance.importMetadata.funder
                },
                { $set: updateData },
                { new: true }
            );

            if (result) {
                console.log(`Successfully updated Advance ${orgMeterAdvance.id} syncMetadata`);
            } else {
                console.log(`Warning: Advance ${orgMeterAdvance.id} not found for sync metadata update`);
            }

        } catch (error) {
            console.error(`Failed to update sync metadata for advance ${orgMeterAdvance.id}:`, error.message);
        }
    }

    /**
     * Mark specific OrgMeter advances as needing sync
     * @param {Array} advanceIds - Array of OrgMeter advance IDs (numeric IDs)
     * @param {String} funderId - Funder ID to filter by
     * @returns {Object} Update result
     */
    async markAdvancesForSync(advanceIds, funderId) {
        try {
            const result = await OrgMeterAdvance.updateMany(
                {
                    id: { $in: advanceIds },
                    'importMetadata.funder': funderId,
                    deleted: false
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
                message: `Marked ${result.modifiedCount} advances for sync`,
                modifiedCount: result.modifiedCount
            };

        } catch (error) {
            throw new ErrorResponse(`Failed to mark advances for sync: ${error.message}`, 500);
        }
    }

    /**
     * Get sync results summary
     * @returns {Object} Sync statistics
     */
    getSyncResults() {
        return {
            success: true,
            message: 'Advance sync completed',
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
     * Get sync status for OrgMeter advances
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

            let query = {
                deleted: false
            };
            
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
                    { name: { $regex: search, $options: 'i' } },
                    { idText: { $regex: search, $options: 'i' } },
                    { merchantBusinessName: { $regex: search, $options: 'i' } }
                ];
            }

            const skip = (page - 1) * limit;
            const advances = await OrgMeterAdvance.find(query)
                .populate('syncMetadata.syncId', 'name type funded_amount payback_amount status')
                .sort({ 'importMetadata.importedAt': -1 })
                .skip(skip)
                .limit(limit);

            const total = await OrgMeterAdvance.countDocuments(query);

            // Get overall sync statistics
            const syncStats = await OrgMeterAdvance.aggregate([
                { $match: { ...query, deleted: false } },
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
                    advances,
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

module.exports = SyncOrgMeterAdvanceService; 