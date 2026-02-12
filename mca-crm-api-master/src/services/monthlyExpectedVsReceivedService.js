const PaybackPlan = require('../models/PaybackPlan');
const Payout = require('../models/Payout'); 
const Syndication = require('../models/Syndication');
const { SYNDICATION_STATUS } = require('../utils/constants');
const { calculatePaybackDistribution, calculateSyndicatorShare, calculateNetSyndicatorReturns } = require('../utils/paybackCalculations');
// const { centsToDollars } = require('../utils/helpers');
const { Types } = require('mongoose');

// Normalize funding id whether value is an ObjectId, string, or populated object
function getFundingId(x) {
    const v = (x && x.funding && x.funding._id) ? x.funding._id : (x && x.funding ? x.funding : x);
    return v ? v.toString() : undefined;
}

// Normalize payout row values to cents regardless of stored units
function normalizeMoneyToCents(payout) {
    const values = [payout && payout.payout_amount, payout && payout.fee_amount, payout && payout.credit_amount]
        .filter(v => v !== undefined && v !== null);

    let isDollars = values.some(v => Math.abs(Number(v) - Math.round(Number(v))) > 1e-6);

    if (!isDollars) {
        const amt = Number(payout && payout.payout_amount ? payout.payout_amount : 0);
        if (amt > 0 && amt <= 5000) isDollars = true;
    }

    const toRowCents = v => isDollars ? Math.round(Number(v || 0) * 100) : Math.round(Number(v || 0));

    return {
        payoutCents: toRowCents(payout && payout.payout_amount),
        feeCents: toRowCents(payout && payout.fee_amount),
        creditCents: toRowCents(payout && payout.credit_amount)
    };
}

/**
 * Calculate monthly expected vs received data for syndicator dashboard
 * @param {string} syndicatorId - Syndicator ID
 * @param {Object} options - Query options
 * @param {string} options.period - Time period (daily, weekly, monthly, all-time)
 * @param {string} options.view - View type (gross, net)
 * @param {string} options.start_date - Start date (optional)
 * @param {string} options.end_date - End date (optional)
 * @param {string[]} options.syndication_status - Filter by syndication status
 * @param {string[]} options.funder_ids - Filter by funder IDs
 * @param {number} options.min_amount - Minimum amount filter
 * @param {number} options.max_amount - Maximum amount filter
 * @returns {Object} Monthly expected vs received data
 */
exports.calculateMonthlyData = async (syndicatorId, options = {}) => {

    const {
        period = 'weekly',
        view = 'gross',
        start_date,
        end_date,
        syndication_status,
        funder_ids,
        min_amount,
        max_amount
    } = options;

    try {
        // Build syndication filter
        const syndicationFilter = {
            syndicator: syndicatorId
        };
        
        // Apply status filter
        if (syndication_status && syndication_status.length > 0) {
            syndicationFilter.status = { $in: syndication_status };
        } else {
            syndicationFilter.status = { $in: [SYNDICATION_STATUS.ACTIVE, SYNDICATION_STATUS.CLOSED] };
        }
        
        // Apply funder filter
        if (funder_ids && funder_ids.length > 0) {
            syndicationFilter.funder = { $in: funder_ids };
        }
        
        // Apply amount filters
        if (min_amount !== undefined || max_amount !== undefined) {
            syndicationFilter.payback_amount = {};
            if (min_amount !== undefined) {
                syndicationFilter.payback_amount.$gte = min_amount * 100; // Convert to cents
            }
            if (max_amount !== undefined) {
                syndicationFilter.payback_amount.$lte = max_amount * 100; // Convert to cents
            }
        }

        // Get all syndications for this syndicator with calculated virtual fields
        const syndications = await Syndication.find(syndicationFilter, null, { calculate: true }).lean();

        if (syndications.length === 0) {
            return {
                summary: {
                    total_expected: 0,
                    total_received: 0,
                    completion_rate: 0,
                    outstanding_balance: 0
                },
                time_series: [],
                metadata: {
                    period_type: period,
                    view_type: view,
                    total_periods: 0,
                    date_range: {
                        start: null,
                        end: null
                    }
                }
            };
        }

        // Get all payback plans for these syndications
        const fundingIds = [...new Set(
            syndications.map(getFundingId).filter(Boolean)
        )].map(id => new Types.ObjectId(id));
        const paybackPlans = await PaybackPlan.find({
            funding: { $in: fundingIds }
        }).lean();

        // Extract payback details from embedded payback_list
        const paybackPlanDetails = paybackPlans.flatMap(plan => 
            (plan.payback_list || []).map(item => ({
                payback_plan: plan._id,
                due_date: item.due_date,
                amount: item.amount,
                distribution_priority: plan.distribution_priority
            }))
        );


        // For all-time, find the earliest record date
        let actualStartDate = start_date;
        let actualEndDate = end_date;
        
        if (period === 'all-time' && !start_date && !end_date) {
            const earliestDates = [];

            // 1) from expected schedule
            if (paybackPlanDetails.length > 0) {
                const earliestDetail = paybackPlanDetails.reduce((a, b) =>
                    new Date(a.due_date) < new Date(b.due_date) ? a : b
                );
                earliestDates.push(new Date(earliestDetail.due_date));
            }

            // 2) from payouts (posted only) using usedDate = redeemed_date || created_date
            const earliestPayout = await Payout.aggregate([
                { $match: {
                    syndicator: new Types.ObjectId(syndicatorId),
                    funding: { $in: fundingIds },
                    pending: false,
                    inactive: false
                }},
                { $addFields: { usedDate: { $ifNull: [ '$redeemed_date', '$created_date' ] } } },
                { $sort: { usedDate: 1 } },
                { $limit: 1 },
                { $project: { usedDate: 1 } }
            ]).then(r => r[0]);
            if (earliestPayout?.usedDate) {
                earliestDates.push(new Date(earliestPayout.usedDate));
            }

            // 3) from syndications
            if (syndications.length > 0) {
                const earliestSynd = syndications.reduce((a, b) =>
                    new Date(a.start_date) < new Date(b.start_date) ? a : b
                );
                if (earliestSynd?.start_date) earliestDates.push(new Date(earliestSynd.start_date));
            }

            if (earliestDates.length > 0) {
                actualStartDate = new Date(Math.min(...earliestDates.map(d => d.getTime())));
                actualStartDate.setDate(1);
                actualStartDate.setHours(0, 0, 0, 0);

                // ✅ set end to max(now, latest payback due) so future expected is included
                const maxDue = Math.max(...paybackPlanDetails.map(d => +new Date(d.due_date)), 0);
                actualEndDate = maxDue ? new Date(Math.max(Date.now(), maxDue)) : new Date();
            }
        }

        // Calculate time series data
        const timeSeriesData = await calculateTimeSeriesData(
            paybackPlanDetails,
            syndications,
            paybackPlans,
            period,
            view,
            actualStartDate,
            actualEndDate,
            syndicatorId,
            fundingIds
        );

        // Calculate summary metrics
        const summary = calculateSummaryMetrics(timeSeriesData);

        // Calculate metadata
        const metadata = {
            period_type: period,
            view_type: view,
            total_periods: timeSeriesData.length,
            date_range: {
                start: timeSeriesData.length > 0 ? timeSeriesData[0].period : null,
                end: timeSeriesData.length > 0 ? timeSeriesData[timeSeriesData.length - 1].period : null
            }
        };

        return {
            summary,
            time_series: timeSeriesData,
            metadata
        };

    } catch (error) {
        console.error('Error calculating monthly data:', error);
        throw error;
    }
};

/**
 * Calculate time series data for expected vs received
 */
async function calculateTimeSeriesData(
    paybackPlanDetails,
    syndications,
    paybackPlans,
    period,
    view,
    startDate,
    endDate,
    syndicatorId,
    fundingIds
) {
    // Create time buckets
    const timeBuckets = createTimeBuckets(period, startDate, endDate);

    // Bound queries to the buckets
    const firstStart = timeBuckets[0]?.start;
    const lastEnd = timeBuckets[timeBuckets.length - 1]?.end;
    // keep payouts capped at now
    const payoutRangeEnd = lastEnd ? new Date(Math.min(lastEnd.getTime(), Date.now())) : new Date(Date.now());
    // but let expected go to the end of the buckets
    const scheduleRangeEnd = (lastEnd && lastEnd.getTime) ? lastEnd.getTime() : Infinity;

    // Pull posted payouts for this syndicator within the range using usedDate = redeemed_date || created_date
    const payouts = await Payout.aggregate([
        { $match: {
            syndicator: new Types.ObjectId(syndicatorId),
            funding: { $in: fundingIds },
            pending: false,
            inactive: false
        }},
        { $addFields: { usedDate: { $ifNull: [ '$redeemed_date', '$created_date' ] } } },
        ...(firstStart && payoutRangeEnd ? [{ $match: { usedDate: { $gte: firstStart, $lte: payoutRangeEnd } } }] : []),
        { $project: { usedDate: 1, payout_amount: 1, fee_amount: 1, credit_amount: 1 } }
    ]);

    // Quick maps
    const syndByFunding = new Map(syndications.map(s => [getFundingId(s), s]));
    const planById = new Map(paybackPlans.map(p => [p._id.toString(), p]));

    // Initialize rows
    const timeSeriesData = timeBuckets.map(bucket => ({
        period: bucket.label,
        expected: 0,
        expected_fund: 0,
        expected_fee: 0,
        received: 0,
        received_fund: 0,
        received_fee: 0,
        completion_rate: 0
    }));

    // Expected (from payback plans)
    // Performance optimization: prefilter schedule items outside the visible range
    const scheduleStart = firstStart ? firstStart.getTime() : -Infinity;
    const scheduleEnd   = scheduleRangeEnd;
    
    for (const detail of paybackPlanDetails) {
        const t = new Date(detail.due_date).getTime();
        if (t < scheduleStart || t > scheduleEnd) continue;
        
        const plan = planById.get(detail.payback_plan.toString());
        if (!plan) continue;

        const planFundingId = (plan.funding && plan.funding._id) ? plan.funding._id : plan.funding;
        const planFundingIdStr = planFundingId ? planFundingId.toString() : undefined;
        const synd = planFundingIdStr ? syndByFunding.get(planFundingIdStr) : undefined;
        if (!synd) continue;

        const bucket = findTimeBucket(new Date(detail.due_date), timeBuckets);
        if (!bucket) continue;

        const idx = bucket.index;
        // Normalize percent to decimal: handles both 0–1 and 0–100 inputs safely
        const rawPct = (synd.participate_percent ?? 0);
        const partPct = rawPct > 1 ? (rawPct / 100) : rawPct;

        const dist = calculatePaybackDistribution(
            detail.amount,
            detail.distribution_priority,
            synd
        );

        if (view === 'gross') {
            // Gross expected: round per-item to cents before summing
            const expectedCents = Math.round(detail.amount * partPct);
            const fundedCents   = Math.round(dist.funded_amount * partPct);
            const feeCents      = Math.round(dist.fee_amount * partPct);

            timeSeriesData[idx].expected      += expectedCents / 100;
            timeSeriesData[idx].expected_fund += fundedCents   / 100;
            timeSeriesData[idx].expected_fee  += feeCents      / 100;
        } else {
            // Net expected = syndicator's net share of total amount
            // Convert amount from cents to dollars, with cent rounding
            const amountDollars = Math.round(detail.amount) / 100;
            const grossShare = calculateSyndicatorShare(amountDollars, partPct);
            const netShare = calculateNetSyndicatorReturns(grossShare, synd);
            const netShareRounded = Math.round(Number(netShare) * 100) / 100;
            timeSeriesData[idx].expected      += netShareRounded;
            timeSeriesData[idx].expected_fund += netShareRounded;
            // expected_fee stays 0 in net view
        }
    }

    // Received (from payouts)
    for (const payout of payouts) {
        const when = new Date(payout.usedDate);
        const bucket = findTimeBucket(when, timeBuckets);
        if (!bucket) continue;

        const idx = bucket.index;
        const { payoutCents, feeCents, creditCents } = normalizeMoneyToCents(payout);

        if (view === 'gross') {
            // Gross received: split payout into fund vs fee (rounded to cents)
            timeSeriesData[idx].received      += (payoutCents / 100);
            timeSeriesData[idx].received_fund += ((payoutCents - feeCents) / 100);
            timeSeriesData[idx].received_fee  += (feeCents / 100);
        } else {
            // Net received: available to syndicator
            const availableCents = payoutCents - feeCents + creditCents;
            const v = availableCents / 100;
            timeSeriesData[idx].received      += v;
            timeSeriesData[idx].received_fund += v;
            // received_fee stays 0 in net view
        }
    }

    // Completion rate
    for (const row of timeSeriesData) {
        row.completion_rate = row.expected > 0 ? (row.received / row.expected) * 100 : 0;
    }

    return timeSeriesData;
}

/**
 * Create time buckets based on period type
 */
function createTimeBuckets(period, startDate, endDate) {
    const buckets = [];
    const now = new Date();
    
    // Calculate the appropriate date range based on period
    let start, end;
    
    // ✅ accept partial custom ranges
    if (startDate || endDate) {
        start = new Date(startDate || new Date(2020, 0, 1));
        end   = new Date(endDate   || now);
    } else {
        // Calculate based on period
        end = now;
        switch (period) {
        case 'daily':
        case '1week':
            start = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)); // 1 week ago
            break;
        case 'weekly':
        case '4weeks':
            start = new Date(now.getTime() - (28 * 24 * 60 * 60 * 1000)); // 4 weeks ago
            break;
        case 'monthly':
        case '1month':
            start = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // 1 month ago
            break;
        case '3months':
            start = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000)); // 3 months ago
            break;
        case '6months':
            start = new Date(now.getTime() - (180 * 24 * 60 * 60 * 1000)); // 6 months ago
            break;
        case '1year':
            start = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000)); // 1 year ago
            break;
        case 'all-time':
        default:
            start = new Date(2020, 0, 1); // Fallback to 2020 if no data found
            break;
        }
    }

    if (period === 'daily' || period === '1week') {
        // Create daily buckets
        let current = new Date(start);
        current.setHours(0, 0, 0, 0); // Start of day
        
        while (current <= end) {
            const dayEnd = new Date(current);
            dayEnd.setHours(23, 59, 59, 999); // End of day
            
            buckets.push({
                start: new Date(current),
                end: dayEnd,
                label: formatDailyLabel(current),
                index: buckets.length
            });
            
            current.setDate(current.getDate() + 1);
        }
    } else if (period === 'weekly' || period === '4weeks') {
        // Create weekly buckets
        let current = new Date(start);
        current.setDate(current.getDate() - current.getDay()); // Start of week

        while (current <= end) {
            const weekEnd = new Date(current);
            weekEnd.setDate(weekEnd.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            
            buckets.push({
                start: new Date(current),
                end: weekEnd,
                label: formatWeeklyLabel(current, weekEnd),
                index: buckets.length
            });
            
            current.setDate(current.getDate() + 7);
        }
    } else if (period === 'monthly' || period === '1month' || period === '3months' || period === '6months' || period === '1year') {
        // Create monthly buckets
        let current = new Date(start.getFullYear(), start.getMonth(), 1);
        
        while (current <= end) {
            const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
            monthEnd.setHours(23, 59, 59, 999);
            
            buckets.push({
                start: new Date(current),
                end: monthEnd,
                label: formatMonthlyLabel(current),
                index: buckets.length
            });
            
            current.setMonth(current.getMonth() + 1);
        }
    } else {
        // All time - create monthly buckets for the entire range
        let current = new Date(start.getFullYear(), start.getMonth(), 1);
        
        while (current <= end) {
            const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
            monthEnd.setHours(23, 59, 59, 999);
            
            buckets.push({
                start: new Date(current),
                end: monthEnd,
                label: formatMonthlyLabel(current),
                index: buckets.length
            });
            
            current.setMonth(current.getMonth() + 1);
        }
    }

    return buckets;
}

/**
 * Find the appropriate time bucket for a given date
 */
function findTimeBucket(date, buckets) {
    return buckets.find(bucket => date >= bucket.start && date <= bucket.end);
}

/**
 * Format daily label (e.g., "1/28/2024")
 */
function formatDailyLabel(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
}

/**
 * Format weekly label (e.g., "1/28-2/3/2024" or "12/28/2023-1/3/2024")
 */
function formatWeeklyLabel(start, end) {
    const startStr = `${start.getMonth() + 1}/${start.getDate()}`;
    const endStr   = `${end.getMonth() + 1}/${end.getDate()}`;
    return start.getFullYear() === end.getFullYear()
        ? `${startStr}-${endStr}/${start.getFullYear()}`
        : `${startStr}/${start.getFullYear()}-${endStr}/${end.getFullYear()}`;
}

/**
 * Format monthly label (e.g., "January 2024")
 */
function formatMonthlyLabel(date) {
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    return `${month} ${year}`;
}


/**
 * Calculate summary metrics from time series data
 */
function calculateSummaryMetrics(timeSeriesData) {
    const totalExpected = timeSeriesData.reduce((sum, period) => sum + period.expected, 0);
    const totalExpectedFund = timeSeriesData.reduce((sum, period) => sum + period.expected_fund, 0);
    const totalExpectedFee = timeSeriesData.reduce((sum, period) => sum + period.expected_fee, 0);
    const totalReceived = timeSeriesData.reduce((sum, period) => sum + period.received, 0);
    const totalReceivedFund = timeSeriesData.reduce((sum, period) => sum + period.received_fund, 0);
    const totalReceivedFee = timeSeriesData.reduce((sum, period) => sum + period.received_fee, 0);
    const completionRate = totalExpected > 0 ? (totalReceived / totalExpected) * 100 : 0;
    const outstandingBalance = totalExpected - totalReceived;

    return {
        total_expected: Number(totalExpected.toFixed(2)),
        total_expected_fund: Number(totalExpectedFund.toFixed(2)),
        total_expected_fee: Number(totalExpectedFee.toFixed(2)),
        total_received: Number(totalReceived.toFixed(2)),
        total_received_fund: Number(totalReceivedFund.toFixed(2)),
        total_received_fee: Number(totalReceivedFee.toFixed(2)),
        completion_rate: Number(completionRate.toFixed(1)),
        outstanding_balance: Number(outstandingBalance.toFixed(2))
    };
}
