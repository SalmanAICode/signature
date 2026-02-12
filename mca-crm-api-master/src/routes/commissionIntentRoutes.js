const express = require('express');
const {
    getCommissionIntents,
    getCommissionIntent,
    getCommissionIntentList,
    createCommissionIntent,
    updateCommissionIntent
} = require('../controllers/commissionIntentController');

const {
    getCommissions,
    getCommission,
    getCommissionList,
    createCommission,
    updateCommission,
    processed,
    succeed,
    failed,
    reconcile
} = require('../controllers/commissionController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Apply protection to all routes
router.use(protect);

router.route('/')
    .get(authorize(PERMISSIONS.COMMISSION_INTENT.READ), getCommissionIntents)
    .post(authorize(PERMISSIONS.COMMISSION_INTENT.CREATE), createCommissionIntent);

router.route('/list')
    .get(authorize(PERMISSIONS.COMMISSION_INTENT.READ), getCommissionIntentList);

router.route('/:id')
    .get(authorize(PERMISSIONS.COMMISSION_INTENT.READ), getCommissionIntent)
    .put(authorize(PERMISSIONS.COMMISSION_INTENT.UPDATE), updateCommissionIntent);

router.route('/:id/commissions')
    .get(authorize(PERMISSIONS.COMMISSION_INTENT.READ), getCommissions)
    .post(authorize(PERMISSIONS.COMMISSION_INTENT.CREATE), createCommission);

router.route('/:id/commissions/list')
    .get(authorize(PERMISSIONS.COMMISSION_INTENT.READ), getCommissionList);

router.route('/:id/commissions/:commissionId')
    .get(authorize(PERMISSIONS.COMMISSION_INTENT.READ), getCommission)
    .put(authorize(PERMISSIONS.COMMISSION_INTENT.UPDATE), updateCommission);

router.route('/:id/commissions/:commissionId/processed')
    .put(authorize(PERMISSIONS.COMMISSION_INTENT.UPDATE), processed);

router.route('/:id/commissions/:commissionId/succeed')
    .put(authorize(PERMISSIONS.COMMISSION_INTENT.UPDATE), succeed);

router.route('/:id/commissions/:commissionId/failed')
    .put(authorize(PERMISSIONS.COMMISSION_INTENT.UPDATE), failed);

router.route('/:id/commissions/:commissionId/reconcile')
    .put(authorize(PERMISSIONS.COMMISSION_INTENT.UPDATE), reconcile);

module.exports = router; 