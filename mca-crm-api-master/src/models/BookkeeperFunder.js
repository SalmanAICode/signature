const mongoose = require('mongoose');

const BookkeeperFunderSchema = new mongoose.Schema({
    bookkeeper: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bookkeeper',
        required: true,
        index: true
    },
    funder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funder',
        required: true,
        index: true
    }
});

const BookkeeperFunder = mongoose.model('Bookkeeper-Funder', BookkeeperFunderSchema);

module.exports = BookkeeperFunder; 