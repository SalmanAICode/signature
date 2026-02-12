const Transaction = require('../models/Transaction');
const Funding = require('../models/Funding');
const Syndication = require('../models/Syndication');
const Payout = require('../models/Payout');
const FundingFee = require('../models/FundingFee');
const FundingExpense = require('../models/FundingExpense');
const Payback = require('../models/Payback');
const PaybackPlan = require('../models/PaybackPlan');
const SyndicatorFunder = require('../models/SyndicatorFunder');
const mongoose = require('mongoose');
const { TRANSACTION_TYPES, SYNDICATION_STATUS } = require('../utils/constants');
const { calculateNetSyndicatorReturns, calculatePaybackDistribution } = require('../utils/paybackCalculations');

function normalizePct(p) {
    const n = Number(p || 0);
    return n > 1 ? n / 100 : n;
}

// Define which transaction types are outflows (negative values)
const OUTFLOW_TRANSACTION_TYPES = [
    TRANSACTION_TYPES.DISBURSEMENT,
    TRANSACTION_TYPES.COMMISSION,
    TRANSACTION_TYPES.EXPENSE,
    TRANSACTION_TYPES.CREDIT,
    TRANSACTION_TYPES.PAYOUT,
    TRANSACTION_TYPES.FUNDER_WITHDRAW,
    TRANSACTION_TYPES.SYNDICATOR_WITHDRAW
];

/**
 * Helper function to create date aggregation
 * @param {string} aggregation - 'day', 'week', or 'month'
 * @returns {Object} Date grouping object for MongoDB aggregation
 */
const getDateGrouping = (aggregation) => {
    switch (aggregation) {
    case 'day':
        return {
            year: { $year: '$transaction_date' },
            month: { $month: '$transaction_date' },
            day: { $dayOfMonth: '$transaction_date' }
        };
    case 'week':
        return {
            year: { $year: '$transaction_date' },
            week: { $week: '$transaction_date' }
        };
    case 'month':
    default:
        return {
            year: { $year: '$transaction_date' },
            month: { $month: '$transaction_date' }
        };
    }
};

/**
 * Helper function to format period string
 * @param {Object} group - Period group object
 * @param {string} aggregation - 'day', 'week', or 'month'
 * @returns {string} Formatted period string
 */
const formatPeriod = (group, aggregation) => {
    switch (aggregation) {
    case 'day':
        return `${new Date(group.year, group.month - 1, group.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} '${group.year.toString().slice(-2)}`;
    case 'week':
        return `Week ${group.week} '${group.year.toString().slice(-2)}`;
    case 'month':
    default:
        return `${new Date(group.year, group.month - 1).toLocaleDateString('en-US', { month: 'short' })} '${group.year.toString().slice(-2)}`;
    }
};

/**
 * Helper function to calculate week number like MongoDB's $week
 * @param {Date} date - Date to calculate week number for
 * @returns {number} Week number
 */
const getWeekNumber = (date) => {
    const year = date.getUTCFullYear();
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const days = Math.floor((date - startOfYear) / (1000 * 60 * 60 * 24));
    return Math.ceil((days + startOfYear.getUTCDay() + 1) / 7);
};

/**
 * Helper function to generate all periods between start and end date
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} aggregation - 'day', 'week', or 'month'
 * @returns {Array} Array of period keys
 */
const generateAllPeriods = (startDate, endDate, aggregation) => {
    const periods = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
        let periodKey;
        let weekNumber;
        let year;
        
        switch (aggregation) {
        case 'day':
            periodKey = {
                year: current.getUTCFullYear(),
                month: current.getUTCMonth() + 1,
                day: current.getUTCDate()
            };
            current.setUTCDate(current.getUTCDate() + 1);
            break;
        case 'week':
            // Use the helper function for more accurate week calculation
            year = current.getUTCFullYear();
            weekNumber = getWeekNumber(current);
            
            periodKey = {
                year: year,
                week: weekNumber
            };
            current.setUTCDate(current.getUTCDate() + 7);
            break;
        case 'month':
        default:
            periodKey = {
                year: current.getUTCFullYear(),
                month: current.getUTCMonth() + 1
            };
            current.setUTCMonth(current.getUTCMonth() + 1);
            break;
        }
        periods.push(periodKey);
    }
    return periods;
};

/**
 * Calculate syndicated amount using Amy's formula
 * participate_amount + upfront_fee_amount - upfront_credit_amount
 */
const calculateSyndicatedAmount = (syndication) => {
    const upfrontFeeAmount = (syndication.fee_list || [])
        .filter(fee => fee.upfront === true)
        .reduce((sum, fee) => sum + (fee.amount || 0), 0);
    
    const upfrontCreditAmount = (syndication.credit_list || [])
        .filter(credit => credit.upfront === true)
        .reduce((sum, credit) => sum + (credit.amount || 0), 0);
    
    return syndication.participate_amount + upfrontFeeAmount - upfrontCreditAmount;
};

/**
 * Calculate syndicator ROI consistently
 * @param {number} investment - The investment amount
 * @param {number} returns - The returns amount
 * @returns {number} ROI percentage
 */
const calculateSyndicatorROI = (investment, returns) => {
    if (investment <= 0) return 0;
    return ((returns - investment) / investment) * 100;
};

/**
 * Calculate syndicator factor rate consistently
 * @param {number} investment - The investment amount
 * @param {number} returns - The returns amount
 * @returns {number} Factor rate
 */
const calculateSyndicatorFactorRate = (investment, returns) => {
    if (investment <= 0) return 0;
    return returns / investment;
};

/**
 * Calculate syndicator performance metrics consistently
 * @param {Object} syndication - The syndication object
 * @param {Object} funding - The funding object (optional, for correct proportional calculation)
 * @returns {Object} Performance metrics with gross and net calculations
 */
const calculateSyndicatorPerformance = (syndication, funding = null) => {
    const grossInvestment = (syndication.participate_amount || 0) / 100;
    // For net investment, subtract upfront fees (not add them)
    const upfrontFeeAmount = (syndication.fee_list || [])
        .filter(fee => fee.upfront === true)
        .reduce((sum, fee) => sum + (fee.amount || 0), 0);
    const upfrontCreditAmount = (syndication.credit_list || [])
        .filter(credit => credit.upfront === true)
        .reduce((sum, credit) => sum + (credit.amount || 0), 0);
    const netInvestment = Math.max(0, grossInvestment - (upfrontFeeAmount - upfrontCreditAmount) / 100);
    
    // Calculate syndicator's proportional share of returns
    let grossReturns;
    if (funding && funding.payback_amount) {
        // Use syndicator's proportional share of total funding payback
        const totalFundingPayback = (funding.payback_amount || 0) / 100;
        const syndicatorShare = totalFundingPayback * normalizePct(syndication.participate_percent);
        grossReturns = syndicatorShare;
    } else {
        // Fallback to syndication payback_amount (legacy behavior)
        grossReturns = (syndication.payback_amount || 0) / 100;
    }
    
    const netReturns = calculateNetSyndicatorReturns(grossReturns, syndication);
    
    return {
        gross: {
            investment: grossInvestment,
            returns: grossReturns,
            roi: calculateSyndicatorROI(grossInvestment, grossReturns),
            factor_rate: calculateSyndicatorFactorRate(grossInvestment, grossReturns),
            profit: grossReturns - grossInvestment
        },
        net: {
            investment: netInvestment,
            returns: netReturns,
            roi: calculateSyndicatorROI(netInvestment, netReturns),
            factor_rate: calculateSyndicatorFactorRate(netInvestment, netReturns),
            profit: netReturns - netInvestment
        }
    };
};  

/**
 * Calculate total received amount for a syndication
 */
const getTotalReceivedForSyndication = async (syndicationId) => {
    const payouts = await Payout.find({ syndication: syndicationId }).lean();
    return payouts.reduce((sum, payout) => sum + ((payout.payout_amount || 0) / 100), 0);
};

/**
 * Calculate investment performance for closed syndications
 */
const calculateInvestmentPerformance = async (closedSyndications) => {
    const performanceData = [];
    
    for (const syndication of closedSyndications) {
        const totalReceived = await getTotalReceivedForSyndication(syndication._id);
        const participateAmount = (syndication.participate_amount || 0) / 100;
        const syndicatedAmount = calculateSyndicatedAmount(syndication) / 100; // Use Amy's formula
        const paybackAmount = (syndication.payback_amount || 0) / 100;
        
        // Calculate gross ROI (before fees and credits) using syndicated amount
        const grossROI = syndicatedAmount > 0 ? ((totalReceived - syndicatedAmount) / syndicatedAmount) * 100 : 0;
        
        // Calculate net ROI (after fees and credits)
        const totalFees = (syndication.total_fee_amount || 0) / 100;
        const totalCredits = (syndication.total_credit_amount || 0) / 100;
        const netROI = grossROI - ((totalFees - totalCredits) / syndicatedAmount) * 100;
        
        // Calculate paid percentage (Amy mentioned 44.5% paid, 55.5% right to receive)
        const paidPercentage = paybackAmount > 0 ? (totalReceived / paybackAmount) * 100 : 0;
        const rightToReceive = paybackAmount - totalReceived;
        
        performanceData.push({
            syndication_id: syndication._id,
            syndicator_name: syndication.syndicator?.name || 'Unknown',
            participate_amount: participateAmount,
            syndicated_amount: syndicatedAmount, // Add syndicated amount to response
            payback_amount: paybackAmount,
            total_received: totalReceived,
            gross_roi: Number(grossROI.toFixed(2)),
            net_roi: Number(netROI.toFixed(2)),
            paid_percentage: Number(paidPercentage.toFixed(2)),
            right_to_receive: Number(rightToReceive.toFixed(2))
        });
    }
    
    return performanceData;
};


/**
 * Get financial report data for a funder
 * @param {string} funderId - The funder ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} aggregation - 'day', 'week', or 'month'
 * @param {string[]} categories - Categories to include
 * @returns {Object} Aggregated financial data
 */
const getFinancialData = async (funderId, startDate, endDate, aggregation, categories) => {
    // Build the base match filter
    const baseMatch = {
        funder: new mongoose.Types.ObjectId(funderId),
        transaction_date: { $gte: startDate, $lte: endDate },
        inactive: { $ne: true } // Exclude inactive transactions
    };

    // Process each category
    const results = {};
    for (const categoryKey of categories) {
        // Validate that the category is a valid transaction type
        if (!Object.values(TRANSACTION_TYPES).includes(categoryKey)) continue;

        // Build the aggregation pipeline for this category
        const pipeline = [
            {
                $match: {
                    ...baseMatch,
                    type: categoryKey
                }
            },
            {
                $group: {
                    _id: getDateGrouping(aggregation),
                    total: { $sum: '$amount' }
                }
            },
            {
                $addFields: {
                    total: { $divide: ['$total', 100] }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
        ];

        const data = await Transaction.aggregate(pipeline);
        results[categoryKey] = data;
    }

    // Generate all possible periods
    const allPeriods = generateAllPeriods(startDate, endDate, aggregation);

    // Create the final financial data with all periods and categories
    const financialData = [];
    
    allPeriods.forEach(period => {
        const periodStr = formatPeriod(period, aggregation);
        
        const periodData = {
            period: periodStr,
            periodKey: period
        };

        // Add data for each category
        categories.forEach(categoryKey => {
            const categoryData = results[categoryKey] || [];
            const matchingData = categoryData.find(item => {
                // Compare period keys
                if (aggregation === 'day') {
                    return item._id.year === period.year && 
                           item._id.month === period.month && 
                           item._id.day === period.day;
                } else if (aggregation === 'week') {
                    return item._id.year === period.year && 
                           item._id.week === period.week;
                } else {
                    return item._id.year === period.year && 
                           item._id.month === period.month;
                }
            });
            
            let value = matchingData ? matchingData.total : 0;
            
            // Make outflows negative
            if (OUTFLOW_TRANSACTION_TYPES.includes(categoryKey)) {
                value = -Math.abs(value);
            }
            
            periodData[categoryKey] = value;
        });

        financialData.push(periodData);
    });

    return financialData;
};

/**
 * Get dashboard data for a funder
 * @param {string} funderId - The funder ID
 * @returns {Object} Dashboard data
 */
const getDashboardData = async (funderId) => {
    // Base query filter
    const baseFilter = {
        'funder.id': new mongoose.Types.ObjectId(funderId),
        inactive: { $ne: true }
    };

    // Get all fundings for this funder (with statistics calculated)
    const allFundings = await Funding.find(baseFilter, null, { calculate: true });

    // Initialize totals for all groups
    const totals = {
        overall: { count: 0, total_funded_amount: 0, total_payback_amount: 0, total_paid_amount: 0 },
        performing: { count: 0, total_funded_amount: 0, total_payback_amount: 0, total_paid_amount: 0 },
        completed: { count: 0, total_funded_amount: 0, total_payback_amount: 0, total_paid_amount: 0 },
        defaulted: { count: 0, total_funded_amount: 0, total_payback_amount: 0, total_paid_amount: 0 }
    };
    
    // Calculate syndication
    const syndicationData = {
        closed: { count: 0, syndication_amount: 0, payout_amount: 0 },
        active: { count: 0, syndication_amount: 0, payout_amount: 0 }
    };

    // Calculate Profit and Loss
    const profit = {
        advance_paid: 0,
        upfront_fees: 0,
        other_fees: 0,
        syndication_cafs: 0,
        total: 0
    };

    const loss = {
        advance_default: 0,
        commissions: 0,
        other_expenses: 0,
        syndication_credits: 0,
        total: 0
    };


    // Single pass through all fundings to categorize and calculate totals
    allFundings.forEach(funding => {
        // Convert from cents to dollars (assuming amounts are stored in cents)
        const fundedAmount = (funding.funded_amount || 0) / 100;
        const paybackAmount = (funding.payback_amount || 0) / 100;
        const paidAmount = (funding.paid_amount || 0) / 100;

        // Add to all category
        totals.overall.count += 1;
        totals.overall.total_funded_amount += fundedAmount;
        totals.overall.total_payback_amount += paybackAmount;
        totals.overall.total_paid_amount += paidAmount;

        // Categorize by status and add to respective groups
        if (funding.status?.performing === true) {
            totals.performing.count += 1;
            totals.performing.total_funded_amount += fundedAmount;
            totals.performing.total_payback_amount += paybackAmount;
            totals.performing.total_paid_amount += paidAmount;
        }

        if (funding.status?.closed === true && funding.status?.defaulted !== true) {
            totals.completed.count += 1;
            totals.completed.total_funded_amount += fundedAmount;
            totals.completed.total_payback_amount += paybackAmount;
            totals.completed.total_paid_amount += paidAmount;
        }

        if (funding.status?.defaulted === true) {
            totals.defaulted.count += 1;
            totals.defaulted.total_funded_amount += fundedAmount;
            totals.defaulted.total_payback_amount += paybackAmount;
            totals.defaulted.total_paid_amount += paidAmount;
        }
    });

    // Query syndication data for this funder with populated syndicator
    // Get both ACTIVE and CLOSED syndications for proper dashboard display
    const allSyndications = await Syndication.find({
        funder: funderId
    }, null, { calculate: true }).populate('syndicator', 'name').lean();
    

    // Get payout data for syndications
    const payouts = await Payout.find({
        funder: funderId
    }).lean();


    // Process syndications
    allSyndications.forEach(syndication => {
        // Convert from cents to dollars
        const participateAmount = (syndication.participate_amount || 0) / 100;
        
        // Calculate syndicated amount using Amy's formula
        const syndicatedAmount = calculateSyndicatedAmount(syndication) / 100;
        
        // Calculate payout amount for this syndication
        const syndicationPayouts = payouts.filter(p => p.syndication.toString() === syndication._id.toString());
        const payoutAmount = syndicationPayouts.reduce((sum, payout) => {
            return sum + ((payout.payout_amount || 0) / 100);
        }, 0);

        // Add to active if status is ACTIVE
        if (syndication.status === SYNDICATION_STATUS.ACTIVE) {
            syndicationData.active.count += 1;
            syndicationData.active.syndication_amount += syndicatedAmount; // Use calculated syndicated amount
            syndicationData.active.payout_amount += payoutAmount;
        } else {
            syndicationData.closed.count += 1;
            syndicationData.closed.syndication_amount += syndicatedAmount; // Use calculated syndicated amount
            syndicationData.closed.payout_amount += payoutAmount;
        }

        // Calculate syndication CAFs
        if (syndication.fee_list && Array.isArray(syndication.fee_list)) {
            syndication.fee_list.forEach(fee => {
                if (fee.upfront === true) {
                    profit.syndication_cafs += (fee.amount || 0) / 100;
                }
            });
        }

        // Calculate syndication credits
        if (syndication.credit_list && Array.isArray(syndication.credit_list)) {
            syndication.credit_list.forEach(credit => {
                if (credit.upfront === true) {
                    loss.syndication_credits += (credit.amount || 0) / 100;
                }
            });
        }
    });

    // 1. Profit - Advance Paid (from fundings: completed, paid_amount - funded_amount)
    profit.advance_paid = totals.completed.total_paid_amount - totals.completed.total_funded_amount;

    // 2. Profit - Upfront fees (from funding-fees collection with upfront: true)
    const upfrontFees = await FundingFee.find({
        funder: funderId,
        upfront: true,
        inactive: { $ne: true }
    }).lean();
    profit.upfront_fees = upfrontFees.reduce((sum, fee) => sum + ((fee.amount || 0) / 100), 0);

    // 3. Profit - Other Fees (from payback collection, sum of fee_amount)
    const paybacks = await Payback.find({
        funder: funderId,
        inactive: { $ne: true }
    }).lean();
    profit.other_fees = paybacks.reduce((sum, payback) => sum + ((payback.fee_amount || 0) / 100), 0);

    // 4. Profit - Add payout fee_amount to syndication CAFs
    profit.syndication_cafs += payouts.reduce((sum, payout) => sum + ((payout.fee_amount || 0) / 100), 0);

    // Calculate total profit
    profit.total = profit.advance_paid + 
                   profit.upfront_fees + 
                   profit.other_fees + 
                   profit.syndication_cafs;

    // 1. Loss - Advance Default (from fundings: defaulted, funded_amount - paid_amount)
    loss.advance_default = totals.defaulted.total_funded_amount - totals.defaulted.total_paid_amount;

    // 2. Loss - Commissions (from funding-expense collection with commission: true)
    const commissions = await FundingExpense.find({
        funder: funderId,
        commission: true,
        inactive: { $ne: true }
    }).lean();
    loss.commissions = commissions.reduce((sum, expense) => sum + ((expense.amount || 0) / 100), 0);

    // 3. Loss - Other Expenses (from funding-expense with commission: false)
    const otherExpenses = await FundingExpense.find({
        funder: funderId,
        commission: false,
        inactive: { $ne: true }
    }).lean();
    loss.other_expenses = otherExpenses.reduce((sum, expense) => sum + ((expense.amount || 0) / 100), 0);

    // 4. Loss - Add payout credit_amount
    loss.syndication_credits += payouts.reduce((sum, payout) => sum + ((payout.credit_amount || 0) / 100), 0);

    // Calculate total loss
    loss.total = loss.advance_default + 
                 loss.commissions + 
                 loss.other_expenses + 
                 loss.syndication_credits;

    // Separate active and closed syndications
    const activeSyndications = allSyndications.filter(s => s.status === SYNDICATION_STATUS.ACTIVE);
    const closedSyndications = allSyndications.filter(s => s.status === SYNDICATION_STATUS.CLOSED);

    // Calculate correct syndication counts from actual syndications
    // Use syndicated_amount (investment) and payout_amount (return) for ROI calculation
    const correctSyndicationData = {
        closed: {
            count: closedSyndications.length,
            syndication_amount: closedSyndications.reduce((sum, s) => {
                const syndicatedAmount = calculateSyndicatedAmount(s) / 100;
                return sum + syndicatedAmount;
            }, 0),
            payout_amount: closedSyndications.reduce((sum, s) => {
                // Calculate payout amount for this syndication
                const syndicationPayouts = payouts.filter(p => p.syndication.toString() === s._id.toString());
                const payoutAmount = syndicationPayouts.reduce((payoutSum, payout) => {
                    return payoutSum + ((payout.payout_amount || 0) / 100);
                }, 0);
                return sum + payoutAmount;
            }, 0)
        },
        active: {
            count: activeSyndications.length,
            syndication_amount: activeSyndications.reduce((sum, s) => {
                const syndicatedAmount = calculateSyndicatedAmount(s) / 100;
                return sum + syndicatedAmount;
            }, 0),
            payout_amount: activeSyndications.reduce((sum, s) => {
                // Calculate payout amount for this syndication
                const syndicationPayouts = payouts.filter(p => p.syndication.toString() === s._id.toString());
                const payoutAmount = syndicationPayouts.reduce((payoutSum, payout) => {
                    return payoutSum + ((payout.payout_amount || 0) / 100);
                }, 0);
                return sum + payoutAmount;
            }, 0)
        }
    };

    // Return basic dashboard data without expensive calculations
    return {
        overall: totals.overall,
        performing: totals.performing,
        completed: totals.completed,
        defaulted: totals.defaulted,
        syndication: correctSyndicationData,
        profit,
        loss,
        // Simplified performance metrics for frontend
        performance_metrics: {
            closed_syndications: calculateSimpleClosedMetrics(correctSyndicationData.closed),
            active_syndications: calculateSimpleActiveMetrics(correctSyndicationData.active)
        }
    };
};

/**
 * Calculate simplified closed syndications performance metrics using aggregated data
 * @param {Object} closedData - Aggregated closed syndication data
 * @param {Object} grossData - Aggregated gross syndication data (participate_amount)
 * @param {number} grossReturns - Total gross returns from deals data
 * @param {number} netReturns - Total net returns from deals data
 * @param {number} grossInvestments - Total gross investments from deals data
 * @param {number} netInvestments - Total net investments from deals data
 * @returns {Object} Performance metrics for closed deals with gross and net
 */
const calculateSimpleClosedMetrics = (closedData, grossData = null, grossReturns = 0, netReturns = 0, grossInvestments = 0, netInvestments = 0) => {
    // Use consistent investment amounts from deals data
    const netTotalInvested = netInvestments || closedData.syndication_amount || 0;
    const grossTotalInvested = grossInvestments || grossData?.syndication_amount || netTotalInvested;
    
    // Use consistent return amounts
    const netTotalReturned = netReturns;
    const grossTotalReturned = grossReturns;
    
    // Calculate consistent metrics
    const netProfit = netTotalReturned - netTotalInvested;
    const grossProfit = grossTotalReturned - grossTotalInvested;
    
    const netRoi = calculateSyndicatorROI(netTotalInvested, netTotalReturned);
    const grossRoi = calculateSyndicatorROI(grossTotalInvested, grossTotalReturned);
    
    const netAvgFactorRate = calculateSyndicatorFactorRate(netTotalInvested, netTotalReturned);
    const grossAvgFactorRate = calculateSyndicatorFactorRate(grossTotalInvested, grossTotalReturned);

    return {
        // Net metrics (after fees & credits)
        net: {
            total_invested: netTotalInvested,
            total_returned: netTotalReturned,
            net_profit: netProfit,
            roi: netRoi,
            avg_promised_factor_rate: netAvgFactorRate,
            avg_realized_factor_rate: netAvgFactorRate,
            factor_rate_variance: 0
        },
        // Gross metrics (before fees & credits)
        gross: {
            total_invested: grossTotalInvested,
            total_returned: grossTotalReturned,
            net_profit: grossProfit,
            roi: grossRoi,
            avg_promised_factor_rate: grossAvgFactorRate,
            avg_realized_factor_rate: grossAvgFactorRate,
            factor_rate_variance: 0
        },
        total_deals: closedData.count || 0
    };
};

/**
 * Calculate ROI distribution for deals data
 * @param {Array} dealsData - Array of individual deal data
 * @returns {Object} ROI distribution analysis
 */
const calculateROIDistribution = (dealsData) => {
    if (!dealsData || dealsData.length === 0) {
        return {
            gross: { ranges: [], summary: { total_deals: 0, profitable_deals: 0, loss_making_deals: 0 } },
            net: { ranges: [], summary: { total_deals: 0, profitable_deals: 0, loss_making_deals: 0 } }
        };
    }

    // ROI range definitions
    const roiRanges = [
        { min: -Infinity, max: 0, label: '< 0% Loss', color: 'red' },
        { min: 0, max: 10, label: '0-10% Low', color: 'orange' },
        { min: 10, max: 20, label: '10-20% Moderate', color: 'yellow' },
        { min: 20, max: 30, label: '20-30% Good', color: 'green' },
        { min: 30, max: 40, label: '30-40% High', color: 'blue' },
        { min: 40, max: 50, label: '40-50% Very High', color: 'darkblue' },
        { min: 50, max: Infinity, label: '50%+ Exceptional', color: 'purple' }
    ];

    const calculateDistribution = (useGross = true) => {
        const ranges = roiRanges.map(range => ({
            ...range,
            count: 0,
            percentage: 0
        }));

        let profitableDeals = 0;
        let lossMakingDeals = 0;

        dealsData.forEach(deal => {
            const investment = useGross ? deal.gross_investment : deal.net_investment;
            const returns = useGross ? deal.gross_returns : deal.net_returns;
            
            // Calculate ROI
            const roi = investment > 0 ? ((returns - investment) / investment) * 100 : 0;
            
            // Categorize by ROI range
            const rangeIndex = ranges.findIndex(range => roi >= range.min && roi < range.max);
            if (rangeIndex !== -1) {
                ranges[rangeIndex].count++;
            }
            
            // Count profitable vs loss-making
            if (roi >= 0) {
                profitableDeals++;
            } else {
                lossMakingDeals++;
            }
        });

        // Calculate percentages
        const totalDeals = dealsData.length;
        ranges.forEach(range => {
            range.percentage = totalDeals > 0 ? (range.count / totalDeals) * 100 : 0;
        });

        return {
            ranges,
            summary: {
                total_deals: totalDeals,
                profitable_deals: profitableDeals,
                loss_making_deals: lossMakingDeals
            }
        };
    };

    return {
        gross: calculateDistribution(true),
        net: calculateDistribution(false)
    };
};

/**
 * Calculate simplified active syndications performance metrics using aggregated data
 * @param {Object} activeData - Aggregated active syndication data
 * @param {Object} grossData - Aggregated gross syndication data (participate_amount)
 * @param {number} grossReturns - Total gross returns from deals data
 * @param {number} netReturns - Total net returns from deals data
 * @param {number} grossInvestments - Total gross investments from deals data
 * @param {number} netInvestments - Total net investments from deals data
 * @returns {Object} Performance metrics for active deals with gross and net
 */
const calculateSimpleActiveMetrics = (activeData, grossData = null, grossReturns = 0, netReturns = 0, grossInvestments = 0, netInvestments = 0) => {
    // Use consistent investment amounts from deals data
    const netTotalInvested = netInvestments || activeData.syndication_amount || 0;
    const grossTotalInvested = grossInvestments || grossData?.syndication_amount || netTotalInvested;
    
    // Use consistent return amounts
    const netTotalReturned = netReturns;
    const grossTotalReturned = grossReturns;
    
    // Calculate expected amounts based on syndicator's payback_amount (their expected returns)
    // For active syndications, expected should be the sum of all syndicator payback_amounts
    const grossTotalExpected = activeData.expected_payback_amount || 0;  // Sum of syndicator payback_amounts
    // For net expected, subtract upfront fees from gross expected
    // Use the total upfront fees calculated from individual deals
    const totalUpfrontFees = grossInvestments - netInvestments; // Total upfront fees across all active deals
    const netTotalExpected = Math.max(0, grossTotalExpected - totalUpfrontFees);
    
    // Calculate right to receive and paid percentage
    const netRightToReceive = Math.max(0, netTotalExpected - netTotalReturned);
    const grossRightToReceive = Math.max(0, grossTotalExpected - grossTotalReturned);
    
    const netPaidPercentage = netTotalExpected > 0 ? (netTotalReturned / netTotalExpected) * 100 : 0;
    const grossPaidPercentage = grossTotalExpected > 0 ? (grossTotalReturned / grossTotalExpected) * 100 : 0;

    return {
        // Net metrics (after fees & credits)
        net: {
            total_invested: netTotalInvested,
            total_returned: netTotalReturned,
            total_expected: netTotalExpected,
            right_to_receive: netRightToReceive,
            paid_percentage: netPaidPercentage
        },
        // Gross metrics (before fees & credits)
        gross: {
            total_invested: grossTotalInvested,
            total_returned: grossTotalReturned,
            total_expected: grossTotalExpected,
            right_to_receive: grossRightToReceive,
            paid_percentage: grossPaidPercentage
        },
        total_deals: activeData.count || 0
    };
};

/**
 * Get syndicator dashboard data aggregated across multiple funders
 * @param {string} syndicatorId - The syndicator ID
 * @param {string[]} funderIds - Array of funder IDs belonging to this syndicator
 * @returns {Object} Aggregated dashboard data
 */
const getSyndicatorDashboardData = async (syndicatorId, funderIds) => {
    if (!funderIds || funderIds.length === 0) {
        return {
            overall: { count: 0, total_funded_amount: 0, total_payback_amount: 0, total_paid_amount: 0 },
            performing: { count: 0, total_funded_amount: 0, total_payback_amount: 0, total_paid_amount: 0 },
            completed: { count: 0, total_funded_amount: 0, total_payback_amount: 0, total_paid_amount: 0 },
            defaulted: { count: 0, total_funded_amount: 0, total_payback_amount: 0, total_paid_amount: 0 },
            syndication: { closed: { count: 0, syndication_amount: 0, payout_amount: 0 }, active: { count: 0, syndication_amount: 0, payout_amount: 0 } },
            profit: { advance_paid: 0, upfront_fees: 0, other_fees: 0, syndication_cafs: 0, total: 0 },
            loss: { advance_default: 0, commissions: 0, other_expenses: 0, syndication_credits: 0, total: 0 },
            pending_payouts: { gross: 0, net: 0, fees: 0, credits: 0 },
            investment_performance: { closed_deals: [], summary: { total_deals: 0, profitable_deals: 0, average_gross_roi: 0, average_net_roi: 0 } },
            total_available_balance: 0,
            // Payout metrics (gross and net)
            gross_pending_payouts: 0,
            gross_completed_payouts: 0,
            gross_total_payouts: 0,
            net_pending_payouts: 0,
            net_completed_payouts: 0,
            net_total_payouts: 0,
            // Investment metrics (gross and net)
            gross_active_investments: 0,
            gross_lifetime_investments: 0,
            net_active_investments: 0,
            net_lifetime_investments: 0,
            // Partnership metrics
            total_funders: 0,
            active_syndications_count: 0,
            total_syndications_count: 0,
            // Funder details for detailed table
            funder_details: []
        };
    }

    // Query syndications directly for this syndicator (not through funders)
    // Get both ACTIVE and CLOSED syndications for proper dashboard display
    const allSyndications = await Syndication.find({
        syndicator: syndicatorId
    }, null, { calculate: true }).populate('syndicator', 'name').lean();

    // Get funding data for proper payback distribution calculations
    const fundingIds = allSyndications.map(s => s.funding).filter(Boolean);
    const fundings = await Funding.find({
        _id: { $in: fundingIds }
    }, null, { calculate: true }).lean();

    // Create funding lookup map for efficient access
    const fundingMap = {};
    fundings.forEach(funding => {
        fundingMap[funding._id.toString()] = funding;
    });

    // Get payout data for syndications
    const payouts = await Payout.find({
        syndication: { $in: allSyndications.map(s => s._id) }
    }).lean();

    // Get payback plans for syndications to access distribution_priority
    const paybackPlans = await PaybackPlan.find({
        funding: { $in: fundingIds }
    }).lean();

    // Initialize aggregated totals
    const aggregated = {
        overall: { count: 0, total_funded_amount: 0, total_payback_amount: 0, total_paid_amount: 0 },
        performing: { count: 0, total_funded_amount: 0, total_payback_amount: 0, total_paid_amount: 0 },
        completed: { count: 0, total_funded_amount: 0, total_payback_amount: 0, total_paid_amount: 0 },
        defaulted: { count: 0, total_funded_amount: 0, total_payback_amount: 0, total_paid_amount: 0 },
        syndication: { 
            closed: { count: 0, syndication_amount: 0, payout_amount: 0, net_payout_amount: 0, payback_amount: 0, gross_syndication_amount: 0 }, 
            active: { count: 0, syndication_amount: 0, payout_amount: 0, net_payout_amount: 0, payback_amount: 0, gross_syndication_amount: 0 } 
        },
        // Individual deals data for charts
        closed_deals_data: [],
        active_deals_data: [],
        profit: { advance_paid: 0, upfront_fees: 0, other_fees: 0, syndication_cafs: 0, total: 0 },
        loss: { advance_default: 0, commissions: 0, other_expenses: 0, syndication_credits: 0, total: 0 },
        pending_payouts: { gross: 0, net: 0, fees: 0, credits: 0 },
        investment_performance: { closed_deals: [], summary: { total_deals: 0, profitable_deals: 0, average_gross_roi: 0, average_net_roi: 0 } },
        total_available_balance: 0,
        // Payout metrics (gross and net)
        gross_pending_payouts: 0,
        gross_completed_payouts: 0,
        gross_total_payouts: 0,
        net_pending_payouts: 0,
        net_completed_payouts: 0,
        net_total_payouts: 0,
        // Investment metrics (gross and net)
        gross_active_investments: 0,
        gross_lifetime_investments: 0,
        net_active_investments: 0,
        net_lifetime_investments: 0,
        // Partnership metrics
        total_funders: 0,
        active_syndications_count: 0,
        total_syndications_count: 0,
        // Funder details for detailed table
        funder_details: []
    };

    // Process syndications directly
    allSyndications.forEach(syndication => {
        // Get funding data for proper payback distribution calculations
        const funding = fundingMap[syndication.funding.toString()];
        
        // Calculate payout amount for this syndication (actual received)
        const syndicationPayouts = payouts.filter(p => p.syndication.toString() === syndication._id.toString());
        const payoutAmount = syndicationPayouts.reduce((sum, payout) => {
            return sum + ((payout.payout_amount || 0) / 100);
        }, 0);

        // Calculate payout-level fees and credits for this syndication
        const payoutFeeAmount = syndicationPayouts.reduce((sum, payout) => {
            return sum + ((payout.fee_amount || 0) / 100);
        }, 0);
        const payoutCreditAmount = syndicationPayouts.reduce((sum, payout) => {
            return sum + ((payout.credit_amount || 0) / 100);
        }, 0);

        // Calculate syndicator performance metrics consistently with funding data
        const performance = calculateSyndicatorPerformance(syndication, funding);
        
        // Extract consistent investment and return amounts
        const grossInvestment = performance.gross.investment;
        const netInvestment = performance.net.investment;
        
        // For closed syndications, use actual payout amounts instead of expected returns
        let grossReturns, netReturns;
        if (syndication.status === SYNDICATION_STATUS.CLOSED) {
            // Use actual payout amounts for closed syndications
            grossReturns = payoutAmount; // Actual received payouts
            netReturns = payoutAmount - payoutFeeAmount + payoutCreditAmount; // Net after payout-level fees/credits
        } else {
            // Use expected returns for active syndications
            grossReturns = performance.gross.returns;
            netReturns = performance.net.returns;
        }

        const totalFundingPaybackAmount = (funding?.payback_amount || 0) / 100;
        
        // Get payback plan to access distribution_priority
        const paybackPlan = paybackPlans.find(p => p.funding.toString() === syndication.funding.toString());
        const distributionPriority = paybackPlan?.distribution_priority || 'FUND'; // Default to FUND if not found
        
        // Calculate fee/fund breakdown based on distribution priority
        // Use TOTAL funding payback amount for distribution, then apply syndicator's percentage
        const totalPaybackDistribution = calculatePaybackDistribution(totalFundingPaybackAmount, distributionPriority, syndication);
        
        // Apply syndicator's percentage to get syndicator's share of each category
        const profitDistribution = {
            funded_amount: totalPaybackDistribution.funded_amount * normalizePct(syndication.participate_percent),
            fee_amount: totalPaybackDistribution.fee_amount * normalizePct(syndication.participate_percent)
        };
        
        // For net distribution, use net returns amount for distribution
        const netDistribution = calculatePaybackDistribution(netReturns, distributionPriority, syndication);
        
        // Calculate corrected ROI and factor rates using actual returns for closed syndications
        const grossROI = calculateSyndicatorROI(grossInvestment, grossReturns);
        const netROI = calculateSyndicatorROI(netInvestment, netReturns);
        const grossFactorRate = calculateSyndicatorFactorRate(grossInvestment, grossReturns);
        const netFactorRate = calculateSyndicatorFactorRate(netInvestment, netReturns);
        const grossProfit = grossReturns - grossInvestment;
        const netProfit = netReturns - netInvestment;

        const dealData = {
            syndication_id: syndication._id,
            syndication_name: syndication.syndicator?.name || 'Unknown',
            // Include funding details for frontend display
            funding: funding ? {
                _id: funding._id,
                name: funding.name,
                funded_amount: (funding.funded_amount || 0) / 100,
                payback_amount: (funding.payback_amount || 0) / 100
            } : undefined,
            // Flat field for backward compatibility
            funding_name: funding?.name,
            // Consistent investment amounts
            gross_investment: grossInvestment,
            net_investment: netInvestment,
            // Consistent return amounts
            gross_returns: grossReturns,
            net_returns: netReturns,
            // Consistent profit/loss calculations
            gross_profit_or_loss: grossProfit,
            net_profit_or_loss: netProfit,
            // ROI and factor rates
            gross_roi: grossROI,
            net_roi: netROI,
            gross_factor_rate: grossFactorRate,
            net_factor_rate: netFactorRate,
            // Fund/fee breakdown
            gross_returns_fund: profitDistribution.funded_amount,
            gross_returns_fee: profitDistribution.fee_amount,
            net_returns_fund: netDistribution.funded_amount,
            net_returns_fee: netDistribution.fee_amount,
            // Additional data
            payback_amount: (syndication.payback_amount || 0) / 100, // Syndicator's expected payback amount
            actual_payouts: payoutAmount, // Actual received payouts
            payout_fee_amount: payoutFeeAmount, // Payout-level fees
            payout_credit_amount: payoutCreditAmount, // Payout-level credits
            status: syndication.status
        };

        // Add to active if status is ACTIVE
        if (syndication.status === SYNDICATION_STATUS.ACTIVE) {
            aggregated.syndication.active.count += 1;
            // Store consistent investment and return amounts
            aggregated.syndication.active.syndication_amount += netInvestment; // Net investment
            aggregated.syndication.active.gross_syndication_amount += grossInvestment; // Gross investment
            aggregated.syndication.active.payout_amount += grossReturns; // Gross returns
            aggregated.syndication.active.net_payout_amount += netReturns; // Net returns
            aggregated.syndication.active.payback_amount += (syndication.payback_amount || 0) / 100; // Track syndicator payback amount
            // Add expected payback amount for proper percentage calculation
            const syndicatorExpectedReturns = (syndication.payback_amount || 0) / 100; // Syndicator's expected returns
            aggregated.syndication.active.expected_payback_amount = (aggregated.syndication.active.expected_payback_amount || 0) + syndicatorExpectedReturns;
            aggregated.active_deals_data.push(dealData);
        } else {
            aggregated.syndication.closed.count += 1;
            // Store consistent investment and return amounts
            aggregated.syndication.closed.syndication_amount += netInvestment; // Net investment
            aggregated.syndication.closed.gross_syndication_amount += grossInvestment; // Gross investment
            aggregated.syndication.closed.payout_amount += grossReturns; // Gross returns
            aggregated.syndication.closed.net_payout_amount += netReturns; // Net returns
            aggregated.syndication.closed.payback_amount += (syndication.payback_amount || 0) / 100; // Track syndicator payback amount
            aggregated.closed_deals_data.push(dealData);
        }

        // Calculate syndication CAFs
        if (syndication.fee_list && Array.isArray(syndication.fee_list)) {
            syndication.fee_list.forEach(fee => {
                if (fee.upfront === true) {
                    aggregated.profit.syndication_cafs += (fee.amount || 0) / 100;
                }
            });
        }

        // Calculate syndication credits
        if (syndication.credit_list && Array.isArray(syndication.credit_list)) {
            syndication.credit_list.forEach(credit => {
                if (credit.upfront === true) {
                    aggregated.loss.syndication_credits += (credit.amount || 0) / 100;
                }
            });
        }
    });

    // Create gross data object from the main aggregated data
    const grossSyndicationData = {
        closed: {
            count: aggregated.syndication.closed.count,
            syndication_amount: aggregated.syndication.closed.gross_syndication_amount,
            payout_amount: aggregated.syndication.closed.payout_amount,
            net_payout_amount: aggregated.syndication.closed.net_payout_amount,
            payback_amount: aggregated.syndication.closed.payback_amount
        },
        active: {
            count: aggregated.syndication.active.count,
            syndication_amount: aggregated.syndication.active.gross_syndication_amount,
            payout_amount: aggregated.syndication.active.payout_amount,
            net_payout_amount: aggregated.syndication.active.net_payout_amount,
            payback_amount: aggregated.syndication.active.payback_amount
        }
    };

    // Calculate consistent returns from deals data
    const closedGrossReturns = aggregated.closed_deals_data.reduce((sum, deal) => sum + deal.gross_returns, 0);
    const closedNetReturns = aggregated.closed_deals_data.reduce((sum, deal) => sum + deal.net_returns, 0);
    // Use actual cash received for active syndications
    const activeGrossReturns = aggregated.active_deals_data.reduce((sum, deal) => sum + (deal.actual_payouts || 0), 0);
    
    // For net paid, returns are the same as gross (upfront fees don't affect returns)
    const activeNetReturns = aggregated.active_deals_data.reduce((sum, deal) => {
        return sum + (deal.actual_payouts || 0);
    }, 0);
    
    // Calculate total upfront fees for all active syndications
    const totalActiveUpfrontFees = aggregated.active_deals_data.reduce((sum, deal) => {
        return sum + (deal.gross_investment - deal.net_investment);
    }, 0);
    
    // Calculate consistent investment amounts
    const closedGrossInvestments = aggregated.closed_deals_data.reduce((sum, deal) => sum + deal.gross_investment, 0);
    const closedNetInvestments = aggregated.closed_deals_data.reduce((sum, deal) => sum + deal.net_investment, 0);
    const activeGrossInvestments = aggregated.active_deals_data.reduce((sum, deal) => sum + deal.gross_investment, 0);
    const activeNetInvestments = aggregated.active_deals_data.reduce((sum, deal) => sum + deal.net_investment, 0);

    // Calculate total available balance from SyndicatorFunder data
    const syndicatorFunders = await SyndicatorFunder.find({
        syndicator: syndicatorId,
        inactive: { $ne: true }
    }, null, { calculate: true }).lean();
    
    aggregated.total_available_balance = syndicatorFunders.reduce((sum, sf) => {
        return sum + (Math.max(0, sf.available_balance || 0) / 100); // Convert from cents to dollars
    }, 0);

    // Calculate payout metrics from SyndicatorFunder data
    // Filter to only active funders (same logic as frontend)
    const activeSyndicatorFunders = syndicatorFunders.filter(sf => !sf.inactive);
    
    // Calculate GROSS amounts using SyndicatorFunder fields directly
    aggregated.gross_pending_payouts = activeSyndicatorFunders.reduce((sum, sf) => {
        return sum + (Math.max(0, sf.pending_payout_amount || 0) / 100); // Convert from cents to dollars
    }, 0);
    
    aggregated.gross_completed_payouts = activeSyndicatorFunders.reduce((sum, sf) => {
        return sum + (Math.max(0, sf.completed_payout_amount || 0) / 100); // Convert from cents to dollars
    }, 0);
    
    aggregated.gross_total_payouts = activeSyndicatorFunders.reduce((sum, sf) => {
        return sum + (Math.max(0, sf.payout_amount || 0) / 100); // Convert from cents to dollars
    }, 0);
    
    // Calculate NET amounts using proportional distribution (same logic as frontend)
    aggregated.net_pending_payouts = activeSyndicatorFunders.reduce((sum, sf) => {
        const grossPending = Math.max(0, sf.pending_payout_amount || 0) / 100;
        const totalFees = Math.max(0, sf.total_payout_fee_amount || 0) / 100;
        const totalCredits = Math.max(0, sf.total_payout_credit_amount || 0) / 100;
        const totalGross = Math.max(0, sf.payout_amount || 0) / 100;
        
        // Calculate proportional fees and credits for pending payouts
        if (totalGross > 0 && grossPending > 0) {
            const pendingRatio = grossPending / totalGross;
            const proportionalFees = totalFees * pendingRatio;
            const proportionalCredits = totalCredits * pendingRatio;
            return sum + grossPending - proportionalFees + proportionalCredits;
        }
        return sum + grossPending;
    }, 0);
    
    aggregated.net_completed_payouts = activeSyndicatorFunders.reduce((sum, sf) => {
        const grossCompleted = Math.max(0, sf.completed_payout_amount || 0) / 100;
        const totalFees = Math.max(0, sf.total_payout_fee_amount || 0) / 100;
        const totalCredits = Math.max(0, sf.total_payout_credit_amount || 0) / 100;
        const totalGross = Math.max(0, sf.payout_amount || 0) / 100;
        
        // Calculate proportional fees and credits for completed payouts
        if (totalGross > 0 && grossCompleted > 0) {
            const completedRatio = grossCompleted / totalGross;
            const proportionalFees = totalFees * completedRatio;
            const proportionalCredits = totalCredits * completedRatio;
            return sum + grossCompleted - proportionalFees + proportionalCredits;
        }
        return sum + grossCompleted;
    }, 0);
    
    // Calculate total NET as Pending NET + Completed NET for consistency
    aggregated.net_total_payouts = aggregated.net_pending_payouts + aggregated.net_completed_payouts;

    // Calculate investment metrics from SyndicatorFunder data (same logic as frontend)
    // Calculate GROSS amounts using SyndicatorFunder fields directly
    aggregated.gross_active_investments = activeSyndicatorFunders.reduce((sum, sf) => {
        return sum + (Math.max(0, sf.active_syndication_amount || 0) / 100); // Convert from cents to dollars
    }, 0);
    
    aggregated.gross_lifetime_investments = activeSyndicatorFunders.reduce((sum, sf) => {
        return sum + (Math.max(0, sf.syndication_amount || 0) / 100); // Convert from cents to dollars
    }, 0);
    
    // Calculate total fees and credits from SyndicatorFunder data (same logic as frontend)
    const totalFees = activeSyndicatorFunders.reduce((sum, sf) => {
        return sum + (Math.max(0, sf.total_payout_fee_amount || 0) / 100); // Convert from cents to dollars
    }, 0);
    
    const totalCredits = activeSyndicatorFunders.reduce((sum, sf) => {
        return sum + (Math.max(0, sf.total_payout_credit_amount || 0) / 100); // Convert from cents to dollars
    }, 0);
    
    // Calculate NET investments: GROSS - FEES + CREDITS (same logic as frontend)
    aggregated.net_active_investments = Math.max(0, aggregated.gross_active_investments - totalFees + totalCredits);
    aggregated.net_lifetime_investments = Math.max(0, aggregated.gross_lifetime_investments - totalFees + totalCredits);

    // Calculate partnership metrics
    // Total funders: count of active syndicator funders
    aggregated.total_funders = activeSyndicatorFunders.length;
    
    // Active syndications: already calculated in syndication.active.count
    aggregated.active_syndications_count = aggregated.syndication.active.count;
    
    // Total syndications: active + closed
    aggregated.total_syndications_count = aggregated.syndication.active.count + aggregated.syndication.closed.count;

    // Calculate funder details for detailed table (same logic as frontend)
    aggregated.funder_details = activeSyndicatorFunders.map(sf => {
        const funderId = sf.funder?._id || sf.funder;
        
        // Find syndications for this funder
        const funderSyndications = allSyndications.filter(s => {
            const syndicationFunderId = typeof s.funder === 'string' ? s.funder : s.funder?._id;
            return syndicationFunderId === funderId;
        });
        
        const activeCount = funderSyndications.filter(s => s.status === 'ACTIVE').length;
        const closedCount = funderSyndications.filter(s => s.status === 'CLOSED').length;
        const totalCount = activeCount + closedCount;
        
        return {
            funder: sf.funder,
            funderId,
            totalSyndications: totalCount,
            activeSyndications: activeCount,
            closedSyndications: closedCount,
            availableBalance: (sf.available_balance || 0) / 100, // Convert from cents to dollars
            activeInvestmentAmount: (sf.active_syndication_amount || 0) / 100, // Convert from cents to dollars
            lifetimeInvestmentAmount: (sf.syndication_amount || 0) / 100 // Convert from cents to dollars
        };
    }).sort((a, b) => b.totalSyndications - a.totalSyndications); // Sort by total syndications descending

    // Add simplified performance metrics for frontend PerformanceMetrics component
    aggregated.performance_metrics = {
        closed_syndications: {
            ...calculateSimpleClosedMetrics(aggregated.syndication.closed, grossSyndicationData.closed, closedGrossReturns, closedNetReturns, closedGrossInvestments, closedNetInvestments),
            deals_data: aggregated.closed_deals_data,
            roi_distribution: calculateROIDistribution(aggregated.closed_deals_data)
        },
        active_syndications: {
            ...calculateSimpleActiveMetrics(aggregated.syndication.active, grossSyndicationData.active, activeGrossReturns, activeNetReturns, activeGrossInvestments, activeNetInvestments),
            deals_data: aggregated.active_deals_data,
            roi_distribution: calculateROIDistribution(aggregated.active_deals_data)
        }
    };

    return aggregated;
};

module.exports = {
    getFinancialData,
    getDashboardData,
    getSyndicatorDashboardData
}; 