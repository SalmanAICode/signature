const mongoose = require('mongoose');

const FeeItemSchema = require('./Common/FeeItem');
const ExpenseItemSchema = require('./Common/ExpenseItem');

const { APPLICATION_OFFER_STATUS } = require('../utils/constants');

const ApplicationOfferSchema = new mongoose.Schema({
    application: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application',
        required: true,
        index: true
    },
    merchant: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Merchant',
            required: true,
            index: true
        },
        name: { type: String, index: true },
        email: { type: String, index: true },
        phone: { type: String, index: true }
    },
    funder: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Funder',
            required: true,
            index: true
        },
        name: { type: String, index: true },
        email: { type: String, index: true },
        phone: { type: String, index: true }
    },
    lender: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lender',
            index: true
        },
        name: { type: String, index: true },
        email: { type: String, index: true },
        phone: { type: String, index: true }
    },
    iso: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ISO',
            index: true
        },
        name: { type: String, index: true },
        email: { type: String, index: true },
        phone: { type: String, index: true }
    },    
    offered_amount: {
        type: Number,
        required: true
    },
    payback_amount: {
        type: Number,
        required: true
    },
    fee_list: [FeeItemSchema],
    expense_list: [ExpenseItemSchema],
    installment: {
        type: Number,
        required: true,
        default: 1
    },
    frequency: {
        type: String,
        enum: ['DAILY', 'WEEKLY', 'MONTHLY'],
        required: true,
        default: 'DAILY'
    },
    payday_list: [{
        type: Number
    }],
    avoid_holiday: {
        type: Boolean,
        default: true
    },
    payback_count: {
        type: Number,
        required: true
    },
    offered_date: {
        type: Date
    },
    offered_by_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updated_by_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    decided_by_contact: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact'
    },
    status: {
        type: String,
        enum: Object.values(APPLICATION_OFFER_STATUS),
        default: APPLICATION_OFFER_STATUS.OFFERED
    },
    inactive: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});


// Calculate total amount
const calculateStatistics = async function(docs) {
    docs.forEach(doc => {
        doc.fee_amount = doc.fee_list?.reduce((sum, fee) => sum + (fee.amount || 0), 0) || 0;
        doc.commission_amount = doc.expense_list?.filter(expense => expense.commission).reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;
        doc.disbursement_amount = (doc.offered_amount || 0) - doc.fee_amount;
        doc.payment_amount = doc.payback_count > 0 ? (doc.payback_amount || 0) / doc.payback_count : 0;
        doc.term_length = doc.payback_count > 0 ? 
            doc.frequency === 'DAILY' ? doc.payback_count / (doc.payday_list ? doc.payday_list.length : 1) / 4 :
                doc.frequency === 'WEEKLY' ? doc.payback_count / 4 :
                    doc.frequency === 'MONTHLY' ? doc.payback_count : 0 : 0;
        doc.factor_rate = doc.offered_amount > 0 ? (doc.payback_amount || 0) / doc.offered_amount : 0;
        doc.buy_rate = doc.offered_amount > 0 ? ((doc.payback_amount || 0) - (doc.commission_amount || 0)) / doc.offered_amount : 0;
        
    });

    return docs;
};

// Middleware to automatically add statistics to query results
ApplicationOfferSchema.post('find', async function(docs) {
    await calculateStatistics(docs);
});

ApplicationOfferSchema.post('findOne', async function(doc) {
    await calculateStatistics([doc]);
});

const ApplicationOffer = mongoose.model('Application-Offer', ApplicationOfferSchema);

module.exports = ApplicationOffer; 