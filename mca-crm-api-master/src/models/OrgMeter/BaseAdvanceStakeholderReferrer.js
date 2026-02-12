const mongoose = require('mongoose');

const BaseAdvanceStakeholderReferrerSchema = new mongoose.Schema({
    stakeholderId: {
        type: Number,
        default: null
    },
    stakeholderName: {
        type: String,
        default: null
    },
    type: {
        type: String,
        required: true,
        enum: ['iso', 'referrer'],
        default: null
    },
    amount: {
        type: String,
        required: true,
        default: null
    },
    basePercent: {
        type: String,
        default: null
    },
    percent: {
        type: String,
        required: true,
        default: null
    }
}, { _id: false });

module.exports = BaseAdvanceStakeholderReferrerSchema; 