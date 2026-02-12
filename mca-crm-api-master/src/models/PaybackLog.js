const mongoose = require('mongoose');
const { PAYBACK_STATUS } = require('../utils/constants');
const { ACTIONS } = require('../utils/permissions');

const PaybackLogSchema = new mongoose.Schema({
    payback: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payback',
        required: true,
        index: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
        default: null // Null for System operations
    },
    event_type: {
        type: String,
        required: true,
        enum: Object.values(ACTIONS),
        index: true
    },
    event_date: {
        type: Date,
        required: true,
        default: Date.now,
        index: true
    },
    request: {
        type: String,
        set: function(value) {
            // If value is an object, stringify it; otherwise return as is
            if (typeof value === 'object' && value !== null) {
                return JSON.stringify(value);
            }
            return value;
        }
    },
    status: {
        type: String,
        required: true,
        enum: Object.values(PAYBACK_STATUS)
    }
});

const PaybackLog = mongoose.model('Payback-Log', PaybackLogSchema);

module.exports = PaybackLog;
