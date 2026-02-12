const express = require('express');
const {
    getSyndicatorAccounts,
    createSyndicatorAccount,
    getSyndicatorAccountList,
    updateSyndicatorAccount,
    getSyndicatorAccount,
    deleteSyndicatorAccount
} = require('../controllers/syndicatorAccountController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Apply protection to all routes
router.use(protect);

router.route('/')
    .get(authorize(PERMISSIONS.SYNDICATOR_ACCOUNT.READ), getSyndicatorAccounts)
    .post(authorize(PERMISSIONS.SYNDICATOR_ACCOUNT.CREATE), createSyndicatorAccount);

router.route('/list')
    .get(authorize(PERMISSIONS.SYNDICATOR_ACCOUNT.READ), getSyndicatorAccountList);

router.route('/:id')
    .get(authorize(PERMISSIONS.SYNDICATOR_ACCOUNT.READ), getSyndicatorAccount)
    .put(authorize(PERMISSIONS.SYNDICATOR_ACCOUNT.UPDATE), updateSyndicatorAccount)
    .delete(authorize(PERMISSIONS.SYNDICATOR_ACCOUNT.DELETE), deleteSyndicatorAccount);

module.exports = router; 