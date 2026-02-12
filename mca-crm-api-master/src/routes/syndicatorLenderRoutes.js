const express = require('express');
const {
    getSyndicatorLenders,
    getSyndicatorLenderList,
    getSyndicatorLender,
    createSyndicatorLender,
    updateSyndicatorLender,
    deleteSyndicatorLender,
    getEnabledSyndicators,
    getSyndicatorRelationships
} = require('../controllers/syndicatorLenderController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Apply protection to all routes
router.use(protect);

router.route('/')
    .get(authorize(PERMISSIONS.SYNDICATOR_FUNDER.READ), getSyndicatorLenders)
    .post(authorize(PERMISSIONS.SYNDICATOR_FUNDER.CREATE), createSyndicatorLender);

router.route('/list')
    .get(authorize(PERMISSIONS.SYNDICATOR_FUNDER.READ), getSyndicatorLenderList);

router.route('/enabled/:funderId/:lenderId')
    .get(authorize(PERMISSIONS.SYNDICATOR_FUNDER.READ), getEnabledSyndicators);

router.route('/syndicator/:syndicatorId')
    .get(authorize(PERMISSIONS.SYNDICATOR_FUNDER.READ), getSyndicatorRelationships);

router.route('/:id')
    .get(authorize(PERMISSIONS.SYNDICATOR_FUNDER.READ), getSyndicatorLender)
    .put(authorize(PERMISSIONS.SYNDICATOR_FUNDER.UPDATE), updateSyndicatorLender)
    .delete(authorize(PERMISSIONS.SYNDICATOR_FUNDER.DELETE), deleteSyndicatorLender);

module.exports = router;
