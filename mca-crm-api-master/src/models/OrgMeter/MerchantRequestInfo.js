const mongoose = require('mongoose');

const MerchantRequestInfoSchema = new mongoose.Schema({
    capitalRequestedAmount: {
        type: Number
    },
    claimedRevenueAmount: {
        type: Number
    },
    claimedFico: {
        type: Number
    },
    claimedPositionNumber: {
        type: Number
    },
    isoSyndicationPercent: {
        type: Number
    }
}, { _id: false });

module.exports = MerchantRequestInfoSchema; 