const ExpenseType = require('../../../models/ExpenseType');
const { SYNDICATION_STATUS } = require('../../../utils/constants');
const SyndicationService = require('../../../services/syndicationService');

/**
 * Service for syncing OrgMeter advance syndications
 */
class SyncOrgMeterSyndicationService {
    constructor(funderId, userId = null) {
        this.funderId = funderId;
        this.userId = userId;
    }

    /**
     * Create syndications for synced funding
     * @param {Object} orgMeterAdvance - OrgMeter advance document
     * @param {Object} funding - System funding document
     */
    async createSyndications(orgMeterAdvance, funding) {
        try {
            // Get participation data from advance
            const participationData = orgMeterAdvance.participation;
            if (!participationData || !participationData.syndicators || participationData.syndicators.length === 0) {
                console.log(`No syndication data available for advance: ${this.getAdvanceDisplayName(orgMeterAdvance)}`);
                return;
            }

            // Create syndication for each syndicator
            const createdSyndications = [];
            for (const syndicatorData of participationData.syndicators) {
                const syndication = await this.createSingleSyndication(orgMeterAdvance, funding, syndicatorData);
                if (syndication) {
                    createdSyndications.push(syndication);
                }
            }

            console.log(`Created ${createdSyndications.length} syndications for funding: ${funding._id}`);

        } catch (error) {
            console.error(`Failed to create syndications for funding ${funding._id}:`, error.message);
            // Don't throw error to avoid breaking the sync process
        }
    }

    /**
     * Create a single syndication from syndicator participation data
     * @param {Object} orgMeterAdvance - OrgMeter advance document
     * @param {Object} funding - System funding document
     * @param {Object} syndicatorData - Single syndicator participation data
     * @returns {Object|null} Created syndication document
     */
    async createSingleSyndication(orgMeterAdvance, funding, syndicatorData) {
        try {
            // Find synced syndicator ID
            let syndicatorId = null;
            if (syndicatorData.id) {
                const orgMeterSyndicator = await require('../../../models/OrgMeter/Syndicator').findOne({
                    id: syndicatorData.id,
                    'importMetadata.funder': this.funderId,
                    'syncMetadata.syncId': { $exists: true }
                });
                syndicatorId = orgMeterSyndicator?.syncMetadata?.syncId;
            }

            if (!syndicatorId) {
                console.warn(`Syndicator not found or not synced for ID: ${syndicatorData.id}`);
                return null;
            }

            // Transform syndicator data to syndication format
            const syndicationData = await this.transformSyndication(orgMeterAdvance, funding, syndicatorData, syndicatorId);

            if (!syndicationData) {
                console.log(`Failed to transform syndication data for syndicator: ${syndicatorData.id}`);
                return null;
            }

            // Make sure there is no syndication with the same funding and syndicator
            const existingSyndication = await SyndicationService.getSyndicationList({
                funding: funding._id,
                syndicator: syndicatorId
            });

            if (existingSyndication && existingSyndication.length > 0) {
                console.log(`Syndication already exists for funding: ${funding._id} and syndicator: ${syndicatorId}`);
                return existingSyndication._id;
            }

            // Create syndication
            const syndication = await SyndicationService.createSyndication(syndicationData, [], '', false, true);

            console.log(`Created syndication for syndicator: ${syndicatorData.id} (Syndication ID: ${syndication._id})`);

            return syndication._id;

        } catch (error) {
            console.error(`Failed to create syndication for syndicator ${syndicatorData.id}:`, error.message);
            return null;
        }
    }

    /**
     * Transform OrgMeter syndicator data to syndication format
     * @param {Object} orgMeterAdvance - OrgMeter advance document
     * @param {Object} funding - System funding document
     * @param {Object} syndicatorData - Syndicator participation data
     * @param {String} syndicatorId - System syndicator ID
     * @returns {Object|null} Transformed syndication data
     */
    async transformSyndication(orgMeterAdvance, funding, syndicatorData, syndicatorId) {
        try {
            // Build fee list
            const feeList = [];

            // Add commission fee if exists
            if (syndicatorData.commission?.amount) {
                const isoCommissionType = await this.findExpenseTypeByName('ISO Commission');
                feeList.push({
                    name: 'Commission',
                    expense_type: isoCommissionType?._id || null,
                    amount: parseFloat(syndicatorData.commission.amount.toString()),
                    upfront: true
                });
            }

            // Add other fees
            if (syndicatorData.fees && Array.isArray(syndicatorData.fees)) {
                for (const fee of syndicatorData.fees) {
                    if (fee.amount) {
                        feeList.push({
                            name: fee.description || 'Fee',
                            expense_type: null,
                            amount: parseFloat(fee.amount.toString()),
                            upfront: fee.chargeMode === 'frontend'
                        });
                    }
                }
            }

            // Determine status based on funding status
            const status = funding.status?.closed ? SYNDICATION_STATUS.CLOSED : SYNDICATION_STATUS.ACTIVE;

            const syndicationData = {
                funding: funding._id,
                funder: this.funderId,
                lender: funding.lender?.id,
                syndicator: syndicatorId,
                syndication_offer: null, // Not available from OrgMeter data
                participate_percent: parseFloat(syndicatorData.principalSyndicationPercent / 100) || 0,
                participate_amount: syndicatorData.syndicationAmount ? 
                    parseFloat(syndicatorData.syndicationAmount.toString()) : 0,
                payback_amount: syndicatorData.paybackAmount ? 
                    parseFloat(syndicatorData.paybackAmount.toString()) : 0,
                fee_list: feeList,
                credit_list: [], // Not available from OrgMeter data
                start_date: syndicatorData.createdAt || new Date(),
                end_date: funding.end_date || null,
                transaction: null, // Will be created by middleware
                status: status
            };

            return syndicationData;

        } catch (error) {
            console.error('Error transforming syndication data:', error.message);
            return null;
        }
    }

    /**
     * Find expense type by name for the current funder
     * @param {String} typeName - Expense type name to search for
     * @returns {Object|null} Expense type document or null
     */
    async findExpenseTypeByName(typeName) {
        try {
            const expenseType = await ExpenseType.findOne({
                funder: this.funderId,
                name: { $regex: new RegExp(`^${typeName}$`, 'i') }, // Case insensitive match
                inactive: { $ne: true }
            });

            if (!expenseType) {
                console.warn(`Expense type not found: ${typeName} for funder: ${this.funderId}`);
            }

            return expenseType;
        } catch (error) {
            console.error(`Error finding expense type "${typeName}":`, error.message);
            return null;
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
}

module.exports = SyncOrgMeterSyndicationService; 