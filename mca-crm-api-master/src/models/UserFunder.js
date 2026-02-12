const mongoose = require('mongoose');

const UserFunderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    funder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funder',
        required: true,
        index: true
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const UserFunder = mongoose.model('User-Funder', UserFunderSchema);

module.exports = UserFunder; 