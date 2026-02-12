const express = require('express');
const {
    getSyndicationOffers,
    createSyndicationOffer,
    getSyndicationOffersList,
    updateSyndicationOffer,
    getSyndicationOffer,
    deleteSyndicationOffer,
    acceptSyndicationOffer
} = require('../controllers/syndicationOfferController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Apply protection to all routes
router.use(protect);

router.route('/')
    .get(authorize(PERMISSIONS.SYNDICATION_OFFER.READ), getSyndicationOffers)
    .post(authorize(PERMISSIONS.SYNDICATION_OFFER.CREATE), createSyndicationOffer);

router.route('/list')
    .get(authorize(PERMISSIONS.SYNDICATION_OFFER.READ), getSyndicationOffersList);

router.route('/:id')
    .get(authorize(PERMISSIONS.SYNDICATION_OFFER.READ), getSyndicationOffer)
    .put(authorize(PERMISSIONS.SYNDICATION_OFFER.UPDATE), updateSyndicationOffer)
    .delete(authorize(PERMISSIONS.SYNDICATION_OFFER.DELETE), deleteSyndicationOffer);

router.route('/:id/accept')
    .post(authorize(PERMISSIONS.SYNDICATION_OFFER.UPDATE), acceptSyndicationOffer);

module.exports = router; 