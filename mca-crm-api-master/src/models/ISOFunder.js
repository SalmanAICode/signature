const mongoose = require('mongoose');

const ISOFunderSchema = new mongoose.Schema({
    iso: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ISO',
        required: true,
        index: true
    },
    funder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funder',
        required: true,
        index: true
    },
    commission_formula: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Formula'
    },
    inactive: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});


const ISOFunder = mongoose.model('ISO-Funder', ISOFunderSchema);

module.exports = ISOFunder; 