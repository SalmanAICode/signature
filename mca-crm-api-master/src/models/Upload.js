const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UploadSchema = new mongoose.Schema({
    file: {
        type: Schema.Types.ObjectId,
        required: true,
        unique: true,
        index: true
    },
    document: {
        type: Schema.Types.ObjectId,
        ref: 'Document',
        required: true,
        index: true
    },
    file_name: {
        type: String,
        required: true
    },
    file_type: {
        type: String,
        required: true,
    },
    file_size: {
        type: Number,
        required: true
    },
    upload_contact: {
        id: {
            type: Schema.Types.ObjectId,
            ref: 'Contact',
            index: true
        },
        first_name: { type: String, index: true },
        last_name: { type: String, index: true },
        email: { type: String, index: true },
        phone_mobile: { type: String, index: true }
    },
    upload_representative: {
        id: {
            type: Schema.Types.ObjectId,
            ref: 'Representative',
            index: true
        },
        first_name: { type: String, index: true },
        last_name: { type: String, index: true },
        email: { type: String, index: true },
        phone_mobile: { type: String, index: true }
    },
    upload_user: {
        id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            index: true
        },
        first_name: { type: String, index: true },
        last_name: { type: String, index: true },
        email: { type: String, index: true },
        phone_mobile: { type: String, index: true }
    },
    upload_syndicator: {
        id: {
            type: Schema.Types.ObjectId,
            ref: 'Syndicator',
            index: true
        },
        name: { type: String, index: true },
        first_name: { type: String, index: true },
        last_name: { type: String, index: true },
        email: { type: String, index: true },
        phone_mobile: { type: String, index: true }
    },
    upload_admin: {
        id: {
            type: Schema.Types.ObjectId,
            ref: 'Admin',
            index: true
        },
        first_name: { type: String, index: true },
        last_name: { type: String, index: true },
        email: { type: String, index: true },
        phone_mobile: { type: String, index: true }
    },
    upload_bookkeeper: {
        id: {
            type: Schema.Types.ObjectId,
            ref: 'Bookkeeper',
            index: true
        },
        first_name: { type: String, index: true },
        last_name: { type: String, index: true },
        email: { type: String, index: true },
        phone_mobile: { type: String, index: true }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Upload', UploadSchema);
