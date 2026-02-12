const mongoose = require('mongoose');

const ApplicationHistorySchema = new mongoose.Schema({
    application: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application',
        required: true
    },
    status: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Application-Status',
            required: true,
            index: true
        },
        name: { type: String, index: true },
        bgcolor: { type: String, index: true },
        initial: { type: Boolean, default: false },
        closed: { type: Boolean, default: false }
    },
    assigned_manager: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        first_name: { type: String, index: true },
        last_name: { type: String, index: true },
        email: { type: String, index: true },
        phone_mobile: { type: String, index: true }
    },
    assigned_user: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        first_name: { type: String, index: true },
        last_name: { type: String, index: true },
        email: { type: String, index: true },
        phone_mobile: { type: String, index: true }
    },
    assigned_timestamp: {
        type: Date,
        required: true,
        default: Date.now
    },
    note: {
        type: String
    }
});

const ApplicationHistory = mongoose.model('Application-History', ApplicationHistorySchema);

module.exports = ApplicationHistory; 