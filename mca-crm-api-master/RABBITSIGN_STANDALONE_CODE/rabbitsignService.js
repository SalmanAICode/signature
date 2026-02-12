/**
 * RabbitSign Service - Standalone Integration Code
 * 
 * This file contains all RabbitSign API integration logic.
 * Copy this file to your project and configure environment variables.
 */

const fetch = require('node-fetch');
const crypto = require('crypto');

// Helper function to normalize the API base URL
const normalizeApiBaseUrl = (url) => {
    if (!url) return 'https://www.rabbitsign.com';
    url = url.replace(/\/+$/, '');
    url = url.replace(/\/api\/?.*$/, '');
    if (url.includes('rabbitsign.com') && !url.includes('www.')) {
        url = url.replace('rabbitsign.com', 'www.rabbitsign.com');
    }
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

function sha512(input) {
    const hash = crypto.createHash('sha512');
    hash.update(input, 'utf8');
    return hash.digest('hex').toUpperCase();
}

/**
 * Generate RabbitSign authentication headers
 * Required headers:
 * - x-rabbitsign-api-time-utc: UTC timestamp (yyyy-MM-ddTHH:mm:ssZ)
 * - x-rabbitsign-api-key-id: Your API key ID
 * - x-rabbitsign-api-signature: SHA-512 hash of "${method} ${path} ${timestamp} ${secret}"
 */
function generateAuthHeaders(method, path) {
    const timestamp = new Date().toISOString().split('.')[0] + 'Z';
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
 * @returns {Promise<Object>} - { uploadUrl: string }
 */
exports.getUploadUrl = async () => {
    if (!rabbitsignConfig.apiKey || !rabbitsignConfig.apiSecret) {
        throw new Error('RabbitSign API credentials not configured');
    }

    const method = 'POST';
    const path = '/api/v1/upload-url';
    const url = `${rabbitsignConfig.apiBaseUrl}${path}`;

    const authHeaders = generateAuthHeaders(method, path);
    const response = await fetch(url, {
        method: method,
        headers: { Accept: '*/*', ...authHeaders },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`RabbitSign API error: ${response.statusText} - ${errorText}`);
    }

    return await response.json();
};

/**
 * Upload file to RabbitSign S3 using pre-signed URL
 * @param {string} uploadUrl - Pre-signed S3 URL
 * @param {Buffer} fileContent - File content as Buffer
 * @param {string} contentType - Content type (default: 'application/pdf')
 */
exports.uploadFileToS3 = async (uploadUrl, fileContent, contentType = 'application/pdf') => {
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
        throw new Error(`Failed to upload file: ${response.statusText} - ${errorText}`);
    }

    return true;
};

/**
 * Create a folder (signature request) in RabbitSign
 * 
 * @param {Object} params
 * @param {string} params.documentId - Your document ID (for tracking)
 * @param {Array} params.docInfo - [{ url: 'https://s3.../doc.pdf', docTitle: 'Document Title' }]
 * @param {Object} params.signerInfo - { 'email@example.com': { name: 'Name', fields: [...] } }
 * @param {string} params.title - Folder title
 * @param {string} params.summary - Message for signers
 * @param {string} params.date - Date in yyyy-MM-dd format (must be today)
 * @returns {Promise<Object>} - { folderId: string }
 */
exports.createFolder = async (params) => {
    const { documentId, docInfo, signerInfo, title, summary, date } = params;

    if (!docInfo || docInfo.length === 0) {
        throw new Error('At least one document is required');
    }
    if (!signerInfo || Object.keys(signerInfo).length === 0) {
        throw new Error('At least one signer is required');
    }
    if (!rabbitsignConfig.apiKey || !rabbitsignConfig.apiSecret) {
        throw new Error('RabbitSign API credentials not configured');
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
    const response = await fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            Accept: '*/*',
            ...authHeaders,
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`RabbitSign API error: ${response.statusText} - ${errorText}`);
    }

    return await response.json();
};

/**
 * Get folder (signature request) status from RabbitSign
 * @param {string} folderId - RabbitSign folder ID
 * @returns {Promise<Object>} - Folder status with signers, status, downloadUrl
 */
exports.getFolderStatus = async (folderId) => {
    if (!rabbitsignConfig.apiKey || !rabbitsignConfig.apiSecret) {
        throw new Error('RabbitSign API credentials not configured');
    }

    const method = 'GET';
    const path = `/api/v1/folder/${folderId}`;
    const url = `${rabbitsignConfig.apiBaseUrl}${path}`;

    const authHeaders = generateAuthHeaders(method, path);
    const response = await fetch(url, {
        method: method,
        headers: { Accept: '*/*', ...authHeaders },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`RabbitSign API error: ${response.statusText} - ${errorText}`);
    }

    return await response.json();
};

/**
 * Process webhook event from RabbitSign
 * @param {Object} event - Webhook payload { folderId, eventName, signerEmail }
 * @returns {Object} - Processed event data
 */
exports.processWebhookEvent = (event) => {
    let eventType = event.type || event.event_type;
    let signatureRequestId = event.signature_request_id || event.id;

    // RabbitSign format: { folderId, eventName, signerEmail }
    if (event.folderId || event.eventName) {
        signatureRequestId = signatureRequestId || event.folderId;
        const eventName = (event.eventName || event.event_name || '').toUpperCase();
        if (eventName === 'SIGNED' || eventName === 'COMPLETED') {
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
        signatureRequestId,
        signer: event.signerEmail ? { email: event.signerEmail } : event.signer,
        signedAt: event.signed_at || event.timestamp || new Date(),
        data: event,
    };
};

module.exports = exports;
