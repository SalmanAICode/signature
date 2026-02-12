const mongoose = require('mongoose');

const { INTENT_STATUS, PAYMENT_METHOD, DISBURSEMENT_STATUS } = require('../utils/constants');

const DisbursementIntentSchema = new mongoose.Schema({
    funding: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funding',
        required: true,
        index: true
    },
    funder: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Funder',
            required: true,
            index: true
        },
        name: { type: String }, 
        email: { type: String },
        phone: { type: String }
    },
    lender: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lender',
            required: true,
            index: true
        },
        name: { type: String },
        email: { type: String },
        phone: { type: String }
    },
    merchant: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Merchant',
            required: true,
            index: true
        },
        name: { type: String },
        email: { type: String },
        phone: { type: String }
    },      
    disbursement_date: {
        type: Date,
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true
    },
    payment_method: {
        type: String,
        enum: [...Object.values(PAYMENT_METHOD), null],
        default: null
    },
    ach_processor: {
        type: String,
        enum: ['ACHWorks', 'Actum', 'Manual', 'Other', null],
        default: null
    },
    funder_account: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funder-Account'
    },
    merchant_account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Merchant-Account'
    },
    created_by_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updated_by_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    note: {
        type: String
    },
    status:{
        type: String,
        enum: Object.values(INTENT_STATUS),
        default: INTENT_STATUS.SCHEDULED
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});


// Helper function to calculate statistics for DisbursementIntent documents
const calculateStatistics = async function(docs) {
    if (!docs || docs.length === 0) return;
    
    const Disbursement = mongoose.model('Disbursement');
    
    // Get all disbursement intent IDs
    const intentIds = docs.map(doc => doc._id);
    
    // Fetch all disbursements for these plans in one query
    const disbursements = await Disbursement.find({
        disbursement_intent: { $in: intentIds }
    }, 'disbursement_intent status amount');
    
    // Group disbursements by intent ID and calculate statistics
    const statsByIntent = {};

    // Initialize stats for each intent to make sure we have stats for all intents, even if there are no disbursements for that intent
    for (const intentId of intentIds) {
        statsByIntent[intentId] = {
            submitted_count: 0,
            processing_count: 0,
            succeed_count: 0,
            failed_count: 0,
            
            submitted_amount: 0,
            processing_amount: 0,
            succeed_amount: 0,
            failed_amount: 0,
        };
    }

    disbursements.forEach(disbursement => {
        const intentId = disbursement.disbursement_intent.toString();
        
        const stats = statsByIntent[intentId];
        switch (disbursement.status) {
        case DISBURSEMENT_STATUS.SUBMITTED:
            stats.submitted_count += 1;
            stats.submitted_amount += disbursement.amount || 0;
            break;
        case DISBURSEMENT_STATUS.PROCESSING:
            stats.processing_count += 1;
            stats.processing_amount += disbursement.amount || 0;
            break;
        case DISBURSEMENT_STATUS.SUCCEED:
            stats.succeed_count += 1;
            stats.succeed_amount += disbursement.amount || 0;
            break;
        case DISBURSEMENT_STATUS.FAILED:
            stats.failed_count += 1;
            stats.failed_amount += disbursement.amount || 0;
            break;
        }
    });
    
    // Add calculated fields to each document
    docs.forEach(doc => {
        const intentId = doc._id.toString();
        const stats = statsByIntent[intentId];
        
        doc.submitted_count = stats.submitted_count;
        doc.processing_count = stats.processing_count;
        doc.succeed_count = stats.succeed_count;
        doc.failed_count = stats.failed_count;

        doc.submitted_amount = stats.submitted_amount;
        doc.processing_amount = stats.processing_amount;
        doc.succeed_amount = stats.succeed_amount;
        doc.failed_amount = stats.failed_amount;

        doc.paid_amount = stats.succeed_amount;
        doc.pending_amount = stats.submitted_amount + stats.processing_amount;
        doc.pending_count = stats.submitted_count + stats.processing_count;
        doc.remaining_balance = (doc.amount || 0) - stats.succeed_amount - doc.pending_amount;
                
        // Set a flag to indicate that statistics have been calculated
        doc._calculatedStatsComplete = true;
    });

    return docs;
};

// Middleware to automatically add statistics to query results
DisbursementIntentSchema.post('find', async function(docs) {
    if (this.getOptions()?.calculate) {
        await calculateStatistics(docs);
    }
});

DisbursementIntentSchema.post('findOne', async function(doc) {
    if (doc && this.getOptions()?.calculate) {
        await calculateStatistics([doc]);
    }
});

const DisbursementIntent = mongoose.model('Disbursement-Intent', DisbursementIntentSchema);

module.exports = DisbursementIntent;
