const FundingFee = require('../../../models/FundingFee');
const FeeType = require('../../../models/FeeType');

/**
 * Service for syncing OrgMeter advance funding fees
 */
class SyncOrgMeterFundingFeeService {
    constructor(funderId, userId = null) {
        this.funderId = funderId;
        this.userId = userId;
    }

    /**
     * Create funding fees for synced funding
     * @param {Object} orgMeterAdvance - OrgMeter advance document
     * @param {Object} funding - System funding document
     */
    async createFundingFees(orgMeterAdvance, funding) {
        try {
            // Check if funding fees already exist for this funding
            const existingFees = await FundingFee.find({
                funding: funding._id
            });

            if (existingFees.length > 0) {
                console.log(`Funding fees already exist for funding: ${funding._id}`);
                return;
            }

            // Create fee configurations based on advance data
            const feeConfigurations = await this.getFeeConfigurations(orgMeterAdvance);

            // Create each fee
            for (const feeConfig of feeConfigurations) {
                if (feeConfig.amount && feeConfig.amount > 0) {
                    await this.createSingleFee(feeConfig, funding);
                }
            }

            console.log(`Created ${feeConfigurations.filter(f => f.amount > 0).length} funding fees for funding: ${funding._id}`);

        } catch (error) {
            console.error(`Failed to create funding fees for funding ${funding._id}:`, error.message);
            // Don't throw error to avoid breaking the sync process
        }
    }

    /**
     * Get fee configurations from OrgMeter advance data
     * @param {Object} orgMeterAdvance - OrgMeter advance document
     * @returns {Array} Array of fee configurations
     */
    async getFeeConfigurations(orgMeterAdvance) {
        const feeConfigurations = [];

        // Bank Fee
        if (orgMeterAdvance.funding?.lenderMerchantBankFee?.amount) {
            const bankFeeType = await this.findFeeTypeByName('Bank Fee');
            feeConfigurations.push({
                name: 'Bank Fee',
                fee_type: bankFeeType?._id,
                amount: Math.round(parseFloat(orgMeterAdvance.funding.lenderMerchantBankFee.amount.toString()) * 100),
                upfront: true
            });
        }

        // Merchant Application Fee
        if (orgMeterAdvance.funding?.merchantApplicationFee?.amount) {
            const merchantAppFeeType = await this.findFeeTypeByName('Merchant Application Fee');
            feeConfigurations.push({
                name: 'Merchant Application Fee',
                fee_type: merchantAppFeeType?._id,
                amount: Math.round(parseFloat(orgMeterAdvance.funding.merchantApplicationFee.amount.toString()) * 100),
                upfront: true
            });
        }

        return feeConfigurations;
    }

    /**
     * Find fee type by name for the current funder
     * @param {String} typeName - Fee type name to search for
     * @returns {Object|null} Fee type document or null
     */
    async findFeeTypeByName(typeName) {
        try {
            const feeType = await FeeType.findOne({
                funder: this.funderId,
                name: { $regex: new RegExp(`^${typeName}$`, 'i') }, // Case insensitive match
                inactive: { $ne: true }
            });

            if (!feeType) {
                console.warn(`Fee type not found: ${typeName} for funder: ${this.funderId}`);
            }

            return feeType;
        } catch (error) {
            console.error(`Error finding fee type "${typeName}":`, error.message);
            return null;
        }
    }

    /**
     * Create a single funding fee
     * @param {Object} feeConfig - Fee configuration
     * @param {Object} funding - System funding document
     */
    async createSingleFee(feeConfig, funding) {
        try {
            const fundingFeeData = {
                funding: funding._id,
                funder: funding.funder?.id,
                lender: funding.lender?.id,
                merchant: funding.merchant?.id,
                iso: funding.iso?.id,
                name: feeConfig.name,
                fee_type: feeConfig.fee_type,
                amount: feeConfig.amount,
                upfront: feeConfig.upfront,
                fee_date: new Date(),
                created_by_user: funding.created_by_user,
                updated_by_user: funding.updated_by_user,
                inactive: false
            };

            const fundingFee = await FundingFee.create(fundingFeeData);
            console.log(`Created funding fee: ${feeConfig.name} (Amount: ${feeConfig.amount}) for funding: ${funding._id}`);
            
            return fundingFee;

        } catch (error) {
            console.error(`Failed to create funding fee "${feeConfig.name}":`, error.message);
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

module.exports = SyncOrgMeterFundingFeeService; 