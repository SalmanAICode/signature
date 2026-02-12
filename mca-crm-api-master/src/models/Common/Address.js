const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['physical', 'mailing', 'billing', 'shipping', 'other']
    },
    address_1: String,
    address_2: String,
    city: String,
    state: String,
    zip: String,
    primary: Boolean,
    verified: Boolean
}, { _id: false });

module.exports = AddressSchema;
