const FundingExpense = require('../../../models/FundingExpense');
const ExpenseType = require('../../../models/ExpenseType');

/**
 * Service for syncing OrgMeter advance funding expenses
 */
class SyncOrgMeterFundingExpenseService {
    constructor(funderId, userId = null) {
        this.funderId = funderId;
        this.userId = userId;
    }

    /**
     * Create funding expenses for synced funding
     * @param {Object} orgMeterAdvance - OrgMeter advance document
     * @param {Object} funding - System funding document
     */
    async createFundingExpenses(orgMeterAdvance, funding) {
        try {
            // Check if funding expenses already exist for this funding
            const existingExpenses = await FundingExpense.find({
                funding: funding._id
            });

            if (existingExpenses.length > 0) {
                console.log(`Funding expenses already exist for funding: ${funding._id}`);
                return;
            }

            // Create expense configurations based on advance data
            const expenseConfigurations = await this.getExpenseConfigurations(orgMeterAdvance);

            // Create each expense
            for (const expenseConfig of expenseConfigurations) {
                if (expenseConfig.amount && expenseConfig.amount > 0) {
                    await this.createSingleExpense(expenseConfig, funding);
                }
            }

            console.log(`Created ${expenseConfigurations.filter(e => e.amount > 0).length} funding expenses for funding: ${funding._id}`);

        } catch (error) {
            console.error(`Failed to create funding expenses for funding ${funding._id}:`, error.message);
            // Don't throw error to avoid breaking the sync process
        }
    }

    /**
     * Get expense configurations from OrgMeter advance data
     * @param {Object} orgMeterAdvance - OrgMeter advance document
     * @returns {Array} Array of expense configurations
     */
    async getExpenseConfigurations(orgMeterAdvance) {
        const expenseConfigurations = [];

        // ISO Commission
        if (orgMeterAdvance.funding?.isoOriginationCommission?.amount) {
            const isoCommissionType = await this.findExpenseTypeByName('ISO Commission');
            expenseConfigurations.push({
                name: 'ISO Commission',
                expense_type: isoCommissionType?._id,
                amount: Math.round(parseFloat(orgMeterAdvance.funding.isoOriginationCommission.amount.toString()) * 100),
                commission: true,
                syndication: true
            });
        }

        // ISO Application Fee
        if (orgMeterAdvance.funding?.isoApplicationFee?.amount) {
            const isoAppFeeType = await this.findExpenseTypeByName('ISO Application Fee');
            expenseConfigurations.push({
                name: 'ISO Application Fee',
                expense_type: isoAppFeeType?._id,
                amount: Math.round(parseFloat(orgMeterAdvance.funding.isoApplicationFee.amount.toString()) * 100),
                commission: false,
                syndication: true
            });
        }

        return expenseConfigurations;
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
     * Create a single funding expense
     * @param {Object} expenseConfig - Expense configuration
     * @param {Object} funding - System funding document
     */
    async createSingleExpense(expenseConfig, funding) {
        try {
            const fundingExpenseData = {
                funding: funding._id,
                funder: funding.funder?.id,
                lender: funding.lender?.id,
                merchant: funding.merchant?.id,
                iso: funding.iso?.id,
                name: expenseConfig.name,
                expense_type: expenseConfig.expense_type,
                amount: expenseConfig.amount,
                commission: expenseConfig.commission,
                syndication: expenseConfig.syndication,
                expense_date: new Date(),
                created_by_user: funding.created_by_user,
                updated_by_user: funding.updated_by_user,
                inactive: false
            };

            const fundingExpense = await FundingExpense.create(fundingExpenseData);
            console.log(`Created funding expense: ${expenseConfig.name} (Amount: ${expenseConfig.amount}) for funding: ${funding._id}`);
            
            return fundingExpense;

        } catch (error) {
            console.error(`Failed to create funding expense "${expenseConfig.name}":`, error.message);
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

module.exports = SyncOrgMeterFundingExpenseService; 