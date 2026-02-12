// Third-party imports
const express = require('express');

// Internal imports
const {
    getISOMerchants,
    getISOMerchantList,
    getISOMerchant,
    createISOMerchant,
    updateISOMerchant,
    deleteISOMerchant,
    getCacheStats,
    clearCache,
    invalidateISOCache,
    invalidateMerchantCache
} = require('../controllers/isoMerchantController');

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// ISO-Merchant routes
router.route('/')
    .get(authorize(PERMISSIONS.ISO_MERCHANT.READ), getISOMerchants)
    .post(authorize(PERMISSIONS.ISO_MERCHANT.CREATE), createISOMerchant);

router.route('/list')
    .get(authorize(PERMISSIONS.ISO_MERCHANT.READ), getISOMerchantList);

// Cache management routes (Admin only)
router.route('/cache/stats')
    .get(authorize(PERMISSIONS.ISO_MERCHANT.READ), getCacheStats);

router.route('/cache')
    .delete(authorize(PERMISSIONS.ISO_MERCHANT.DELETE), clearCache);

router.route('/cache/iso/:isoId')
    .delete(authorize(PERMISSIONS.ISO_MERCHANT.DELETE), invalidateISOCache);

router.route('/cache/merchant/:merchantId')
    .delete(authorize(PERMISSIONS.ISO_MERCHANT.DELETE), invalidateMerchantCache);

router.route('/:id')
    .get(authorize(PERMISSIONS.ISO_MERCHANT.READ), getISOMerchant)
    .put(authorize(PERMISSIONS.ISO_MERCHANT.UPDATE), updateISOMerchant)
    .delete(authorize(PERMISSIONS.ISO_MERCHANT.DELETE), deleteISOMerchant);

module.exports = router; 