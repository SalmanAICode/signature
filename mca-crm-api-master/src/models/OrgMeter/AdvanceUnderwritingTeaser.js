const mongoose = require('mongoose');
const CustomFieldSchema = require('./CustomField');

const AdvanceUnderwritingTeaserSchema = new mongoose.Schema({
    positionNumber: {
        type: Number,
        default: null
    },
    pendingStipCount: {
        type: Number,
        default: null
    },
    customFields: [CustomFieldSchema]
}, { _id: false });

module.exports = AdvanceUnderwritingTeaserSchema; 