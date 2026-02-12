const mongoose = require('mongoose');

const IsoCommissionClassTeaserSchema = new mongoose.Schema({
    id: {
        type: Number,
        default: null
    },
    name: {
        type: String,
        default: null
    }
}, { _id: false });

module.exports = IsoCommissionClassTeaserSchema; 