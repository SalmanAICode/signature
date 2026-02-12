const CommissionIntent = require('../../../models/CommissionIntent');
const Commission = require('../../../models/Commission');
const { PAYMENT_METHOD, INTENT_STATUS, COMMISSION_STATUS } = require('../../../utils/constants');

/**
 * Service for syncing OrgMeter advance commissions
 */
class SyncOrgMeterCommissionService {
    constructor(funderId, userId = null) {
        this.funderId = funderId;
        this.userId = userId;
    }

    /**
     * Create commission intent and commission for synced funding
     * @param {Object} orgMeterAdvance - OrgMeter advance document
     * @param {Object} funding - System funding document
     */
    async createCommission(orgMeterAdvance, funding) {
        try {
            // Check if commission intent already exists for this funding
            const existingCommissionIntent = await CommissionIntent.findOne({
                funding: funding._id
            });

            if (existingCommissionIntent) {
                console.log(`Commission intent already exists for funding: ${funding._id}`);
                return;
            }

            // Transform advance data to commission intent format
            const commissionIntentData = await this.transformCommissionIntent(orgMeterAdvance, funding);

            if (!commissionIntentData) {
                console.log(`No commission data available for advance: ${this.getAdvanceDisplayName(orgMeterAdvance)}`);
                return;
            }

            // Create commission intent
            const commissionIntent = await CommissionIntent.create(commissionIntentData);
            console.log(`Created commission intent for funding: ${funding._id} (Intent ID: ${commissionIntent._id})`);

            if (commissionIntent.status === INTENT_STATUS.SUCCEED) {
                // Create related commission
                await this.createRelatedCommission(commissionIntent, funding);
            }

        } catch (error) {
            console.error(`Failed to create commission for funding ${funding._id}:`, error.message);
            // Don't throw error to avoid breaking the sync process
        }
    }

    /**
     * Transform OrgMeter advance data to commission intent format
     * @param {Object} orgMeterAdvance - OrgMeter advance document
     * @param {Object} funding - System funding document
     * @returns {Object|null} Transformed commission intent data
     */
    async transformCommissionIntent(orgMeterAdvance, funding) {
        try {
            if (orgMeterAdvance.funding?.isoOriginationCommission?.amount) {
                const commissionAmount = parseFloat(orgMeterAdvance.funding.isoOriginationCommission.amount.toString());

                const commissionIntentData = {
                    funding: funding._id,
                    funder: {
                        id: funding.funder?.id,
                        name: funding.funder?.name,
                        email: funding.funder?.email,
                        phone: funding.funder?.phone
                    },
                    lender: {
                        id: funding.lender?.id,
                        name: funding.lender?.name,
                        email: funding.lender?.email,
                        phone: funding.lender?.phone
                    },
                    iso: {
                        id: funding.iso?.id,
                        name: funding.iso?.name,
                        email: funding.iso?.email,
                        phone: funding.iso?.phone
                    },
                    commission_date: orgMeterAdvance.funding?.fundedAt || null,
                    amount: Math.round(commissionAmount * 100), // Convert to cents
                    payment_method: PAYMENT_METHOD.OTHER,
                    ach_processor: null,
                    funder_account: null,
                    iso_account: null,
                    created_by_user: funding.created_by_user,
                    updated_by_user: funding.updated_by_user,
                    note: `Commission for advance ${this.getAdvanceDisplayName(orgMeterAdvance)}`,
                    status: orgMeterAdvance.funding?.fundedAt ? INTENT_STATUS.SUCCEED : INTENT_STATUS.SCHEDULED
                };

                return commissionIntentData;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error transforming commission intent data:', error.message);
            return null;
        }
    }

    /**
     * Create related commission for the commission intent
     * @param {Object} commissionIntent - Commission intent document
     * @param {Object} funding - System funding document
     */
    async createRelatedCommission(commissionIntent, funding) {
        try {
            const commissionData = {
                commission_intent: commissionIntent._id,
                funder_account: null,
                iso_account: null,
                payment_method: commissionIntent.payment_method,
                ach_processor: commissionIntent.ach_processor,
                submitted_date: commissionIntent.commission_date,
                processed_date: commissionIntent.commission_date,
                responsed_date: commissionIntent.commission_date,
                amount: commissionIntent.amount,
                status: COMMISSION_STATUS.SUCCEED,
                created_by_user: funding.created_by_user,
                updated_by_user: funding.updated_by_user,
                transaction: null, // Will be created by middleware
                reconciled: false
            };

            const commission = await Commission.create(commissionData);
            console.log(`Created commission for intent: ${commissionIntent._id} (Commission ID: ${commission._id})`);

            return commission;

        } catch (error) {
            console.error(`Failed to create commission for intent ${commissionIntent._id}:`, error.message);
            throw error;
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

module.exports = SyncOrgMeterCommissionService;
