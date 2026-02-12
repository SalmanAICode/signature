const mongoose = require('mongoose');

const CafsSchema = new mongoose.Schema({
    total: {
        type: Number
    },
    frontend: {
        type: Number
    },
    backend: {
        type: Number
    },
    expected: {
        type: Number
    }
}, { _id: false });

module.exports = CafsSchema; 