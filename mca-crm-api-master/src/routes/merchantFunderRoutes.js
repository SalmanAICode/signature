const express = require('express');
const {
    getMerchantFunders,
    getMerchantFunder,
    getMerchantFunderList,
    createMerchantFunder,
    updateMerchantFunder,
    deleteMerchantFunder,
    getCacheStats,
    clearCache,
    invalidateFunderCache,
    invalidateMerchantCache
} = require('../controllers/merchantFunderController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Apply protection to all routes
router.use(protect);

router.route('/')
    .get(authorize(PERMISSIONS.MERCHANT_FUNDER.READ), getMerchantFunders)
    .post(authorize(PERMISSIONS.MERCHANT_FUNDER.CREATE), createMerchantFunder);

router.route('/list')
    .get(authorize(PERMISSIONS.MERCHANT_FUNDER.READ), getMerchantFunderList);

// Cache management routes (Admin only)
router.route('/cache/stats')
    .get(authorize(PERMISSIONS.MERCHANT_FUNDER.READ), getCacheStats);

router.route('/cache')
    .delete(authorize(PERMISSIONS.MERCHANT_FUNDER.DELETE), clearCache);

router.route('/cache/funder/:funderId')
    .delete(authorize(PERMISSIONS.MERCHANT_FUNDER.DELETE), invalidateFunderCache);

router.route('/cache/merchant/:merchantId')
    .delete(authorize(PERMISSIONS.MERCHANT_FUNDER.DELETE), invalidateMerchantCache);

// Some Routes that only admins and funders can access
router.route('/:id')
    .get(authorize(PERMISSIONS.MERCHANT_FUNDER.READ), getMerchantFunder)
    .put(authorize(PERMISSIONS.MERCHANT_FUNDER.UPDATE), updateMerchantFunder)
    .delete(authorize(PERMISSIONS.MERCHANT_FUNDER.DELETE), deleteMerchantFunder);

module.exports = router; 