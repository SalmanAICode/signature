/**
 * RabbitSign Routes - Standalone Integration Code
 * 
 * Express.js routes for RabbitSign endpoints.
 * Copy this file to your routes directory.
 */

const express = require('express');
const router = express.Router();
const {
    getUploadUrl,
    uploadFile,
    initiateSignature,
    getSignatureStatus,
    handleWebhook
} = require('../controllers/rabbitsignController');

// Add your auth middleware here if needed
// const { protect } = require('../middleware/auth');

// Get upload URL for document file
router.route('/documents/:id/upload-url')
    .get(getUploadUrl); // Add protect middleware if needed

// Upload document file to RabbitSign S3
router.route('/documents/:id/upload-file')
    .post(uploadFile); // Add protect middleware if needed

// Initiate signature request
router.route('/documents/:id/sign')
    .post(initiateSignature); // Add protect middleware if needed

// Get signature/folder status
router.route('/documents/:id/signature-status')
    .get(getSignatureStatus); // Add protect middleware if needed

// RabbitSign webhook (no auth required - uses signature verification)
router.route('/webhook')
    .post(handleWebhook);

module.exports = router;
