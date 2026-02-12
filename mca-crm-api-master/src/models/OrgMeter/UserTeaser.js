const mongoose = require('mongoose');

const UserTeaserSchema = new mongoose.Schema({
    id: {
        type: Number,
        default: null
    },
    email: {
        type: String,
        default: null
    },
    fullName: {
        type: String,
        default: null
    }
}, { _id: false });

module.exports = UserTeaserSchema;
