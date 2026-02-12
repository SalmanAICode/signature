const mongoose = require('mongoose');
const { PORTAL_OPERATIONS } = require('../utils/constants');

const SyndicatorAccessLogSchema = new mongoose.Schema({
    syndicator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Syndicator',
        required: true,
        index: true
    },
    operation: {
        type: String,
        required: true,
        enum: Object.values(PORTAL_OPERATIONS),
        index: true
    },
    access_date: {
        type: Date,
        default: Date.now,
        required: true,
        index: true
    },
    ip_address: {
        type: String
    }
});

const SyndicatorAccessLog = mongoose.model('Syndicator-Access-Log', SyndicatorAccessLogSchema);

module.exports = SyndicatorAccessLog; 