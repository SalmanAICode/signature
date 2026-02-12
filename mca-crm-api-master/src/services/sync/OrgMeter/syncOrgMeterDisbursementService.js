const DisbursementIntent = require('../../../models/DisbursementIntent');
const Disbursement = require('../../../models/Disbursement');
const { PAYMENT_METHOD, INTENT_STATUS, DISBURSEMENT_STATUS } = require('../../../utils/constants');

/**
 * Service for syncing OrgMeter advance disbursements
 */
class SyncOrgMeterDisbursementService {
    constructor(funderId, userId = null) {
        this.funderId = funderId;
        this.userId = userId;
    }

    /**
     * Create disbursement intent and disbursement for synced funding
     * @param {Object} orgMeterAdvance - OrgMeter advance document
     * @param {Object} funding - System funding document
     */
    async createDisbursement(orgMeterAdvance, funding) {
        try {
            // Check if disbursement intent already exists for this funding
            const existingDisbursementIntent = await DisbursementIntent.findOne({
                funding: funding._id
            });

            if (existingDisbursementIntent) {
                console.log(`Disbursement intent already exists for funding: ${funding._id}`);
                return;
            }

            // Transform advance data to disbursement intent format
            const disbursementIntentData = await this.transformDisbursementIntent(orgMeterAdvance, funding);

            if (!disbursementIntentData) {
                console.log(`No disbursement data available for advance: ${this.getAdvanceDisplayName(orgMeterAdvance)}`);
                return;
            }

            // Create disbursement intent
            const disbursementIntent = await DisbursementIntent.create(disbursementIntentData);
            console.log(`Created disbursement intent for funding: ${funding._id} (Intent ID: ${disbursementIntent._id})`);

            // Create related disbursement
            await this.createRelatedDisbursement(disbursementIntent, funding);

        } catch (error) {
            console.error(`Failed to create disbursement for funding ${funding._id}:`, error.message);
            // Don't throw error to avoid breaking the sync process
        }
    }

    /**
     * Transform OrgMeter advance data to disbursement intent format
     * @param {Object} orgMeterAdvance - OrgMeter advance document
     * @param {Object} funding - System funding document
     * @returns {Object|null} Transformed disbursement intent data
     */
    async transformDisbursementIntent(orgMeterAdvance, funding) {
        try {
            // Calculate disbursement amount: principalAmount - fees
            const principalAmount = orgMeterAdvance.funding?.principalAmount ? 
                parseFloat(orgMeterAdvance.funding.principalAmount.toString()) : 0;

            const bankFeeAmount = orgMeterAdvance.funding?.lenderMerchantBankFee?.amount ? 
                parseFloat(orgMeterAdvance.funding.lenderMerchantBankFee.amount.toString()) : 0;

            const merchantAppFeeAmount = orgMeterAdvance.funding?.merchantApplicationFee?.amount ? 
                parseFloat(orgMeterAdvance.funding.merchantApplicationFee.amount.toString()) : 0;

            const disbursementAmount = principalAmount - bankFeeAmount - merchantAppFeeAmount;

            if (disbursementAmount <= 0) {
                console.warn(`Invalid disbursement amount (${disbursementAmount}) for advance: ${this.getAdvanceDisplayName(orgMeterAdvance)}`);
                return null;
            }

            // Get disbursement date from fundedAt
            const disbursementDate = orgMeterAdvance.funding?.fundedAt || new Date();

            const disbursementIntentData = {
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
                merchant: {
                    id: funding.merchant?.id,
                    name: funding.merchant?.name,
                    email: funding.merchant?.email,
                    phone: funding.merchant?.phone
                },
                disbursement_date: disbursementDate,
                amount: Math.round(disbursementAmount * 100), // Convert to cents
                payment_method: PAYMENT_METHOD.OTHER,
                ach_processor: null,
                funder_account: null,
                merchant_account: null,
                created_by_user: funding.created_by_user,
                updated_by_user: funding.updated_by_user,
                note: `Disbursement for advance ${this.getAdvanceDisplayName(orgMeterAdvance)}`,
                status: INTENT_STATUS.SUCCEED
            };

            return disbursementIntentData;

        } catch (error) {
            console.error('Error transforming disbursement intent data:', error.message);
            return null;
        }
    }

    /**
     * Create related disbursement for the disbursement intent
     * @param {Object} disbursementIntent - Disbursement intent document
     * @param {Object} funding - System funding document
     */
    async createRelatedDisbursement(disbursementIntent, funding) {
        try {
            const disbursementData = {
                disbursement_intent: disbursementIntent._id,
                funder_account: null,
                merchant_account: null,
                payment_method: disbursementIntent.payment_method,
                ach_processor: disbursementIntent.ach_processor,
                submitted_date: disbursementIntent.disbursement_date,
                processed_date: disbursementIntent.disbursement_date,
                responsed_date: disbursementIntent.disbursement_date,
                amount: disbursementIntent.amount,
                status: DISBURSEMENT_STATUS.SUCCEED,
                created_by_user: funding.created_by_user,
                updated_by_user: funding.updated_by_user,
                transaction: null, // Will be created by middleware
                reconciled: false
            };

            const disbursement = await Disbursement.create(disbursementData);
            console.log(`Created disbursement for intent: ${disbursementIntent._id} (Disbursement ID: ${disbursement._id})`);

            return disbursement;

        } catch (error) {
            console.error(`Failed to create disbursement for intent ${disbursementIntent._id}:`, error.message);
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

module.exports = SyncOrgMeterDisbursementService; 