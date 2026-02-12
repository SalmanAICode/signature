const mongoose = require('mongoose');
const { PORTAL_OPERATIONS } = require('../utils/constants');

const BookkeeperAccessLogSchema = new mongoose.Schema({
    bookkeeper: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bookkeeper',
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

const BookkeeperAccessLog = mongoose.model('Bookkeeper-Access-Log', BookkeeperAccessLogSchema);

module.exports = BookkeeperAccessLog; 