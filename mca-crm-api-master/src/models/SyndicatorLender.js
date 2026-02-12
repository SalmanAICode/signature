const mongoose = require('mongoose');

const SyndicatorLenderSchema = new mongoose.Schema({
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
    lender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lender',
        required: true,
        index: true
    },
    enabled: {
        type: Boolean,
        default: false
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

// Compound index for unique syndicator-funder-lender combination
SyndicatorLenderSchema.index({ syndicator: 1, funder: 1, lender: 1 }, { unique: true });

// Virtual for syndicator details
SyndicatorLenderSchema.virtual('syndicator_details', {
    ref: 'Syndicator',
    localField: 'syndicator',
    foreignField: '_id',
    justOne: true
});

// Virtual for funder details
SyndicatorLenderSchema.virtual('funder_details', {
    ref: 'Funder',
    localField: 'funder',
    foreignField: '_id',
    justOne: true
});

// Virtual for lender details
SyndicatorLenderSchema.virtual('lender_details', {
    ref: 'Lender',
    localField: 'lender',
    foreignField: '_id',
    justOne: true
});

// Static method to check if syndicator is enabled for funder-lender combination
SyndicatorLenderSchema.statics.isSyndicatorEnabled = async function(syndicatorId, funderId, lenderId) {
    const relationship = await this.findOne({
        syndicator: syndicatorId,
        funder: funderId,
        lender: lenderId,
        enabled: true,
        inactive: false
    });
    return !!relationship;
};

// Static method to get all enabled syndicators for a funder-lender combination
SyndicatorLenderSchema.statics.getEnabledSyndicators = async function(funderId, lenderId) {
    return await this.find({
        funder: funderId,
        lender: lenderId,
        enabled: true,
        inactive: false
    }).populate('syndicator', 'name email contact_info');
};

// Static method to get all funder-lender combinations for a syndicator
SyndicatorLenderSchema.statics.getSyndicatorRelationships = async function(syndicatorId) {
    return await this.find({
        syndicator: syndicatorId,
        inactive: false
    }).populate('funder', 'name').populate('lender', 'name');
};

module.exports = mongoose.model('Syndicator-Lender', SyndicatorLenderSchema);
