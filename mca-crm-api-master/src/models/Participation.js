const mongoose = require('mongoose');
const Helpers = require('../utils/helpers');

const ParticipationSchema = new mongoose.Schema({
    funding: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Funding',
            required: true,
            index: true
        },
        name: { type: String, index: true },
        identifier: { type: String, index: true },
        funded_amount: { type: Number },
        payback_amount: { type: Number }
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
            required: true,
            index: true
        },
        name: { type: String, index: true },
        email: { type: String, index: true },
        phone: { type: String, index: true }
    },
    participate_amount: {
        type: Number,
        required: true,
        default: 0
    },
    participate_percent: {
        type: Number,
        required: true,
        default: 0
    },
    profit_percent: {
        type: Number,
        required: true,
        default: 0
    },
    profit_amount: {
        type: Number,
        default: null
    },
    fee_list: {
        type: [{
            name: String,
            fee_type: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Fee-Type'
            },
            amount: {
                type: Number,
                required: true,
                default: 0
            },
            syndication: {
                type: Boolean,
                default: true
            }
        }],
        required: true,
        default: []
    },
    expense_list: {
        type: [{
            name: String,
            expense_type: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Expense-Type'
            },
            amount: {
                type: Number,
                required: true,
                default: 0
            },
            syndication: {
                type: Boolean,
                default: false
            }
        }],
        required: true,
        default: []
    },
    created_by_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updated_by_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    participate_transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        default: null
    },
    profit_transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        default: null
    },
    status: {
        type: String,
        enum: ['PERFORMING', '', 'CLOSED'],
        default: 'PERFORMING'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
ParticipationSchema.index({ 'funding.id': 1, 'funder.id': 1, 'lender.id': 1 });
ParticipationSchema.index({ 'funding.id': 1 });
ParticipationSchema.index({ 'funder.id': 1 });
ParticipationSchema.index({ 'lender.id': 1 });
ParticipationSchema.index({ status: 1 });

// Pre-save middleware to populate embedded fields
ParticipationSchema.pre('save', async function(next) {
    try {
        // Populate funding details if funding.id is provided
        if (this.funding && this.funding.id && !this.funding.name) {
            const Funding = mongoose.model('Funding');
            const funding = await Funding.findById(this.funding.id).select('name identifier funded_amount payback_amount');
            if (funding) {
                this.funding.name = funding.name;
                this.funding.identifier = funding.identifier;
                this.funding.funded_amount = funding.funded_amount;
                this.funding.payback_amount = funding.payback_amount;
            }
        }

        // Populate funder details if funder.id is provided
        if (this.funder && this.funder.id && !this.funder.name) {
            const Funder = mongoose.model('Funder');
            const funder = await Funder.findById(this.funder.id).select('name email phone');
            if (funder) {
                this.funder.name = funder.name;
                this.funder.email = funder.email;
                this.funder.phone = funder.phone;
            }
        }

        // Populate lender details if lender.id is provided
        if (this.lender && this.lender.id && !this.lender.name) {
            const Lender = mongoose.model('Lender');
            const lender = await Lender.findById(this.lender.id).select('name email phone');
            if (lender) {
                this.lender.name = lender.name;
                this.lender.email = lender.email;
                this.lender.phone = lender.phone;
            }
        }

        next();
    } catch (error) {
        next(error);
    }
});

/**
 * Helper function to calculate statistics for Participation documents
 * @param {Array} docs - The array of Participation documents to calculate statistics for
 * @returns {Array} The array of Participation documents with statistics
 */
const calculateStatistics = async function(docs) {
    if (!docs || docs.length === 0) return;
    
    // Get all unique funding IDs
    const fundingIds = [...new Set(docs.map(doc => Helpers.extractIdString(doc.funding.id)))];
    
    // Get funding information for calculations
    const Funding = mongoose.model('Funding');
    const fundings = await Funding.find({ 
        _id: { $in: fundingIds }
    }, null, { calculate: true });
    
    // Create a map of funding stats by funding ID
    const statsByFunding = {};
    fundings.forEach(funding => {
        statsByFunding[funding._id.toString()] = {
            total_funded_amount: funding.funded_amount || 0,
            total_payback_amount: funding.payback_amount || 0,
            total_expected_profit_amount: funding.expected_profit_amount || 0,
            total_current_profit_amount: funding.current_profit_amount || 0
        };
    });

    // Calculate statistics for each participation document
    docs.forEach(doc => {
        const fundingId = Helpers.extractIdString(doc.funding.id);
        const funding = statsByFunding[fundingId] || {
            total_funded_amount: 0,
            total_payback_amount: 0,
            total_expected_profit_amount: 0,
            total_current_profit_amount: 0
        };
        
        // Set funding totals
        doc.total_funded_amount = funding.total_funded_amount;
        doc.total_payback_amount = funding.total_payback_amount;
        doc.total_expected_profit_amount = funding.total_expected_profit_amount;
        doc.total_current_profit_amount = funding.total_current_profit_amount;

        // Calculate fee amount (sum of fee_list amounts)
        doc.fee_amount = doc.fee_list ? 
            doc.fee_list.reduce((sum, fee) => sum + (fee.amount || 0), 0) : 0;

        // Calculate expense amount (sum of expense_list amounts)
        doc.expense_amount = doc.expense_list ? 
            doc.expense_list.reduce((sum, expense) => sum + (expense.amount || 0), 0) : 0;

        // Calculate purchase amount (participate_amount - fee_amount + expense_amount)
        doc.purchase_amount = (doc.participate_amount || 0) - doc.fee_amount + doc.expense_amount;

        // Calculate expected profit amount (total_expected_profit_amount * profit_percent)
        doc.expect_profit_amount = doc.total_expected_profit_amount * (doc.profit_percent || 0);

        // Calculate expected return amount (expect_profit_amount + purchase_amount)
        doc.expect_return_amount = doc.expect_profit_amount + doc.purchase_amount;

        // Set a flag to indicate that statistics have been calculated
        doc._calculatedStatsComplete = true;
    });

    return docs;
};

// Middleware to automatically add statistics to query results
ParticipationSchema.post('find', async function(docs) {
    if (this.getOptions()?.calculate) {
        await calculateStatistics(docs);
    }
});

ParticipationSchema.post('findOne', async function(doc) {
    if (doc && this.getOptions()?.calculate) {
        await calculateStatistics([doc]);
    }
});

const Participation = mongoose.model('Participation', ParticipationSchema);

module.exports = Participation;
