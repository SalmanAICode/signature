const express = require('express');
const {
    getPaybackPlans,
    createPaybackPlan,
    getPaybackPlanList,
    updatePaybackPlan,
    getPaybackPlan,
    generateNextPaybacks,
    generatePaybackList,
    getPaybackPlanScheduleWithStatus
} = require('../controllers/paybackPlanController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Apply protection to all routes
router.use(protect);

router.route('/')
    .get(authorize(PERMISSIONS.PAYBACK_PLAN.READ), getPaybackPlans)
    .post(authorize(PERMISSIONS.PAYBACK_PLAN.CREATE), createPaybackPlan);

router.route('/list')
    .get(authorize(PERMISSIONS.PAYBACK_PLAN.READ), getPaybackPlanList);

router.route('/generate')
    .get(authorize(PERMISSIONS.PAYBACK_PLAN.READ), generatePaybackList);

router.route('/:id')
    .get(authorize(PERMISSIONS.PAYBACK_PLAN.READ), getPaybackPlan)
    .put(authorize(PERMISSIONS.PAYBACK_PLAN.UPDATE), updatePaybackPlan);

router.route('/:id/generate')
    .post(authorize(PERMISSIONS.PAYBACK_PLAN.UPDATE), generateNextPaybacks);

router.route('/:id/schedule-with-status')
    .get(authorize(PERMISSIONS.PAYBACK_PLAN.READ), getPaybackPlanScheduleWithStatus);

module.exports = router;
