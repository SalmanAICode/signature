const mongoose = require('mongoose');

const Helpers = require('../utils/helpers');
const { SYNDICATION_STATUS, TRANSACTION_TYPES, TRANSACTION_SENDER_TYPES, TRANSACTION_RECEIVER_TYPES, PAYOUT_SCHEDULE_STATUS } = require('../utils/constants');

const SyndicationSchema = new mongoose.Schema({
    funding: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funding',
        required: true,
        index: true
    },
    funder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funder',
        index: true
    },
    lender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lender',
        required: true,
        index: true
    },
    syndicator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Syndicator',
        required: true,
        index: true
    },
    syndication_offer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Syndication-Offer',
        index: true
    },
    participate_percent: {
        type: Number,
        required: true,
        default: 0
    },
    participate_amount: {
        type: Number,
        required: true,
        default: 0
    },
    payback_amount: {
        type: Number,
        required: true,
        default: 0
    },
    fee_list: {
        type: [{
            name: String,
            expense_type: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ExpenseType'
            },
            amount: {
                type: Number,
                required: true,
                default: 0
            },
            upfront: {
                type: Boolean,
                default: false
            },
            syndication: {
                type: Boolean,
                default: true
            }
        }],
        required: true,
        default: []
    },
    credit_list: {
        type: [{
            name: String,
            fee_type: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'FeeType'
            },
            amount: {
                type: Number,
                required: true,
                default: 0
            },
            upfront: {
                type: Boolean,
                default: false
            },
            syndication: {
                type: Boolean,
                default: true
            }
        }],
        required: true,
        default: []
    },
    start_date: {
        type: Date,
        required: true,
        default: Date.now
    },
    end_date: {
        type: Date
    },
    created_by_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updated_by_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        index: true
    },
    status: {
        type: String,
        enum: Object.values(SYNDICATION_STATUS),
        default: SYNDICATION_STATUS.ACTIVE
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});



// Helper function to calculate statistics for Syndication documents
const calculateStatistics = async function(docs) {
    if (!docs || docs.length === 0) return;
    
    // ------------------------------------------------------------------------------------------------
    // Calculate statistics for fundings
    // ------------------------------------------------------------------------------------------------
    const Funding = mongoose.model('Funding');
    
    // Get all funding IDs
    const fundingIds = docs.map(doc => Helpers.extractIdString(doc.funding)).filter(id => id !== null);
    const distinctFundingIds = [...new Set(fundingIds)];

    // Fetch all fundings for these offers in one query with calculated virtual fields
    const fundings = await Funding.find({
        _id: { $in: distinctFundingIds }
    }, '_id funded_amount payback_amount commission_amount', { calculate: true });
    
    // Group fundings by funding ID and calculate statistics
    const statsByFunding = {};

    // Initialize stats for each funding to make sure we have stats for all fundings, even if there are no funding for that funding
    for (const fundingId of distinctFundingIds) {
        statsByFunding[fundingId] = {
            total_funded_amount: 0,
            total_payback_amount: 0,
        };
    }

    // Calculate statistics for each funding
    fundings.forEach(funding => {
        const stats = statsByFunding[Helpers.extractIdString(funding)];

        stats.total_funded_amount = funding.funded_amount || 0;
        stats.total_payback_amount = funding.payback_amount || 0;
    });

    // ------------------------------------------------------------------------------------------------
    // Calculate statistics for payouts
    // ------------------------------------------------------------------------------------------------
    const Payout = mongoose.model('Payout');

    const syndicationIds = docs.map(doc => doc._id);
    
    const payouts = await Payout.find({
        syndication: { $in: syndicationIds }
    }, '_id syndication payout_amount management_amount');
    
    // Group payouts by syndication ID and calculate statistics
    const statsBySyndication = {};
    
    for (const syndicationId of syndicationIds) {
        statsBySyndication[syndicationId] = {
            payout_count: 0,
            payout_amount: 0,
            payout_fee_amount: 0,
            payout_credit_amount: 0,
            redeemed_amount: 0,
            pending_amount: 0
        };
    }

    payouts.forEach(payout => {
        const stats = statsBySyndication[Helpers.extractIdString(payout.syndication)];
        
        stats.payout_count += 1;
        stats.payout_amount += payout.payout_amount || 0;
        stats.payout_fee_amount += payout.fee_amount || 0;
        stats.payout_credit_amount += payout.credit_amount || 0;
        if (payout.pending) {
            stats.pending_amount += (payout.payout_amount || 0) - (payout.fee_amount || 0) + (payout.credit_amount || 0);
        } else {
            stats.redeemed_amount += (payout.payout_amount || 0) - (payout.fee_amount || 0) + (payout.credit_amount || 0);
        }
    });

    // ------------------------------------------------------------------------------------------------
    // Add statistics to each syndication
    // ------------------------------------------------------------------------------------------------
    docs.forEach(doc => {
        const funding = statsByFunding[Helpers.extractIdString(doc.funding)];
        const payout = statsBySyndication[doc._id];
        
        doc.total_funded_amount = funding?.total_funded_amount || 0; // In case the funding is not found, we set the total funded amount to 0
        doc.total_payback_amount = funding?.total_payback_amount || 0; // In case the funding is not found, we set the total payback amount to 0
        
        // Calculate syndicator's share of payback amount based on participation percentage
        doc.payback_amount = funding?.total_payback_amount && doc.participate_percent 
            // ? Math.round(funding.total_payback_amount * doc.participate_percent / 100) 
            ? Math.round(funding.total_payback_amount * doc.participate_percent) 
            : 0;

        doc.total_fee_amount = doc.fee_list ? doc.fee_list.reduce((acc, fee) => acc + fee.amount, 0) : 0;
        doc.total_credit_amount = doc.credit_list ? doc.credit_list.reduce((acc, credit) => acc + credit.amount, 0) : 0;

        doc.upfront_fee_amount = doc.fee_list ? doc.fee_list.filter(fee => fee.upfront === true).reduce((acc, fee) => acc + fee.amount, 0) : 0;
        doc.upfront_credit_amount = doc.credit_list ? doc.credit_list.filter(credit => credit.upfront === true).reduce((acc, credit) => acc + credit.amount, 0) : 0;

        doc.syndicated_fee_amount = doc.fee_list ? doc.fee_list.filter(fee => fee.syndication === true).reduce((acc, fee) => acc + fee.amount, 0) : 0;
        doc.syndicated_credit_amount = doc.credit_list ? doc.credit_list.filter(credit => credit.syndication === true).reduce((acc, credit) => acc + credit.amount, 0) : 0;

        doc.recurring_fee_amount = doc.total_fee_amount - doc.upfront_fee_amount;
        doc.recurring_credit_amount = doc.total_credit_amount - doc.upfront_credit_amount;

        doc.syndicated_amount = doc.participate_amount + doc.upfront_fee_amount - doc.upfront_credit_amount;

        doc.factor_rate = doc.payback_amount > 0 ? doc.payback_amount / doc.participate_amount : 0;
        doc.buy_rate = doc.payback_amount > 0 ? (doc.payback_amount - doc.total_fee_amount + doc.total_credit_amount) / doc.participate_amount : 0;

        doc.payout_count = payout?.payout_count || 0;  // In case the payout is not found, we set the payout count to 0
        doc.payout_amount = payout?.payout_amount || 0; // In case the payout is not found, we set the payout amount to 0
        doc.payout_fee_amount = payout?.payout_fee_amount || 0; // In case the payout is not found, we set the payout fee amount to 0
        doc.payout_credit_amount = payout?.payout_credit_amount || 0; // In case the payout is not found, we set the payout credit amount to 0
        doc.pending_amount = payout?.pending_amount || 0; // In case the payout is not found, we set the pending amount to 0
        doc.redeemed_amount = payout?.redeemed_amount || 0;

        doc.remaining_fee_amount = doc.total_fee_amount - doc.upfront_fee_amount - doc.payout_fee_amount;
        doc.remaining_credit_amount = doc.total_credit_amount - doc.upfront_credit_amount - doc.payout_credit_amount;
        doc.remaining_payback_amount = (doc.payback_amount || 0) - (payout?.payout_amount || 0);
        doc.remaining_balance = doc.remaining_payback_amount - doc.remaining_fee_amount + doc.remaining_credit_amount;

        // Set a flag to indicate that statistics have been calculated
        doc._calculatedStatsComplete = true;
    });

    return docs;
};

// Middleware to automatically add statistics to query results
SyndicationSchema.post('find', async function(docs) {
    if (this.getOptions()?.calculate) {
        await calculateStatistics(docs);
    }
});

SyndicationSchema.post('findOne', async function(doc) {
    if (doc && this.getOptions()?.calculate) {
        await calculateStatistics([doc]);
    }
});

// Helper function to handle syndication creation and transaction generation
async function handleSyndicationCreation(syndication, setTransactionCallback) {
    // Create transaction if it doesn't exist
    if (!syndication.transaction) {
        try {
            // Use dynamic imports to avoid circular dependency
            const TransactionService = require('../services/transactionService');
            const Helpers = require('../utils/helpers');
            
            // Calculate syndicated_amount manually since it's not available in post-save
            const upfront_fee_amount = syndication.fee_list ? 
                syndication.fee_list.filter(fee => fee.upfront === true).reduce((acc, fee) => acc + fee.amount, 0) : 0;
            const upfront_credit_amount = syndication.credit_list ? 
                syndication.credit_list.filter(credit => credit.upfront === true).reduce((acc, credit) => acc + credit.amount, 0) : 0;
            const syndicated_amount = syndication.participate_amount + upfront_fee_amount - upfront_credit_amount;
            
            const transaction = await TransactionService.createTransaction({
                funder: Helpers.extractIdString(syndication.funder),
                sender: Helpers.extractIdString(syndication.syndicator),
                receiver: Helpers.extractIdString(syndication.funder),
                sender_type: TRANSACTION_SENDER_TYPES.SYNDICATOR,
                receiver_type: TRANSACTION_RECEIVER_TYPES.FUNDER,
                sender_account: null, // VIRTUAL transaction as noted in constants
                receiver_account: null, // VIRTUAL transaction as noted in constants
                amount: Helpers.centsToDollars(syndicated_amount),
                transaction_date: syndication.start_date || Date.now(),
                funding: Helpers.extractIdString(syndication.funding),
                type: TRANSACTION_TYPES.SYNDICATION,
                source: syndication._id,
                reconciled: false // Virtual transaction don't need to be reconciled
            });
            
            // Set transaction reference using the callback
            if (setTransactionCallback) {
                setTransactionCallback(Helpers.extractIdString(transaction._id));
            }
        } catch (error) {
            console.error('Error creating transaction in syndication middleware:', error);
        }
    }
}

// Middleware for syndication creation via save operations
SyndicationSchema.post('save', async function() {
    // Create transaction for any syndication that doesn't have one yet
    if (!this.transaction) {
        const self = this;
        console.log('Creating syndication transaction for:', this._id);
        
        await handleSyndicationCreation(this, async (transactionId) => {
            // Update the document with the transaction reference
            await self.constructor.updateOne(
                { _id: self._id },
                { $set: { transaction: transactionId } }
            );
        });
    } else {
        console.log('Syndication already has transaction:', this._id, 'Transaction ID:', this.transaction);
    }
});

// Middleware for syndication creation via create/insertMany operations
SyndicationSchema.post('insertMany', async function(docs) {
    // Handle multiple syndications created at once
    for (const syndication of docs) {
        if (!syndication.transaction) {
            await handleSyndicationCreation(syndication, async (transactionId) => {
                // Update the document with the transaction reference
                await this.model.updateOne(
                    { _id: syndication._id },
                    { $set: { transaction: transactionId } }
                );
            });
        }
    }
});

// Helper function to handle syndication deletion
async function handleSyndicationDeletion(syndication) {
    try {
        // Delete related transaction if it exists
        if (syndication.transaction) {
            // Use dynamic import to avoid circular dependency
            const TransactionService = require('../services/transactionService');
            await TransactionService.hardDeleteTransaction(syndication.transaction);
            console.log(`Deleted transaction ${syndication.transaction} for syndication ${syndication._id}`);
        }
    } catch (error) {
        console.error(`Error deleting transaction for syndication ${syndication._id}:`, error.message);
        // Don't throw error to avoid blocking the syndication deletion
    }
}

// Middleware for deleteOne operations
SyndicationSchema.pre('deleteOne', { document: true, query: false }, async function() {
    await handleSyndicationDeletion(this);
});

// Middleware for findOneAndDelete operations
SyndicationSchema.pre('findOneAndDelete', async function() {
    const syndication = await this.model.findOne(this.getQuery());
    if (syndication) {
        await handleSyndicationDeletion(syndication);
    }
});

// Middleware for deleteMany operations
SyndicationSchema.pre('deleteMany', async function() {
    // Find all syndications that will be deleted
    const syndications = await this.model.find(this.getQuery(), 'transaction');
    
    // Delete related transactions for each syndication
    for (const syndication of syndications) {
        await handleSyndicationDeletion(syndication);
    }
});

// Middleware for findOneAndRemove operations (deprecated but still used)
SyndicationSchema.pre('findOneAndRemove', async function() {
    const syndication = await this.model.findOne(this.getQuery());
    if (syndication) {
        await handleSyndicationDeletion(syndication);
    }
});

// Middleware for remove operations (deprecated but still used)
SyndicationSchema.pre('remove', { document: true, query: false }, async function() {
    await handleSyndicationDeletion(this);
});

/**
 * Calculate scheduled payout list with actual payout status
 * Distributes actual payouts chronologically across scheduled payout items
 * @param {ObjectId} syndicationId - The syndication ID
 * @param {Array} scheduleItems - Array of scheduled payout items
 * @returns {Array} Enriched schedule with actual payout data
 */
const calculateSchedulePayoutStatus = async function(syndicationId, scheduleItems) {
    const Payout = mongoose.model('Payout');
    
    // Get all actual Payouts for this syndication
    const payouts = await Payout.find({
        syndication: syndicationId,
        inactive: { $ne: true }
    })
    .sort({ created_date: 1, createdAt: 1 }) // Sort by creation date (earliest first)
    .select('payout_amount fee_amount credit_amount created_date redeemed_date pending createdAt')
    .lean();
    
    // Sort schedule items by date (chronologically)
    const sortedSchedule = [...scheduleItems].sort((a, b) =>
        new Date(a.scheduled_date) - new Date(b.scheduled_date)
    );
    
    const results = [];
    let payoutIndex = 0;
    let remainingPayoutGross = 0;
    let remainingPayoutFee = 0;
    let remainingPayoutCredit = 0;
    let currentPayoutDate = null;
    let currentRedeemedDate = null;
    let currentPending = true;
    
    for (const scheduleItem of sortedSchedule) {
        let scheduledGross = scheduleItem.expected_gross; // In cents
        let receivedGross = 0;
        let receivedFee = 0;
        let receivedCredit = 0;
        let receivedDate = null;
        let redeemedDate = null;
        let isPending = null;
        
        // Apply actual payouts to this scheduled item
        while (scheduledGross > 0 && (remainingPayoutGross > 0 || payoutIndex < payouts.length)) {
            // Load next payout if needed
            if (remainingPayoutGross === 0 && payoutIndex < payouts.length) {
                const payout = payouts[payoutIndex];
                remainingPayoutGross = payout.payout_amount || 0; // cents
                remainingPayoutFee = payout.fee_amount || 0; // cents
                remainingPayoutCredit = payout.credit_amount || 0; // cents
                currentPayoutDate = payout.created_date || payout.createdAt;
                currentRedeemedDate = payout.redeemed_date;
                currentPending = payout.pending;
                payoutIndex++;
            }
            
            // Apply as much as possible to this scheduled item
            const amountToApply = Math.min(scheduledGross, remainingPayoutGross);
            
            // Calculate proportional fee and credit based on the amount applied
            const feeRatio = remainingPayoutGross > 0 ? amountToApply / remainingPayoutGross : 0;
            const feeToApply = remainingPayoutFee * feeRatio;
            const creditToApply = remainingPayoutCredit * feeRatio;
            
            receivedGross += amountToApply;
            receivedFee += feeToApply;
            receivedCredit += creditToApply;
            scheduledGross -= amountToApply;
            remainingPayoutGross -= amountToApply;
            remainingPayoutFee -= feeToApply;
            remainingPayoutCredit -= creditToApply;
            
            // Set the date and pending status from the first payout applied
            if (!receivedDate) {
                receivedDate = currentPayoutDate;
                redeemedDate = currentRedeemedDate;
                isPending = currentPending;
            }
        }
        
        // Determine payment status
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const scheduledDate = new Date(scheduleItem.scheduled_date);
        scheduledDate.setHours(0, 0, 0, 0);
        
        let status;
        if (receivedGross >= scheduleItem.expected_gross) {
            status = PAYOUT_SCHEDULE_STATUS.FULLY_PAID;
        } else if (receivedGross > 0) {
            status = PAYOUT_SCHEDULE_STATUS.PARTIALLY_PAID;
        } else if (scheduledDate < today) {
            status = PAYOUT_SCHEDULE_STATUS.OVERDUE;
        } else {
            status = PAYOUT_SCHEDULE_STATUS.SCHEDULED;
        }
        
        // Calculate received net amount
        const receivedNet = receivedGross - receivedFee + receivedCredit;
        
        results.push({
            payback_plan_id: scheduleItem.payback_plan_id,
            scheduled_date: scheduleItem.scheduled_date,
            expected_gross: scheduleItem.expected_gross,
            expected_fee: scheduleItem.expected_fee,
            expected_credit: scheduleItem.expected_credit,
            expected_net: scheduleItem.expected_net,
            received_gross: Math.round(receivedGross), // Round to avoid float errors
            received_fee: Math.round(receivedFee),
            received_credit: Math.round(receivedCredit),
            received_net: Math.round(receivedNet),
            received_date: receivedDate,
            status: status,
            pending: isPending,
            redeemed_date: redeemedDate,
            _id: scheduleItem._id
        });
    }
    
    return results;
};

/**
 * Instance method to get payout schedule with actual payout status
 * @returns {Array} Scheduled payouts with actual received amounts
 */
SyndicationSchema.methods.getPayoutScheduleWithStatus = async function() {
    const PaybackPlan = mongoose.model('Payback-Plan');
    
    // Get all payback plans for this funding
    const paybackPlans = await PaybackPlan.find({ 
        funding: this.funding 
    }).select('_id payback_list start_date end_date').lean();
    
    if (!paybackPlans || paybackPlans.length === 0) {
        return [];
    }
    
    // Calculate residual (non-upfront) fees & credits
    const recurringFeeAmount = this.fee_list
        .filter(f => !f.upfront && f.syndication)
        .reduce((sum, f) => sum + (f.amount || 0), 0);
    
    const recurringCreditAmount = this.credit_list
        .filter(c => !c.upfront && c.syndication)
        .reduce((sum, c) => sum + (c.amount || 0), 0);
    
    console.log(`\n📊 Syndication ${this._id}: participate_percent=${this.participate_percent}, recurringFee=${recurringFeeAmount}, recurringCredit=${recurringCreditAmount}`);
    
    // Generate scheduled payouts from payback plan schedules
    const scheduledPayouts = [];
    
    for (const plan of paybackPlans) {
        if (!plan.payback_list || plan.payback_list.length === 0) continue;
        
        const totalScheduledItems = plan.payback_list.length;
        const feePerItem = totalScheduledItems > 0 ? recurringFeeAmount / totalScheduledItems : 0;
        const creditPerItem = totalScheduledItems > 0 ? recurringCreditAmount / totalScheduledItems : 0;
        
        for (const item of plan.payback_list) {
            // Calculate expected payout for this schedule item
            // payback_list amounts are in cents, multiply by participate_percent
            const expectedGross = item.amount * this.participate_percent; // cents
            const expectedFee = feePerItem * this.participate_percent;
            const expectedCredit = creditPerItem * this.participate_percent;
            const expectedNet = expectedGross - expectedFee + expectedCredit;
            
            scheduledPayouts.push({
                payback_plan_id: plan._id,
                scheduled_date: item.due_date,
                expected_gross: Math.round(expectedGross), // Round to avoid float errors
                expected_fee: Math.round(expectedFee),
                expected_credit: Math.round(expectedCredit),
                expected_net: Math.round(expectedNet),
                _id: item._id
            });
        }
    }
    
    // Sort by date (chronologically)
    scheduledPayouts.sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
    
    console.log(`📋 Generated ${scheduledPayouts.length} scheduled payout items`);
    
    // Calculate status by distributing actual payouts
    return await calculateSchedulePayoutStatus(this._id, scheduledPayouts);
};

const Syndication = mongoose.model('Syndication', SyndicationSchema);

module.exports = Syndication;
