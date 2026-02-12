const mongoose = require('mongoose');

const BaseSyndicatorAccountBalanceSchema = new mongoose.Schema({
    accountId: {
        type: Number,
        default: null
    },
    accountName: {
        type: String,
        default: null
    },
    availableBalanceAmount: {
        type: String,
        default: null
    },
    frozenBalanceAmount: {
        type: String,
        default: null
    },
    pendingBalanceAmount: {
        type: String,
        default: null
    },
    outstandingPurchaseAmount: {
        type: String,
        default: null
    }
}, { _id: false });

module.exports = BaseSyndicatorAccountBalanceSchema; 