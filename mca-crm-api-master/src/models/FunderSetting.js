const mongoose = require('mongoose');

const FunderSettingSchema = new mongoose.Schema({
    funder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funder',
        required: true,
        unique: true,
        index: true
    },
    app_seq_id_mask: {
        type: String,
        required: true,
        default: 'A-MMDDYY-###',
        trim: true,
        comment: 'Application sequence ID mask format. Supports: YYYY (4-digit year), YY (2-digit year), MM (2-digit month), MMM (3-letter month), MMMM (full month), DD (2-digit day). Example: APP-JUL172025-1'
    },
    funding_seq_id_mask: {
        type: String,
        required: true,
        default: 'F-MMDDYY-###',
        trim: true,
        comment: 'Funding sequence ID mask format. Supports: YYYY (4-digit year), YY (2-digit year), MM (2-digit month), MMM (3-letter month), MMMM (full month), DD (2-digit day). Example: FUND-JUL172025-1'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index for compound uniqueness if needed in the future
FunderSettingSchema.index({ funder: 1 }, { unique: true });

const FunderSetting = mongoose.model('Funder-Setting', FunderSettingSchema);

module.exports = FunderSetting;
