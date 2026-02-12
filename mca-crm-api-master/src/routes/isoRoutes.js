// Third-party imports
const express = require('express');

// Internal imports
const {
    getISOs,
    getISO,
    getISOList,
    createISO,
    updateISO,
    deleteISO,
} = require('../controllers/isoController');

const {
    getISORepresentatives,
    getISORepresentativesList,
    createISORepresentative,
    deleteISORepresentative
} = require('../controllers/representativeISOController');

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// ISO routes
router.route('/')
    .get(authorize(PERMISSIONS.ISO.READ), getISOs)
    .post(authorize(PERMISSIONS.ISO.CREATE), createISO);

router.route('/list')
    .get(authorize(PERMISSIONS.ISO.READ), getISOList);

router.route('/:id')
    .get(authorize(PERMISSIONS.ISO.READ), getISO)
    .put(authorize(PERMISSIONS.ISO.UPDATE), updateISO)
    .delete(authorize(PERMISSIONS.ISO.DELETE), deleteISO);

router.route('/:id/representatives')
    .get(authorize(PERMISSIONS.REPRESENTATIVE_ISO.READ), getISORepresentatives)
    .post(authorize(PERMISSIONS.REPRESENTATIVE_ISO.CREATE), createISORepresentative);

router.route('/:id/representatives/list')
    .get(authorize(PERMISSIONS.REPRESENTATIVE_ISO.READ), getISORepresentativesList);

router.route('/:id/representatives/:representative')
    .delete(authorize(PERMISSIONS.REPRESENTATIVE_ISO.DELETE), deleteISORepresentative);

module.exports = router; 