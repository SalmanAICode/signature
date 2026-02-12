const mongoose = require('mongoose');

const IsoOfferTeaserSchema = new mongoose.Schema({
    id: {
        type: Number,
        default: null
    },
    name: {
        type: String,
        default: null
    }
}, { _id: false });

module.exports = IsoOfferTeaserSchema; 