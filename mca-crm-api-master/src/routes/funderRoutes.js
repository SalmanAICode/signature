const express = require('express');
const {
    getFunders,
    getFunder,
    getFunderList,
    createFunder,
    updateFunder,
    deleteFunder,
    getSelectedFunder,
    selectFunder,
} = require('../controllers/funderController');

const {
    getFunderUsers,
    getFunderUsersList,
    createFunderUser,
    deleteFunderUser
} = require('../controllers/userFunderController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Apply protection to all routes
router.use(protect);

// Some routes are protected by the funder permission
router.route('/')
    .get(authorize(PERMISSIONS.FUNDER.READ), getFunders)
    .post(authorize(PERMISSIONS.FUNDER.CREATE), createFunder);

router.route('/select')
    .get(authorize(PERMISSIONS.FUNDER.READ), getSelectedFunder)
    .post(authorize(PERMISSIONS.FUNDER.READ), selectFunder);

router.route('/list')
    .get(authorize(PERMISSIONS.FUNDER.READ), getFunderList);

// Some Routes that only admins and funders can access
router.route('/:id')
    .get(authorize(PERMISSIONS.FUNDER.READ), getFunder)
    .put(authorize(PERMISSIONS.FUNDER.UPDATE), updateFunder)
    .delete(authorize(PERMISSIONS.FUNDER.DELETE), deleteFunder);

router.route('/:id/users')
    .get(authorize(PERMISSIONS.USER_FUNDER.READ), getFunderUsers)
    .post(authorize(PERMISSIONS.USER_FUNDER.CREATE), createFunderUser);

router.route('/:id/users/list')
    .get(authorize(PERMISSIONS.USER_FUNDER.READ), getFunderUsersList);

router.route('/:id/users/:userId')
    .delete(authorize(PERMISSIONS.USER_FUNDER.DELETE), deleteFunderUser);

module.exports = router; 