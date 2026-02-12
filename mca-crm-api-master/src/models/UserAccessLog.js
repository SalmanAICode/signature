const mongoose = require('mongoose');
const { PORTAL_OPERATIONS } = require('../utils/constants');

const UserAccessLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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

const UserAccessLog = mongoose.model('User-Access-Log', UserAccessLogSchema);

module.exports = UserAccessLog; 