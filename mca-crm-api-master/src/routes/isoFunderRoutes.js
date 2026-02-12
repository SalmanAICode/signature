const express = require('express');
const {
    getISOFunders,
    getISOFunder,
    getISOFunderList,
    createISOFunder,
    updateISOFunder,
    deleteISOFunder,
    getCacheStats,
    clearCache,
    invalidateISOCache,
    invalidateFunderCache
} = require('../controllers/isoFunderController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Apply protection to all routes
router.use(protect);

router.route('/')
    .get(authorize(PERMISSIONS.ISO_FUNDER.READ), getISOFunders)
    .post(authorize(PERMISSIONS.ISO_FUNDER.CREATE), createISOFunder);

router.route('/list')
    .get(authorize(PERMISSIONS.ISO_FUNDER.READ), getISOFunderList);

// Cache management routes (Admin only)
router.route('/cache/stats')
    .get(authorize(PERMISSIONS.ISO_FUNDER.READ), getCacheStats);

router.route('/cache')
    .delete(authorize(PERMISSIONS.ISO_FUNDER.DELETE), clearCache);

router.route('/cache/iso/:isoId')
    .delete(authorize(PERMISSIONS.ISO_FUNDER.DELETE), invalidateISOCache);

router.route('/cache/funder/:funderId')
    .delete(authorize(PERMISSIONS.ISO_FUNDER.DELETE), invalidateFunderCache);

// Some Routes that only admins and funders can access
router.route('/:id')
    .get(authorize(PERMISSIONS.ISO_FUNDER.READ), getISOFunder)
    .put(authorize(PERMISSIONS.ISO_FUNDER.UPDATE), updateISOFunder)
    .delete(authorize(PERMISSIONS.ISO_FUNDER.DELETE), deleteISOFunder);

module.exports = router; 