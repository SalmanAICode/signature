const fetch = require('node-fetch');
const crypto = require('crypto');
const ErrorResponse = require('../utils/errorResponse');

// Helper function to normalize the API base URL
const normalizeApiBaseUrl = (url) => {
    if (!url) return 'https://www.rabbitsign.com';

    // Remove trailing slashes
    url = url.replace(/\/+$/, '');

    // If URL includes /api, remove it (we'll add /api/v1/ later)
    url = url.replace(/\/api\/?.*$/, '');

    // Ensure we use www.rabbitsign.com (not just rabbitsign.com)
    // The www subdomain likely has the correct CloudFront config for POST requests
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
    // RabbitSign API uses: https://www.rabbitsign.com/api/v1/
    // Normalize the base URL to ensure it's correct
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
 * Create a signature request in RabbitSign
 * @param {Object} params - Signature request parameters
 * @param {string} params.documentId - Document ID
 * @param {string} params.documentHtml - HTML content of the document
 * @param {string} params.documentTitle - Title of the document
 * @param {Array} params.signers - Array of signer objects with email, name, role
 * @param {string} params.message - Optional message for signers
 * @returns {Promise<Object>} - RabbitSign API response
 */
exports.createSignatureRequest = async (params) => {
    try {
        const { documentId, documentHtml, documentTitle, signers, message } =
            params;

        if (!documentHtml || !signers || signers.length === 0) {
            throw new ErrorResponse(
                'Document HTML and at least one signer are required',
                400,
            );
        }

        // Validate configuration
        // Note: RABBITSIGN_API_KEY should contain the key ID, RABBITSIGN_API_SECRET should contain the key secret
        if (!rabbitsignConfig.apiKey || !rabbitsignConfig.apiSecret) {
            throw new ErrorResponse(
                'RabbitSign API credentials are not configured. Please set RABBITSIGN_API_KEY (key ID) and RABBITSIGN_API_SECRET (key secret) environment variables.',
                500,
            );
        }

        // RabbitSign API endpoint
        // Based on RabbitSign documentation: https://www.rabbitsign.com/api/v1/
        // RabbitSign uses "folders" for signing requests
        // The baseUrl is already normalized to use www.rabbitsign.com

        const baseUrl = rabbitsignConfig.apiBaseUrl; // Already normalized

        // RabbitSign API uses /api/v1/folders for signing requests
        // This is the standard endpoint that should allow POST requests
        let url = `${baseUrl}/api/v1/folder`;

        console.log('Using RabbitSign API endpoint:', url);

        // RabbitSign API request body format
        // Based on RabbitSign API, they use "folders" for signing requests
        // The request format might be different - adjust based on actual API docs
        const requestBody = {
            // Try folder-based format (RabbitSign uses folders for signing)
            folder: {
                name: documentTitle || `Document ${documentId}`,
                documents: [
                    {
                        html: documentHtml,
                        title: documentTitle || `Document ${documentId}`,
                    },
                ],
            },
            signers: signers.map((signer, index) => ({
                email: signer.email,
                name: signer.name,
                role: signer.role || 'signer',
                order: signer.order !== undefined ? signer.order : index,
            })),
            message: message || 'Please review and sign this document',
            metadata: {
                document_id: documentId,
                source: 'mca-crm',
            },
        };

        // Also prepare alternative body format (document-based)
        const alternativeRequestBody = {
            document: {
                html: documentHtml,
                title: documentTitle || `Document ${documentId}`,
            },
            signers: signers.map((signer, index) => ({
                email: signer.email,
                name: signer.name,
                role: signer.role || 'signer',
                order: signer?.order || index,
            })),
            message: message || 'Please review and sign this document',
            metadata: {
                document_id: documentId,
                source: 'mca-crm',
            },
        };

        // RabbitSign API authentication
        // According to RabbitSign documentation, each API request must have 3 HTTP headers:
        // 1. x-rabbitsign-api-time-utc: UTC timestamp in format yyyy-MM-ddTHH:mm:ssZ
        // 2. x-rabbitsign-api-key-id: The key ID (not the secret)
        // 3. x-rabbitsign-api-signature: SHA-512 hash of "${method} ${path} ${timestamp} ${secretKey}"
        const timestamp = new Date().toISOString().split('.')[0] + 'Z'; // Format: yyyy-MM-ddTHH:mm:ssZ
        const method = 'POST';

        // Use folder endpoint (RabbitSign standard)
        const path = '/api/v1/folder';
        let bodyString = JSON.stringify(requestBody);


        const signatureString = `${method} ${path} ${timestamp} ${rabbitsignConfig.apiSecret}`;
        const signature = sha512(signatureString);

        // Build headers according to RabbitSign API documentation
        const authHeaders = generateAuthHeaders(method, path);
        const headers = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...authHeaders,
        };

        console.log('RabbitSign API Request:', {
            url: url,
            method: 'POST',
            path: path,
            keyId: rabbitsignConfig.apiKey
                ? `${rabbitsignConfig.apiKey.substring(0, 10)}...`
                : 'missing',
            keySecret: rabbitsignConfig.apiSecret ? 'configured' : 'missing',
            timestamp: timestamp,
            baseUrl: rabbitsignConfig.apiBaseUrl,
            signersCount: signers.length,
            hasSignature: !!signature,
        });

        // Make the API request
        let response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: bodyString,
        });

        // If we get a 403 from CloudFront, try alternative endpoints and body formats
        if (response.status === 403) {
            const responseText = await response.text();
            if (
                responseText.includes('CloudFront') ||
                responseText.includes('cacheable') ||
                responseText.includes('HTTP method')
            ) {
                console.log(
                    'CloudFront blocking detected, trying alternative endpoints...',
                );

                // Try alternative endpoints with different body formats
                const attempts = [
                    {
                        url: `${baseUrl}/api/v1/documents`,
                        body: alternativeRequestBody,
                        path: '/api/v1/documents',
                    },
                    {
                        url: 'https://www.rabbitsign.com/api/v1/folders',
                        body: requestBody,
                        path: '/api/v1/folders',
                    },
                    {
                        url: 'https://www.rabbitsign.com/api/v1/documents',
                        body: alternativeRequestBody,
                        path: '/api/v1/documents',
                    },
                ];

                for (const attempt of attempts) {
                    if (attempt.url === url) continue; // Skip the one we already tried

                    try {
                        const altBodyString = JSON.stringify(attempt.body);
                        // Recalculate signature for alternative endpoint
                        const altAuthHeaders = generateAuthHeaders(method, attempt.path);
                        const altHeaders = {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            ...altAuthHeaders,
                        };

                        console.log(`Trying alternative endpoint: ${attempt.url}`);
                        response = await fetch(attempt.url, {
                            method: 'POST',
                            headers: altHeaders,
                            body: altBodyString,
                        });

                        // If this endpoint works (not 403), break
                        if (response.status !== 403) {
                            console.log(`Success with endpoint: ${attempt.url}`);
                            url = attempt.url; // Update url for logging
                            bodyString = altBodyString;
                            break;
                        }
                    } catch (err) {
                        console.error(`Error trying ${attempt.url}:`, err.message);
                        continue;
                    }
                }
            }
        }

        if (!response.ok) {
            let errorText;
            try {
                errorText = await response.text();
                // Try to parse as JSON for better error messages
                try {
                    const errorJson = JSON.parse(errorText);
                    errorText = errorJson.message || errorJson.error || errorText;
                } catch (e) {
                    // Not JSON, use as is - might be HTML error page
                    if (errorText.includes('403') || errorText.includes('Forbidden')) {
                        errorText =
                            'Authentication failed. Please check your RabbitSign API credentials and endpoint configuration.';
                    }
                }
            } catch (e) {
                errorText = response.statusText;
            }

            console.error('RabbitSign API Error:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText.substring(0, 500), // Limit error text length
                url: url,
                keyIdConfigured: !!rabbitsignConfig.apiKey,
                keySecretConfigured: !!rabbitsignConfig.apiSecret,
                apiBaseUrl: rabbitsignConfig.apiBaseUrl,
            });

            // Provide more helpful error message
            if (response.status === 403) {
                // Check if it's a CloudFront blocking error
                if (
                    errorText.includes('CloudFront') ||
                    errorText.includes('cacheable') ||
                    errorText.includes('HTTP method')
                ) {
                    throw new ErrorResponse(
                        'RabbitSign API endpoint is blocking POST requests (CloudFront configuration). ' +
                        `The endpoint "${url}" only allows GET requests (cached requests). ` +
                        '\n\nSOLUTION: Update your .env file with the correct API endpoint. ' +
                        '\nTry one of these:\n' +
                        '1. RABBITSIGN_API_BASE_URL=https://www.rabbitsign.com (then we\'ll use /api/v1/folders)\n' +
                        '2. RABBITSIGN_API_BASE_URL=https://api.rabbitsign.com\n' +
                        '3. Check RabbitSign developer documentation for the correct API endpoint URL\n\n' +
                        `Current endpoint: ${rabbitsignConfig.apiBaseUrl}\n` +
                        `Attempted URL: ${url}\n\n` +
                        'Note: RabbitSign API typically uses: POST https://www.rabbitsign.com/api/v1/folders for signing requests.',
                        response.status,
                    );
                }

                throw new ErrorResponse(
                    'RabbitSign API authentication failed (403 Forbidden). ' +
                    'Please verify:\n' +
                    '1. Your API credentials are correct:\n' +
                    '   - RABBITSIGN_API_KEY should be your key ID\n' +
                    '   - RABBITSIGN_API_SECRET should be your key secret\n' +
                    '2. The API endpoint allows POST requests\n' +
                    '3. The authentication headers follow RabbitSign format:\n' +
                    '   - x-rabbitsign-api-time-utc\n' +
                    '   - x-rabbitsign-api-key-id\n' +
                    '   - x-rabbitsign-api-signature\n\n' +
                    `Current endpoint: ${url}\n` +
                    `Base URL: ${rabbitsignConfig.apiBaseUrl}\n\n` +
                    'Check RabbitSign developer documentation for the correct endpoint and authentication method.',
                    response.status,
                );
            }

            throw new ErrorResponse(
                `RabbitSign API error: ${response.statusText} - ${errorText.substring(
                    0,
                    200,
                )}`,
                response.status,
            );
        }

        const data = await response.json();
        return data;
    } catch (error) {
        if (error instanceof ErrorResponse) {
            throw error;
        }
        console.error('Error creating signature request:', error);
        throw new ErrorResponse(
            `Failed to create signature request: ${error.message}`,
            500,
        );
    }
};

/**
 * Get upload URL from RabbitSign for file upload
 * @returns {Promise<Object>} - Upload URL response with uploadUrl
 */
exports.getUploadUrl = async () => {
    try {
        if (!rabbitsignConfig.apiKey || !rabbitsignConfig.apiSecret) {
            throw new ErrorResponse(
                'RabbitSign API credentials are not configured. Please set RABBITSIGN_API_KEY (key ID) and RABBITSIGN_API_SECRET (key secret) environment variables.',
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
 * @param {string} uploadUrl - Pre-signed S3 URL from getUploadUrl
 * @param {Buffer|string} fileContent - File content as Buffer or base64 string
 * @param {string} contentType - Content type (e.g., 'application/pdf', 'application/octet-stream')
 * @returns {Promise<boolean>} - Success status
 */
exports.uploadFileToS3 = async (
    uploadUrl,
    fileContent,
    contentType = 'application/octet-stream',
) => {
    try {
        console.log(contentType);
        // Convert base64 string to Buffer if needed
        let fileBuffer = fileContent;
        // if (typeof fileContent === 'string') {
        //     // Check if it's base64
        //     if (fileContent.startsWith('data:')) {
        //         // Remove data URL prefix
        //         const base64Data = fileContent.split(',')[1];
        //         fileBuffer = Buffer.from(base64Data, 'base64');
        //     } else {
        //         // Assume it's already base64
        //         fileBuffer = Buffer.from(fileContent, 'base64');
        //     }
        // } else {
        //     fileBuffer = fileContent;
        // }

        const response = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                // 'Content-Type': contentType,
                'Content-Type': 'binary/octet-stream',
                Accept: '*/*',
            },
            body: fileBuffer,
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
 * Create a folder (signing request) in RabbitSign with uploaded files
 * @param {Object} params - Folder creation parameters
 * @param {string} params.documentId - Document ID from your system
 * @param {Array} params.docInfo - Array of document info objects with url and docTitle
 * @param {Object} params.signerInfo - Object mapping email to signer info
 * @param {string} params.title - Folder title
 * @param {string} params.summary - Folder summary/message
 * @param {string} params.date - Date in yyyy-MM-dd format (must be today in sender's local timezone)
 * @returns {Promise<Object>} - RabbitSign API response with folderId
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
                'RabbitSign API credentials are not configured. Please set RABBITSIGN_API_KEY (key ID) and RABBITSIGN_API_SECRET (key secret) environment variables.',
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
            date: new Date()?.toISOString(),
        };

        const authHeaders = generateAuthHeaders(method, path);
        const headers = {
            'Content-Type': 'application/json',
            Accept: '*/*',
            ...authHeaders,
        };

        console.log('RabbitSign Create Folder Request:', {
            url: url,
            method: method,
            path: path,
            keyId: rabbitsignConfig.apiKey
                ? `${rabbitsignConfig.apiKey.substring(0, 10)}...`
                : 'missing',
            keySecret: rabbitsignConfig.apiSecret ? 'configured' : 'missing',
            timestamp: authHeaders['x-rabbitsign-api-time-utc'],
            baseUrl: rabbitsignConfig.apiBaseUrl,
            docCount: docInfo.length,
            signerCount: Object.keys(signerInfo).length,
        });

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

            console.error('RabbitSign API Error:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText.substring(0, 500),
                url: url,
            });

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
 * Get folder (signing request) status from RabbitSign
 * @param {string} folderId - RabbitSign folder ID
 * @returns {Promise<Object>} - Folder status with signers, status, downloadUrl, etc.
 */
exports.getFolderStatus = async (folderId) => {
    try {
        if (!rabbitsignConfig.apiKey || !rabbitsignConfig.apiSecret) {
            throw new ErrorResponse(
                'RabbitSign API credentials are not configured. Please set RABBITSIGN_API_KEY (key ID) and RABBITSIGN_API_SECRET (key secret) environment variables.',
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
 * Get signature request status from RabbitSign (legacy method - uses folder status)
 * @param {string} signatureRequestId - RabbitSign folder ID
 * @returns {Promise<Object>} - Signature request status
 */
exports.getSignatureRequestStatus = async (signatureRequestId) => {
    return exports.getFolderStatus(signatureRequestId);
};

/**
 * Verify webhook signature (if RabbitSign provides signature verification)
 * @param {Object} payload - Webhook payload
 * @param {string} signature - Webhook signature header
 * @returns {boolean} - Whether signature is valid
 */
exports.verifyWebhookSignature = (payload, signature) => {
    // Implement signature verification if RabbitSign provides it
    // For now, we'll use the webhook secret for basic validation
    console.log(payload, signature);
    if (!rabbitsignConfig.webhookSecret) {
        return true; // Skip verification if no secret configured
    }

    // TODO: Implement actual signature verification based on RabbitSign's method
    // This is a placeholder - check RabbitSign documentation for actual implementation
    return true;
};

/**
 * Process webhook event from RabbitSign
 * Supports multiple payload formats:
 * - Standard: { type, signature_request_id, signer, ... }
 * - RabbitSign: { folderId, eventName, signerEmail }
 * @param {Object} event - Webhook event data
 * @returns {Object} - Processed event data
 */
exports.processWebhookEvent = (event) => {
    // Standard format
    let eventType = event.type || event.event_type;
    let signatureRequestId = event.signature_request_id || event.id;
    let signer = event.signer;

    // RabbitSign format: { folderId, eventName, signerEmail }
    if (event.folderId || event.eventName) {
        signatureRequestId = signatureRequestId || event.folderId;
        const eventName = (event.eventName || event.event_name || '').toUpperCase();
        if (eventName === 'SIGNED' || eventName === 'COMPLETED' || eventName === 'DOCUMENT_SIGNED') {
            eventType = eventType || 'signature_completed';
        } else if (eventName === 'SENT' || eventName === 'CREATED') {
            eventType = eventType || 'signature_pending';
        } else if (eventName === 'DECLINED' || eventName === 'CANCELLED') {
            eventType = eventType || 'signature_declined';
        } else {
            eventType = eventType || event.eventName || 'unknown';
        }
        if (event.signerEmail && !signer) {
            signer = { email: event.signerEmail, role: 'signer' };
        }
    }

    return {
        eventType: eventType || 'unknown',
        documentId: event.metadata?.documentId || event.document_id,
        signatureRequestId,
        status: event.status,
        signer,
        signedAt: event.signed_at || event.timestamp || new Date(),
        data: event,
    };
};
