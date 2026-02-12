const express = require('express');
const {
    getMerchants,
    getMerchant,
    getMerchantList,
    createMerchant,
    updateMerchant,
    deleteMerchant,
} = require('../controllers/merchantController');

const {
    getMerchantContacts,
    getMerchantContactsList,
    createMerchantContact,
    updateMerchantContact,
    deleteMerchantContact
} = require('../controllers/contactMerchantController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Apply protection to all routes
router.use(protect);

// Some routes that only admins and merchants can access
router.route('/')
    .get(authorize(PERMISSIONS.MERCHANT.READ), getMerchants)
    .post(authorize(PERMISSIONS.MERCHANT.CREATE), createMerchant);

router.route('/list')
    .get(authorize(PERMISSIONS.MERCHANT.READ), getMerchantList);

// Some Routes that only admins and merchants can access
router.route('/:id')
    .get(authorize(PERMISSIONS.MERCHANT.READ), getMerchant)
    .put(authorize(PERMISSIONS.MERCHANT.UPDATE), updateMerchant)
    .delete(authorize(PERMISSIONS.MERCHANT.DELETE), deleteMerchant);

router.route('/:id/contacts')
    .get(authorize(PERMISSIONS.MERCHANT_CONTACT.READ), getMerchantContacts)
    .post(authorize(PERMISSIONS.MERCHANT_CONTACT.CREATE), createMerchantContact);

router.route('/:id/contacts/list')
    .get(authorize(PERMISSIONS.MERCHANT_CONTACT.READ), getMerchantContactsList);

router.route('/:id/contacts/:contactId')
    .put(authorize(PERMISSIONS.MERCHANT_CONTACT.UPDATE), updateMerchantContact)
    .delete(authorize(PERMISSIONS.MERCHANT_CONTACT.DELETE), deleteMerchantContact);

module.exports = router; 