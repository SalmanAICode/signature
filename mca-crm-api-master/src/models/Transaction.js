const mongoose = require('mongoose');
const AccountSchema = require('./Common/Account');
const TransactionBreakdownSchema = require('./TransactionBreakdown');
const { TRANSACTION_TYPES } = require('../utils/constants');

const TransactionSchema = new mongoose.Schema({
    funder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funder',
        required: true,
        index: true
    },
    sender: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            index: true
        },
        name: { type: String, index: true }
    },
    receiver: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            index: true
        },
        name: { type: String, index: true }
    },
    sender_type: {
        type: String,
        required: true,
        enum: ['FUNDER', 'LENDER', 'MERCHANT', 'ISO', 'SYNDICATOR', 'OTHER']
    },
    receiver_type: {
        type: String,
        required: true,
        enum: ['FUNDER', 'LENDER', 'MERCHANT', 'ISO', 'SYNDICATOR', 'OTHER']
    },
    sender_account: {
        type: AccountSchema,
        index: true
    },
    receiver_account: {
        type: AccountSchema,
        index: true
    },
    amount: {
        type: Number,
        required: true,
        default: 0
    },
    transaction_date: {
        type: Date,
        required: true,
        default: Date.now
    },
    funding: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funding'
    },
    type: {
        type: String,
        required: true,
        enum: Object.values(TRANSACTION_TYPES)
    },
    source: {
        type: mongoose.Schema.Types.ObjectId
    },
    reconciled: {
        type: Boolean,
        required: true,
        default: false,
        index: true
    },
    description: {
        type: String
    },
    notes: {
        type: String
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

// Indexes for better query performance
TransactionSchema.index({ funder: 1, transaction_date: -1 });
TransactionSchema.index({ sender: 1, sender_type: 1 });
TransactionSchema.index({ receiver: 1, receiver_type: 1 });
TransactionSchema.index({ funding: 1 });
TransactionSchema.index({ type: 1, transaction_date: -1 });
TransactionSchema.index({ reconciled: 1, transaction_date: -1 });



// Helper function to calculate statistics for Transaction documents
const calculateStatistics = async function(docs) {
    if (!docs || docs.length === 0) return;
    
    // Get all transaction IDs
    const transactionIds = docs.map(doc => doc._id);
    
    // Fetch all transaction breakdowns for these transactions in one query
    const transactionBreakdowns = await TransactionBreakdownSchema.find({
        transaction: { $in: transactionIds }
    });
    
    // Group transaction breakdowns by transaction ID and calculate statistics
    const statsByTransaction = {};

    // Initialize stats for each transaction to make sure we have stats for all transactions, even if there are no transaction breakdowns for that transaction
    for (const transactionId of transactionIds) {
        statsByTransaction[transactionId] = {
            breakdowns: [],
        };
    }

    transactionBreakdowns.forEach(transactionBreakdown => {
        const transactionId = transactionBreakdown.transaction.toString();
        const stats = statsByTransaction[transactionId];

        stats.breakdowns.push(transactionBreakdown);
    });
    
    // Add calculated fields to each document
    docs.forEach(doc => {
        const transactionId = doc._id.toString();
        const stats = statsByTransaction[transactionId];
        
        doc.breakdowns = stats.breakdowns;

        // Set a flag to indicate that statistics have been calculated
        doc._calculatedStatsComplete = true;
    });

    return docs;
};

// Middleware to automatically add statistics to query results
TransactionSchema.post('find', async function(docs) {
    await calculateStatistics(docs);
});

TransactionSchema.post('findOne', async function(doc) {
    await calculateStatistics([doc]);
});

// Helper function to handle transaction deletion
async function handleTransactionDeletion(transaction) {
    try {
        // Import TransactionBreakdown model dynamically to avoid circular dependency
        const TransactionBreakdown = require('./TransactionBreakdown');
        
        // Delete all transaction breakdowns linked to this transaction
        const deleteResult = await TransactionBreakdown.deleteMany({ 
            transaction: transaction._id 
        });
        
        if (deleteResult.deletedCount > 0) {
            console.log(`Deleted ${deleteResult.deletedCount} transaction breakdowns for transaction ${transaction._id}`);
        }
    } catch (error) {
        console.error(`Error deleting transaction breakdowns for transaction ${transaction._id}:`, error.message);
        // Don't throw error to avoid blocking the transaction deletion
    }
}

// Middleware for deleteOne operations
TransactionSchema.pre('deleteOne', { document: true, query: false }, async function() {
    await handleTransactionDeletion(this);
});

// Middleware for findOneAndDelete operations
TransactionSchema.pre('findOneAndDelete', async function() {
    const transaction = await this.model.findOne(this.getQuery());
    if (transaction) {
        await handleTransactionDeletion(transaction);
    }
});

// Middleware for deleteMany operations
TransactionSchema.pre('deleteMany', async function() {
    // Find all transactions that will be deleted
    const transactions = await this.model.find(this.getQuery(), '_id');
    
    // Delete related transaction breakdowns for each transaction
    for (const transaction of transactions) {
        await handleTransactionDeletion(transaction);
    }
});

// Middleware for findOneAndRemove operations (deprecated but still used)
TransactionSchema.pre('findOneAndRemove', async function() {
    const transaction = await this.model.findOne(this.getQuery());
    if (transaction) {
        await handleTransactionDeletion(transaction);
    }
});

// Middleware for remove operations (deprecated but still used)
TransactionSchema.pre('remove', { document: true, query: false }, async function() {
    await handleTransactionDeletion(this);
});

const Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = Transaction;
