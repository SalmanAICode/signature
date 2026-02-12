const mongoose = require('mongoose');
const { PORTAL_OPERATIONS } = require('../utils/constants');

const ContactAccessLogSchema = new mongoose.Schema({
    contact: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact',
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

const ContactAccessLog = mongoose.model('Contact-Access-Log', ContactAccessLogSchema);

module.exports = ContactAccessLog; 