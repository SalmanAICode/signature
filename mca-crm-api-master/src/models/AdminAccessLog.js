const mongoose = require('mongoose');
const { PORTAL_OPERATIONS } = require('../utils/constants');

const AdminAccessLogSchema = new mongoose.Schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
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

const AdminAccessLog = mongoose.model('Admin-Access-Log', AdminAccessLogSchema);

module.exports = AdminAccessLog; 