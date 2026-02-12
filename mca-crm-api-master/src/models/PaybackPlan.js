const mongoose = require('mongoose');
const dateHolidays = require('date-holidays');
const Payback = require('./Payback');

const { PAYMENT_METHOD, PAYBACK_FREQUENCY, PAYBACK_PLAN_STATUS, PAYBACK_STATUS, PAYBACK_DISTRIBUTION_PRIORITY, PAYBACK_PLAN_DETAILS_STATUS } = require('../utils/constants');
const { calculatePaybackDistribution } = require('../utils/paybackCalculations');

// Helper function to check if a date is a public holiday (ignoring observance holidays)
const isPublicHoliday = function(date, holidays) {
    const holidayInfo = holidays.isHoliday(date);
    if (holidayInfo === false) {
        return false;
    }
    
    // Check if any of the holidays for this date are public holidays
    if (Array.isArray(holidayInfo)) {
        return holidayInfo.some(holiday => holiday.type === 'public');
    } else if (holidayInfo && holidayInfo.type === 'public') {
        return true;
    }
    
    return false;
};

const PaybackPlanSchema = new mongoose.Schema({
    funding: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funding',
        required: true,
        index: true
    },
    merchant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Merchant',
        required: true,
        index: true
    },
    funder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funder',
        required: true,
        index: true
    },
    lender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lender',
        required: true,
        index: true
    },
    merchant_account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Merchant-Account'
    },
    funder_account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funder-Account'
    },
    payment_method: {
        type: String,
        enum: [...Object.values(PAYMENT_METHOD), null],
        default: null
    },
    ach_processor: {
        type: String,
        enum: ['ACHWorks', 'Actum', 'Manual', 'Other', null],
        default: null
    },
    total_amount: {
        type: Number,
        required: true
    },
    payback_count: {
        type: Number
    },
    start_date: {
        type: Date,
        required: true
    },
    end_date: {
        type: Date
    },
    next_payback_date: {
        type: Date
    },
    created_by_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    updated_by_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    frequency: {
        type: String,
        enum: Object.values(PAYBACK_FREQUENCY)
    },
    payday_list: {
        type: [Number]
    },
    avoid_holiday: {
        type: Boolean,
        default: false
    },
    distribution_priority: {
        type: String,
        enum: Object.values(PAYBACK_DISTRIBUTION_PRIORITY),
        default: PAYBACK_DISTRIBUTION_PRIORITY.FUND
    },
    payback_list: [{
        due_date: {
            type: Date,
            required: true
        },
        amount: {
            type: Number,
            required: true,
            default: 0
        }
    }],
    note: {
        type: String
    },
    status: {
        type: String,
        enum: Object.values(PAYBACK_PLAN_STATUS)
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Helper function to calculate term length for PaybackPlan document
const calculateTermLength = function(paybackPlan) {
    if (!paybackPlan.payback_count || !paybackPlan.frequency) {
        return null;
    }
    const paydayListLength = Array.isArray(paybackPlan.payday_list) ? paybackPlan.payday_list.length : 0;

    if (paybackPlan.frequency === PAYBACK_FREQUENCY.DAILY) {
        return paydayListLength ? paybackPlan.payback_count / paydayListLength / 4 : null;
    } else if (paybackPlan.frequency === PAYBACK_FREQUENCY.WEEKLY) {
        return paybackPlan.payback_count / 4;
    } else if (paybackPlan.frequency === PAYBACK_FREQUENCY.MONTHLY) {
        return paybackPlan.payback_count;
    }
    return null;
};

// Helper function to calculate the scheduled end date for PaybackPlan document
const calculateScheduledEndDate = function(paybackPlan) {
    if (!paybackPlan || !paybackPlan.start_date || !paybackPlan.payback_count || !paybackPlan.frequency || !paybackPlan.payday_list || paybackPlan.payday_list.length === 0) {
        return null;
    }

    return calculateScheduledPaybackDate(paybackPlan, paybackPlan.start_date, paybackPlan.payback_count);
};

// Helper function to calculate the expected end date for PaybackPlan document
const calculateExpectedEndDate = function(paybackPlan) {
    if (!paybackPlan || !paybackPlan.start_date || !paybackPlan.remaining_count || !paybackPlan.frequency || !paybackPlan.payday_list || paybackPlan.payday_list.length === 0) {
        return null;
    }

    return calculateScheduledPaybackDate(paybackPlan, paybackPlan.next_payback_date, paybackPlan.remaining_count);
};

// Helper function to generate the whole list of paybacks (date and amount) for a PaybackPlan document
const generatePaybackList = function(paybackPlan) {
    const paybackList = [];

    if (!paybackPlan || !paybackPlan.start_date || !paybackPlan.total_amount || !paybackPlan.payback_count || !paybackPlan.frequency || !paybackPlan.payday_list || paybackPlan.payday_list.length === 0) {
        return paybackList;
    }
    
    let remainingAmount = paybackPlan.total_amount;
    let remainingCount = paybackPlan.payback_count;
    let nextPaybackAmount = paybackPlan.next_payback_amount || Math.round(remainingAmount / remainingCount);
    if (nextPaybackAmount < 1) nextPaybackAmount = 1; // Next payback amount should be at least 1 cent
    let nextPaybackDate = new Date(new Date(paybackPlan.start_date).toISOString().split('T')[0] + ' 00:00:00'); // Set the time to 00:00:00 to avoid timezone issues
    
    // If the next payback amount is not set or is 0, return the empty list
    if (!nextPaybackAmount) {
        return paybackList;
    }

    while (remainingCount > 0 && remainingAmount > 0) {
        const calculatedNextPaybackDate = calculateNthPaybackDate(paybackPlan, nextPaybackDate, 1);
        paybackList.push({
            date: calculatedNextPaybackDate.toISOString().split('T')[0],
            amount: nextPaybackAmount
        });
        remainingAmount = remainingAmount - nextPaybackAmount;
        remainingCount = remainingCount - 1;
        nextPaybackAmount = Math.round(remainingAmount / remainingCount);
        if (nextPaybackAmount < 1) nextPaybackAmount = 1; // Next payback amount should be at least 1 cent
        nextPaybackDate = new Date(calculatedNextPaybackDate);
        nextPaybackDate.setDate(nextPaybackDate.getDate() + 1);
    }

    paybackList.sort((a, b) => new Date(a.date) - new Date(b.date));

    return paybackList;
};

// Helper function to calculate the nth payback date from the start date
// Use recursion to calculate the next payback date
// Should avoid holidays if avoid_holiday is true
const calculateNthPaybackDate = function(paybackPlan, startDate, n) {
    if (!paybackPlan || !startDate || !n || n <= 0 || !paybackPlan.frequency || !paybackPlan.payday_list || paybackPlan.payday_list.length === 0) {
        return null;
    }
 
    const holidays = new dateHolidays('US');

    let nextPaybackDate = new Date(startDate);

    if (paybackPlan.frequency === PAYBACK_FREQUENCY.DAILY) {
        // If daily, find the next day in payday_list starting from or after startDate
        const startDay = startDate.getDay(); // 0-indexed (0=Sun, 1=Mon, etc.)
        const startDay1Indexed = startDay + 1; // Convert to 1-indexed (1=Sun, 2=Mon, etc.)
        
        // Sort payday_list to ensure proper order
        const sortedPaydays = [...paybackPlan.payday_list].sort((a, b) => a - b);
        
        // Find the next payday: first check if today IS a payday, otherwise find next one
        let nextPayday1Indexed = null;
        
        // Check if current day is in the payday list
        if (sortedPaydays.includes(startDay1Indexed)) {
            nextPayday1Indexed = startDay1Indexed;
        } else {
            // Look for the next day later in the same week
            for (const day of sortedPaydays) {
                if (day > startDay1Indexed) {
                    nextPayday1Indexed = day;
                    break;
                }
            }
        }
        
        // If still not found, wrap to first day of next week
        if (nextPayday1Indexed === null) {
            nextPayday1Indexed = sortedPaydays[0];
        }
        
        // Convert back to 0-indexed
        const nextPaybackDay = nextPayday1Indexed - 1;
        
        // Calculate days to add
        let daysToAdd = nextPaybackDay - startDay;
        if (daysToAdd < 0) {
            daysToAdd += 7; // Move to next week
        }
        
        nextPaybackDate.setDate(nextPaybackDate.getDate() + daysToAdd);
    } else if (paybackPlan.frequency === PAYBACK_FREQUENCY.WEEKLY) {
        // If weekly, based on the payday_list, find the next payday which day is in the first element of the payday_list
        const startDay = startDate.getDay();
        const nextPaybackDay = paybackPlan.payday_list[0] - 1; // -1 because the array is 1-indexed
        nextPaybackDate.setDate(nextPaybackDate.getDate() + (nextPaybackDay - startDay + 7) % 7);
    } else if (paybackPlan.frequency === PAYBACK_FREQUENCY.MONTHLY) {
        // If monthly, based on the payday_list, compare the date in the first element of the payday_list with the start date
        // if the start date is greater or equal to the date in the first element of the payday_list, then the next payback date is the date in the first element of the payday_list
        // otherwise, the next payback date is the date in the first element of the payday_list + 1 month
        const nextPaybackDay = paybackPlan.payday_list[0];
        if (startDate.getDate() > nextPaybackDay)  nextPaybackDate.setMonth(nextPaybackDate.getMonth() + 1);
        // If the next payback day is lager than the last day of the month, then set the last day of the month
        // Otherwise, set the next payback day
        if (nextPaybackDay > new Date(nextPaybackDate.getFullYear(), nextPaybackDate.getMonth() + 1, 0).getDate()) {
            nextPaybackDate.setDate(new Date(nextPaybackDate.getFullYear(), nextPaybackDate.getMonth() + 1, 0).getDate());
        } else {
            nextPaybackDate.setDate(nextPaybackDay);
        }
    }

    // Avoid holidays and weekends if avoid_holiday is true
    if (paybackPlan.avoid_holiday) {
        let holidayInfo = holidays.isHoliday(nextPaybackDate);
        let isHoliday = isPublicHoliday(nextPaybackDate, holidays);
        let dayOfWeek = nextPaybackDate.getDay();
        let isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        // Debug log for holiday detection (only for public holidays)
        if (isHoliday) {
            console.log(`[PUBLIC HOLIDAY DETECTED] ${nextPaybackDate.toISOString().split('T')[0]} - ${JSON.stringify(holidayInfo)}`);
        }
        
        // For DAILY/WEEKLY: check if weekend is in payday_list (day-of-week)
        // For MONTHLY: always skip weekends (payday_list contains day-of-month, not day-of-week)
        let shouldSkipWeekend;
        if (paybackPlan.frequency === PAYBACK_FREQUENCY.MONTHLY) {
            shouldSkipWeekend = isWeekend; // Always skip weekends for MONTHLY
        } else {
            // For DAILY/WEEKLY: only skip weekend if NOT in payday_list
            let dayOfWeek1Indexed = dayOfWeek + 1;
            shouldSkipWeekend = isWeekend && !paybackPlan.payday_list.includes(dayOfWeek1Indexed);
        }
        
        while (isHoliday || shouldSkipWeekend) {
            nextPaybackDate.setDate(nextPaybackDate.getDate() + 1);
            holidayInfo = holidays.isHoliday(nextPaybackDate);
            isHoliday = isPublicHoliday(nextPaybackDate, holidays);
            
            if (isHoliday) {
                console.log(`[PUBLIC HOLIDAY DETECTED] ${nextPaybackDate.toISOString().split('T')[0]} - ${JSON.stringify(holidayInfo)}`);
            }
            
            dayOfWeek = nextPaybackDate.getDay();
            isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            
            if (paybackPlan.frequency === PAYBACK_FREQUENCY.MONTHLY) {
                shouldSkipWeekend = isWeekend;
            } else {
                let dayOfWeek1Indexed = dayOfWeek + 1;
                shouldSkipWeekend = isWeekend && !paybackPlan.payday_list.includes(dayOfWeek1Indexed);
            }
        }
    }

    if (n > 1) {
        const nextStartDate = new Date(nextPaybackDate);
        nextStartDate.setDate(nextStartDate.getDate() + 1);
        return calculateNthPaybackDate(paybackPlan, nextStartDate, n - 1);
    } else {
        return nextPaybackDate;
    }
};

// Helper function to calculate the scheduled nth payback date
const calculateScheduledPaybackDate = function(paybackPlan, nextPaybackDate, n) {
    if (!paybackPlan || !nextPaybackDate || !n || n <= 0 || !paybackPlan.frequency || !paybackPlan.payday_list || paybackPlan.payday_list.length === 0) {
        return null;
    }

    const holidays = new dateHolidays('US');
    
    if (n === 1) {
        if (paybackPlan.avoid_holiday) {
            let holidayInfo = holidays.isHoliday(new Date(nextPaybackDate));
            let isHoliday = isPublicHoliday(new Date(nextPaybackDate), holidays);
            let dayOfWeek = nextPaybackDate.getDay();
            let isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            
            if (isHoliday) {
                console.log(`[PUBLIC HOLIDAY DETECTED - calculateScheduledPaybackDate n=1] ${nextPaybackDate.toISOString().split('T')[0]} - ${JSON.stringify(holidayInfo)}`);
            }
            
            let shouldSkipWeekend;
            if (paybackPlan.frequency === PAYBACK_FREQUENCY.MONTHLY) {
                shouldSkipWeekend = isWeekend;
            } else {
                let dayOfWeek1Indexed = dayOfWeek + 1;
                shouldSkipWeekend = isWeekend && !paybackPlan.payday_list.includes(dayOfWeek1Indexed);
            }
            
            while (isHoliday || shouldSkipWeekend) {
                nextPaybackDate = new Date(nextPaybackDate);
                nextPaybackDate.setDate(nextPaybackDate.getDate() + 1);
                holidayInfo = holidays.isHoliday(new Date(nextPaybackDate));
                isHoliday = isPublicHoliday(new Date(nextPaybackDate), holidays);
                
                if (isHoliday) {
                    console.log(`[PUBLIC HOLIDAY DETECTED - calculateScheduledPaybackDate n=1] ${nextPaybackDate.toISOString().split('T')[0]} - ${JSON.stringify(holidayInfo)}`);
                }
                
                dayOfWeek = nextPaybackDate.getDay();
                isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                
                if (paybackPlan.frequency === PAYBACK_FREQUENCY.MONTHLY) {
                    shouldSkipWeekend = isWeekend;
                } else {
                    let dayOfWeek1Indexed = dayOfWeek + 1;
                    shouldSkipWeekend = isWeekend && !paybackPlan.payday_list.includes(dayOfWeek1Indexed);
                }
            }
        }
        return nextPaybackDate;
    }

    const startDate = new Date(nextPaybackDate);
    const remainingPaybacks = n - 1; // Since we start from start_date

    if (paybackPlan.frequency === PAYBACK_FREQUENCY.DAILY) {
        // Calculate the second payback date index
        const startDay = startDate.getDay();
        let startIndex = paybackPlan.payday_list.findIndex(day => day > startDay);
        if (startIndex === -1) {
            startIndex = 0;
        }

        // Calculate the day of the last payback date from the payday_list, startIndex and remainingPaybacks % daysPerCycle
        const daysPerCycle = paybackPlan.payday_list.length;
        const lastPaybackDay = paybackPlan.payday_list[(startIndex + remainingPaybacks - 1) % daysPerCycle];
        const lastDaysToAdd = (lastPaybackDay - startDay + 7) % 7;
        let lastPaybackDate = new Date(startDate);
        lastPaybackDate.setDate(lastPaybackDate.getDate() + Math.floor(remainingPaybacks / daysPerCycle) * 7 + lastDaysToAdd);
        
        if (paybackPlan.avoid_holiday) {
            let holidayInfo = holidays.isHoliday(new Date(lastPaybackDate));
            let isHoliday = isPublicHoliday(new Date(lastPaybackDate), holidays);
            let dayOfWeek = lastPaybackDate.getDay();
            let dayOfWeek1Indexed = dayOfWeek + 1;
            let isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            let isWeekendNotInList = isWeekend && !paybackPlan.payday_list.includes(dayOfWeek1Indexed);
            
            if (isHoliday) {
                console.log(`[PUBLIC HOLIDAY DETECTED - DAILY] ${lastPaybackDate.toISOString().split('T')[0]} - ${JSON.stringify(holidayInfo)}`);
            }
            
            while (isHoliday || isWeekendNotInList) {
                lastPaybackDate = new Date(lastPaybackDate);
                lastPaybackDate.setDate(lastPaybackDate.getDate() + 1);
                holidayInfo = holidays.isHoliday(new Date(lastPaybackDate));
                isHoliday = isPublicHoliday(new Date(lastPaybackDate), holidays);
                
                if (isHoliday) {
                    console.log(`[PUBLIC HOLIDAY DETECTED - DAILY] ${lastPaybackDate.toISOString().split('T')[0]} - ${JSON.stringify(holidayInfo)}`);
                }
                
                dayOfWeek = lastPaybackDate.getDay();
                dayOfWeek1Indexed = dayOfWeek + 1;
                isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                isWeekendNotInList = isWeekend && !paybackPlan.payday_list.includes(dayOfWeek1Indexed);
            }
        }
        return lastPaybackDate;
    } else if (paybackPlan.frequency === PAYBACK_FREQUENCY.WEEKLY) {
        // Find the weekday from the payday_list, where 1 = Sunday, 2 = Monday, etc.
        // We will convert to 0 = Sunday, 1 = Monday, etc.
        const weekday = paybackPlan.payday_list[0];

        // Find the next occurrence of the weekday after start_date
        // If the weekday is same as day of start_date, then we need to add 7 days
        const currentDay = startDate.getDay();
        let daysToAdd = (weekday - currentDay) % 7;
        if (daysToAdd <= 0) daysToAdd += 7;

        const nextPaybackDate = new Date(startDate);
        nextPaybackDate.setDate(nextPaybackDate.getDate() + daysToAdd);

        // Calculate the end date by adding the number of weeks to the next payback date
        let endDate = new Date(nextPaybackDate);
        endDate.setDate(endDate.getDate() + ((remainingPaybacks - 1) * 7));

        if (paybackPlan.avoid_holiday) {
            let isHoliday = holidays.isHoliday(new Date(endDate));
            let dayOfWeek = endDate.getDay();
            let dayOfWeek1Indexed = dayOfWeek + 1;
            let isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            let isWeekendNotInList = isWeekend && !paybackPlan.payday_list.includes(dayOfWeek1Indexed);
            
            while (isHoliday || isWeekendNotInList) {
                endDate = new Date(endDate);
                endDate.setDate(endDate.getDate() + 1);
                isHoliday = holidays.isHoliday(new Date(endDate));
                dayOfWeek = endDate.getDay();
                dayOfWeek1Indexed = dayOfWeek + 1;
                isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                isWeekendNotInList = isWeekend && !paybackPlan.payday_list.includes(dayOfWeek1Indexed);
            }
        }
        return endDate;
    } else if (paybackPlan.frequency === PAYBACK_FREQUENCY.MONTHLY) {
        // Calculate the next payback date
        const nextPaybackDate = new Date(startDate);
        let endDate = new Date(nextPaybackDate);

        if (paybackPlan.payday_list[0] <= startDate.getDate()) {
            endDate.setMonth(endDate.getMonth() + remainingPaybacks);
        } else {
            endDate.setMonth(endDate.getMonth() + remainingPaybacks - 1);
        }
        endDate.setDate(paybackPlan.payday_list[0]);

        if (paybackPlan.avoid_holiday) {
            let holidayInfo = holidays.isHoliday(new Date(endDate));
            let isHoliday = isPublicHoliday(new Date(endDate), holidays);
            let isWeekend = endDate.getDay() === 0 || endDate.getDay() === 6;
            
            if (isHoliday) {
                console.log(`[PUBLIC HOLIDAY DETECTED - MONTHLY] ${endDate.toISOString().split('T')[0]} - ${JSON.stringify(holidayInfo)}`);
            }
            
            // For MONTHLY frequency, always skip weekends (payday_list contains day-of-month, not day-of-week)
            while (isHoliday || isWeekend) {
                endDate = new Date(endDate);
                endDate.setDate(endDate.getDate() + 1);
                holidayInfo = holidays.isHoliday(new Date(endDate));
                isHoliday = isPublicHoliday(new Date(endDate), holidays);
                
                if (isHoliday) {
                    console.log(`[PUBLIC HOLIDAY DETECTED - MONTHLY] ${endDate.toISOString().split('T')[0]} - ${JSON.stringify(holidayInfo)}`);
                }
                
                isWeekend = endDate.getDay() === 0 || endDate.getDay() === 6;
            }
        }
        return endDate;
    }
    return null;
};

// Add static methods to the schema
PaybackPlanSchema.statics.calculateScheduledPaybackDate = calculateScheduledPaybackDate;
PaybackPlanSchema.statics.calculateNthPaybackDate = calculateNthPaybackDate;
PaybackPlanSchema.statics.generatePaybackList = generatePaybackList;

// Helper function to calculate fully paid and pending scheduled counts in batch
const calculateScheduledPaymentCounts = function(paybackPlanIds, docs, allPaybacks) {
    const results = {};
    
    // Initialize all plans with 0
    for (const planId of paybackPlanIds) {
        results[planId.toString()] = {
            fully_paid_count: 0,
            pending_count: 0
        };
    }
    
    // Filter paybacks to only those with relevant statuses (no DB query needed)
    const allPayments = allPaybacks.filter(p => 
        p.status === PAYBACK_STATUS.SUCCEED || 
        p.status === PAYBACK_STATUS.SUBMITTED || 
        p.status === PAYBACK_STATUS.PROCESSING
    );
    
    // Sort payments by plan and date
    allPayments.sort((a, b) => {
        const planCompare = a.payback_plan.toString().localeCompare(b.payback_plan.toString());
        if (planCompare !== 0) return planCompare;
        
        const dateA = a.processed_date || a.createdAt;
        const dateB = b.processed_date || b.createdAt;
        return new Date(dateA) - new Date(dateB);
    });
    
    // Group payments by plan and status
    const paymentsByPlan = {};
    allPayments.forEach(payment => {
        const planId = payment.payback_plan.toString();
        if (!paymentsByPlan[planId]) {
            paymentsByPlan[planId] = {
                succeeded: [],
                pending: []
            };
        }
        
        if (payment.status === PAYBACK_STATUS.SUCCEED) {
            paymentsByPlan[planId].succeeded.push(payment);
        } else if (payment.status === PAYBACK_STATUS.SUBMITTED || payment.status === PAYBACK_STATUS.PROCESSING) {
            paymentsByPlan[planId].pending.push(payment);
        }
    });
    
    // Create a map of docs by ID for easy lookup
    const docMap = {};
    docs.forEach(doc => {
        docMap[doc._id.toString()] = doc;
    });
    
    // Calculate fully paid and pending count for each plan
    for (const planId of paybackPlanIds) {
        const planIdStr = planId.toString();
        const doc = docMap[planIdStr];
        const payments = paymentsByPlan[planIdStr];
        
        if (!doc || !payments || !doc.payback_list || doc.payback_list.length === 0) {
            continue;
        }
        
        // Early exit optimization: if no payments, skip complex calculation
        if (payments.succeeded.length === 0 && payments.pending.length === 0) {
            results[planIdStr] = {
                fully_paid_count: 0,
                pending_count: 0
            };
            continue;
        }
        
        const paybackList = doc.payback_list;
        
        // Sort schedule items by due date
        const sortedSchedule = [...paybackList].sort((a, b) => 
            new Date(a.due_date) - new Date(b.due_date)
        );
        
        // First, apply succeeded payments to calculate fully paid count
        let fullyPaidCount = 0;
        let paymentIndex = 0;
        let remainingPaymentAmount = 0;
        const succeededPayments = payments.succeeded || [];
        
        for (const scheduleItem of sortedSchedule) {
            let scheduledAmount = scheduleItem.amount;
            let paidAmount = 0;
            
            // Apply succeeded payments to this schedule item
            while (scheduledAmount > 0 && paymentIndex < succeededPayments.length) {
                // Get next payment if needed
                if (remainingPaymentAmount === 0) {
                    const payment = succeededPayments[paymentIndex];
                    remainingPaymentAmount = payment.payback_amount;
                    paymentIndex++;
                }
                
                // Apply payment to schedule item
                const amountToApply = Math.min(scheduledAmount, remainingPaymentAmount);
                paidAmount += amountToApply;
                scheduledAmount -= amountToApply;
                remainingPaymentAmount -= amountToApply;
            }
            
            // Check if fully paid
            if (paidAmount >= scheduleItem.amount) {
                fullyPaidCount++;
            }
        }
        
        // Now calculate how many additional scheduled items would be covered by pending payments
        let pendingCoveredCount = 0;
        const pendingPayments = payments.pending || [];
        
        if (pendingPayments.length > 0) {
            // Start from where succeeded payments left off
            let pendingPaymentIndex = 0;
            let remainingPendingAmount = remainingPaymentAmount; // Carry over any leftover from succeeded
            
            for (let i = fullyPaidCount; i < sortedSchedule.length; i++) {
                const scheduleItem = sortedSchedule[i];
                let scheduledAmount = scheduleItem.amount;
                
                // If there's leftover from succeeded payments, apply it first
                if (remainingPendingAmount > 0) {
                    const amountToApply = Math.min(scheduledAmount, remainingPendingAmount);
                    scheduledAmount -= amountToApply;
                    remainingPendingAmount -= amountToApply;
                }
                
                // Apply pending payments to this schedule item
                while (scheduledAmount > 0 && pendingPaymentIndex < pendingPayments.length) {
                    // Get next payment if needed
                    if (remainingPendingAmount === 0) {
                        const payment = pendingPayments[pendingPaymentIndex];
                        remainingPendingAmount = payment.payback_amount;
                        pendingPaymentIndex++;
                    }
                    
                    // Apply payment to schedule item
                    const amountToApply = Math.min(scheduledAmount, remainingPendingAmount);
                    scheduledAmount -= amountToApply;
                    remainingPendingAmount -= amountToApply;
                }
                
                // Check if fully covered by pending payments
                if (scheduledAmount === 0) {
                    pendingCoveredCount++;
                } else {
                    // If we couldn't fully cover this item, we can't cover any after it
                    break;
                }
            }
        }
        
        results[planIdStr] = {
            fully_paid_count: fullyPaidCount,
            pending_count: pendingCoveredCount
        };
    }
    
    return results;
};

// Helper function to calculate statistics for PaybackPlan documents
const calculateStatistics = async function(docs) {
    if (!docs || docs.length === 0) return;
    
    const Payback = mongoose.model('Payback');
    
    // Get all payback plan IDs
    const paybackPlanIds = docs.map(doc => doc._id);
    
    // Fetch all paybacks for these plans in ONE query (with all needed fields)
    const paybacks = await Payback.find({
        payback_plan: { $in: paybackPlanIds }
    }, 'payback_plan status payback_amount processed_date createdAt').lean();
    
    // Calculate scheduled payment counts using the fetched paybacks (no additional query)
    const scheduledCounts = calculateScheduledPaymentCounts(paybackPlanIds, docs, paybacks);
    
    // Group paybacks by plan ID and calculate statistics
    const statsByPlan = {};

    // Initialize stats for each plan
    for (const planId of paybackPlanIds) {
        statsByPlan[planId] = {
            succeed_count: 0,
            submitted_count: 0,
            processing_count: 0,
            bounced_count: 0,
            failed_count: 0,
            disputed_count: 0,

            submitted_amount: 0,
            processing_amount: 0,
            failed_amount: 0,
            succeed_amount: 0,
            bounced_amount: 0,
            disputed_amount: 0,   
        };
    }

    paybacks.forEach(payback => {
        const planId = payback.payback_plan.toString();
        
        const stats = statsByPlan[planId];
        switch (payback.status) {
        case PAYBACK_STATUS.SUBMITTED:
            stats.submitted_count += 1;
            stats.submitted_amount += payback.payback_amount || 0;
            break;
        case PAYBACK_STATUS.PROCESSING:
            stats.processing_count += 1;
            stats.processing_amount += payback.payback_amount || 0;
            break;
        case PAYBACK_STATUS.FAILED:
            stats.failed_count += 1;
            stats.failed_amount += payback.payback_amount || 0;
            break;
        case PAYBACK_STATUS.SUCCEED:
            stats.succeed_count += 1;
            stats.succeed_amount += payback.payback_amount || 0;
            break;
        case PAYBACK_STATUS.BOUNCED:
            stats.bounced_count += 1;
            stats.bounced_amount += payback.payback_amount || 0;
            break;
        case PAYBACK_STATUS.DISPUTED:
            stats.disputed_count += 1;
            stats.disputed_amount += payback.payback_amount || 0;
            break;
        }
    });
    
    // Add calculated fields to each document
    docs.forEach(doc => {
        const planId = doc._id.toString();
        const stats = statsByPlan[planId];
        const scheduledCount = scheduledCounts[planId] || { fully_paid_count: 0, pending_count: 0 };

        doc.submitted_count = stats.submitted_count;
        doc.processing_count = stats.processing_count;
        doc.failed_count = stats.failed_count;
        doc.succeed_count = stats.succeed_count;
        doc.bounced_count = stats.bounced_count;
        doc.disputed_count = stats.disputed_count;

        doc.submitted_amount = stats.submitted_amount;
        doc.processing_amount = stats.processing_amount;
        doc.failed_amount = stats.failed_amount;
        doc.succeed_amount = stats.succeed_amount;
        doc.bounced_amount = stats.bounced_amount;
        doc.disputed_amount = stats.disputed_amount;

        doc.paid_amount = stats.succeed_amount;
        doc.pending_amount = stats.submitted_amount + stats.processing_amount;
        doc.pending_count = stats.submitted_count + stats.processing_count;
        doc.remaining_balance = (doc.total_amount || 0) - stats.succeed_amount - doc.pending_amount;
        doc.remaining_count = Math.max(0, (doc.payback_count || 0) - scheduledCount.fully_paid_count - scheduledCount.pending_count);
                
        // Calculate success rate only if there are completed paybacks (succeed + bounced + disputed)
        const completedPaybacks = stats.succeed_count + stats.bounced_count + stats.disputed_count;
        doc.succeed_rate = completedPaybacks > 0 ? stats.succeed_count / completedPaybacks : 0;
        
        doc.next_payback_amount = doc.remaining_count > 0 ? doc.remaining_balance / doc.remaining_count : 0;

        // Calculate term length, scheduled end date and expected end date
        doc.term_length = calculateTermLength(doc);
        doc.scheduled_end_date = calculateScheduledEndDate(doc);
        doc.expected_end_date = calculateExpectedEndDate(doc);

        // Set a flag to indicate that statistics have been calculated
        doc._calculatedStatsComplete = true;
    });

    return docs;
};

// Middleware to automatically add statistics to query results
PaybackPlanSchema.post('find', async function(docs) {
    if (this.getOptions()?.calculate) {
        await calculateStatistics(docs);
    }
});

PaybackPlanSchema.post('findOne', async function(doc) {
    if (doc && this.getOptions()?.calculate) {
        await calculateStatistics([doc]);
    }
});

// Helper functions for payback details calculations
const calculateSchedulePaymentStatus = async function(paybackPlanId, scheduleItems) {
    const payments = await Payback.find({
        payback_plan: paybackPlanId,
        status: PAYBACK_STATUS.SUCCEED
    })
    .sort({ processed_date: 1, createdAt: 1 }) // Sort by payment date (earliest first)
    .select('payback_amount processed_date createdAt status due_date')
    .lean();

    // Sort schedule items by due date (ensure chronological order)
    const sortedSchedule = [...scheduleItems].sort((a, b) => 
        new Date(a.due_date) - new Date(b.due_date)
    );

    // Apply payments chronologically to schedule
    const results = [];
    let paymentIndex = 0;
    let remainingPaymentAmount = 0;
    let currentPaymentDate = null;

    for (const scheduleItem of sortedSchedule) {
        let scheduledAmount = scheduleItem.amount; // In cents (stored in DB)
        let paidAmount = 0;
        let paidDate = null;

        // Apply payments to this schedule item
        // Continue if we have remaining amount OR more payments to load
        while (scheduledAmount > 0 && (remainingPaymentAmount > 0 || paymentIndex < payments.length)) {
            // Get next payment if needed
            if (remainingPaymentAmount === 0) {
                const payment = payments[paymentIndex];
                // Both are in cents, no conversion needed
                remainingPaymentAmount = payment.payback_amount;
                currentPaymentDate = payment.processed_date || payment.createdAt;
                paymentIndex++;
            }

            // Apply payment to schedule item
            const amountToApply = Math.min(scheduledAmount, remainingPaymentAmount);
            paidAmount += amountToApply;
            scheduledAmount -= amountToApply;
            remainingPaymentAmount -= amountToApply;

            // Record the payment date (first payment that covered this item)
            if (!paidDate) {
                paidDate = currentPaymentDate;
            }
        }

        // Determine status
        let status;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(scheduleItem.due_date);
        dueDate.setHours(0, 0, 0, 0);

        if (paidAmount >= scheduleItem.amount) {
            status = PAYBACK_PLAN_DETAILS_STATUS.PAID_IN_FULL;
        } else if (paidAmount > 0) {
            status = PAYBACK_PLAN_DETAILS_STATUS.PARTIALLY_PAID;
        } else if (dueDate < today) {
            status = PAYBACK_PLAN_DETAILS_STATUS.NOT_PAID;
        } else {
            status = PAYBACK_PLAN_DETAILS_STATUS.SCHEDULED;
        }

        results.push({
            due_date: scheduleItem.due_date,
            amount: scheduleItem.amount,
            status: status,
            paid_amount: paidAmount,
            paid_date: paidDate,
            _id: scheduleItem._id
        });
    }

    return results;
};


PaybackPlanSchema.methods.getPaybackDetailsWithStatus = async function(syndication = null) {
    if (!this.payback_list || this.payback_list.length === 0) {
        return [];
    }
    
    const scheduleWithStatus = await calculateSchedulePaymentStatus(this._id, this.payback_list);
    
    // If syndication provided, add distribution breakdown
    if (syndication) {
        return scheduleWithStatus.map(item => {
            const distribution = calculatePaybackDistribution(
                item.amount, 
                this.distribution_priority, 
                syndication
            );
            
            return {
                ...item,
                funded_amount: distribution.funded_amount,
                fee_amount: distribution.fee_amount
            };
        });
    }
    
    return scheduleWithStatus;
};

const PaybackPlan = mongoose.model('Payback-Plan', PaybackPlanSchema);

module.exports = PaybackPlan;
