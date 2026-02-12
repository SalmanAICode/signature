const mongoose = require('mongoose');

const UserLenderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    lender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lender',
        required: true,
        index: true
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const UserLender = mongoose.model('User-Lender', UserLenderSchema);

module.exports = UserLender; 