const express = require('express');
const {
    getSyndicatorTransactions,
    createSyndicatorTransaction,
    getSyndicatorTransactionsList,
    updateSyndicatorTransaction,
    getSyndicatorTransaction
} = require('../controllers/syndicatorTransactionController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');


// Apply protection to all routes
router.use(protect);

// Get all syndicator transactions
router.route('/')
    .get(authorize(PERMISSIONS.SYNDICATOR_TRANSACTION.READ), getSyndicatorTransactions)
    .post(authorize(PERMISSIONS.SYNDICATOR_TRANSACTION.CREATE), createSyndicatorTransaction);

router.route('/list')
    .get(authorize(PERMISSIONS.SYNDICATOR_TRANSACTION.READ), getSyndicatorTransactionsList);

router.route('/:id')
    .get(authorize(PERMISSIONS.SYNDICATOR_TRANSACTION.READ), getSyndicatorTransaction)
    .put(authorize(PERMISSIONS.SYNDICATOR_TRANSACTION.UPDATE), updateSyndicatorTransaction);

module.exports = router;


