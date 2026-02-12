const express = require('express');
const {
    getRepresentatives,
    getRepresentative,
    getMe,
    updateDetails,
    updatePassword,
    getRepresentativeList,
    createRepresentative,
    updateRepresentative,
    deleteRepresentative,
} = require('../controllers/representativeController');

const {
    getRepresentativeAccessLogs,
    getRepresentativeAccessLogList,
    getRepresentativeAccessLog,
    getRepresentativeAccessLogsByRepresentativeId,
    getRepresentativeAccessLogsByOperation,
    getRecentRepresentativeActivity,
    getRepresentativeLoginStats,
    createRepresentativeAccessLog,
    deleteOldRepresentativeAccessLogs
} = require('../controllers/representativeAccessLogController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Apply protection to all routes
router.use(protect);

// Some routes that only admins and isos can access
router.route('/')
    .get(authorize(PERMISSIONS.REPRESENTATIVE.READ), getRepresentatives)
    .post(authorize(PERMISSIONS.REPRESENTATIVE.CREATE), createRepresentative);

// For the login representative
router.get('/me', authorize(PERMISSIONS.REPRESENTATIVE.SELF), getMe);
router.put('/updatedetails', authorize(PERMISSIONS.REPRESENTATIVE.SELF), updateDetails);
router.put('/updatepassword', authorize(PERMISSIONS.REPRESENTATIVE.SELF), updatePassword);

router.route('/list')
    .get(authorize(PERMISSIONS.REPRESENTATIVE.READ), getRepresentativeList);

// Representative Access Log routes
router.route('/access-logs')
    .get(authorize(PERMISSIONS.REPRESENTATIVE.READ), getRepresentativeAccessLogs)
    .post(authorize(PERMISSIONS.REPRESENTATIVE.CREATE), createRepresentativeAccessLog);

router.route('/access-logs/list')
    .get(authorize(PERMISSIONS.REPRESENTATIVE.READ), getRepresentativeAccessLogList);

router.route('/access-logs/recent-activity')
    .get(authorize(PERMISSIONS.REPRESENTATIVE.READ), getRecentRepresentativeActivity);

router.route('/access-logs/operation/:operation')
    .get(authorize(PERMISSIONS.REPRESENTATIVE.READ), getRepresentativeAccessLogsByOperation);

router.route('/access-logs/cleanup')
    .delete(authorize(PERMISSIONS.REPRESENTATIVE.DELETE), deleteOldRepresentativeAccessLogs);

router.route('/access-logs/:id')
    .get(authorize(PERMISSIONS.REPRESENTATIVE.READ), getRepresentativeAccessLog);

// Some Routes that only admins and isos can access
router.route('/:id')
    .get(authorize(PERMISSIONS.REPRESENTATIVE.READ), getRepresentative)
    .put(authorize(PERMISSIONS.REPRESENTATIVE.UPDATE), updateRepresentative)
    .delete(authorize(PERMISSIONS.REPRESENTATIVE.DELETE), deleteRepresentative);

// Representative Access Logs by Representative ID
router.route('/:id/access-logs')
    .get(authorize(PERMISSIONS.REPRESENTATIVE.READ), getRepresentativeAccessLogsByRepresentativeId);

router.route('/:id/access-logs/stats')
    .get(authorize(PERMISSIONS.REPRESENTATIVE.READ), getRepresentativeLoginStats);

module.exports = router;