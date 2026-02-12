const express = require('express');
const {
    getSyndicators,
    getSyndicator,
    getMe,
    updateDetails,
    updatePassword,
    getSyndicatorList,
    createSyndicator,
    updateSyndicator,
    deleteSyndicator,
    transferBalanceToFunder
} = require('../controllers/syndicatorController');


const {
    getSyndicatorAccessLogs,
    getSyndicatorAccessLogList,
    getSyndicatorAccessLog,
    getSyndicatorAccessLogsBySyndicatorId,
    getSyndicatorAccessLogsByOperation,
    getRecentSyndicatorActivity,
    getSyndicatorLoginStats,
    createSyndicatorAccessLog,
    deleteOldSyndicatorAccessLogs
} = require('../controllers/syndicatorAccessLogController');

const {
    getSyndicatorDashboard,
    getSyndicatorDashboardForFunders
} = require('../controllers/syndicatorDashboardController');

const {
    getMonthlyExpectedVsReceived
} = require('../controllers/monthlyExpectedVsReceivedController');

const {
    getUpcomingPayouts
} = require('../controllers/upcomingPayoutsController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Apply protection to all routes
router.use(protect);

// Some routes that only admins and funders can access
router.route('/')
    .get(authorize(PERMISSIONS.SYNDICATOR.READ), getSyndicators)
    .post(authorize(PERMISSIONS.SYNDICATOR.CREATE), createSyndicator);

// For the login syndicator
router.get('/me', authorize(PERMISSIONS.SYNDICATOR.SELF), getMe);
router.put('/updatedetails', authorize(PERMISSIONS.SYNDICATOR.SELF), updateDetails);
router.put('/updatepassword', authorize(PERMISSIONS.SYNDICATOR.SELF), updatePassword);

router.route('/list')
    .get(authorize(PERMISSIONS.SYNDICATOR.READ), getSyndicatorList);

// Syndicator Dashboard routes
router.route('/dashboard-data')
    .get(authorize(PERMISSIONS.SYNDICATOR.SELF), getSyndicatorDashboard)
    .post(authorize(PERMISSIONS.SYNDICATOR.SELF), getSyndicatorDashboardForFunders);

// Monthly Expected vs Received routes
router.route('/monthly-expected-vs-received')
    .get(authorize(PERMISSIONS.SYNDICATOR.SELF), getMonthlyExpectedVsReceived);

// Syndicator Access Log routes
router.route('/access-logs')
    .get(authorize(PERMISSIONS.SYNDICATOR.READ), getSyndicatorAccessLogs)
    .post(authorize(PERMISSIONS.SYNDICATOR.CREATE), createSyndicatorAccessLog);

router.route('/access-logs/list')
    .get(authorize(PERMISSIONS.SYNDICATOR.READ), getSyndicatorAccessLogList);

router.route('/access-logs/recent-activity')
    .get(authorize(PERMISSIONS.SYNDICATOR.READ), getRecentSyndicatorActivity);

router.route('/access-logs/operation/:operation')
    .get(authorize(PERMISSIONS.SYNDICATOR.READ), getSyndicatorAccessLogsByOperation);

router.route('/access-logs/cleanup')
    .delete(authorize(PERMISSIONS.SYNDICATOR.DELETE), deleteOldSyndicatorAccessLogs);

router.route('/access-logs/:id')
    .get(authorize(PERMISSIONS.SYNDICATOR.READ), getSyndicatorAccessLog);

// Upcoming Payouts Timeline (must be before /:id route to avoid route conflict)
router.route('/upcoming-payouts')
    .get(authorize(PERMISSIONS.SYNDICATOR.SELF), getUpcomingPayouts);

// Some Routes that only admins and funders can access
router.route('/:id')
    .get(authorize(PERMISSIONS.SYNDICATOR.READ), getSyndicator)
    .put(authorize(PERMISSIONS.SYNDICATOR.UPDATE), updateSyndicator)
    .delete(authorize(PERMISSIONS.SYNDICATOR.DELETE), deleteSyndicator);

// Syndicator Access Logs by Syndicator ID
router.route('/:id/access-logs')
    .get(authorize(PERMISSIONS.SYNDICATOR.READ), getSyndicatorAccessLogsBySyndicatorId);

router.route('/:id/access-logs/stats')
    .get(authorize(PERMISSIONS.SYNDICATOR.READ), getSyndicatorLoginStats);

router.route('/:id/funders/:funderId/transfer')
    .post(authorize(PERMISSIONS.SYNDICATOR.SELF), transferBalanceToFunder);

module.exports = router; 