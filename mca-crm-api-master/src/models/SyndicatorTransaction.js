const mongoose = require('mongoose');

const SyndicatorTransactionSchema = new mongoose.Schema({
    syndicator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Syndicator',
        required: true,
        index: true
    },
    funder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funder',
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: ['DEPOSIT', 'WITHDRAW'],
        index: true
    },
    created_date: {
        type: Date,
        default: Date.now,
        required: true,
        index: true
    },
    created_by_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    hit_date: {
        type: Date
    },
    response_date: {
        type: Date
    },
    amount: {
        type: Number,
        required: true
    },
    syndicator_account: {
        type: Object
    },
    funder_account: {
        type: Object
    },
    status: {
        type: String,
        required: true,
        enum: ['PENDING', 'SUCCEED', 'FAILED', 'CANCELLED'],
        index: true
    },
    updated_date: {
        type: Date,
        default: Date.now,
        required: true,
        index: true
    },
    updated_by_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reconciled: {
        type: Boolean,
        default: false,
        index: true
    }
});

const SyndicatorTransaction = mongoose.model('Syndicator-Transaction', SyndicatorTransactionSchema);

module.exports = SyndicatorTransaction; 