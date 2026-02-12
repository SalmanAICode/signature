const Payback = require('../models/Payback');
const Payout = require('../models/Payout');
const Syndication = require('../models/Syndication');
const SyndicatorFunder = require('../models/SyndicatorFunder');
const PaybackPlan = require('../models/PaybackPlan');
const Funding = require('../models/Funding');
const { SYNDICATION_STATUS, SYNDICATOR_PAYOUT_FREQUENCY, PAYBACK_STATUS, PAYOUT_TIMELINE_STATUS } = require('../utils/constants');
const { centsToDollars } = require('../utils/helpers');

/**
 * Normalize participation percentage
 * Treat numbers > 1 as percent points (10 => 10%), <= 1 as fraction (0.10 => 10%)
 */
function normalizePercent(raw) {
    if (raw == null) return 0;
    const n = Number(raw);
    // Treat numbers > 1 as percent points (10 => 10%), <= 1 as fraction (0.10 => 10%)
    return n > 1 ? n / 100 : n;
}

/**
 * Round money to 2 decimals for clean output
 */
function round2(n) { 
    return Math.round((Number(n) + Number.EPSILON) * 100) / 100; 
}

/**
 * Generate future payback schedule dynamically from PaybackPlan
 * @deprecated This function is NO LONGER USED - we now use stored payback_list instead
 * @param {Object} paybackPlan - PaybackPlan document with calculated virtuals
 * @param {Date} rangeStart - Start date for range
 * @param {Date} rangeEnd - End date for range
 * @returns {Array} Array of { due_date, amount } for future merchant payments
 */
function generateFuturePaybackSchedule(paybackPlan, rangeStart, rangeEnd) {
    const schedule = [];
    
    if (!paybackPlan || !paybackPlan.remaining_count || paybackPlan.remaining_count <= 0) {
        return schedule;
    }
    
    // Determine starting point for schedule generation
    const now = new Date();
    let startDate = paybackPlan.next_payback_date ? new Date(paybackPlan.next_payback_date) : now;
    
    // If next_payback_date is in the past, start from today
    if (startDate < now) {
        startDate = now;
    }
    
    const remainingCount = Math.min(paybackPlan.remaining_count, 100); // Limit for performance
    const amountPerPayback = paybackPlan.next_payback_amount || 
        (paybackPlan.remaining_balance / paybackPlan.remaining_count);
    
    // Generate future dates using PaybackPlan's calculation method
    let currentDate = new Date(startDate);
    
    for (let i = 1; i <= remainingCount; i++) {
        try {
            const paybackDate = PaybackPlan.calculateNthPaybackDate(
                paybackPlan,
                currentDate,
                1
            );
            
            if (!paybackDate) break;
            
            // Only include dates within the requested range
            if (paybackDate >= rangeStart && paybackDate <= rangeEnd) {
                schedule.push({
                    due_date: paybackDate,
                    amount: amountPerPayback
                });
            }
            
            // Move to next iteration
            currentDate = new Date(paybackDate);
            currentDate.setDate(currentDate.getDate() + 1);
            
            // Stop if we've gone past the range
            if (paybackDate > rangeEnd) break;
            
        } catch (error) {
            console.error(`Error calculating payback date ${i}: ${error.message}`);
            break;
        }
    }
    
    return schedule;
}

/**
 * Get upcoming payouts timeline for syndicator dashboard
 * @param {string} syndicatorId - Syndicator ID
 * @param {Object} options - Query options
 * @param {string} options.period - Time period (1week, 4weeks, 1month, 3months, 6months, 1year)
 * @param {string} options.view - View type (gross, net)
 * @param {string} options.start_date - Start date (optional)
 * @param {string} options.end_date - End date (optional)
 * @param {string[]} options.syndication_status - Filter by syndication status
 * @param {string[]} options.funder_ids - Filter by funder IDs
 * @param {number} options.min_amount - Minimum amount filter
 * @param {number} options.max_amount - Maximum amount filter
 * @returns {Object} Upcoming payouts timeline data
 */
exports.getUpcomingPayouts = async (syndicatorId, options = {}) => {

    const {
        period = '4weeks',
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
            // For upcoming payouts, only include ACTIVE syndications (closed ones are fully paid)
            syndicationFilter.status = SYNDICATION_STATUS.ACTIVE;
        }
        
        // Apply funder filter
        if (funder_ids && funder_ids.length > 0) {
            syndicationFilter.funder = { $in: funder_ids };
        }
        
        // Apply amount filters
        // Note: min_amount/max_amount are provided in dollars (API input), 
        // but syndication.payback_amount is stored in cents in the database
        if (min_amount !== undefined || max_amount !== undefined) {
            syndicationFilter.payback_amount = {};
            if (min_amount !== undefined) {
                syndicationFilter.payback_amount.$gte = min_amount * 100; // Convert dollars to cents
            }
            if (max_amount !== undefined) {
                syndicationFilter.payback_amount.$lte = max_amount * 100; // Convert dollars to cents
            }
        }

        // Get all syndications for this syndicator with calculated virtual fields
        const syndications = await Syndication.find(syndicationFilter, null, { calculate: true })
            .populate('funder', 'name') // ✅ get funder name
            .lean();

        console.log('DEBUG: Retrieved syndications:', {
            count: syndications.length,
            syndicationIds: syndications.map(s => s._id),
            statuses: syndications.map(s => s.status),
            remainingBalances: syndications.map(s => s.remaining_balance)
        });

        if (syndications.length === 0) {
            return {
                summary: {
                    total_upcoming: 0,
                    avg_weekly: 0,
                    next_payout_date: null,
                    past_due_amount: 0
                },
                timeline: [],
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

        // Get all actual paybacks for these syndications (merchant payments received)
        const fundingIds = syndications.map(s => s.funding).filter(Boolean);
        const paybacks = await Payback.find({
            funding: { $in: fundingIds },
            status: PAYBACK_STATUS.SUCCEED // Only successful payments
        }).lean();

        // Get payback plans to access distribution_priority and schedule
        const paybackPlans = await PaybackPlan.find({
            funding: { $in: fundingIds }
        }).lean();
        
        // Extract payback details from embedded payback_list (like Monthly service does)
        const paybackPlanDetails = paybackPlans.flatMap(plan => 
            (plan.payback_list || []).map(item => ({
                payback_plan: plan._id,
                funding: plan.funding,
                due_date: item.due_date,
                amount: item.amount,
                distribution_priority: plan.distribution_priority
            }))
        );
        
        // Debug logging
        console.log('DEBUG PaybackPlan Details:', {
            paybackPlansCount: paybackPlans.length,
            paybackPlanDetailsCount: paybackPlanDetails.length,
            upcomingPayments: paybackPlanDetails.filter(p => new Date(p.due_date) > new Date()).length,
            pastPayments: paybackPlanDetails.filter(p => new Date(p.due_date) <= new Date()).length,
            dateRange: {
                earliest: paybackPlanDetails.length > 0 ? new Date(Math.min(...paybackPlanDetails.map(p => new Date(p.due_date)))) : null,
                latest: paybackPlanDetails.length > 0 ? new Date(Math.max(...paybackPlanDetails.map(p => new Date(p.due_date)))) : null
            }
        });

        // Get funding objects with calculated virtual fields
        const fundings = await Funding.find({
            _id: { $in: fundingIds }
        }, null, { calculate: true });

        // Get syndication IDs for payouts query
        const syndicationIds = syndications.map(s => s._id);

        // Get syndicator-funder relationships for payout schedules
        const funderIds = [
            ...new Set(
                syndications
                    .map(s => {
                        const f = s.funder;
                        return f && typeof f === 'object' && f._id ? String(f._id) : (f ? String(f) : null);
                    })
                    .filter(Boolean)
            ),
        ];
        const syndicatorFunders = await SyndicatorFunder.find({
            syndicator: syndicatorId,
            funder: { $in: funderIds },
            inactive: false
        }).populate('funder', 'name').lean();
        
        // Debug logging
        console.log('DEBUG SyndicatorFunders:', {
            syndicatorId,
            funderIds,
            syndicatorFundersCount: syndicatorFunders.length,
            syndicatorFunders: syndicatorFunders.map(sf => ({
                funder: sf.funder,
                payout_frequency: sf.payout_frequency,
                payout_day_of_week: sf.payout_day_of_week,
                payout_day_of_month: sf.payout_day_of_month,
                inactive: sf.inactive
            }))
        });
        
        // Fix missing payout_day_of_week for WEEKLY frequency
        syndicatorFunders.forEach(sf => {
            if (sf.payout_frequency === 'WEEKLY' && sf.payout_day_of_week === undefined) {
                sf.payout_day_of_week = 5; // Default to Friday
                console.log('DEBUG: Set default payout_day_of_week to Friday (5) for funder:', sf.funder);
            }
        });

        // Calculate timeline data
        const { timelineData, totalAvailableGross, totalAvailableNet } = await calculateUpcomingPayoutsTimeline(
            paybacks,
            syndicationIds,
            syndications,
            syndicatorFunders,
            paybackPlans,
            paybackPlanDetails,
            fundings,
            period,
            view,
            start_date,
            end_date
        );

        // Calculate summary metrics
        const summary = calculateUpcomingPayoutsSummary(timelineData, totalAvailableGross, totalAvailableNet);

        // Calculate metadata
        const metadata = {
            period_type: period,
            view_type: view,
            total_periods: timelineData.length,
            date_range: {
                start: timelineData.length > 0 ? timelineData[0].period : null,
                end: timelineData.length > 0 ? timelineData[timelineData.length - 1].period : null
            }
        };

        return {
            summary,
            timeline: timelineData,
            metadata
        };

    } catch (error) {
        console.error('Error getting upcoming payouts:', error);
        throw error;
    }
};

async function calculateUpcomingPayoutsTimeline(paybacks, syndicationIds, syndications, syndicatorFunders, paybackPlans, paybackPlanDetails, fundings, period, view, startDate, endDate) {
    // Create time buckets based on period
    const timeBuckets = createUpcomingTimeBuckets(period, startDate, endDate);

    // Get date range from time buckets for performance optimization
    const rangeStart = timeBuckets[0]?.start;
    const rangeEnd = timeBuckets[timeBuckets.length - 1]?.end;

    // Range-filtered payouts for "received" series in the chart
    const payoutsInRange = await Payout.find({
        syndication: { $in: syndicationIds },
        ...(rangeStart && rangeEnd ? { 
            $or: [
                { redeemed_date: { $gte: rangeStart, $lte: rangeEnd } },
                { created_date:  { $gte: rangeStart, $lte: rangeEnd } }
            ]
        } : {})
    }).lean();


    // Initialize timeline data
    const timelineData = timeBuckets.map(bucket => ({
        period: bucket.label,
        week_number: bucket.weekNumber,
        expected_amount: 0,
        expected_gross: 0,
        expected_net: 0,
        expected_fund: 0,
        expected_fee: 0,
        received_amount: 0,
        received_fund: 0,
        received_fee: 0,
        remaining_balance: 0,
        remaining_net_balance: 0,
        payouts: []
    }));

    const now = new Date();

    // NEW APPROACH: PaybackPlan-based payout forecast
    // Instead of distributing available balance, project future merchant payments
    console.log('DEBUG: Starting PaybackPlan-based forecast');
    console.log('DEBUG: Syndications count:', syndications.length);
    
    // Get PaybackPlans for all fundings
    const fundingIds = [...new Set(syndications.map(s => s.funding?.toString()).filter(Boolean))];
    const allPaybackPlans = await PaybackPlan.find({
        funding: { $in: fundingIds }
    }, null, { calculate: true }).lean();
    
    // Map funding ID to PaybackPlan
    const paybackPlanByFunding = {};
    allPaybackPlans.forEach(plan => {
        if (plan.funding) {
            paybackPlanByFunding[plan.funding.toString()] = plan;
        }
    });
    
    console.log('DEBUG: Found PaybackPlans:', allPaybackPlans.length);
    
    // Process each syndication to generate future payout forecast
    for (const syndication of syndications) {
        const fundingId = syndication.funding?.toString();
        if (!fundingId) continue;
        
        const paybackPlan = paybackPlanByFunding[fundingId];
        if (!paybackPlan) {
            console.log(`DEBUG: No PaybackPlan for syndication ${syndication._id}`);
            continue;
        }
        
        console.log(`DEBUG: Processing syndication ${syndication._id}:`);
        console.log(`  Participate %: ${syndication.participate_percent}`);
        console.log(`  PaybackPlan has ${paybackPlan.payback_list?.length || 0} entries in payback_list`);
        console.log(`  PaybackPlan status: ${paybackPlan.status}, remaining_count: ${paybackPlan.remaining_count || 0}`);
        
        // Skip if PaybackPlan has ended (STOPPED status or 0 remaining count)
        if (paybackPlan.status === 'STOPPED' || (paybackPlan.remaining_count !== undefined && paybackPlan.remaining_count <= 0)) {
            console.log(`  Skipping: PaybackPlan has ended`);
            continue;
        }
        
        // Use stored payback_list instead of dynamic generation
        // Filter for future payments within the date range
        const futurePaybacks = (paybackPlan.payback_list || [])
            .filter(item => {
                const dueDate = new Date(item.due_date);
                // Only include if within range AND in the future (not past)
                return dueDate >= rangeStart && dueDate <= rangeEnd && dueDate >= now;
            })
            .map(item => ({
                due_date: new Date(item.due_date),
                amount: item.amount
            }));
        
        console.log(`  Found ${futurePaybacks.length} future paybacks from payback_list`);
        
        // For each future merchant payment, calculate syndicator's share
        for (const payback of futurePaybacks) {
            // Merchant payment amount (in cents, convert to dollars)
            const merchantPayment = centsToDollars(payback.amount || 0);
            
            // Calculate syndicator's share
            const pct = normalizePercent(syndication.participate_percent || 0);
            const syndicatorShare = round2(merchantPayment * pct);
            
            // Debug logging for first payback
            if (futurePaybacks.indexOf(payback) === 0) {
                console.log(`  DEBUG: First payback calculation`);
                console.log(`    payback.amount (cents): ${payback.amount}`);
                console.log(`    merchantPayment (dollars): ${merchantPayment}`);
                console.log(`    participate_percent: ${syndication.participate_percent}`);
                console.log(`    pct (normalized): ${pct}`);
                console.log(`    syndicatorShare: ${syndicatorShare}`);
            }
            
            if (syndicatorShare <= 0) continue;
            
            // Find which time bucket this payback falls into
            const bucket = findTimeBucket(payback.due_date, timeBuckets);
            if (!bucket) continue;
            
            // Add to timeline data
            timelineData[bucket.index].expected_amount = round2(
                (timelineData[bucket.index].expected_amount || 0) + syndicatorShare
            );
            timelineData[bucket.index].expected_gross = round2(
                (timelineData[bucket.index].expected_gross || 0) + syndicatorShare
            );
            timelineData[bucket.index].expected_net = round2(
                (timelineData[bucket.index].expected_net || 0) + syndicatorShare
            );
            timelineData[bucket.index].expected_fund = round2(
                (timelineData[bucket.index].expected_fund || 0) + syndicatorShare
            );
            timelineData[bucket.index].expected_fee = 0; // No additional fees in forecast
            
            // Add payout detail
            timelineData[bucket.index].payouts.push({
                syndication_id: syndication._id,
                syndication_name: syndication.name || `Syndication ${syndication._id}`,
                funder_name: syndication.funder?.name || 'Unknown Funder',
                due_date: payback.due_date.toISOString(),
                gross_amount: round2(syndicatorShare),
                net_amount: round2(syndicatorShare),
                fund_amount: round2(syndicatorShare),
                fee_amount: 0,
                status: payback.due_date < now ? PAYOUT_TIMELINE_STATUS.PAST_DUE : PAYOUT_TIMELINE_STATUS.UPCOMING
            });
        }
    }
    
    console.log('DEBUG: PaybackPlan-based forecast complete');

    // Process actual received payouts
    for (const payout of payoutsInRange) {
        const payoutDate = new Date(payout.redeemed_date || payout.created_date);
        const bucket = findTimeBucket(payoutDate, timeBuckets);
        if (!bucket) continue;

        // NOTE: payout amounts are stored in cents, convert to dollars
        const grossAmount = round2(centsToDollars(payout.payout_amount || 0));
        const feeAmount = round2(centsToDollars(payout.fee_amount || 0));
        const creditAmount = round2(centsToDollars(payout.credit_amount || 0));

        // ✅ NET should add credits (credits increase available)
        const netAmount = round2(grossAmount - feeAmount + creditAmount);
        const fundAmountGross = round2(grossAmount - feeAmount);

        if (view === 'gross') {
            timelineData[bucket.index].received_amount = round2((timelineData[bucket.index].received_amount || 0) + grossAmount);
            timelineData[bucket.index].received_fund = round2((timelineData[bucket.index].received_fund || 0) + fundAmountGross);
            timelineData[bucket.index].received_fee = round2((timelineData[bucket.index].received_fee || 0) + feeAmount);
        } else {
            // NET view: store net only; fees=0
            timelineData[bucket.index].received_amount = round2((timelineData[bucket.index].received_amount || 0) + netAmount);
            timelineData[bucket.index].received_fund = round2((timelineData[bucket.index].received_fund || 0) + netAmount);
            // fee stays 0 in net
        }
    }

    // Ensure consistent data structure
    timelineData.forEach(period => {
        // Ensure expected_net is set correctly
        period.expected_net = period.expected_net || 0;
        
        // In this model, fees are always 0 for forecast (payout-level fees show up when you record real Payout docs)
        period.expected_fee = 0;
        
        if (view === 'gross') {
            period.received_fee = round2(period.received_fee || 0); // keep what you computed
        } else {
            period.received_fee = 0; // hide in net view
        }
    });

    // Calculate total available funds from syndications
    let totalAvailableGross = 0;
    let totalAvailableNet = 0;
    
    for (const syndication of syndications) {
        const remainingBalance = centsToDollars(syndication.remaining_balance || 0);
        const grossAvailable = round2(Math.max(0, remainingBalance));
        const upfrontFeeAmount = centsToDollars(syndication.upfront_fee_amount || 0);
        const netAvailable = round2(Math.max(0, remainingBalance - upfrontFeeAmount));
        
        totalAvailableGross += grossAvailable;
        totalAvailableNet += netAvailable;
    }

    // Calculate running balance for each timeline period
    // This shows how the available balance grows as future payouts are received
    let runningBalanceGross = totalAvailableGross;
    let runningBalanceNet = totalAvailableNet;
    
    for (let i = 0; i < timelineData.length; i++) {
        // Add expected earnings for this period
        runningBalanceGross += timelineData[i].expected_amount || 0;
        runningBalanceNet += (timelineData[i].expected_net || 0);
        
        // Store the cumulative balance after this period's earnings
        timelineData[i].remaining_balance = round2(runningBalanceGross);
        timelineData[i].remaining_net_balance = round2(runningBalanceNet);
    }

    return {
        timelineData,
        totalAvailableGross: round2(totalAvailableGross),
        totalAvailableNet: round2(totalAvailableNet)
    };
}

/**
 * Create time buckets for upcoming payouts
 */
function createUpcomingTimeBuckets(period, startDate, endDate) {
    const buckets = [];
    const now = new Date();
    
    // Calculate the appropriate date range based on period
    let start, end;
    
    if (startDate && endDate) {
        // Custom date range provided
        start = new Date(startDate);
        end = new Date(endDate);
    } else {
        // Calculate based on period
        end = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year in the future
        switch (period) {
        case '1week':
            start = now;
            end = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // 1 week ahead
            break;
        case '4weeks':
            start = now;
            end = new Date(now.getTime() + (28 * 24 * 60 * 60 * 1000)); // 4 weeks ahead
            break;
        case '1month':
            start = now;
            end = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 1 month ahead
            break;
        case '3months':
            start = now;
            end = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000)); // 3 months ahead
            break;
        case '6months':
            start = now;
            end = new Date(now.getTime() + (180 * 24 * 60 * 60 * 1000)); // 6 months ahead
            break;
        case '1year':
            start = now;
            end = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year ahead
            break;
        default:
            start = now;
            end = new Date(now.getTime() + (28 * 24 * 60 * 60 * 1000)); // Default to 4 weeks
            break;
        }
    }

    if (period === '1week') {
        // Create daily buckets for 1 week
        let current = new Date(start);
        current.setHours(0, 0, 0, 0);
        
        let weekNumber = 1;
        while (current <= end) {
            const dayEnd = new Date(current);
            dayEnd.setHours(23, 59, 59, 999);
            
            buckets.push({
                start: new Date(current),
                end: dayEnd,
                label: formatDailyLabel(current),
                weekNumber: weekNumber,
                index: buckets.length
            });
            
            current.setDate(current.getDate() + 1);
        }
    } else {
        // Create weekly buckets for other periods (start next week for true "next N weeks")
        let current = new Date(start);
        current.setDate(current.getDate() - current.getDay() + 7); // Start of next week
        
        let weekNumber = 1;
        while (current <= end) {
            const weekEnd = new Date(current);
            weekEnd.setDate(weekEnd.getDate() + 6);
            
            buckets.push({
                start: new Date(current),
                end: weekEnd,
                label: formatWeeklyLabel(current, weekEnd),
                weekNumber: weekNumber,
                index: buckets.length
            });
            
            current.setDate(current.getDate() + 7);
            weekNumber++;
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
 * Format weekly label (e.g., "Oct 13–Oct 19, 2025")
 */
function formatWeeklyLabel(start, end) {
    const s = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const e = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const y = end.getFullYear();
    return `${s}–${e}, ${y}`; // e.g., "Oct 13–Oct 19, 2025"
}

/**
 * Generate scheduled payout dates for a funder within the given range
 */
function generateScheduledPayoutDates(syndicatorFunder, rangeStart, rangeEnd, now) {
    const dates = [];
    const freq = syndicatorFunder.payout_frequency;
    const next = syndicatorFunder.next_payout_date ? new Date(syndicatorFunder.next_payout_date) : null;

    let cursor = new Date(Math.max(
        rangeStart ? rangeStart.getTime() : 0,
        next ? next.getTime() : 0,
        now.getTime()
    ));

    // Debug logging
    console.log('DEBUG generateScheduledPayoutDates:', {
        funder: syndicatorFunder.funder?.name || 'Unknown',
        frequency: freq,
        payout_day_of_week: syndicatorFunder.payout_day_of_week,
        rangeStart: rangeStart?.toISOString(),
        rangeEnd: rangeEnd?.toISOString(),
        now: now.toISOString(),
        cursor: cursor.toISOString()
    });

    // align cursor to first valid date for the frequency
    if (freq === SYNDICATOR_PAYOUT_FREQUENCY.WEEKLY) {
        // move to upcoming payout day (or stay on payout day if already that day)
        const payoutDay = syndicatorFunder.payout_day_of_week || 5; // Default to Friday if not set
        const d = cursor.getDay();              // 0=Sun..6=Sat
        const daysUntilPayoutDay = (payoutDay - d + 7) % 7;
        if (daysUntilPayoutDay !== 0) cursor.setDate(cursor.getDate() + daysUntilPayoutDay);
    } else if (freq === SYNDICATOR_PAYOUT_FREQUENCY.MONTHLY) {
        // move to the 1st of next month if we're not on the 1st
        if (cursor.getDate() !== 1) cursor.setMonth(cursor.getMonth() + 1, 1);
    }
    // DAILY needs no alignment

    while (cursor <= rangeEnd) {
        if (!rangeStart || cursor >= rangeStart) dates.push(new Date(cursor));
        // advance
        if (freq === SYNDICATOR_PAYOUT_FREQUENCY.DAILY) {
            cursor.setDate(cursor.getDate() + 1);
        } else if (freq === SYNDICATOR_PAYOUT_FREQUENCY.WEEKLY) {
            cursor.setDate(cursor.getDate() + 7);
        } else if (freq === SYNDICATOR_PAYOUT_FREQUENCY.MONTHLY) {
            cursor.setMonth(cursor.getMonth() + 1, 1);
        } else {
            cursor.setDate(cursor.getDate() + 7); // default weekly
        }
    }
    
    // Debug logging
    console.log('DEBUG generateScheduledPayoutDates result:', {
        funder: syndicatorFunder.funder?.name || 'Unknown',
        datesGenerated: dates.length,
        firstDate: dates[0]?.toISOString(),
        lastDate: dates[dates.length - 1]?.toISOString()
    });
    
    return dates;
}



/**
 * Calculate summary metrics for upcoming payouts
 */
function calculateUpcomingPayoutsSummary(timelineData, totalAvailableGross, totalAvailableNet) {
    // NOTE: All date operations use local timezone - ensure consistency across schedule generation
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    
    console.log('DEBUG Summary Calculation:');
    console.log(`  Current date (startOfToday): ${startOfToday.toISOString()}`);
    console.log(`  Total timeline periods: ${timelineData.length}`);
    console.log(`  First period:`, timelineData[0] ? {
        period: timelineData[0].period,
        expected_amount: timelineData[0].expected_amount,
        payouts_count: timelineData[0].payouts?.length || 0,
        first_payout_date: timelineData[0].payouts?.[0]?.due_date
    } : 'N/A');
    
    // Separate upcoming and past due (professional logic)
    const upcomingPeriods = timelineData.filter(period => {
        return period.payouts.some(payout => {
            // Anything due today or later is upcoming
            return new Date(payout.due_date) >= startOfToday;
        });
    });
    
    const pastDuePeriods = timelineData.filter(period => {
        return period.payouts.some(payout => {
            // Anything due before today with amount >= threshold is past due
            const dueDate = new Date(payout.due_date);
            const isPastDue = dueDate < startOfToday;
            const hasAmount = payout.gross_amount > 0; // Any amount indicates it should have been paid
            return isPastDue && hasAmount;
        });
    });

    console.log(`  Upcoming periods after filter: ${upcomingPeriods.length}`);
    console.log(`  Past due periods after filter: ${pastDuePeriods.length}`);

    // Calculate totals
    const totalUpcoming = upcomingPeriods.reduce((sum, period) => sum + period.expected_amount, 0);
    const totalUpcomingFund = upcomingPeriods.reduce((sum, period) => sum + period.expected_fund, 0);
    const totalUpcomingFee = upcomingPeriods.reduce((sum, period) => sum + period.expected_fee, 0);
    const totalPastDue = pastDuePeriods.reduce((sum, period) => sum + period.expected_amount, 0);
    const totalPastDueFund = pastDuePeriods.reduce((sum, period) => sum + period.expected_fund, 0);
    const totalPastDueFee = pastDuePeriods.reduce((sum, period) => sum + period.expected_fee, 0);
    
    console.log(`  Total upcoming: $${totalUpcoming}`);
    console.log(`  Total past due: $${totalPastDue}`);
    
    // Calculate average weekly (period average - total weeks in view)
    const weeksInView = timelineData.length; // Total weeks in the visible range
    const avgWeekly = weeksInView > 0 ? totalUpcoming / weeksInView : 0;
    
    // Find next payout date (earliest scheduled date >= now with amount >= threshold)
    let nextPayoutDate = null;
    for (const period of upcomingPeriods) {
        for (const payout of period.payouts) {
            const dueDate = new Date(payout.due_date);
            const hasAmount = payout.gross_amount > 0; // Any amount indicates it should be paid
            
            if (dueDate >= startOfToday && hasAmount && (!nextPayoutDate || dueDate < nextPayoutDate)) {
                nextPayoutDate = dueDate;
            }
        }
    }

    return {
        total_upcoming: round2(totalUpcoming),
        total_upcoming_fund: round2(totalUpcomingFund),
        total_upcoming_fee: round2(totalUpcomingFee),
        avg_weekly: round2(avgWeekly),
        next_payout_date: nextPayoutDate ? nextPayoutDate.toISOString().split('T')[0] : null,
        past_due_amount: round2(totalPastDue),
        past_due_fund: round2(totalPastDueFund),
        past_due_fee: round2(totalPastDueFee),
        // NEW: show the current available pot from actual funder balances
        available_funds_gross: round2(totalAvailableGross),
        available_funds_net: round2(totalAvailableNet)
    };
}
