const express = require('express');
const {
    getApplications,
    getApplication,
    getApplicationList,
    createApplication,
    updateApplication,
    deleteApplication,
} = require('../controllers/applicationController');

const {
    getApplicationDocuments,
    getApplicationDocumentsList,
    getApplicationDocument,
    createApplicationDocument,
    updateApplicationDocument,
    deleteApplicationDocument
} = require('../controllers/applicationDocumentController');

const {
    getApplicationStipulations,
    getApplicationStipulationsList,
    getApplicationStipulation,
    createApplicationStipulation,
    updateApplicationStipulation,
    deleteApplicationStipulation
} = require('../controllers/applicationStipulationController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Apply protection to all routes
router.use(protect);

// Query applications and create a new application - requires read and create permission
router.route('/')
    .get(authorize(PERMISSIONS.APPLICATION.READ), getApplications)
    .post(authorize(PERMISSIONS.APPLICATION.CREATE), createApplication);

// List all applications - requires read permission
router.route('/list')
    .get(authorize(PERMISSIONS.APPLICATION.READ), getApplicationList);

// Get a single application, update an application, and delete an application - requires read, update, and delete permission
router.route('/:id')
    .get(authorize(PERMISSIONS.APPLICATION.READ), getApplication)
    .put(authorize(PERMISSIONS.APPLICATION.UPDATE), updateApplication)
    .delete(authorize(PERMISSIONS.APPLICATION.DELETE), deleteApplication);

// Get application documents and create a new application document - requires read and create permission
router.route('/:id/documents')
    .get(authorize(PERMISSIONS.APPLICATION_DOCUMENT.READ), getApplicationDocuments)
    .post(authorize(PERMISSIONS.APPLICATION_DOCUMENT.CREATE), createApplicationDocument);

// Get application documents list - requires read permission
router.route('/:id/documents/list')
    .get(authorize(PERMISSIONS.APPLICATION_DOCUMENT.READ), getApplicationDocumentsList);

// Get a single application document, update an application document, and delete an application document - requires read, update, and delete permission
router.route('/:id/documents/:documentId')
    .get(authorize(PERMISSIONS.APPLICATION_DOCUMENT.READ), getApplicationDocument)
    .put(authorize(PERMISSIONS.APPLICATION_DOCUMENT.UPDATE), updateApplicationDocument)
    .delete(authorize(PERMISSIONS.APPLICATION_DOCUMENT.DELETE), deleteApplicationDocument);

// Get application stipulations and create a new application stipulation - requires read and create permission
router.route('/:id/stipulations')
    .get(authorize(PERMISSIONS.APPLICATION.READ), getApplicationStipulations)
    .post(authorize(PERMISSIONS.APPLICATION.UPDATE), createApplicationStipulation);

// Get application stipulations list - requires read permission
router.route('/:id/stipulations/list')
    .get(authorize(PERMISSIONS.APPLICATION.READ), getApplicationStipulationsList);

// Get a single application stipulation, update an application stipulation, and delete an application stipulation - requires read, update, and delete permission
router.route('/:id/stipulations/:stipulationId')
    .get(authorize(PERMISSIONS.APPLICATION.READ), getApplicationStipulation)
    .put(authorize(PERMISSIONS.APPLICATION.UPDATE), updateApplicationStipulation)
    .delete(authorize(PERMISSIONS.APPLICATION.DELETE), deleteApplicationStipulation);

module.exports = router; 