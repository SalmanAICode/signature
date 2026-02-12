const mongoose = require('mongoose');

const WorksheetSummarySchema = new mongoose.Schema({
    revenueAmount: {
        type: mongoose.Schema.Types.Decimal128
    },
    averageBalance: {
        type: mongoose.Schema.Types.Decimal128
    },
    depositAmount: {
        type: mongoose.Schema.Types.Decimal128
    },
    depositCount: {
        type: Number
    },
    endMonthBalance: {
        type: mongoose.Schema.Types.Decimal128
    },
    nsfOdCount: {
        type: Number
    },
    negativeDayCount: {
        type: Number
    }
}, { _id: false });

module.exports = WorksheetSummarySchema; 