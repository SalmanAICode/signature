const express = require('express');
const {
    getSyndicatorFunders,
    getSyndicatorFunder,
    getSyndicatorFunderList,
    createSyndicatorFunder,
    updateSyndicatorFunder,
    deleteSyndicatorFunder,
    getCacheStats,
    clearCache,
    invalidateSyndicatorCache,
    invalidateFunderCache
} = require('../controllers/syndicatorFunderController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Apply protection to all routes
router.use(protect);

router.route('/')
    .get(authorize(PERMISSIONS.SYNDICATOR_FUNDER.READ), getSyndicatorFunders)
    .post(authorize(PERMISSIONS.SYNDICATOR_FUNDER.CREATE), createSyndicatorFunder);

router.route('/list')
    .get(authorize(PERMISSIONS.SYNDICATOR_FUNDER.READ), getSyndicatorFunderList);

// Cache management routes (Admin only)
router.route('/cache/stats')
    .get(authorize(PERMISSIONS.SYNDICATOR_FUNDER.READ), getCacheStats);

router.route('/cache')
    .delete(authorize(PERMISSIONS.SYNDICATOR_FUNDER.DELETE), clearCache);

router.route('/cache/syndicator/:syndicatorId')
    .delete(authorize(PERMISSIONS.SYNDICATOR_FUNDER.DELETE), invalidateSyndicatorCache);

router.route('/cache/funder/:funderId')
    .delete(authorize(PERMISSIONS.SYNDICATOR_FUNDER.DELETE), invalidateFunderCache);

// Some Routes that only admins and funders can access
router.route('/:id')
    .get(authorize(PERMISSIONS.SYNDICATOR_FUNDER.READ), getSyndicatorFunder)
    .put(authorize(PERMISSIONS.SYNDICATOR_FUNDER.UPDATE), updateSyndicatorFunder)
    .delete(authorize(PERMISSIONS.SYNDICATOR_FUNDER.DELETE), deleteSyndicatorFunder);

module.exports = router; 