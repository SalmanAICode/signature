const express = require('express');
const {
    getExpenseTypes,
    createExpenseType,
    getExpenseTypesList,
    updateExpenseType,
    getExpenseTypeById,
    deleteExpenseType
} = require('../controllers/expenseTypeController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

router.use(protect);

router.route('/')
    .get(authorize(PERMISSIONS.EXPENSE_TYPE.READ), getExpenseTypes)
    .post(authorize(PERMISSIONS.EXPENSE_TYPE.CREATE), createExpenseType);

router.route('/list')
    .get(authorize(PERMISSIONS.EXPENSE_TYPE.READ), getExpenseTypesList);

router.route('/:id')
    .get(authorize(PERMISSIONS.EXPENSE_TYPE.READ), getExpenseTypeById)
    .put(authorize(PERMISSIONS.EXPENSE_TYPE.UPDATE), updateExpenseType)
    .delete(authorize(PERMISSIONS.EXPENSE_TYPE.DELETE), deleteExpenseType);

module.exports = router;