const mongoose = require('mongoose');

const PortfolioTeaserSchema = new mongoose.Schema({
    id: {
        type: Number,
        default: null
    },
    name: {
        type: String,
        default: null
    },
    deleted: {
        type: Boolean
    }
}, { _id: false });

module.exports = PortfolioTeaserSchema; 