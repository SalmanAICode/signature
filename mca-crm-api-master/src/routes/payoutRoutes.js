const express = require('express');
const {
    getPayouts,
    createPayout,
    getPayoutList,
    getPayout,
    updatePayout,
    deletePayout
} = require('../controllers/payoutController');

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

const router = express.Router();

router.use(protect);

router.route('/')
    .get(authorize(PERMISSIONS.PAYOUT.READ), getPayouts)
    .post(authorize(PERMISSIONS.PAYOUT.CREATE), createPayout);

router.route('/list')
    .get(authorize(PERMISSIONS.PAYOUT.READ), getPayoutList);

router.route('/:id')
    .get(authorize(PERMISSIONS.PAYOUT.READ), getPayout)
    .put(authorize(PERMISSIONS.PAYOUT.UPDATE), updatePayout)
    .delete(authorize(PERMISSIONS.PAYOUT.DELETE), deletePayout);

module.exports = router;