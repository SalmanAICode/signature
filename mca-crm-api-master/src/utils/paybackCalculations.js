const { PAYBACK_DISTRIBUTION_PRIORITY } = require('./constants');

/**
 * Calculate payback distribution based on priority and syndication data
 * @param {number} paybackAmount - The total payback amount
 * @param {string} distributionPriority - The distribution priority (FUND, FEE, BOTH)
 * @param {Object} syndication - The syndication object with calculated virtual fields
 * @returns {Object} - { funded_amount, fee_amount }
 */
const calculatePaybackDistribution = (paybackAmount, distributionPriority, syndication) => {
    if (!syndication) {
        throw new Error('Syndication data is required for payback distribution calculation');
    }
    
    let funded_amount = 0;
    let fee_amount = 0;

    switch (distributionPriority) {
        case PAYBACK_DISTRIBUTION_PRIORITY.FUND:
            funded_amount = paybackAmount;
            break;
            
        case PAYBACK_DISTRIBUTION_PRIORITY.FEE:
            fee_amount = paybackAmount;
            break;
            
        case PAYBACK_DISTRIBUTION_PRIORITY.BOTH:
        default:
            // Use syndicator-specific amounts directly from syndication
            if (syndication.payback_amount && syndication.recurring_fee_amount) {
                funded_amount = Math.round(paybackAmount * syndication.payback_amount / (syndication.payback_amount + syndication.recurring_fee_amount) * 100) / 100;
                fee_amount = paybackAmount - funded_amount;
            } else {
                console.warn(`Syndication ${syndication._id} missing payback_amount or recurring_fee_amount for BOTH distribution. Falling back to FUND distribution.`);
                funded_amount = paybackAmount;
                fee_amount = 0;
            }
            break;
    }

    return { funded_amount, fee_amount };
};

/**
 * Calculate syndicator's share of payback amount
 * This is separate from payback distribution - it's the syndicator's profit
 * 
 * @param {number} paybackAmount - Total payback amount from merchant
 * @param {number} participatePercent - Syndicator's participation percentage
 * @returns {number} Syndicator's share of the payback
 */
const calculateSyndicatorShare = (paybackAmount, participatePercent) => {
    // participatePercent is expected as decimal (e.g., 0.10 for 10%)
    return paybackAmount * participatePercent;
};

/**
 * Calculate net syndicator returns (after fees and credits)
 * 
 * @param {number} grossReturns - Gross syndicator returns
 * @param {Object} syndication - Syndication object with fee/credit info
 * @returns {number} Net syndicator returns
 */
const calculateNetSyndicatorReturns = (grossReturns, syndication) => {
    const fees = syndication.recurring_fee_amount || 0;
    const credits = syndication.recurring_credit_amount || 0;
    const participatePercent = syndication.participate_percent || 0;
    
    // Calculate proportional fees and credits based on syndicator's share (decimal)
    const syndicatorPercent = participatePercent;
    const proportionalFees = fees * syndicatorPercent;
    const proportionalCredits = credits * syndicatorPercent;
    
    return Math.max(0, grossReturns - proportionalFees + proportionalCredits);
};

/**
 * Calculate remaining amounts from funding virtual fields
 * @param {Object} funding - The funding object with calculated virtual fields
 * @returns {Object} - { remaining_payback_amount, remaining_fee_amount }
 */
const calculateRemainingAmounts = (funding) => {
    if (!funding) {
        throw new Error('Funding object is required');
    }

    return {
        remaining_payback_amount: funding.remaining_payback_amount || 0,
        remaining_fee_amount: funding.remaining_fee_amount || 0
    };
};

module.exports = {
    calculatePaybackDistribution,
    calculateSyndicatorShare,
    calculateNetSyndicatorReturns,
    calculateRemainingAmounts
};
