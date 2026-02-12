const mongoose = require('mongoose');

const StakeholderContactSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    }
}, { _id: false });

module.exports = StakeholderContactSchema; 