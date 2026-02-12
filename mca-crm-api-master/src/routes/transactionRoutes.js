const express = require('express');
const {
    getTransactions,
    getTransactionList,
    getTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    reconcileTransaction,
    unreconcileTransaction
} = require('../controllers/transactionController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Apply protection to all routes
router.use(protect);

// Get all transactions
router.route('/')
    .get(authorize(PERMISSIONS.TRANSACTION.READ), getTransactions)
    .post(authorize(PERMISSIONS.TRANSACTION.CREATE), createTransaction);

// Get transaction list without pagination
router.route('/list')
    .get(authorize(PERMISSIONS.TRANSACTION.READ), getTransactionList);

// Get single transaction, update, delete
router.route('/:id')
    .get(authorize(PERMISSIONS.TRANSACTION.READ), getTransaction)
    .put(authorize(PERMISSIONS.TRANSACTION.UPDATE), updateTransaction)
    .delete(authorize(PERMISSIONS.TRANSACTION.DELETE), deleteTransaction);

// Reconcile/Unreconcile transaction
router.route('/:id/reconcile')
    .put(authorize(PERMISSIONS.TRANSACTION.UPDATE), reconcileTransaction);

router.route('/:id/unreconcile')
    .put(authorize(PERMISSIONS.TRANSACTION.UPDATE), unreconcileTransaction);

module.exports = router; 