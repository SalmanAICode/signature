const express = require('express');
const {
    getMe,
    updateDetails,
    updatePassword,
    getAdmins,
    getAdminList,
    getAdmin,
    createAdmin,
    updateAdmin,
    deleteAdmin
} = require('../controllers/adminController');

const {
    getAdminAccessLogs,
    getAdminAccessLogList,
    getAdminAccessLog,
    getAdminAccessLogsByAdminId,
    getAdminAccessLogsByOperation,
    getRecentAdminActivity,
    getAdminLoginStats,
    createAdminAccessLog,
    deleteOldAdminAccessLogs
} = require('../controllers/adminAccessLogController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PORTAL_TYPES } = require('../utils/constants');

// Protect all routes after this middleware
router.use(protect);
router.use(authorize(PORTAL_TYPES.ADMIN));

// For the login admin
router.get('/me', getMe);
router.put('/updatedetails', updateDetails);
router.put('/updatepassword', updatePassword);

// For the admin portal
router
    .route('/')
    .get(getAdmins)
    .post(createAdmin);

router
    .route('/list')
    .get(getAdminList);

router
    .route('/:id')
    .get(getAdmin)
    .put(updateAdmin)
    .delete(deleteAdmin);

// Admin Access Log Routes
router
    .route('/access-logs')
    .get(getAdminAccessLogs)
    .post(createAdminAccessLog);

router
    .route('/access-logs/list')
    .get(getAdminAccessLogList);

router
    .route('/access-logs/recent-activity')
    .get(getRecentAdminActivity);

router
    .route('/access-logs/operation/:operation')
    .get(getAdminAccessLogsByOperation);

router
    .route('/access-logs/cleanup')
    .delete(deleteOldAdminAccessLogs);

router
    .route('/access-logs/:id')
    .get(getAdminAccessLog);

router
    .route('/:id/access-logs')
    .get(getAdminAccessLogsByAdminId);

router
    .route('/:id/access-logs/stats')
    .get(getAdminLoginStats);

module.exports = router;