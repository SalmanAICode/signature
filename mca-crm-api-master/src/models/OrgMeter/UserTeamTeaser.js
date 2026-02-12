const mongoose = require('mongoose');

const UserTeamTeaserSchema = new mongoose.Schema({
    id: {
        type: Number
    },
    name: {
        type: String
    }
}, { _id: false });

module.exports = UserTeamTeaserSchema; 