const mongoose = require('mongoose');

const SyndicationOffer = require('./SyndicationOffer');
const Syndication = require('./Syndication');
const Payout = require('./Payout');

const { SYNDICATOR_PAYOUT_FREQUENCY, SYNDICATION_OFFER_STATUS, SYNDICATION_STATUS } = require('../utils/constants');

const SyndicatorFunderSchema = new mongoose.Schema({
    syndicator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Syndicator',
        required: true,
        index: true
    },
    funder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funder',
        required: true,
        index: true
    },
    available_balance: {
        type: Number,
        required: true,
        default: 0
    },
    payout_frequency: {
        type: String,
        required: true,
        enum: Object.values(SYNDICATOR_PAYOUT_FREQUENCY),
        default: SYNDICATOR_PAYOUT_FREQUENCY.WEEKLY
    },
    next_payout_date: {
        type: Date
    },
    inactive: {
        type: Boolean,
        default: false
    },
    auto_syndication: {
        type: Boolean,
        default: false
    },
    auto_percent: {
        type: Number,
        min: 0,
        max: 1,
        default: 0
    },
    max_amount: {
        type: Number,
        min: 0,
        default: 0
    },
    min_amount: {
        type: Number,
        min: 0,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for pending_balance
SyndicatorFunderSchema.virtual('pending_balance').get(async function() {
    // Implementation would sum all pending payouts
    // Placeholder implementation
    return 0;
});

// Virtual for transaction_list
SyndicatorFunderSchema.virtual('transaction_list', {
    ref: 'Syndicator-Transaction',
    localField: 'syndicator',
    foreignField: 'syndicator',
    match: { funder: this.funder }
});

// Virtual for syndication_offer_list
SyndicatorFunderSchema.virtual('syndication_offer_list', {
    ref: 'Syndication-Offer',
    localField: 'syndicator',
    foreignField: 'syndicator',
    match: { funder: this.funder }
});

// Virtual for syndication_list
SyndicatorFunderSchema.virtual('syndication_list', {
    ref: 'Syndication',
    localField: 'syndicator',
    foreignField: 'syndicator',
    match: { funder: this.funder }
});

// Virtual for payout_list
SyndicatorFunderSchema.virtual('payout_list', {
    ref: 'Payout',
    localField: 'syndicator',
    foreignField: 'syndicator',
    match: { funder: this.funder }
});


/**
 * Helper function to calculate statistics for Syndicator-Funder documents
 * @param {Array} docs - The array of Syndicator-Funder documents to calculate statistics for
 * @returns {Array} The array of Syndicator-Funder documents with statistics
 */
const calculateStatistics = async function(docs) {
    if (!docs || docs.length === 0) return;
    
    // Get all Syndicator-Funder IDs
    const syndicatorFunderIds = docs.map(doc => doc._id);
    const syndicatorIds = docs.map(doc => doc.syndicator);
    const funderIds = docs.map(doc => doc.funder);
    
    // Initialize stats for each syndicator-funder to make sure we have stats for all syndicator-funders, even if there are no paybacks for that syndicator-funder
    const statsBySyndicatorFunder = {};

    for (const syndicatorFunderId of syndicatorFunderIds) {
        statsBySyndicatorFunder[syndicatorFunderId] = {
            syndication_offer_count: 0,
            pending_syndication_offer_count: 0,
            accepted_syndication_offer_count: 0,
            declined_syndication_offer_count: 0,
            cancelled_syndication_offer_count: 0,

            syndication_offer_amount: 0,
            pending_syndication_offer_amount: 0,
            accepted_syndication_offer_amount: 0,
            declined_syndication_offer_amount: 0,
            cancelled_syndication_offer_amount: 0,
            
            syndication_count: 0,
            active_syndication_count: 0,
            closed_syndication_count: 0,

            syndication_amount: 0,
            active_syndication_amount: 0,
            closed_syndication_amount: 0,

            // Payout related fields
            payout_count: 0,
            payout_amount: 0,
            pending_payout_amount: 0,
            completed_payout_amount: 0,
            total_payout_fee_amount: 0,
            total_payout_credit_amount: 0,
        };
    }

    const [syndicationOffers, syndications, payouts] = await Promise.all([
        SyndicationOffer.find({ 
            syndicator: { $in: syndicatorIds }, 
            funder: { $in: funderIds }, 
            inactive: { $ne: true } 
        }, '_id syndicator funder status participate_amount'),
        Syndication.find({ 
            syndicator: { $in: syndicatorIds }, 
            funder: { $in: funderIds }, 
            inactive: { $ne: true } 
        }, '_id syndicator funder participate_amount status'),
        
        Payout.find({ 
            syndicator: { $in: syndicatorIds }, 
            funder: { $in: funderIds }, 
            inactive: { $ne: true } 
        }, '_id syndicator funder payout_amount fee_amount credit_amount pending'),
    ]);
    
    for (const doc of docs) {
        const stats = statsBySyndicatorFunder[doc._id];

        // Syndication Offer Statistics
        const docOffers = syndicationOffers.filter(offer => 
            offer.syndicator && offer.funder &&
            offer.syndicator.toString() === (doc.syndicator?._id || doc.syndicator)?.toString() && 
            offer.funder.toString() === (doc.funder?._id || doc.funder)?.toString()
        );
        
        stats.syndication_offer_count = docOffers.length;
        stats.syndication_offer_amount = docOffers.reduce((acc, offer) => acc + (offer.participate_amount || 0), 0);

        stats.pending_syndication_offer_count = docOffers.filter(offer => offer.status === SYNDICATION_OFFER_STATUS.SUBMITTED).length;
        stats.pending_syndication_offer_amount = docOffers.filter(offer => offer.status === SYNDICATION_OFFER_STATUS.SUBMITTED)
            .reduce((acc, offer) => acc + (offer.participate_amount || 0), 0);

        stats.accepted_syndication_offer_count = docOffers.filter(offer => offer.status === SYNDICATION_OFFER_STATUS.ACCEPTED).length;
        stats.accepted_syndication_offer_amount = docOffers.filter(offer => offer.status === SYNDICATION_OFFER_STATUS.ACCEPTED)
            .reduce((acc, offer) => acc + (offer.participate_amount || 0), 0);

        stats.declined_syndication_offer_count = docOffers.filter(offer => offer.status === SYNDICATION_OFFER_STATUS.DECLINED).length;
        stats.declined_syndication_offer_amount = docOffers.filter(offer => offer.status === SYNDICATION_OFFER_STATUS.DECLINED)
            .reduce((acc, offer) => acc + (offer.participate_amount || 0), 0);

        stats.cancelled_syndication_offer_count = docOffers.filter(offer => 
            offer.status === SYNDICATION_OFFER_STATUS.CANCELLED || 
            offer.status === SYNDICATION_OFFER_STATUS.EXPIRED
        ).length;
        stats.cancelled_syndication_offer_amount = docOffers.filter(offer => 
            offer.status === SYNDICATION_OFFER_STATUS.CANCELLED || 
            offer.status === SYNDICATION_OFFER_STATUS.EXPIRED
        ).reduce((acc, offer) => acc + (offer.participate_amount || 0), 0);
    
        // Syndication Statistics
        const docSyndications = syndications.filter(syndication => 
            syndication.syndicator && syndication.funder &&
            syndication.syndicator.toString() === (doc.syndicator?._id || doc.syndicator)?.toString() && 
            syndication.funder.toString() === (doc.funder?._id || doc.funder)?.toString()
        );
        
        stats.syndication_count = docSyndications.length;
        stats.syndication_amount = docSyndications.reduce((acc, syndication) => acc + (syndication.participate_amount || 0), 0);

        stats.active_syndication_count = docSyndications.filter(syndication => syndication.status === SYNDICATION_STATUS.ACTIVE).length;
        stats.active_syndication_amount = docSyndications.filter(syndication => syndication.status === SYNDICATION_STATUS.ACTIVE)
            .reduce((acc, syndication) => acc + (syndication.participate_amount || 0), 0);

        stats.closed_syndication_count = docSyndications.filter(syndication => syndication.status === SYNDICATION_STATUS.CLOSED).length;
        stats.closed_syndication_amount = docSyndications.filter(syndication => syndication.status === SYNDICATION_STATUS.CLOSED)
            .reduce((acc, syndication) => acc + (syndication.participate_amount || 0), 0);

        // Payout Statistics
        const docPayouts = payouts.filter(payout => 
            payout.syndicator && payout.funder &&
            payout.syndicator.toString() === (doc.syndicator?._id || doc.syndicator)?.toString() && 
            payout.funder.toString() === (doc.funder?._id || doc.funder)?.toString()
        );

        stats.payout_count = docPayouts.length;
        stats.payout_amount = docPayouts.reduce((acc, payout) => acc + (payout.payout_amount || 0), 0);
        
        stats.pending_payout_amount = docPayouts.filter(payout => payout.pending)
            .reduce((acc, payout) => acc + (payout.payout_amount || 0), 0);
        
        stats.completed_payout_amount = docPayouts.filter(payout => !payout.pending)
            .reduce((acc, payout) => acc + (payout.payout_amount || 0), 0);
        
        stats.total_payout_fee_amount = docPayouts.reduce((acc, payout) => acc + (payout.fee_amount || 0), 0);
        stats.total_payout_credit_amount = docPayouts.reduce((acc, payout) => acc + (payout.credit_amount || 0), 0);
    }
    
    // Add calculated fields to each document
    docs.forEach(doc => {
        const stats = statsBySyndicatorFunder[doc._id];
    
        // Syndication Offer fields
        doc.syndication_offer_count = stats.syndication_offer_count;
        doc.pending_syndication_offer_count = stats.pending_syndication_offer_count;
        doc.accepted_syndication_offer_count = stats.accepted_syndication_offer_count;
        doc.declined_syndication_offer_count = stats.declined_syndication_offer_count;
        doc.cancelled_syndication_offer_count = stats.cancelled_syndication_offer_count;

        doc.syndication_offer_amount = stats.syndication_offer_amount;
        doc.pending_syndication_offer_amount = stats.pending_syndication_offer_amount;
        doc.accepted_syndication_offer_amount = stats.accepted_syndication_offer_amount;
        doc.declined_syndication_offer_amount = stats.declined_syndication_offer_amount;
        doc.cancelled_syndication_offer_amount = stats.cancelled_syndication_offer_amount;

        // Syndication fields
        doc.syndication_count = stats.syndication_count;
        doc.active_syndication_count = stats.active_syndication_count;
        doc.closed_syndication_count = stats.closed_syndication_count;

        doc.syndication_amount = stats.syndication_amount;
        doc.active_syndication_amount = stats.active_syndication_amount;
        doc.closed_syndication_amount = stats.closed_syndication_amount;

        // Payout fields
        doc.payout_count = stats.payout_count;
        doc.payout_amount = stats.payout_amount;
        doc.pending_payout_amount = stats.pending_payout_amount;
        doc.completed_payout_amount = stats.completed_payout_amount;
        doc.total_payout_fee_amount = stats.total_payout_fee_amount;
        doc.total_payout_credit_amount = stats.total_payout_credit_amount;

        // Set a flag to indicate that statistics have been calculated
        doc._calculatedStatsComplete = true;
    });

    return docs;
};

// Middleware to automatically add statistics to query results
SyndicatorFunderSchema.post('find', async function(docs) {
    if (this.getOptions()?.calculate) {
        await calculateStatistics(docs);
    }
});

SyndicatorFunderSchema.post('findOne', async function(doc) {
    if (doc && this.getOptions()?.calculate) {
        await calculateStatistics([doc]);
    }
});

const SyndicatorFunder = mongoose.model('Syndicator-Funder', SyndicatorFunderSchema);

module.exports = SyndicatorFunder; 