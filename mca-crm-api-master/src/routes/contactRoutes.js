const express = require('express');
const {
    getContacts,
    getContact,
    getMe,
    updateDetails,
    updatePassword,
    getContactList,
    createContact,
    updateContact,
    deleteContact,
} = require('../controllers/contactController');

const {
    getContactMerchants,
    getContactMerchantsList,
    createContactMerchant,
    updateContactMerchant,
    deleteContactMerchant
} = require('../controllers/contactMerchantController');

const {
    getContactAccessLogs,
    getContactAccessLogList,
    getContactAccessLog,
    getContactAccessLogsByContactId,
    getContactAccessLogsByOperation,
    getRecentContactActivity,
    getContactLoginStats,
    createContactAccessLog,
    deleteOldContactAccessLogs
} = require('../controllers/contactAccessLogController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// @todo createContact don't need protect, so it need other verification methods, such as cache verification
router.route('/')
    .get(protect, authorize(PERMISSIONS.CONTACT.READ), getContacts)
    .post(protect, authorize(PERMISSIONS.CONTACT.CREATE), createContact);

// For the login contact
router.route('/me')
    .get(protect, authorize(PERMISSIONS.CONTACT.SELF), getMe);
router.route('/updatedetails')
    .put(protect, authorize(PERMISSIONS.CONTACT.SELF), updateDetails);
router.route('/updatepassword')
    .put(protect, authorize(PERMISSIONS.CONTACT.SELF), updatePassword);

router.route('/list')
    .get(protect, authorize(PERMISSIONS.CONTACT.READ), getContactList);

// Contact Access Log routes
router.route('/access-logs')
    .get(protect, authorize(PERMISSIONS.CONTACT.READ), getContactAccessLogs)
    .post(protect, authorize(PERMISSIONS.CONTACT.CREATE), createContactAccessLog);

router.route('/access-logs/list')
    .get(protect, authorize(PERMISSIONS.CONTACT.READ), getContactAccessLogList);

router.route('/access-logs/recent-activity')
    .get(protect, authorize(PERMISSIONS.CONTACT.READ), getRecentContactActivity);

router.route('/access-logs/operation/:operation')
    .get(protect, authorize(PERMISSIONS.CONTACT.READ), getContactAccessLogsByOperation);

router.route('/access-logs/cleanup')
    .delete(protect, authorize(PERMISSIONS.CONTACT.DELETE), deleteOldContactAccessLogs);

router.route('/access-logs/:id')
    .get(protect, authorize(PERMISSIONS.CONTACT.READ), getContactAccessLog);

// Some Routes that only admins and merchants can access
router.route('/:id')
    .get(protect, authorize(PERMISSIONS.CONTACT.READ), getContact)
    .put(protect, authorize(PERMISSIONS.CONTACT.UPDATE), updateContact)
    .delete(protect, authorize(PERMISSIONS.CONTACT.DELETE), deleteContact);

// Contact Access Logs by Contact ID
router.route('/:id/access-logs')
    .get(protect, authorize(PERMISSIONS.CONTACT.READ), getContactAccessLogsByContactId);

router.route('/:id/access-logs/stats')
    .get(protect, authorize(PERMISSIONS.CONTACT.READ), getContactLoginStats);

router.route('/:id/merchants')
    .get(protect, authorize(PERMISSIONS.MERCHANT_CONTACT.READ), getContactMerchants)
    .post(protect, authorize(PERMISSIONS.MERCHANT_CONTACT.CREATE), createContactMerchant);

router.route('/:id/merchants/list')
    .get(protect, authorize(PERMISSIONS.MERCHANT_CONTACT.READ), getContactMerchantsList);

router.route('/:id/merchants/:merchantId')
    .put(protect, authorize(PERMISSIONS.MERCHANT_CONTACT.UPDATE), updateContactMerchant)
    .delete(protect, authorize(PERMISSIONS.MERCHANT_CONTACT.DELETE), deleteContactMerchant);

module.exports = router; 