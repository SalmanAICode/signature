const express = require('express');
const {
    getLenders,
    getLender,
    getLenderList,
    createLender,
    updateLender,
    deleteLender,
    transferBalanceToSyndicator
} = require('../controllers/lenderController');

const {
    getLenderUsers,
    getLenderUsersList,
    createLenderUser,
    deleteLenderUser
} = require('../controllers/userLenderController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Apply protection to all routes
router.use(protect);

// Some routes are protected by the lender permission
router.route('/')
    .get(authorize(PERMISSIONS.LENDER.READ), getLenders)
    .post(authorize(PERMISSIONS.LENDER.CREATE), createLender);

router.route('/list')
    .get(authorize(PERMISSIONS.LENDER.READ), getLenderList);

// Some Routes that only admins and funders can access
router.route('/:id')
    .get(authorize(PERMISSIONS.LENDER.READ), getLender)
    .put(authorize(PERMISSIONS.LENDER.UPDATE), updateLender)
    .delete(authorize(PERMISSIONS.LENDER.DELETE), deleteLender);

router.route('/:id/users')
    .get(authorize(PERMISSIONS.USER_LENDER.READ), getLenderUsers)
    .post(authorize(PERMISSIONS.USER_LENDER.CREATE), createLenderUser);

router.route('/:id/users/list')
    .get(authorize(PERMISSIONS.USER_LENDER.READ), getLenderUsersList);

router.route('/:id/users/:userId')
    .delete(authorize(PERMISSIONS.USER_LENDER.DELETE), deleteLenderUser);

router.route('/:id/syndicators/:syndicatorId/transfer')
    .post(authorize(PERMISSIONS.USER_LENDER.SELF), transferBalanceToSyndicator);

module.exports = router; 