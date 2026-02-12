const express = require('express');
const {
    getFundingExpenses,
    getFundingExpenseList,
    createFundingExpense,
    getFundingExpense,
    updateFundingExpense,
    deleteFundingExpense
} = require('../controllers/fundingExpenseController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

router.use(protect);

router.route('/')
    .get(authorize(PERMISSIONS.FUNDING_EXPENSE.READ), getFundingExpenses)
    .post(authorize(PERMISSIONS.FUNDING_EXPENSE.CREATE), createFundingExpense);

router.route('/list')
    .get(authorize(PERMISSIONS.FUNDING_EXPENSE.READ), getFundingExpenseList);

router.route('/:id')
    .get(authorize(PERMISSIONS.FUNDING_EXPENSE.READ), getFundingExpense)
    .put(authorize(PERMISSIONS.FUNDING_EXPENSE.UPDATE), updateFundingExpense)
    .delete(authorize(PERMISSIONS.FUNDING_EXPENSE.DELETE), deleteFundingExpense);

module.exports = router; 