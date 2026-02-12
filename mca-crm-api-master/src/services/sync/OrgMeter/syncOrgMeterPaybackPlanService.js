const PaybackPlan = require('../../../models/PaybackPlan');
const { PAYMENT_METHOD, PAYBACK_FREQUENCY, PAYBACK_DISTRIBUTION_PRIORITY, PAYBACK_PLAN_STATUS } = require('../../../utils/constants');

/**
 * Service for syncing OrgMeter advance payback plans
 */
class SyncOrgMeterPaybackPlanService {
    constructor(funderId, userId = null) {
        this.funderId = funderId;
        this.userId = userId;
    }

    /**
     * Create payback plan for synced funding
     * @param {Object} orgMeterAdvance - OrgMeter advance document
     * @param {Object} funding - System funding document
     */
    async createPaybackPlan(orgMeterAdvance, funding) {
        try {
            // Check if payback plan already exists for this funding
            const existingPaybackPlan = await PaybackPlan.findOne({
                funding: funding._id
            });

            if (existingPaybackPlan) {
                console.log(`Payback plan already exists for funding: ${funding._id}`);
                return;
            }

            // Transform advance data to payback plan format
            const paybackPlanData = await this.transformPaybackPlan(orgMeterAdvance, funding);

            if (!paybackPlanData) {
                console.log(`No payback plan data available for advance: ${this.getAdvanceDisplayName(orgMeterAdvance)}`);
                return;
            }

            // Create payback plan
            const paybackPlan = await PaybackPlan.create(paybackPlanData);
            console.log(`Created payback plan for funding: ${funding._id} (Plan ID: ${paybackPlan._id})`);

        } catch (error) {
            console.error(`Failed to create payback plan for funding ${funding._id}:`, error.message);
            // Don't throw error to avoid breaking the sync process
        }
    }

    /**
     * Transform OrgMeter advance data to payback plan format
     * @param {Object} orgMeterAdvance - OrgMeter advance document
     * @param {Object} funding - System funding document
     * @returns {Object|null} Transformed payback plan data
     */
    async transformPaybackPlan(orgMeterAdvance, funding) {
        try {
            // Extract collection frequency data
            const collectionFrequency = orgMeterAdvance.funding?.collectionFrequencyType;
            
            if (!collectionFrequency) {
                return null; // No collection frequency data
            }

            // Map frequency and payday_list
            let frequency = PAYBACK_FREQUENCY.DAILY;
            let payDayList = [];

            switch (collectionFrequency.toLowerCase()) {
            case 'daily':
                frequency = PAYBACK_FREQUENCY.DAILY;
                payDayList = this.mapDailyPayDayList(orgMeterAdvance.funding);
                break;
            case 'weekly':
                frequency = PAYBACK_FREQUENCY.WEEKLY;
                payDayList = this.mapWeeklyPayDayList(orgMeterAdvance.funding);
                break;
            case 'monthly':
                frequency = PAYBACK_FREQUENCY.MONTHLY;
                payDayList = this.mapMonthlyPayDayList(orgMeterAdvance.funding);
                break;
            default:
                console.warn(`Unknown collection frequency: ${collectionFrequency}`);
                return null;
            }

            const avoidHoliday = orgMeterAdvance.funding?.collectionFrequencyDailyCustom === 'banking_days' ? true : false;

            // Extract other payback plan data
            const paymentCount = orgMeterAdvance.funding?.paymentCount || 0;
            const totalAmount = orgMeterAdvance.funding?.paybackAmount ? 
                Math.round(parseFloat(orgMeterAdvance.funding.paybackAmount.toString()) * 100) : 0;
            const startDate = orgMeterAdvance.funding?.fundedAt || new Date();
            const endDate = orgMeterAdvance.funding?.originalExpectedEndedAt || null;

            const paybackPlanData = {
                funding: funding._id,
                merchant: funding.merchant?.id,
                funder: funding.funder?.id,
                lender: funding.lender?.id,
                // merchant_account: not included
                // funder_account: not included
                payment_method: PAYMENT_METHOD.OTHER,
                //ach_processor: not included
                total_amount: totalAmount,
                payback_count: paymentCount,
                start_date: startDate,
                end_date: endDate,
                next_payback_date: null,
                created_by_user: funding.created_by_user,
                updated_by_user: funding.updated_by_user,
                frequency: frequency,
                payday_list: payDayList,
                avoid_holiday: avoidHoliday,
                distribution_priority: PAYBACK_DISTRIBUTION_PRIORITY.EQUAL,
                //note: not included:
                status: funding.status?.closed ? PAYBACK_PLAN_STATUS.CLOSED : PAYBACK_PLAN_STATUS.ACTIVE
            };

            return paybackPlanData;

        } catch (error) {
            console.error('Error transforming payback plan data:', error.message);
            return null;
        }
    }

    /**
     * Map daily collection frequency to payday list
     * @param {Object} fundingData - OrgMeter funding data
     * @returns {Array} Payday list
     */
    mapDailyPayDayList(fundingData) {
        const dailyCustom = fundingData?.collectionFrequencyDailyCustom;
        
        if (dailyCustom === 'custom_days' && fundingData?.collectionFrequencyDailyCustomDays) {
            return fundingData.collectionFrequencyDailyCustomDays;
        } else if (dailyCustom === 'every_day') {
            return [1, 2, 3, 4, 5, 6, 7];
        } else if (dailyCustom === 'weekdays') {
            return [1, 2, 3, 4, 5];
        } else if (dailyCustom === 'banking_days') {
            return [1, 2, 3, 4, 5];
        }
        
        // Default to weekdays
        return [1, 2, 3, 4, 5];
    }

    /**
     * Map weekly collection frequency to payday list
     * @param {Object} fundingData - OrgMeter funding data
     * @returns {Array} Payday list
     */
    mapWeeklyPayDayList(fundingData) {
        const weeklyCustom = fundingData?.collectionFrequencyWeeklyCustom;
        
        if (weeklyCustom && weeklyCustom >= 1 && weeklyCustom <= 7) {
            return [weeklyCustom];
        }
        
        // Default to Monday
        return [1];
    }

    /**
     * Map monthly collection frequency to payday list
     * @param {Object} fundingData - OrgMeter funding data
     * @returns {Array} Payday list
     */
    mapMonthlyPayDayList(fundingData) {
        const monthlyCustom = fundingData?.collectionFrequencyMonthlyCustom;
        
        if (monthlyCustom && monthlyCustom >= 1 && monthlyCustom <= 28) {
            return [monthlyCustom];
        }
        
        // Default to 1st of month
        return [1];
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

module.exports = SyncOrgMeterPaybackPlanService; 