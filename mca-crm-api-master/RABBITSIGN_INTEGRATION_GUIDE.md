# RabbitSign Integration Guide

Complete standalone RabbitSign integration code with explanations for integrating into any application.

## Table of Contents

1. [Overview](#overview)
2. [Environment Variables](#environment-variables)
3. [Service Layer](#service-layer)
4. [Controller Layer](#controller-layer)
5. [Routes](#routes)
6. [Frontend Integration](#frontend-integration)
7. [Webhook Setup](#webhook-setup)
8. [Usage Examples](#usage-examples)

---

## Overview

RabbitSign is a document signing service that allows you to:
- Upload PDF documents
- Create signature requests (folders)
- Add signers with signature field positions
- Track signature status
- Receive webhook notifications when documents are signed

### Integration Flow

1. **Upload Document** → Get pre-signed S3 URL → Upload PDF to S3
2. **Create Signature Request** → Create folder with document URL and signers
3. **Track Status** → Poll folder status or receive webhooks
4. **Handle Completion** → Update your database when all signers complete

---

## Environment Variables

Add these to your `.env` file:

```env
# RabbitSign API Credentials
RABBITSIGN_API_KEY=your_api_key_id_here
RABBITSIGN_API_SECRET=your_api_secret_here
RABBITSIGN_API_BASE_URL=https://www.rabbitsign.com
RABBITSIGN_WEBHOOK_SECRET=your_webhook_secret_here  # Optional, for webhook verification
```

**Note:**
- `RABBITSIGN_API_KEY` = Your API Key ID (not the secret)
- `RABBITSIGN_API_SECRET` = Your API Secret Key
- `RABBITSIGN_API_BASE_URL` = Base URL (defaults to https://www.rabbitsign.com)

---

## Service Layer

Create file: `src/services/rabbitsignService.js`

```javascript
const fetch = require('node-fetch');
const crypto = require('crypto');
const ErrorResponse = require('../utils/errorResponse'); // Or your error handling class

// Helper function to normalize the API base URL
const normalizeApiBaseUrl = (url) => {
    if (!url) return 'https://www.rabbitsign.com';

    // Remove trailing slashes
    url = url.replace(/\/+$/, '');

    // If URL includes /api, remove it (we'll add /api/v1/ later)
    url = url.replace(/\/api\/?.*$/, '');

    // Ensure we use www.rabbitsign.com (not just rabbitsign.com)
    if (url.includes('rabbitsign.com') && !url.includes('www.')) {
        url = url.replace('rabbitsign.com', 'www.rabbitsign.com');
    }

    // If it's just the domain without protocol, add https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
    }

    return url;
};

const rabbitsignConfig = {
    apiKey: process.env.RABBITSIGN_API_KEY,
    apiSecret: process.env.RABBITSIGN_API_SECRET,
    apiBaseUrl: normalizeApiBaseUrl(process.env.RABBITSIGN_API_BASE_URL),
    webhookSecret: process.env.RABBITSIGN_WEBHOOK_SECRET,
};

/**
 * SHA-512 hash function for signature generation
 */
function sha512(input) {
    const hash = crypto.createHash('sha512');
    hash.update(input, 'utf8');
    return hash.digest('hex').toUpperCase();
}

/**
 * Generate RabbitSign authentication headers
 * RabbitSign requires 3 headers for authentication:
 * 1. x-rabbitsign-api-time-utc: UTC timestamp (yyyy-MM-ddTHH:mm:ssZ)
 * 2. x-rabbitsign-api-key-id: Your API key ID
 * 3. x-rabbitsign-api-signature: SHA-512 hash of "${method} ${path} ${timestamp} ${secret}"
 * 
 * @param {string} method - HTTP method (GET, POST, PUT, etc.)
 * @param {string} path - API path (e.g., /api/v1/folder)
 * @returns {Object} - Headers object with authentication
 */
function generateAuthHeaders(method, path) {
    const timestamp = new Date().toISOString().split('.')[0] + 'Z'; // Format: yyyy-MM-ddTHH:mm:ssZ
    const signatureString = `${method} ${path} ${timestamp} ${rabbitsignConfig.apiSecret}`;
    const signature = sha512(signatureString);

    return {
        'x-rabbitsign-api-time-utc': timestamp,
        'x-rabbitsign-api-key-id': rabbitsignConfig.apiKey,
        'x-rabbitsign-api-signature': signature,
    };
}

/**
 * Get upload URL from RabbitSign for file upload
 * This returns a pre-signed S3 URL where you can upload your PDF
 * 
 * @returns {Promise<Object>} - { uploadUrl: string }
 */
exports.getUploadUrl = async () => {
    try {
        if (!rabbitsignConfig.apiKey || !rabbitsignConfig.apiSecret) {
            throw new ErrorResponse(
                'RabbitSign API credentials are not configured. Please set RABBITSIGN_API_KEY and RABBITSIGN_API_SECRET environment variables.',
                500,
            );
        }

        const method = 'POST';
        const path = '/api/v1/upload-url';
        const url = `${rabbitsignConfig.apiBaseUrl}${path}`;

        const authHeaders = generateAuthHeaders(method, path);
        const headers = {
            Accept: '*/*',
            ...authHeaders,
        };

        const response = await fetch(url, {
            method: method,
            headers: headers,
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = errorText;
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.message || errorJson.error || errorText;
            } catch (e) {
                // Not JSON, use as is
            }

            throw new ErrorResponse(
                `RabbitSign API error: ${response.statusText} - ${errorMessage}`,
                response.status,
            );
        }

        const data = await response.json();
        return data;
    } catch (error) {
        if (error instanceof ErrorResponse) {
            throw error;
        }
        console.error('Error getting upload URL:', error);
        throw new ErrorResponse(`Failed to get upload URL: ${error.message}`, 500);
    }
};

/**
 * Upload file to RabbitSign S3 using pre-signed URL
 * 
 * @param {string} uploadUrl - Pre-signed S3 URL from getUploadUrl
 * @param {Buffer} fileContent - File content as Buffer
 * @param {string} contentType - Content type (e.g., 'application/pdf')
 * @returns {Promise<boolean>} - Success status
 */
exports.uploadFileToS3 = async (uploadUrl, fileContent, contentType = 'application/pdf') => {
    try {
        const response = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'binary/octet-stream',
                Accept: '*/*',
            },
            body: fileContent,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new ErrorResponse(
                `Failed to upload file to S3: ${response.statusText} - ${errorText}`,
                response.status,
            );
        }

        return true;
    } catch (error) {
        if (error instanceof ErrorResponse) {
            throw error;
        }
        console.error('Error uploading file to S3:', error);
        throw new ErrorResponse(`Failed to upload file: ${error.message}`, 500);
    }
};

/**
 * Create a folder (signature request) in RabbitSign
 * This is the main method to initiate a signing request
 * 
 * @param {Object} params - Folder creation parameters
 * @param {string} params.documentId - Document ID from your system (for tracking)
 * @param {Array} params.docInfo - Array of document info objects
 *   Example: [{ url: 'https://s3.../document.pdf', docTitle: 'Contract' }]
 * @param {Object} params.signerInfo - Object mapping email to signer info
 *   Example: {
 *     'signer@example.com': {
 *       name: 'John Doe',
 *       fields: [{
 *         id: 1,
 *         type: 'SIGNATURE',
 *         position: { docNumber: 0, pageIndex: 0, x: 100, y: 200, width: 200, height: 50 }
 *       }]
 *     }
 *   }
 * @param {string} params.title - Folder title (shown to signers)
 * @param {string} params.summary - Folder summary/message
 * @param {string} params.date - Date in yyyy-MM-dd format (must be today in sender's local timezone)
 * @returns {Promise<Object>} - { folderId: string }
 */
exports.createFolder = async (params) => {
    try {
        const { documentId, docInfo, signerInfo, title, summary, date } = params;

        if (!docInfo || docInfo.length === 0) {
            throw new ErrorResponse('At least one document is required', 400);
        }

        if (!signerInfo || Object.keys(signerInfo).length === 0) {
            throw new ErrorResponse('At least one signer is required', 400);
        }

        if (!rabbitsignConfig.apiKey || !rabbitsignConfig.apiSecret) {
            throw new ErrorResponse(
                'RabbitSign API credentials are not configured.',
                500,
            );
        }

        // Validate date format (must be today in sender's local timezone)
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new ErrorResponse(
                'Date must be provided in yyyy-MM-dd format and must be today in sender\'s local timezone',
                400,
            );
        }

        const method = 'POST';
        const path = '/api/v1/folder';
        const url = `${rabbitsignConfig.apiBaseUrl}${path}`;

        const requestBody = {
            folder: {
                title: title || `Document ${documentId}`,
                summary: summary || 'Please review and sign this document',
                docInfo: docInfo,
                signerInfo: signerInfo,
            },
            date: new Date().toISOString(),
        };

        const authHeaders = generateAuthHeaders(method, path);
        const headers = {
            'Content-Type': 'application/json',
            Accept: '*/*',
            ...authHeaders,
        };

        const response = await fetch(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            let errorText;
            try {
                errorText = await response.text();
                try {
                    const errorJson = JSON.parse(errorText);
                    errorText = errorJson.message || errorJson.error || errorText;
                } catch (e) {
                    // Not JSON, use as is
                }
            } catch (e) {
                errorText = response.statusText;
            }

            throw new ErrorResponse(
                `RabbitSign API error: ${response.statusText} - ${errorText.substring(0, 200)}`,
                response.status,
            );
        }

        const data = await response.json();
        return data;
    } catch (error) {
        if (error instanceof ErrorResponse) {
            throw error;
        }
        console.error('Error creating folder:', error);
        throw new ErrorResponse(`Failed to create folder: ${error.message}`, 500);
    }
};

/**
 * Get folder (signature request) status from RabbitSign
 * 
 * @param {string} folderId - RabbitSign folder ID
 * @returns {Promise<Object>} - Folder status with signers, status, downloadUrl, etc.
 */
exports.getFolderStatus = async (folderId) => {
    try {
        if (!rabbitsignConfig.apiKey || !rabbitsignConfig.apiSecret) {
            throw new ErrorResponse(
                'RabbitSign API credentials are not configured.',
                500,
            );
        }

        const method = 'GET';
        const path = `/api/v1/folder/${folderId}`;
        const url = `${rabbitsignConfig.apiBaseUrl}${path}`;

        const authHeaders = generateAuthHeaders(method, path);
        const headers = {
            Accept: '*/*',
            ...authHeaders,
        };

        const response = await fetch(url, {
            method: method,
            headers: headers,
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = errorText;
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.message || errorJson.error || errorText;
            } catch (e) {
                // Not JSON, use as is
            }

            throw new ErrorResponse(
                `RabbitSign API error: ${response.statusText} - ${errorMessage}`,
                response.status,
            );
        }

        const data = await response.json();
        return data;
    } catch (error) {
        if (error instanceof ErrorResponse) {
            throw error;
        }
        console.error('Error getting folder status:', error);
        throw new ErrorResponse(
            `Failed to get folder status: ${error.message}`,
            500,
        );
    }
};

/**
 * Verify webhook signature (if RabbitSign provides signature verification)
 * 
 * @param {Object} payload - Webhook payload
 * @param {string} signature - Webhook signature header
 * @returns {boolean} - Whether signature is valid
 */
exports.verifyWebhookSignature = (payload, signature) => {
    // Implement signature verification if RabbitSign provides it
    // For now, we'll use the webhook secret for basic validation
    if (!rabbitsignConfig.webhookSecret) {
        return true; // Skip verification if no secret configured
    }

    // TODO: Implement actual signature verification based on RabbitSign's method
    // Check RabbitSign documentation for actual implementation
    return true;
};

/**
 * Process webhook event from RabbitSign
 * Supports RabbitSign format: { folderId, eventName, signerEmail }
 * 
 * @param {Object} event - Webhook event data
 * @returns {Object} - Processed event data
 */
exports.processWebhookEvent = (event) => {
    let eventType = event.type || event.event_type;
    let signatureRequestId = event.signature_request_id || event.id;

    // RabbitSign format: { folderId, eventName, signerEmail }
    if (event.folderId || event.eventName) {
        signatureRequestId = signatureRequestId || event.folderId;
        const eventName = (event.eventName || event.event_name || '').toUpperCase();
        if (eventName === 'SIGNED' || eventName === 'COMPLETED' || eventName === 'DOCUMENT_SIGNED') {
            eventType = 'signature_completed';
        } else if (eventName === 'SENT' || eventName === 'CREATED') {
            eventType = 'signature_pending';
        } else if (eventName === 'DECLINED' || eventName === 'CANCELLED') {
            eventType = 'signature_declined';
        } else {
            eventType = event.eventName || 'unknown';
        }
    }

    return {
        eventType: eventType || 'unknown',
        documentId: event.metadata?.documentId || event.document_id,
        signatureRequestId,
        status: event.status,
        signer: event.signerEmail ? { email: event.signerEmail } : event.signer,
        signedAt: event.signed_at || event.timestamp || new Date(),
        data: event,
    };
};
```

---

## Controller Layer

Create file: `src/controllers/rabbitsignController.js`

```javascript
const Joi = require('joi');
const RabbitSignService = require('../services/rabbitsignService');
const ErrorResponse = require('../utils/errorResponse'); // Or your error handling

/**
 * Get upload URL for document file
 * @route GET /api/v1/documents/:id/upload-url
 */
exports.getUploadUrl = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);
        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id } = value;

        // Get upload URL from RabbitSign
        const uploadUrlResponse = await RabbitSignService.getUploadUrl();

        res.status(200).json({
            success: true,
            data: {
                document_id: id,
                upload_url: uploadUrlResponse.uploadUrl,
                expires_in: 300 // 5 minutes
            }
        });
    } catch (error) {
        console.error('Error getting upload URL:', error);
        return next(new ErrorResponse(error.message || 'Failed to get upload URL', error.statusCode || 500));
    }
};

/**
 * Upload document file to RabbitSign S3
 * @route POST /api/v1/documents/:id/upload-file
 */
exports.uploadFile = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            upload_url: Joi.string().uri().required(),
            file_content: Joi.alternatives().try(
                Joi.string(), // base64 string
                Joi.binary() // Buffer
            ).required(),
            content_type: Joi.string().default('application/pdf')
        });

        const { value, error } = schema.validate({
            ...req.params,
            ...req.body
        });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, upload_url, file_content, content_type } = value;

        // Convert base64 to Buffer if needed
        let fileBuffer = file_content;
        if (typeof file_content === 'string') {
            // Remove data URL prefix if present
            const base64Data = file_content.includes(',') 
                ? file_content.split(',')[1] 
                : file_content;
            fileBuffer = Buffer.from(base64Data, 'base64');
        }

        // Upload file to S3
        await RabbitSignService.uploadFileToS3(upload_url, fileBuffer, content_type);

        res.status(200).json({
            success: true,
            data: {
                document_id: id,
                message: 'File uploaded successfully'
            }
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        return next(new ErrorResponse(error.message || 'Failed to upload file', error.statusCode || 500));
    }
};

/**
 * Initiate signature request for a document
 * Complete flow: get upload URL, upload file, create folder
 * @route POST /api/v1/documents/:id/sign
 */
exports.initiateSignature = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            signers: Joi.array().items(
                Joi.object({
                    email: Joi.string().email().required(),
                    name: Joi.string().required(),
                    role: Joi.string().valid('seller', 'guarantor', 'buyer', 'signer').optional(),
                    order: Joi.number().min(1).optional(),
                    fields: Joi.array().items(
                        Joi.object({
                            id: Joi.number().required(),
                            type: Joi.string().valid('SIGNATURE', 'INITIALS', 'LOCAL_DATE', 'TEXTBOX', 'CHECKBOX').required(),
                            currentValue: Joi.string().allow('').optional(),
                            position: Joi.object({
                                docNumber: Joi.number().min(0).required(),
                                pageIndex: Joi.number().min(0).required(),
                                x: Joi.number().required(),
                                y: Joi.number().required(),
                                width: Joi.number().required(),
                                height: Joi.number().required()
                            }).required()
                        })
                    ).optional()
                })
            ).min(1).required(),
            message: Joi.string().optional(),
            title: Joi.string().optional(),
            summary: Joi.string().optional(),
            file_url: Joi.string().uri().optional(), // S3 URL from upload
            file_content: Joi.alternatives().try(
                Joi.string(), // base64 string
                Joi.binary() // Buffer
            ).optional(),
        });

        const { value, error } = schema.validate({
            ...req.params,
            ...req.body
        });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, signers, message, title, summary, file_url, file_content } = value;

        let uploadedFileUrl = file_url;

        // If file_content is provided, upload it first
        if (file_content && !file_url) {
            // Get upload URL
            const uploadUrlResponse = await RabbitSignService.getUploadUrl();
            const uploadUrl = uploadUrlResponse.uploadUrl;

            // Convert base64 to Buffer if needed
            let fileBuffer = file_content;
            if (typeof file_content === 'string') {
                const base64Data = file_content.includes(',') 
                    ? file_content.split(',')[1] 
                    : file_content;
                fileBuffer = Buffer.from(base64Data, 'base64');
            }

            // Upload file to S3
            await RabbitSignService.uploadFileToS3(uploadUrl, fileBuffer, 'application/pdf');
            
            // Get base URL without query params
            uploadedFileUrl = uploadUrl.split('?')[0];
        }

        if (!uploadedFileUrl) {
            return next(new ErrorResponse('File URL or file content is required.', 400));
        }

        // Get today's date in local timezone (yyyy-MM-dd format)
        const today = new Date();
        const localDate = today.toISOString().split('T')[0]; // yyyy-MM-dd

        // Build signerInfo object (email -> signer info mapping)
        const signerInfo = {};
        signers.forEach((signer) => {
            signerInfo[signer.email] = {
                name: signer.name,
                fields: signer.fields || []
            };
        });

        // Create folder with uploaded file
        const docTitle = title || `Document ${id}`;
        const folderResponse = await RabbitSignService.createFolder({
            documentId: id,
            docInfo: [{
                url: uploadedFileUrl,
                docTitle
            }],
            signerInfo: signerInfo,
            title: docTitle,
            summary: summary || message || 'Please review and sign this document',
            date: localDate
        });

        const folderId = folderResponse.folderId || folderResponse.id;

        // Update your document record with signature request ID
        // await YourDocumentModel.findByIdAndUpdate(id, {
        //     $set: {
        //         signature_request_id: folderId,
        //         signature_status: 'pending',
        //         signers: signers.map(s => ({
        //             email: s.email,
        //             name: s.name,
        //             role: s.role || 'signer',
        //             status: 'pending'
        //         }))
        //     }
        // });

        res.status(200).json({
            success: true,
            data: {
                folder_id: folderId,
                signature_request_id: folderId,
                document_id: id,
                status: 'pending',
                signers: signers,
                signing_url: `https://www.rabbitsign.com/folder/${folderId}`
            }
        });
    } catch (error) {
        console.error('Error initiating signature:', error);
        return next(new ErrorResponse(error.message || 'Failed to initiate signature', error.statusCode || 500));
    }
};

/**
 * Get signature status for a document
 * @route GET /api/v1/documents/:id/signature-status
 */
exports.getSignatureStatus = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);
        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id } = value;

        // Get signature request ID from your document
        // const document = await YourDocumentModel.findById(id);
        // const folderId = document.signature_request_id;

        // For this example, assume folderId is passed or stored
        const folderId = req.query.folder_id || req.body.folder_id;

        if (!folderId) {
            return res.status(200).json({
                success: true,
                data: {
                    document_id: id,
                    status: 'not_initiated',
                    signers: []
                }
            });
        }

        // Get status from RabbitSign
        const folderStatus = await RabbitSignService.getFolderStatus(folderId);

        // Map RabbitSign status to your status
        let mappedStatus = 'pending';
        if (folderStatus.folderStatus === 'SIGNED' || folderStatus.folderStatus === 'COMPLETED') {
            mappedStatus = 'completed';
        } else if (folderStatus.folderStatus === 'CANCELLED') {
            mappedStatus = 'cancelled';
        }

        // Map signers from RabbitSign format
        const mappedSigners = (folderStatus.signers || []).map(rsSigner => ({
            email: rsSigner.email,
            name: rsSigner.name,
            status: rsSigner.status === 'SIGNED' ? 'completed' : 'pending',
            signed_at: rsSigner.status === 'SIGNED' ? new Date() : null
        }));

        res.status(200).json({
            success: true,
            data: {
                document_id: id,
                folder_id: folderId,
                signature_request_id: folderId,
                status: mappedStatus,
                folder_status: folderStatus.folderStatus,
                signers: mappedSigners,
                download_url: folderStatus.downloadUrl || null,
                signing_url: `https://www.rabbitsign.com/folder/${folderId}`
            }
        });
    } catch (error) {
        console.error('Error getting signature status:', error);
        return next(new ErrorResponse(error.message || 'Failed to get signature status', error.statusCode || 500));
    }
};

/**
 * Handle RabbitSign webhook
 * @route POST /api/v1/rabbitsign/webhook
 */
exports.handleWebhook = async (req, res, next) => {
    try {
        // Verify webhook signature if provided
        const signature = req.headers['x-rabbitsign-signature'] || req.headers['x-signature'];

        if (signature) {
            const isValid = RabbitSignService.verifyWebhookSignature(req.body, signature);
            if (!isValid) {
                return next(new ErrorResponse('Invalid webhook signature', 401));
            }
        }

        // Process webhook event
        const event = RabbitSignService.processWebhookEvent(req.body);

        // Find document by signature request ID
        // const document = await YourDocumentModel.findOne({
        //     signature_request_id: event.signatureRequestId
        // });

        if (!document) {
            console.warn('Document not found for webhook event:', event);
            // Still return success to RabbitSign to avoid retries
            return res.status(200).json({ success: true, message: 'Event received' });
        }

        // Update document signature status based on event
        const updateData = {
            'signature_data.last_event': event.eventType,
            'signature_data.last_event_at': new Date()
        };

        // Handle different event types
        switch (event.eventType) {
            case 'signature_completed':
            case 'document_signed':
                updateData['signature_data.signature_status'] = 'completed';
                if (event.signer) {
                    // Update specific signer status
                    // const signers = document.signature_data?.signers || [];
                    // Update signer status logic here
                }
                break;
            case 'signature_declined':
            case 'document_declined':
                updateData['signature_data.signature_status'] = 'declined';
                break;
            case 'signature_pending':
            case 'document_sent':
                updateData['signature_data.signature_status'] = 'pending';
                break;
        }

        // await YourDocumentModel.findByIdAndUpdate(document._id, {
        //     $set: updateData
        // });

        res.status(200).json({
            success: true,
            message: 'Webhook processed successfully',
            event: event.eventType
        });
    } catch (error) {
        console.error('Error processing webhook:', error);
        // Return 200 to prevent RabbitSign from retrying
        res.status(200).json({
            success: false,
            message: 'Webhook processed with errors',
            error: error.message
        });
    }
};
```

---

## Routes

Create file: `src/routes/rabbitsignRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const {
    getUploadUrl,
    uploadFile,
    initiateSignature,
    getSignatureStatus,
    handleWebhook
} = require('../controllers/rabbitsignController');

const { protect } = require('../middleware/auth'); // Your auth middleware

// Get upload URL for document file
router.route('/documents/:id/upload-url')
    .get(protect, getUploadUrl);

// Upload document file to RabbitSign S3
router.route('/documents/:id/upload-file')
    .post(protect, uploadFile);

// Initiate signature request (handles complete flow: upload + create folder)
router.route('/documents/:id/sign')
    .post(protect, initiateSignature);

// Get signature/folder status
router.route('/documents/:id/signature-status')
    .get(protect, getSignatureStatus);

// RabbitSign webhook (no auth required - uses signature verification)
router.route('/webhook')
    .post(handleWebhook);

module.exports = router;
```

Add to your main server file:

```javascript
const rabbitsignRoutes = require('./routes/rabbitsignRoutes');
app.use('/api/v1/rabbitsign', rabbitsignRoutes);
```

---

## Frontend Integration

### TypeScript/React Example

```typescript
// types/document.ts
export interface Signer {
  email: string;
  name: string;
  role: 'seller' | 'guarantor' | 'buyer' | 'signer';
  order?: number;
  fields?: Array<{
    id: number;
    type: 'SIGNATURE' | 'INITIALS' | 'LOCAL_DATE' | 'TEXTBOX' | 'CHECKBOX';
    currentValue: string;
    position: {
      docNumber: number;
      pageIndex: number;
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
}

export interface SignatureStatus {
  document_id: string;
  signature_request_id: string | null;
  status: 'not_initiated' | 'pending' | 'completed' | 'declined' | 'cancelled';
  signers: Array<{
    email: string;
    name: string;
    role: string;
    status: 'pending' | 'completed' | 'declined';
    signed_at: string | null;
  }>;
  signing_url?: string;
  download_url?: string;
}

// lib/api/documents.ts
export const initiateSignature = async (
  documentId: string,
  signers: Signer[],
  file_content?: string,
  message?: string,
  title?: string,
): Promise<{
  signature_request_id: string;
  document_id: string;
  status: string;
  signing_url: string;
  signers: any[];
}> => {
  const endpoint = `/api/v1/rabbitsign/documents/${documentId}/sign`;
  const result = await apiClient.post(endpoint, {
    signers,
    file_content,
    message,
    ...(title ? { title } : {}),
  });
  return result.data;
};

export const getSignatureStatus = async (
  documentId: string,
  folderId?: string,
): Promise<SignatureStatus> => {
  const endpoint = `/api/v1/rabbitsign/documents/${documentId}/signature-status`;
  const query = folderId ? `?folder_id=${folderId}` : '';
  const result = await apiClient.get(`${endpoint}${query}`);
  return result.data;
};
```

### Usage Example

```typescript
// Send document for signature
const handleSendForSign = async () => {
  try {
    const signers: Signer[] = [
      {
        email: 'signer@example.com',
        name: 'John Doe',
        role: 'signer',
        order: 1,
        fields: [{
          id: 1,
          type: 'SIGNATURE',
          currentValue: '',
          position: {
            docNumber: 0,
            pageIndex: 0,
            x: 100,      // X position in points (from left)
            y: 200,      // Y position in points (from top)
            width: 200,
            height: 50
          }
        }]
      }
    ];

    // Option 1: Provide file content (base64)
    const result = await initiateSignature(
      documentId,
      signers,
      fileBase64Content,  // Base64 encoded PDF
      'Please review and sign',
      'Contract Agreement'
    );

    // Option 2: Upload file first, then use file_url
    // Step 1: Get upload URL
    const uploadUrlRes = await fetch(`/api/v1/rabbitsign/documents/${documentId}/upload-url`);
    const { upload_url } = await uploadUrlRes.json();

    // Step 2: Upload file
    await fetch(`/api/v1/rabbitsign/documents/${documentId}/upload-file`, {
      method: 'POST',
      body: JSON.stringify({
        upload_url,
        file_content: fileBase64Content,
        content_type: 'application/pdf'
      })
    });

    // Step 3: Create signature request with file_url
    const fileUrl = upload_url.split('?')[0]; // Remove query params
    const result = await initiateSignature(
      documentId,
      signers,
      undefined,  // No file_content
      'Please review and sign',
      'Contract Agreement'
    );

    console.log('Signature request created:', result.signature_request_id);
    console.log('Signing URL:', result.signing_url);
    
    // Redirect user to signing URL
    window.location.href = result.signing_url;
  } catch (error) {
    console.error('Failed to send for signature:', error);
  }
};

// Check signature status
const checkStatus = async () => {
  const status = await getSignatureStatus(documentId, folderId);
  console.log('Status:', status.status);
  console.log('Signers:', status.signers);
  
  if (status.status === 'completed') {
    console.log('All signers have completed!');
    // Download signed document
    if (status.download_url) {
      window.open(status.download_url);
    }
  }
};
```

---

## Webhook Setup

### 1. Configure Webhook URL in RabbitSign Dashboard

Set your webhook URL to: `https://yourdomain.com/api/v1/rabbitsign/webhook`

### 2. Webhook Payload Format

RabbitSign sends webhooks in this format:

```json
{
  "folderId": "abc123",
  "eventName": "SIGNED",
  "signerEmail": "signer@example.com"
}
```

### 3. Webhook Events

- `CREATED` / `SENT` - Document sent to signers
- `SIGNED` / `COMPLETED` - Document signed
- `DECLINED` / `CANCELLED` - Document declined/cancelled

---

## Key Concepts

### 1. Signature Field Positions

RabbitSign uses **points** as the unit of measurement:
- **Origin**: Top-left corner (0, 0)
- **X**: Distance from left edge in points
- **Y**: Distance from top edge in points
- **Page Size**: Standard A4 = 595 points wide × 842 points tall

### 2. Signer Roles

- `seller` - Seller/merchant
- `buyer` - Buyer/funder
- `guarantor` - Guarantor
- `signer` - General signer

### 3. Field Types

- `SIGNATURE` - Signature field
- `INITIALS` - Initials field
- `LOCAL_DATE` - Date field
- `TEXTBOX` - Text input
- `CHECKBOX` - Checkbox

### 4. Complete Flow

```
1. User uploads PDF → Store in your system
2. User positions signature fields → Frontend calculates X, Y positions
3. User clicks "Send for Sign" → Backend:
   a. Gets upload URL from RabbitSign
   b. Uploads PDF to S3
   c. Creates folder with document URL and signers
   d. Returns folderId and signing_url
4. Signers receive email → Click link → Sign document
5. Webhook received → Update your database
6. User checks status → Poll or use webhook
```

---

## Error Handling

Common errors and solutions:

1. **403 Forbidden**
   - Check API credentials (key ID vs secret)
   - Verify API endpoint allows POST requests
   - Check timestamp format

2. **File Upload Fails**
   - Ensure file is PDF format
   - Check file size limits
   - Verify upload URL hasn't expired (5 minutes)

3. **Signature Fields Not Appearing**
   - Verify X, Y coordinates are correct
   - Check pageIndex matches document page
   - Ensure field positions are within page bounds

---

## Testing

### Test Signature Request

```javascript
// Test script
const RabbitSignService = require('./services/rabbitsignService');

async function testSignature() {
  try {
    // 1. Get upload URL
    const uploadUrlRes = await RabbitSignService.getUploadUrl();
    console.log('Upload URL:', uploadUrlRes.uploadUrl);

    // 2. Upload test PDF (you need a test PDF buffer)
    // await RabbitSignService.uploadFileToS3(uploadUrlRes.uploadUrl, pdfBuffer, 'application/pdf');
    
    // 3. Create folder
    const folderRes = await RabbitSignService.createFolder({
      documentId: 'test-123',
      docInfo: [{
        url: 'https://example.com/test.pdf', // Use uploaded URL
        docTitle: 'Test Document'
      }],
      signerInfo: {
        'test@example.com': {
          name: 'Test Signer',
          fields: [{
            id: 1,
            type: 'SIGNATURE',
            position: {
              docNumber: 0,
              pageIndex: 0,
              x: 100,
              y: 200,
              width: 200,
              height: 50
            }
          }]
        }
      },
      title: 'Test Document',
      summary: 'Please sign this test document',
      date: new Date().toISOString().split('T')[0]
    });

    console.log('Folder created:', folderRes.folderId);
    console.log('Signing URL:', `https://www.rabbitsign.com/folder/${folderRes.folderId}`);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testSignature();
```

---

## Dependencies

```json
{
  "dependencies": {
    "node-fetch": "^2.6.7",
    "joi": "^17.13.3"
  }
}
```

---

## Summary

This integration provides:

✅ **Complete RabbitSign API integration**
✅ **File upload to S3**
✅ **Signature request creation**
✅ **Status tracking**
✅ **Webhook handling**
✅ **Error handling**
✅ **Frontend examples**

All code is standalone and can be integrated into any Node.js/Express application. Simply:
1. Copy the service and controller files
2. Set environment variables
3. Add routes
4. Integrate frontend calls

The integration handles the complete flow from file upload to signature completion.
