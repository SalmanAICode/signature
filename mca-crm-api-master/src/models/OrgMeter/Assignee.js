const mongoose = require('mongoose');

const AssigneeSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['user', 'team']
    }
}, { _id: false });

module.exports = AssigneeSchema;
