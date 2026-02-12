const mongoose = require('mongoose');

const StakeholderSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['internal', 'external']
    },
    name: {
        type: String,
        required: true
    }
}, { _id: false });

module.exports = StakeholderSchema;
