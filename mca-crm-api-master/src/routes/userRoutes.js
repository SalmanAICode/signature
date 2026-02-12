const express = require('express');
const {
    getUsers,
    getUser,
    getMe,
    updateDetails,
    updatePassword,
    getUserList,
    createUser,
    updateUser,
    deleteUser,
} = require('../controllers/userController');

const {
    getUserFunders,
    getUserFunderList,
    createUserFunder,
    deleteUserFunder,
    getCacheStats,
    clearCache,
    invalidateUserCache,
    invalidateFunderCache
} = require('../controllers/userFunderController');

const {
    getUserLenders,
    getUserLenderList,
    createUserLender,
    deleteUserLender
} = require('../controllers/userLenderController');

const {
    getUserAccessLogs,
    getUserAccessLogList,
    getUserAccessLog,
    getUserAccessLogsByUserId,
    getUserAccessLogsByOperation,
    getRecentUserActivity,
    getUserLoginStats,
    createUserAccessLog,
    deleteOldUserAccessLogs
} = require('../controllers/userAccessLogController');

const {
    sendVerificationEmail,
    verifyEmailWithCode,
} = require('../controllers/emailVerificationController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { userCreationAuth } = require('../middleware/userCreationAuth');
const { PERMISSIONS } = require('../utils/permissions');

router.post('/verification/send-verification', sendVerificationEmail);
router.post('/verification/verify-code', verifyEmailWithCode);
router.post('/verification/create-user', userCreationAuth, createUser);

router.use(protect);

// Some routes that only admins and funders can access
router.route('/')
    .get(authorize(PERMISSIONS.USER.READ), getUsers)
    .post(authorize(PERMISSIONS.USER.CREATE), createUser);

// For the login user
router.get('/me', authorize(PERMISSIONS.USER.SELF), getMe);
router.put('/updatedetails', authorize(PERMISSIONS.USER.SELF), updateDetails);
router.put('/updatepassword', authorize(PERMISSIONS.USER.SELF), updatePassword);

router.route('/list')
    .get(authorize(PERMISSIONS.USER.READ), getUserList);

// User Access Log routes
router.route('/access-logs')
    .get(authorize(PERMISSIONS.USER.READ), getUserAccessLogs)
    .post(authorize(PERMISSIONS.USER.CREATE), createUserAccessLog);

router.route('/access-logs/list')
    .get(authorize(PERMISSIONS.USER.READ), getUserAccessLogList);

router.route('/access-logs/recent-activity')
    .get(authorize(PERMISSIONS.USER.READ), getRecentUserActivity);

router.route('/access-logs/operation/:operation')
    .get(authorize(PERMISSIONS.USER.READ), getUserAccessLogsByOperation);

router.route('/access-logs/cleanup')
    .delete(authorize(PERMISSIONS.USER.DELETE), deleteOldUserAccessLogs);

router.route('/access-logs/:id')
    .get(authorize(PERMISSIONS.USER.READ), getUserAccessLog);

// Some Routes that only admins and funders can access
router.route('/:id')
    .get(authorize(PERMISSIONS.USER.READ), getUser)
    .put(authorize(PERMISSIONS.USER.UPDATE), updateUser)
    .delete(authorize(PERMISSIONS.USER.DELETE), deleteUser);

// User Access Logs by User ID
router.route('/:id/access-logs')
    .get(authorize(PERMISSIONS.USER.READ), getUserAccessLogsByUserId);

router.route('/:id/access-logs/stats')
    .get(authorize(PERMISSIONS.USER.READ), getUserLoginStats);

// User-Funder Cache management routes (Admin only)
router.route('/funders/cache/stats')
    .get(authorize(PERMISSIONS.USER_FUNDER.READ), getCacheStats);

router.route('/funders/cache')
    .delete(authorize(PERMISSIONS.USER_FUNDER.DELETE), clearCache);

router.route('/funders/cache/user/:userId')
    .delete(authorize(PERMISSIONS.USER_FUNDER.DELETE), invalidateUserCache);

router.route('/funders/cache/funder/:funderId')
    .delete(authorize(PERMISSIONS.USER_FUNDER.DELETE), invalidateFunderCache);

router.route('/:id/funders')
    .get(authorize(PERMISSIONS.USER_FUNDER.READ), getUserFunders)
    .post(authorize(PERMISSIONS.USER_FUNDER.CREATE), createUserFunder);

router.route('/:id/funders/list')
    .get(authorize(PERMISSIONS.USER_FUNDER.READ), getUserFunderList);

router.route('/:id/funders/:funderId')
    .delete(authorize(PERMISSIONS.USER_FUNDER.DELETE), deleteUserFunder);

router.route('/:id/lenders')
    .get(authorize(PERMISSIONS.USER_LENDER.READ), getUserLenders)
    .post(authorize(PERMISSIONS.USER_LENDER.CREATE), createUserLender);

router.route('/:id/lenders/list')
    .get(authorize(PERMISSIONS.USER_LENDER.READ), getUserLenderList);

router.route('/:id/lenders/:lenderId')
    .delete(authorize(PERMISSIONS.USER_LENDER.DELETE), deleteUserLender);       

module.exports = router; 