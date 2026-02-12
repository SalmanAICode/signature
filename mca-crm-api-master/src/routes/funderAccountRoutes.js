const express = require('express');
const {
    getFunderAccounts,
    createFunderAccount,
    getFunderAccountList,
    updateFunderAccount,
    getFunderAccount,
    deleteFunderAccount
} = require('../controllers/funderAccountController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Apply protection to all routes
router.use(protect);

router.route('/')
    .get(authorize(PERMISSIONS.FUNDER_ACCOUNT.READ), getFunderAccounts)
    .post(authorize(PERMISSIONS.FUNDER_ACCOUNT.CREATE), createFunderAccount);

router.route('/list')
    .get(authorize(PERMISSIONS.FUNDER_ACCOUNT.READ), getFunderAccountList);

router.route('/:id')
    .get(authorize(PERMISSIONS.FUNDER_ACCOUNT.READ), getFunderAccount)
    .put(authorize(PERMISSIONS.FUNDER_ACCOUNT.UPDATE), updateFunderAccount)
    .delete(authorize(PERMISSIONS.FUNDER_ACCOUNT.DELETE), deleteFunderAccount);

module.exports = router;
