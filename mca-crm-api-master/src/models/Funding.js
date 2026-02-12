const mongoose = require('mongoose');

const FundingFee = require('./FundingFee');
const FundingExpense = require('./FundingExpense');
const FundingCredit = require('./FundingCredit');
const DisbursementIntent = require('./DisbursementIntent');
const CommissionIntent = require('./CommissionIntent');
const SyndicationOffer = require('./SyndicationOffer');
const Syndication = require('./Syndication');
const Payout = require('./Payout');
const Payback = require('./Payback');

const { FUNDING_TYPES, PAYBACK_PLAN_STATUS, INTENT_STATUS, SYNDICATION_OFFER_STATUS, SYNDICATION_STATUS, PAYBACK_STATUS } = require('../utils/constants');

const FundingSchema = new mongoose.Schema({
    funder: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Funder',
            required: true,
            index: true
        },
        name: { type: String, index: true },
        email: { type: String, index: true },
        phone: { type: String, index: true }
    },
    lender: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lender',
            index: true
        },
        name: { type: String, index: true },
        email: { type: String, index: true },
        phone: { type: String, index: true }
    },
    merchant: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Merchant',
            required: true,
            index: true
        },
        name: { type: String, index: true },
        email: { type: String, index: true },
        phone: { type: String, index: true }
    },
    iso_list: [
        {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ISO',
                index: true
            },
            name: { type: String, index: true },
            email: { type: String, index: true },
            phone: { type: String, index: true }
        }
    ],
    syndicator_list: [
        {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Syndicator',
                index: true
            },
            name: { type: String, index: true },
            email: { type: String, index: true },
            phone: { type: String, index: true },
            _id: false
        }
    ],
    application: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application',
        index: true
    },
    application_offer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application-Offer',
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    identifier: {
        type: String,
        trim: true,
        index: true
    },
    type: {
        type: String,
        enum: Object.values(FUNDING_TYPES),
        default: FUNDING_TYPES.NEW
    },
    funded_amount: {
        type: Number,
        required: true,
        default: 0
    },
    payback_amount: {
        type: Number,
        required: true,
        default: 0
    },
    assigned_manager: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true
        },
        first_name: { type: String, index: true },
        last_name: { type: String, index: true },
        email: { type: String, index: true },
        phone_mobile: { type: String, index: true }
    },
    assigned_user: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true
        },
        first_name: { type: String, index: true },
        last_name: { type: String, index: true },
        email: { type: String, index: true },
        phone_mobile: { type: String, index: true }
    },
    follower_list: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    created_by_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updated_by_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Funding-Status',
            index: true
        },
        name: { type: String, index: true },
        bgcolor: { type: String, index: true },
        initial: { type: Boolean, index: true },
        funded: { type: Boolean, index: true },
        performing: { type: Boolean, index: true },
        warning: { type: Boolean, index: true },
        closed: { type: Boolean, index: true },
        defaulted: { type: Boolean, index: true }
    },
    internal: {
        type: Boolean,
        default: false
    },
    position: {
        type: Number
    },
    inactive: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const across_collections = [
    { collection: 'Participation', field: 'funding'},
    // Add other collections that store funding data in this format
];

// Reusable function to synchronize funding information across collections
FundingSchema.statics.syncFundingInfo = async function(ids, data = {}) {
    if (!ids) return { success: false, error: 'Missing required ids parameter' };
    
    try {
        let query = {};
        let updateData = {};
        
        // Handle different types of ids input
        if (Array.isArray(ids)) {
            // Array of funding ids
            query = { $in: ids };
            updateData = data;
        } else if (typeof ids === 'object' && ids._id) {
            // Single funding object
            query = ids._id;
            if (!data || Object.keys(data).length === 0) {
                updateData = { 
                    name: ids.name, 
                    identifier: ids.identifier,
                    funded_amount: ids.funded_amount,
                    payback_amount: ids.payback_amount
                };
            } else {
                updateData = data;
            }
        } else {
            // Single funding ID
            query = ids;
            updateData = data;
        }

        if (!updateData || Object.keys(updateData).length === 0) {
            return { success: false, error: 'Missing required data parameter' };
        }
                
        const results = {
            success: true,
            collections: {}
        };

        // Update across collections
        for (const { collection, field } of across_collections) {
            const Model = mongoose.model(collection);

            // Create update object with funding.fieldname format
            const updateObject = {};
            for (const [key, value] of Object.entries(data)) {
                updateObject[`${field}.${key}`] = value;
            }

            const result = await Model.updateMany(
                { [`${field}.id`]: query },
                { $set: updateObject }
            );

            results.collections[collection] = {
                updatedCount: result.nModified || 0,
                matchedCount: result.n || 0
            };
        }
            
        return results;
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Middleware to update redundant data in related collections
FundingSchema.pre('save', async function(next) {
    // Only run this middleware if certain fields were modified
    const updateData = {};
    if (this.isModified('name')) updateData.name = this.name;
    if (this.isModified('identifier')) updateData.identifier = this.identifier;
    if (this.isModified('funded_amount')) updateData.funded_amount = this.funded_amount;
    if (this.isModified('payback_amount')) updateData.payback_amount = this.payback_amount;

    if (Object.keys(updateData).length > 0) {
        try {
            await this.constructor.syncFundingInfo(this._id, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for direct updateOne operations
FundingSchema.pre('updateOne', { document: false, query: true }, async function(next) {
    const update = this.getUpdate();
    const updateData = {};
    
    // Check for fields that need syncing in both direct and $set updates
    if (update.name || (update.$set && update.$set.name)) {
        updateData.name = update.name || update.$set.name;
    }
    
    if (update.identifier || (update.$set && update.$set.identifier)) {
        updateData.identifier = update.identifier || update.$set.identifier;
    }

    if (update.funded_amount || (update.$set && update.$set.funded_amount)) {
        updateData.funded_amount = update.funded_amount || update.$set.funded_amount;
    }

    if (update.payback_amount || (update.$set && update.$set.payback_amount)) {
        updateData.payback_amount = update.payback_amount || update.$set.payback_amount;
    }
    
    if (Object.keys(updateData).length > 0) {
        const fundingId = this.getQuery()._id;
        try {
            await mongoose.model('Funding').syncFundingInfo(fundingId, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for direct findOneAndUpdate operations
FundingSchema.pre('findOneAndUpdate', { document: false, query: true }, async function(next) {
    const update = this.getUpdate();
    const updateData = {};
    
    // Check for fields that need syncing in both direct and $set updates
    if (update.name || (update.$set && update.$set.name)) {
        updateData.name = update.name || update.$set.name;
    }
    
    if (update.identifier || (update.$set && update.$set.identifier)) {
        updateData.identifier = update.identifier || update.$set.identifier;
    }

    if (update.funded_amount || (update.$set && update.$set.funded_amount)) {
        updateData.funded_amount = update.funded_amount || update.$set.funded_amount;
    }

    if (update.payback_amount || (update.$set && update.$set.payback_amount)) {
        updateData.payback_amount = update.payback_amount || update.$set.payback_amount;
    }
    
    if (Object.keys(updateData).length > 0) {
        const fundingId = this.getQuery()._id;
        try {
            await mongoose.model('Funding').syncFundingInfo(fundingId, updateData);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware for updateMany operations - requires special handling
FundingSchema.pre('updateMany', { document: false, query: true }, async function(next) {
    const update = this.getUpdate();
    const updateData = {};
    
    // Check for fields that need syncing in both direct and $set updates
    if (update.name || (update.$set && update.$set.name)) {
        updateData.name = update.name || update.$set.name;
    }
    
    if (update.identifier || (update.$set && update.$set.identifier)) {
        updateData.identifier = update.identifier || update.$set.identifier;
    }

    if (update.funded_amount || (update.$set && update.$set.funded_amount)) {
        updateData.funded_amount = update.funded_amount || update.$set.funded_amount;
    }

    if (update.payback_amount || (update.$set && update.$set.payback_amount)) {
        updateData.payback_amount = update.payback_amount || update.$set.payback_amount;
    }
    
    if (Object.keys(updateData).length > 0) {
        const fundingQuery = this.getQuery();
        try {
            // First find all fundings that match the query
            const Funding = mongoose.model('Funding');
            const fundings = await Funding.find(fundingQuery, '_id');
            const fundingIds = fundings.map(funding => funding._id);
            
            if (fundingIds.length > 0) {
                await Funding.syncFundingInfo(fundingIds, updateData);
            }
            
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});


/**
 * Helper function to calculate statistics for Funding documents
 * @param {Array} docs - The array of Funding documents to calculate statistics for
 * @returns {Array} The array of Funding documents with statistics
 */
const calculateStatistics = async function(docs) {
    if (!docs || docs.length === 0) return;
    
    // Get all funding IDs
    const fundingIds = docs.map(doc => doc._id);
    
    // Initialize stats for each funding to make sure we have stats for all fundings, even if there are no paybacks for that funding
    const statsByFunding = {};
    for (const fundingId of fundingIds) {
        statsByFunding[fundingId] = {
            upfront_fee_amount: 0,
            residual_fee_amount: 0,
            total_fee_amount: 0,

            upfront_fee_count: 0,
            residual_fee_count: 0,
            total_fee_count: 0,

            commission_amount: 0,
            commission_count: 0,
            total_expense_amount: 0,
            total_expense_count: 0,

            credit_amount: 0,
            credit_count: 0,

            disbursement_intent_count: 0,
            disbursement_succeed_count: 0,
            
            disbursement_scheduled_amount: 0,
            disbursement_paid_amount: 0,

            commission_intent_count: 0,
            commission_succeed_count: 0,
            
            commission_scheduled_amount: 0,
            commission_paid_amount: 0,

            payback_plan_count: 0,
            payback_submitted_count: 0,
            payback_processing_count: 0,
            payback_failed_count: 0,
            payback_succeed_count: 0,
            payback_bounced_count: 0,
            payback_disputed_count: 0,
            payback_remaining_count: 0,

            payback_plan_amount: 0,
            payback_submitted_amount: 0,
            payback_processing_amount: 0,
            payback_failed_amount: 0,
            payback_bounced_amount: 0,
            payback_succeed_amount: 0,
            payback_disputed_amount: 0,

            syndication_offer_count: 0,
            pending_syndication_offer_count: 0,
            accepted_syndication_offer_count: 0,
            declined_syndication_offer_count: 0,
            cancelled_syndication_offer_count: 0,
            expired_syndication_offer_count: 0,

            syndication_offer_amount: 0,
            pending_syndication_offer_amount: 0,
            accepted_syndication_offer_amount: 0,
            declined_syndication_offer_amount: 0,
            cancelled_syndication_offer_amount: 0,
            expired_syndication_offer_amount: 0,

            syndication_count: 0,
            active_syndication_count: 0,
            syndication_amount: 0,
            
            payout_amount: 0,
            management_amount: 0,

            paid_payback_funded_amount : 0,
            pending_payback_funded_amount : 0,
            paid_payback_fee_amount : 0,
            pending_payback_fee_amount : 0
        };
    }

    // ------------------------------------------------------------------------------------------------
    // Calculate statistics for fees
    // ------------------------------------------------------------------------------------------------
    // Fetch all fees for these fundings in one query
    const fees = await FundingFee.find({
        funding: { $in: fundingIds },
        inactive: { $ne: true }
    });

    // Group fees by funding ID and calculate statistics
    fees.forEach(fee => {
        const fundingId = fee.funding.toString();
        const stats = statsByFunding[fundingId];
        stats.total_fee_amount += fee.amount || 0;
        stats.total_fee_count += 1;

        if (fee.upfront) {
            stats.upfront_fee_amount += fee.amount || 0;
            stats.upfront_fee_count += 1;
        } else {
            stats.residual_fee_amount += fee.amount || 0;
            stats.residual_fee_count += 1;
        }
    });

    // ------------------------------------------------------------------------------------------------
    // Calculate statistics for expenses
    // ------------------------------------------------------------------------------------------------
    // Fetch all expenses for these fundings in one query
    const expenses = await FundingExpense.find({
        funding: { $in: fundingIds },
        inactive: { $ne: true }
    });

    // Group expenses by funding ID and calculate statistics
    expenses.forEach(expense => {
        const fundingId = expense.funding.toString();
        const stats = statsByFunding[fundingId];
        stats.total_expense_amount += expense.amount || 0;
        stats.total_expense_count += 1;

        if (expense.commission) {
            stats.commission_amount += expense.amount || 0;
            stats.commission_count += 1;
        }
    });

    // ------------------------------------------------------------------------------------------------
    // Calculate statistics for credits
    // ------------------------------------------------------------------------------------------------
    // Fetch all credits for these fundings in one query
    const credits = await FundingCredit.find({
        funding: { $in: fundingIds },
        inactive: { $ne: true }
    });

    // Group credits by funding ID and calculate statistics
    credits.forEach(credit => {
        const fundingId = credit.funding.toString();
        const stats = statsByFunding[fundingId];
        stats.credit_amount += credit.amount || 0;
        stats.credit_count += 1;
    });
    
    // ------------------------------------------------------------------------------------------------
    // Calculate statistics for disbursement intents
    // ------------------------------------------------------------------------------------------------
    // Fetch all disbursements for these fundings in one query
    const disbursementIntents = await DisbursementIntent.find({
        funding: { $in: fundingIds }
    }, null, { calculateStats: true });

    // Group disbursement intents by funding ID and calculate statistics
    disbursementIntents.forEach(disbursementIntent => {
        const fundingId = disbursementIntent.funding.toString();
        const stats = statsByFunding[fundingId];
        

        switch (disbursementIntent.status) {
        case INTENT_STATUS.SUCCEED:
            stats.disbursement_intent_count += 1;
            stats.disbursement_succeed_count += 1;
            stats.disbursement_paid_amount += disbursementIntent.amount;
            break;
        case INTENT_STATUS.SCHEDULED:
        case INTENT_STATUS.SUBMITTED:
        case INTENT_STATUS.FAILED:
            stats.disbursement_intent_count += 1;
            stats.disbursement_scheduled_amount += disbursementIntent.amount;
            break;
        case INTENT_STATUS.CANCELLED:
            // CANCELLED status should not be counted in any amount
            break;
        }
    });

    
    // ------------------------------------------------------------------------------------------------
    // Calculate statistics for commission intents
    // ------------------------------------------------------------------------------------------------
    // Fetch all commissions for these fundings in one query
    const commissionIntents = await CommissionIntent.find({
        funding: { $in: fundingIds }
    }, null, { calculateStats: true });

    // Group commission intents by funding ID and calculate statistics
    commissionIntents.forEach(commissionIntent => {
        const fundingId = commissionIntent.funding.toString();
        const stats = statsByFunding[fundingId];
        

        switch (commissionIntent.status) {
        case INTENT_STATUS.SUCCEED:
            stats.commission_intent_count += 1;
            stats.commission_succeed_count += 1;
            stats.commission_paid_amount += commissionIntent.amount;
            break;
        case INTENT_STATUS.SCHEDULED:
        case INTENT_STATUS.SUBMITTED:
        case INTENT_STATUS.FAILED:
            stats.commission_intent_count += 1;
            stats.commission_scheduled_amount += commissionIntent.amount;
            break;
        case INTENT_STATUS.CANCELLED:
            // CANCELLED status should not be counted in any amount
            break;
        }
    });


    // ------------------------------------------------------------------------------------------------
    // Calculate statistics for payback-plans
    // ------------------------------------------------------------------------------------------------
    const PaybackPlan = mongoose.model('Payback-Plan');
    
    // Fetch all payback plans for these fundings in one query
    const paybackPlans = await PaybackPlan.find({
        funding: { $in: fundingIds }
    }, null, { calculate: true });
    
    // Group payback plans by funding ID and calculate statistics
    paybackPlans.forEach(paybackPlan => {
        const fundingId = paybackPlan.funding.toString();
        
        const stats = statsByFunding[fundingId];

        stats.payback_plan_count += 1;
        stats.payback_submitted_count += paybackPlan.submitted_count || 0;
        stats.payback_processing_count += paybackPlan.processing_count || 0;
        stats.payback_failed_count += paybackPlan.failed_count || 0;
        stats.payback_succeed_count += paybackPlan.succeed_count || 0;
        stats.payback_bounced_count += paybackPlan.bounced_count || 0;
        stats.payback_disputed_count += paybackPlan.disputed_count || 0;
        stats.payback_remaining_count += paybackPlan.payback_count || 0;
        
        if (paybackPlan.status === PAYBACK_PLAN_STATUS.ACTIVE) {
            stats.payback_plan_amount += paybackPlan.total_amount || 0;
        } else {
            stats.payback_plan_amount += (paybackPlan.succeed_amount || 0) + (paybackPlan.submitted_amount || 0) + (paybackPlan.processing_amount || 0);
        }
        stats.payback_submitted_amount += paybackPlan.submitted_amount || 0;
        stats.payback_processing_amount += paybackPlan.processing_amount || 0;
        stats.payback_failed_amount += paybackPlan.failed_amount || 0;
        stats.payback_succeed_amount += paybackPlan.succeed_amount || 0;
        stats.payback_bounced_amount += paybackPlan.bounced_amount || 0;
        stats.payback_disputed_amount += paybackPlan.disputed_amount || 0;
    });

    
    // ------------------------------------------------------------------------------------------------
    // Calculate statistics for syndication offers
    // ------------------------------------------------------------------------------------------------
    // Fetch all syndication offers for these fundings in one query
    const syndicationOffers = await SyndicationOffer.find({
        funding: { $in: fundingIds }
    }, null, { calculateStats: true });

    // Group syndication offers by funding ID and calculate statistics
    syndicationOffers.forEach(syndicationOffer => {
        const fundingId = syndicationOffer.funding.toString();
        const stats = statsByFunding[fundingId];
        
        stats.syndication_offer_count += 1;
        stats.syndication_offer_amount += syndicationOffer.participate_amount;

        switch (syndicationOffer.status) {
        case SYNDICATION_OFFER_STATUS.SUBMITTED:
            stats.pending_syndication_offer_count += 1;
            stats.pending_syndication_offer_amount += syndicationOffer.participate_amount;
            break;
        case SYNDICATION_OFFER_STATUS.ACCEPTED:
            stats.accepted_syndication_offer_count += 1;
            stats.accepted_syndication_offer_amount += syndicationOffer.participate_amount;
            break;
        case SYNDICATION_OFFER_STATUS.DECLINED:
            stats.declined_syndication_offer_count += 1;
            stats.declined_syndication_offer_amount += syndicationOffer.participate_amount;
            break;
        case SYNDICATION_OFFER_STATUS.CANCELLED:
            stats.cancelled_syndication_offer_count += 1;
            stats.cancelled_syndication_offer_amount += syndicationOffer.participate_amount;
            break;
        case SYNDICATION_OFFER_STATUS.EXPIRED:
            stats.expired_syndication_offer_count += 1;
            stats.expired_syndication_offer_amount += syndicationOffer.participate_amount;
            break;
        }
    });

    // ------------------------------------------------------------------------------------------------
    // Calculate statistics for syndications
    // ------------------------------------------------------------------------------------------------
    // Fetch all syndications for these fundings in one query
    const syndications = await Syndication.find({
        funding: { $in: fundingIds }
    });

    // Group syndications by funding ID and calculate statistics
    syndications.forEach(syndication => {
        const fundingId = syndication.funding.toString();
        const stats = statsByFunding[fundingId];
        
        stats.syndication_count += 1;
        stats.syndication_amount += syndication.participate_amount || 0;
        
        switch (syndication.status) {
        case SYNDICATION_STATUS.ACTIVE:
            //TODO: Should we count active syndications?
            // stats.active_syndication_count += 1;
            // stats.active_syndication_amount += syndication.participate_amount || 0;
            break;
        case SYNDICATION_STATUS.CLOSED:
            break;
        }
    });

    
    // ------------------------------------------------------------------------------------------------
    // Calculate statistics for succeed paybacks, this is for paid_funded_amount and paid_fee_amount
    // ------------------------------------------------------------------------------------------------
    // Fetch all paybacks for these fundings in one query
    const paybacks = await Payback.find({
        funding: { $in: fundingIds },
        status: { $in: [PAYBACK_STATUS.SUCCEED, PAYBACK_STATUS.SUBMITTED, PAYBACK_STATUS.PROCESSING] }
    }, 'funding status payback_amount funded_amount fee_amount');

    // Group paybacks by funding ID and calculate statistics
    paybacks.forEach(payback => {
        const fundingId = payback.funding.toString();
        const stats = statsByFunding[fundingId];

        switch (payback.status) {
        case PAYBACK_STATUS.SUCCEED:
            stats.paid_payback_funded_amount += payback.funded_amount || 0;
            stats.paid_payback_fee_amount += payback.fee_amount || 0;
            break;
        case PAYBACK_STATUS.SUBMITTED:
        case PAYBACK_STATUS.PROCESSING:
            stats.pending_payback_funded_amount += payback.funded_amount || 0;
            stats.pending_payback_fee_amount += payback.fee_amount || 0;
        }
    });

    // ------------------------------------------------------------------------------------------------
    // Calculate statistics for payouts
    // ------------------------------------------------------------------------------------------------
    // Fetch all payouts for these fundings in one query
    const payouts = await Payout.find({
        funding: { $in: fundingIds },
        inactive: { $ne: true }
    });

    // Group payouts by funding ID and calculate statistics
    payouts.forEach(payout => {
        const fundingId = payout.funding.toString();
        const stats = statsByFunding[fundingId];
        
        stats.payout_amount += payout.payout_amount || 0;
        stats.management_amount += payout.management_amount || 0;
    });

    // ------------------------------------------------------------------------------------------------
    // Calculate Funding Virtual Fields
    // ------------------------------------------------------------------------------------------------
    docs.forEach(doc => {
        doc.factor_rate = doc.payback_amount / doc.funded_amount;
    });

    // Add calculated fields to each document
    docs.forEach(doc => {
        const fundingId = doc._id.toString();
        const stats = statsByFunding[fundingId];

        doc.upfront_fee_amount = stats.upfront_fee_amount;
        doc.residual_fee_amount = stats.residual_fee_amount;
        doc.total_fee_amount = stats.total_fee_amount;

        doc.upfront_fee_count = stats.upfront_fee_count;
        doc.residual_fee_count = stats.residual_fee_count;
        doc.total_fee_count = stats.total_fee_count;

        doc.commission_amount = stats.commission_amount;
        doc.commission_count = stats.commission_count;
        doc.total_expense_amount = stats.total_expense_amount;
        doc.total_expense_count = stats.total_expense_count;

        doc.credit_amount = stats.credit_amount;
        doc.credit_count = stats.credit_count;

        doc.disbursement_intent_count = stats.disbursement_intent_count;
        doc.disbursement_succeed_count = stats.disbursement_succeed_count;

        doc.disbursement_scheduled_amount = stats.disbursement_scheduled_amount;
        doc.disbursement_paid_amount = stats.disbursement_paid_amount;

        doc.commission_intent_count = stats.commission_intent_count;
        doc.commission_succeed_count = stats.commission_succeed_count;

        doc.commission_scheduled_amount = stats.commission_scheduled_amount;
        doc.commission_paid_amount = stats.commission_paid_amount;

        doc.payback_plan_count = stats.payback_plan_count;
        doc.payback_submitted_count = stats.payback_submitted_count;
        doc.payback_processing_count = stats.payback_processing_count;
        doc.payback_failed_count = stats.payback_failed_count;
        doc.payback_succeed_count = stats.payback_succeed_count;
        doc.payback_bounced_count = stats.payback_bounced_count;
        doc.payback_disputed_count = stats.payback_disputed_count;
        doc.payback_remaining_count = stats.payback_remaining_count;

        doc.payback_plan_amount = stats.payback_plan_amount;
        doc.payback_submitted_amount = stats.payback_submitted_amount;
        doc.payback_processing_amount = stats.payback_processing_amount;
        doc.payback_failed_amount = stats.payback_failed_amount;
        doc.payback_succeed_amount = stats.payback_succeed_amount;
        doc.payback_bounced_amount = stats.payback_bounced_amount;
        doc.payback_disputed_amount = stats.payback_disputed_amount;

        doc.syndication_offer_count = stats.syndication_offer_count;
        doc.pending_syndication_offer_count = stats.pending_syndication_offer_count;
        doc.accepted_syndication_offer_count = stats.accepted_syndication_offer_count;
        doc.declined_syndication_offer_count = stats.declined_syndication_offer_count;
        doc.cancelled_syndication_offer_count = stats.cancelled_syndication_offer_count;
        doc.expired_syndication_offer_count = stats.expired_syndication_offer_count;

        doc.syndication_offer_amount = stats.syndication_offer_amount;
        doc.pending_syndication_offer_amount = stats.pending_syndication_offer_amount;
        doc.accepted_syndication_offer_amount = stats.accepted_syndication_offer_amount;
        doc.declined_syndication_offer_amount = stats.declined_syndication_offer_amount;
        doc.cancelled_syndication_offer_amount = stats.cancelled_syndication_offer_amount;
        doc.expired_syndication_offer_amount = stats.expired_syndication_offer_amount;

        doc.paid_payback_funded_amount = stats.paid_payback_funded_amount;
        doc.pending_payback_funded_amount = stats.pending_payback_funded_amount;
        doc.paid_payback_fee_amount = stats.paid_payback_fee_amount;
        doc.pending_payback_fee_amount = stats.pending_payback_fee_amount;

        doc.paid_amount = stats.payback_succeed_amount;
        doc.pending_amount = stats.payback_submitted_amount + stats.payback_processing_amount;
        doc.pending_count = stats.payback_submitted_count + stats.payback_processing_count;
        
        doc.unscheduled_amount = (doc.disbursement_paid_amount + doc.upfront_fee_amount) * doc.factor_rate + doc.residual_fee_amount - doc.credit_amount - doc.payback_plan_amount;
        doc.remaining_balance = (doc.disbursement_paid_amount + doc.upfront_fee_amount) * doc.factor_rate + doc.residual_fee_amount - doc.credit_amount - doc.paid_amount - doc.pending_amount;

        doc.remaining_payback_amount = (doc.disbursement_paid_amount * doc.factor_rate) - doc.paid_payback_funded_amount - doc.pending_payback_funded_amount;
        doc.remaining_fee_amount = doc.residual_fee_amount - doc.paid_payback_fee_amount - doc.pending_payback_fee_amount;

        doc.syndication_count = stats.syndication_count;
        doc.active_syndication_count = stats.active_syndication_count;

        doc.syndication_amount = stats.syndication_amount;
        doc.syndication_percent = doc.funded_amount > 0 ? stats.syndication_amount / doc.funded_amount : 0;

        doc.payout_amount = stats.payout_amount;
        doc.management_amount = stats.management_amount;
        
        // Calculate success rate only if there are completed paybacks (succeed + bounced + disputed)
        const completedPaybacks = doc.payback_succeed_count + doc.payback_bounced_count + doc.payback_disputed_count;
        doc.succeed_rate = completedPaybacks > 0 ? doc.payback_succeed_count / completedPaybacks : 0;    
        
        // Calculate buy rate, this needs commission_amount to be calculated first
        doc.net_amount = doc.funded_amount - doc.upfront_fee_amount;
        doc.buy_rate = (doc.payback_amount - doc.commission_amount) / doc.funded_amount;
        
        // Calculate disbursement related amounts after net_amount is available
        doc.disbursement_unscheduled_amount = doc.net_amount - doc.disbursement_scheduled_amount;
        doc.disbursement_remaining_amount = doc.net_amount - doc.disbursement_paid_amount;
        
        // Calculate commission related amounts after net_amount is available
        doc.commission_unscheduled_amount = doc.net_amount - doc.commission_scheduled_amount;
        doc.commission_remaining_amount = doc.net_amount - doc.commission_paid_amount;
        
        // Calculate current profit amount: paid_amount - disbursed_amount - total_expense_amount + commission_amount - commission_paid_amount
        doc.current_profit_amount = doc.paid_amount - doc.disbursement_paid_amount - doc.total_expense_amount + doc.commission_amount - doc.commission_paid_amount;
        
        // Calculate expected profit amount: payback_amount + total_fee_amount - funded_amount - total_expense_amount - credit_amount
        doc.expected_profit_amount = doc.payback_amount + doc.total_fee_amount - doc.funded_amount - doc.total_expense_amount - doc.credit_amount;
        
        // Set a flag to indicate that statistics have been calculated
        doc._calculatedStatsComplete = true;
    });

    return docs;
};

// Middleware to automatically add statistics to query results
FundingSchema.post('find', async function(docs) {
    if (this.getOptions()?.calculate) {
        await calculateStatistics(docs);
    }
});

FundingSchema.post('findOne', async function(doc) {
    if (doc && this.getOptions()?.calculate) {
        await calculateStatistics([doc]);
    }
});

// Create compound unique index for id and funder
FundingSchema.index(
    { identifier: 1, 'funder.id': 1 }, 
    { 
        unique: true, 
        partialFilterExpression: { identifier: { $exists: true } }
    }
);

/**
 * Convert funding to proper object structure for embedding in other documents
 * @param {Object|string} funding - Funding object or ID
 * @returns {Promise<Object|undefined>} - Converted funding object or undefined
 */
FundingSchema.statics.convertToEmbeddedFormat = async function(funding) {
    const Helpers = require('../utils/helpers');
    const fundingId = Helpers.extractIdString(funding);
    if (fundingId) {
        try {
            const fundingDoc = await this.findById(fundingId);
            if (fundingDoc) {
                return {
                    id: fundingDoc._id,
                    name: fundingDoc.name,
                    identifier: fundingDoc.identifier,
                    funded_amount: fundingDoc.funded_amount,
                    payback_amount: fundingDoc.payback_amount
                };
            }
        } catch (error) {
            console.error('Error fetching funding details:', error);
            // Continue with creation even if funding details can't be fetched
        }
    }
    return undefined;
};

const Funding = mongoose.model('Funding', FundingSchema);

module.exports = Funding; 