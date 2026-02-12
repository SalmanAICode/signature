const express = require('express');
const {
    getMerchantAccounts,
    createMerchantAccount,
    getMerchantAccountsList,
    updateMerchantAccount,
    getMerchantAccount,
    deleteMerchantAccount
} = require('../controllers/merchantAccountController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Apply protection to all routes
router.use(protect);

router.route('/')
    .get(authorize(PERMISSIONS.MERCHANT_ACCOUNT.READ), getMerchantAccounts)
    .post(authorize(PERMISSIONS.MERCHANT_ACCOUNT.CREATE), createMerchantAccount);

router.route('/list')
    .get(authorize(PERMISSIONS.MERCHANT_ACCOUNT.READ), getMerchantAccountsList);

router.route('/:id')
    .get(authorize(PERMISSIONS.MERCHANT_ACCOUNT.READ), getMerchantAccount)
    .put(authorize(PERMISSIONS.MERCHANT_ACCOUNT.UPDATE), updateMerchantAccount)
    .delete(authorize(PERMISSIONS.MERCHANT_ACCOUNT.DELETE), deleteMerchantAccount);

module.exports = router;
