const mongoose = require('mongoose');

const RepresentativeISOSchema = new mongoose.Schema({
    iso: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ISO',
        required: true,
        index: true
    },
    representative: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Representative',
        required: true,
        index: true
    }
});

const RepresentativeISO = mongoose.model('Representative-ISO', RepresentativeISOSchema);

module.exports = RepresentativeISO; 