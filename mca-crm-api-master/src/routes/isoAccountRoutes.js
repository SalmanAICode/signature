const express = require('express');
const {
    getISOAccounts,
    createISOAccount,
    getISOAccountList,
    updateISOAccount,
    getISOAccount,
    deleteISOAccount
} = require('../controllers/isoAccountController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Apply protection to all routes
router.use(protect);

router.route('/')
    .get(authorize(PERMISSIONS.ISO_ACCOUNT.READ), getISOAccounts)
    .post(authorize(PERMISSIONS.ISO_ACCOUNT.CREATE), createISOAccount);

router.route('/list')
    .get(authorize(PERMISSIONS.ISO_ACCOUNT.READ), getISOAccountList);

router.route('/:id')
    .get(authorize(PERMISSIONS.ISO_ACCOUNT.READ), getISOAccount)
    .put(authorize(PERMISSIONS.ISO_ACCOUNT.UPDATE), updateISOAccount)
    .delete(authorize(PERMISSIONS.ISO_ACCOUNT.DELETE), deleteISOAccount);

module.exports = router;