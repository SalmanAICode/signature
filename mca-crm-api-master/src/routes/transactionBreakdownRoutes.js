const express = require('express');
const {
    getTransactionBreakdowns,
    getTransactionBreakdownList,
    getTransactionBreakdown,
    createTransactionBreakdown,
    updateTransactionBreakdown,
    deleteTransactionBreakdown,
    getBreakdownsByTransaction,
    getBreakdownSummaryByTransaction
} = require('../controllers/transactionBreakdownController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Apply protection to all routes
router.use(protect);

// Get all transaction breakdowns
router.route('/')
    .get(authorize(PERMISSIONS.TRANSACTION_BREAKDOWN.READ), getTransactionBreakdowns)
    .post(authorize(PERMISSIONS.TRANSACTION_BREAKDOWN.CREATE), createTransactionBreakdown);

// Get transaction breakdown list without pagination
router.route('/list')
    .get(authorize(PERMISSIONS.TRANSACTION_BREAKDOWN.READ), getTransactionBreakdownList);

// Get single transaction breakdown, update, delete
router.route('/:id')
    .get(authorize(PERMISSIONS.TRANSACTION_BREAKDOWN.READ), getTransactionBreakdown)
    .put(authorize(PERMISSIONS.TRANSACTION_BREAKDOWN.UPDATE), updateTransactionBreakdown)
    .delete(authorize(PERMISSIONS.TRANSACTION_BREAKDOWN.DELETE), deleteTransactionBreakdown);

// Get breakdowns by transaction
router.route('/transaction/:transactionId')
    .get(authorize(PERMISSIONS.TRANSACTION_BREAKDOWN.READ), getBreakdownsByTransaction);

// Get breakdown summary by transaction
router.route('/transaction/:transactionId/summary')
    .get(authorize(PERMISSIONS.TRANSACTION_BREAKDOWN.READ), getBreakdownSummaryByTransaction);

module.exports = router; 