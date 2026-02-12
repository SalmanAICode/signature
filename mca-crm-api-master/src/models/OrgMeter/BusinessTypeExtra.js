const mongoose = require('mongoose');

const BusinessTypeExtraSchema = new mongoose.Schema({
    homeBased: {
        type: Boolean
    },
    eCommerce: {
        type: Boolean
    }
}, { _id: false });

module.exports = BusinessTypeExtraSchema; 