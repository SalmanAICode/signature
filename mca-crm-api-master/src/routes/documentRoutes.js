const express = require('express');
const router = express.Router();

const {
    getDocuments,
    createDocument,
    getDocumentList,
    updateDocumentFile,
    updateDocument,
    getDocument,
    deleteDocument,
    downloadDocument,
    bulkCreateDocuments,
    sendDocumentViaRabbitSign,
    generateDocumentFromTemplate,
    getWordTemplatePlaceholders
} = require('../controllers/documentController');

const {
    getUploadUrl,
    uploadFile,
    initiateSignature,
    getSignatureStatus,
    handleWebhook
} = require('../controllers/rabbitsignController');

const { protect, authorize, authorizeAny } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Get all documents and create a new document
router.route('/')
    .get(protect, authorize(PERMISSIONS.DOCUMENT.READ), getDocuments)
    .post(protect, authorize(PERMISSIONS.DOCUMENT.CREATE), createDocument);

// Get documents list without pagination
router.route('/list')
    .get(protect, authorize(PERMISSIONS.DOCUMENT.READ), getDocumentList);

// Bulk create documents
router.route('/bulk')
    .post(protect, authorize(PERMISSIONS.DOCUMENT.CREATE), bulkCreateDocuments);

// Update document with file, get single document, update document, delete document
router.route('/:id')
    .get(protect, authorize(PERMISSIONS.DOCUMENT.READ), getDocument)
    .put(protect, authorize(PERMISSIONS.DOCUMENT.UPDATE), updateDocument)
    .delete(protect, authorize(PERMISSIONS.DOCUMENT.DELETE), deleteDocument);

// Update document with file upload
router.route('/:id/upload')
    .put(protect, authorize(PERMISSIONS.DOCUMENT.UPDATE), updateDocumentFile);

// Download document file
router.route('/:id/download')
    .get(protect, authorize(PERMISSIONS.DOCUMENT.READ), downloadDocument);

// Generate document from template
router.route('/generate-from-template')
    .post(protect, authorize(PERMISSIONS.DOCUMENT.CREATE), generateDocumentFromTemplate);

// Get available placeholders for Word templates
router.route('/word-template-placeholders')
    .get(protect, authorize(PERMISSIONS.DOCUMENT.READ), getWordTemplatePlaceholders);

// RabbitSign signature routes
// Get upload URL for document file
router.route('/:id/upload-url')
    .get(protect, authorize(PERMISSIONS.DOCUMENT.READ), getUploadUrl);

// Upload document file to RabbitSign S3
router.route('/:id/upload-file')
    .post(protect, authorize(PERMISSIONS.DOCUMENT.UPDATE), uploadFile);

// Initiate signature request (handles complete flow: upload + create folder)
// Allow DOCUMENT.UPDATE or APPLICATION_DOCUMENT.UPDATE so same endpoint works from documents page and application-offer
router.route('/:id/sign')
    .post(protect, authorizeAny([PERMISSIONS.DOCUMENT.UPDATE, PERMISSIONS.APPLICATION_DOCUMENT.UPDATE]), initiateSignature);

// Get signature/folder status
router.route('/:id/signature-status')
    .get(protect, authorize(PERMISSIONS.DOCUMENT.READ), getSignatureStatus);

// RabbitSign webhook (no auth required - uses signature verification)
router.route('/rabbitsign/webhook')
    .post(handleWebhook);

// Legacy rabbit sign route (kept for backward compatibility)
router.route('/rabbit/sign')
    .post(sendDocumentViaRabbitSign);

module.exports = router;
