const mongoose = require('mongoose');
const { PORTAL_OPERATIONS } = require('../utils/constants');

const RepresentativeAccessLogSchema = new mongoose.Schema({
    representative: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Representative',
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

const RepresentativeAccessLog = mongoose.model('Representative-Access-Log', RepresentativeAccessLogSchema);

module.exports = RepresentativeAccessLog; 