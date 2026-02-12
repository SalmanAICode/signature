const express = require('express');
const {
    getLenderAccounts,
    createLenderAccount,
    getLenderAccountList,
    updateLenderAccount,
    getLenderAccount,
    deleteLenderAccount
} = require('../controllers/lenderAccountController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Apply protection to all routes
router.use(protect);

router.route('/')
    .get(authorize(PERMISSIONS.LENDER_ACCOUNT.READ), getLenderAccounts)
    .post(authorize(PERMISSIONS.LENDER_ACCOUNT.CREATE), createLenderAccount);

router.route('/list')
    .get(authorize(PERMISSIONS.LENDER_ACCOUNT.READ), getLenderAccountList);

router.route('/:id')
    .get(authorize(PERMISSIONS.LENDER_ACCOUNT.READ), getLenderAccount)
    .put(authorize(PERMISSIONS.LENDER_ACCOUNT.UPDATE), updateLenderAccount)
    .delete(authorize(PERMISSIONS.LENDER_ACCOUNT.DELETE), deleteLenderAccount);

module.exports = router;
