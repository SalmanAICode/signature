const mongoose = require('mongoose');
const { ENTITY_TYPES } = require('../../utils/constants');

const BusinessDetailSchema = new mongoose.Schema({
    ein: String,
    entity_type: {
        type: String,
        enum: [...Object.values(ENTITY_TYPES), null],
        default: null
    },
    incorporation_date: Date,
    state_of_incorporation: String
}, { _id: false });

module.exports = BusinessDetailSchema;
