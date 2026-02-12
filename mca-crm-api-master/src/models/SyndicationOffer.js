const mongoose = require('mongoose');

const Helpers = require('../utils/helpers');
const { SYNDICATION_OFFER_STATUS } = require('../utils/constants');


const SyndicationOfferSchema = new mongoose.Schema({
    funding: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funding',
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
    syndicator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Syndicator',
        required: true,
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
    status: {
        type: String,
        enum: Object.values(SYNDICATION_OFFER_STATUS),
        required: true
    },
    offered_date: {
        type: Date,
        required: true
    },
    status_date: {
        type: Date,
        required: true
    },
    expired_date: {
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
    inactive: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});



// Helper function to calculate statistics for Syndication Offer documents
const calculateStatistics = async function(docs) {
    if (!docs || docs.length === 0) return;
    
    const Funding = mongoose.model('Funding');
    
    // Get all funding IDs
    const fundingIds = docs.map(doc => Helpers.extractIdString(doc.funding)).filter(id => id !== null);
    const distinctFundingIds = [...new Set(fundingIds)];
    
    // Fetch all fundings for these offers in one query
    const fundings = await Funding.find({
        _id: { $in: distinctFundingIds }
    }, '_id funded_amount payback_amount commission_amount');
    
    // Group fundings by funding ID and calculate statistics
    const statsByFunding = {};

    // Initialize stats for each funding to make sure we have stats for all fundings, even if there are no funding for that funding
    for (const fundingId of distinctFundingIds) {
        statsByFunding[fundingId] = {
            total_funded_amount: 0,
            total_payback_amount: 0
        };
    }

    // Calculate statistics for each funding
    fundings.forEach(funding => {
        const stats = statsByFunding[Helpers.extractIdString(funding)];

        stats.total_funded_amount = funding.funded_amount || 0;
        stats.total_payback_amount = funding.payback_amount || 0;
    });

    // Calculate statistics for each offer
    docs.forEach(doc => {
        const funding = statsByFunding[Helpers.extractIdString(doc.funding)];
        
        doc.total_funded_amount = funding.total_funded_amount;
        doc.total_payback_amount = funding.total_payback_amount;

        doc.total_fee_amount = doc.fee_list ? doc.fee_list.reduce((acc, fee) => acc + fee.amount, 0) : 0;
        doc.total_credit_amount = doc.credit_list ? doc.credit_list.reduce((acc, credit) => acc + credit.amount, 0) : 0;

        doc.upfront_fee_amount = doc.fee_list ? doc.fee_list.filter(fee => fee.upfront === true).reduce((acc, fee) => acc + fee.amount, 0) : 0;
        doc.upfront_credit_amount = doc.credit_list ? doc.credit_list.filter(credit => credit.upfront === true).reduce((acc, credit) => acc + credit.amount, 0) : 0;

        doc.recurring_fee_amount = doc.total_fee_amount - doc.upfront_fee_amount;
        doc.recurring_credit_amount = doc.total_credit_amount - doc.upfront_credit_amount;

        doc.syndicated_amount = doc.participate_amount + doc.upfront_fee_amount - doc.upfront_credit_amount;

        doc.factor_rate = doc.payback_amount / doc.participate_amount;
        doc.buy_rate = (doc.payback_amount - doc.total_fee_amount + doc.total_credit_amount) / doc.participate_amount;
        
        // Set a flag to indicate that statistics have been calculated
        doc._calculatedStatsComplete = true;
    });

    return docs;
};

// Middleware to automatically add statistics to query results
SyndicationOfferSchema.post('find', async function(docs) {
    if (this.getOptions()?.calculate) {
        await calculateStatistics(docs);
    }
});

SyndicationOfferSchema.post('findOne', async function(doc) {
    if (doc && this.getOptions()?.calculate) {
        await calculateStatistics([doc]);
    }
});

const SyndicationOffer = mongoose.model('Syndication-Offer', SyndicationOfferSchema);

module.exports = SyndicationOffer;
