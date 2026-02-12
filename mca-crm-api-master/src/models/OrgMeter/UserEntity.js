const mongoose = require('mongoose');

const UserEntitySchema = new mongoose.Schema({
    id: {
        type: Number
    },
    name: {
        type: String
    },
    type: {
        type: String
    }
}, { _id: false });

module.exports = UserEntitySchema; 