const express = require('express');
const {
    getDisbursementIntents,
    getDisbursementIntent,
    getDisbursementIntentList,
    createDisbursementIntent,
    updateDisbursementIntent
} = require('../controllers/disbursementIntentController');

const {
    getDisbursements,
    getDisbursement,
    getDisbursementList,
    createDisbursement,
    updateDisbursement,
    processed,
    succeed,
    failed,
    reconcile
} = require('../controllers/disbursementController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Apply protection to all routes
router.use(protect);

router.route('/')
    .get(authorize(PERMISSIONS.DISBURSEMENT_INTENT.READ), getDisbursementIntents)
    .post(authorize(PERMISSIONS.DISBURSEMENT_INTENT.CREATE), createDisbursementIntent);

router.route('/list')
    .get(authorize(PERMISSIONS.DISBURSEMENT_INTENT.READ), getDisbursementIntentList);

router.route('/:id')
    .get(authorize(PERMISSIONS.DISBURSEMENT_INTENT.READ), getDisbursementIntent)
    .put(authorize(PERMISSIONS.DISBURSEMENT_INTENT.UPDATE), updateDisbursementIntent);

router.route('/:id/disbursements')
    .get(authorize(PERMISSIONS.DISBURSEMENT_INTENT.READ), getDisbursements)
    .post(authorize(PERMISSIONS.DISBURSEMENT_INTENT.CREATE), createDisbursement);

router.route('/:id/disbursements/list')
    .get(authorize(PERMISSIONS.DISBURSEMENT_INTENT.READ), getDisbursementList);

router.route('/:id/disbursements/:disbursementId')
    .get(authorize(PERMISSIONS.DISBURSEMENT_INTENT.READ), getDisbursement)
    .put(authorize(PERMISSIONS.DISBURSEMENT_INTENT.UPDATE), updateDisbursement);

router.route('/:id/disbursements/:disbursementId/processed')
    .put(authorize(PERMISSIONS.DISBURSEMENT_INTENT.UPDATE), processed);

router.route('/:id/disbursements/:disbursementId/succeed')
    .put(authorize(PERMISSIONS.DISBURSEMENT_INTENT.UPDATE), succeed);

router.route('/:id/disbursements/:disbursementId/failed')
    .put(authorize(PERMISSIONS.DISBURSEMENT_INTENT.UPDATE), failed);

router.route('/:id/disbursements/:disbursementId/reconcile')
    .put(authorize(PERMISSIONS.DISBURSEMENT_INTENT.UPDATE), reconcile);

module.exports = router; 