const Joi = require('joi');
const RabbitSignService = require('../services/rabbitsignService');
const DocumentService = require('../services/documentService');
const Document = require('../models/Document');
const ErrorResponse = require('../utils/errorResponse');
const Validators = require('../utils/validators');
const puppeteer = require('puppeteer');
const wsRouter = require('../middleware/websocket/webSocketRouter');
const { PORTAL_TYPES } = require('../utils/constants');
const { PDFDocument } = require('pdf-lib');

async function convertHtmlToPdf(htmlContent) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });

    await browser.close();
    return pdfBuffer;
}

async function preparePdfForRabbitSign({ fileType, fileContent }) {
    // HTML → PDF (Puppeteer already gives perfect output)
    if (fileType?.includes('html')) {
        return fileContent; // already Puppeteer-generated PDF
    }

    // Uploaded PDF → normalize
    if (fileType?.includes('pdf')) {
        if (!fileContent || fileContent.slice(0, 4).toString() !== '%PDF') {
            throw new Error('Invalid PDF buffer');
        }

        const pdfDoc = await PDFDocument.load(fileContent, {
            ignoreEncryption: true,
        });

        const cleanPdf = await pdfDoc.save({
            useObjectStreams: false, // critical for signing engines
        });

        return Buffer.from(cleanPdf);
    }

    throw new Error(`Unsupported file type: ${fileType}`);
}

function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];

        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
};

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

        // Verify document exists
        const document = await DocumentService.getDocumentById(id);
        if (!document) {
            return next(new ErrorResponse('Document not found', 404));
        }

        // Get upload URL from RabbitSign
        const uploadUrlResponse = await RabbitSignService.getUploadUrl();

        res.status(200).json({
            success: true,
            data: {
                document_id: id,
                upload_url: uploadUrlResponse.uploadUrl,
                expires_in: 300 // 5 minutes as per RabbitSign docs
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

        // Verify document exists
        const document = await DocumentService.getDocumentById(id);
        if (!document) {
            return next(new ErrorResponse('Document not found', 404));
        }

        // Upload file to S3
        await RabbitSignService.uploadFileToS3(upload_url, file_content, content_type);

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
 * This method handles the complete flow: get upload URL, upload file, create folder
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
                            }).optional()
                        })
                    ).optional()
                })
            ).min(1).required(),
            message: Joi.string().optional(),
            title: Joi.string().optional(),
            summary: Joi.string().optional(),
            // For file-based flow
            file_url: Joi.string().uri().optional(), // S3 URL from upload
            file_content: Joi.alternatives().try(
                Joi.string(), // base64 string
                Joi.binary() // Buffer
            ).optional(),
            // For HTML-based flow (legacy)
            use_html: Joi.boolean().default(false)
        });

        const { value, error } = schema.validate({
            ...req.params,
            ...req.body
        });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, signers, message, title, summary, file_url, file_content, use_html } = value;

        // Get document
        const document = await DocumentService.getDocumentById(id);

        let fileBuffer = null;

        if (!document.file_type?.includes('html')) {
            const { stream } = await DocumentService.downloadDocumentFile(id);

            fileBuffer = await streamToBuffer(stream);
        }

        if (!document) {
            return next(new ErrorResponse('Document not found', 404));
        }

        let folderResponse;
        let uploadedFileUrl = file_url;

        // If file_content is provided, upload it first
        if (file_content && !file_url) {
            // Get upload URL
            const uploadUrlResponse = await RabbitSignService.getUploadUrl();
            const uploadUrl = uploadUrlResponse.uploadUrl;

            // Determine content type
            const contentType = document.file_type?.includes('pdf')
                ? 'application/pdf'
                : document.file_type?.includes('html')
                    ? 'text/html'
                    : 'application/octet-stream';

            // Usage
            let pdfBuffer;

            if (document.file_type?.includes('html')) {
                pdfBuffer = await convertHtmlToPdf(file_content);
            } else {
                pdfBuffer = await preparePdfForRabbitSign({
                    fileType: document.file_type,
                    fileContent: fileBuffer,
                });
            }
            await RabbitSignService.uploadFileToS3(uploadUrl, pdfBuffer, contentType);
            uploadedFileUrl = uploadUrl.split('?')[0]; // Get base URL without query params
        }

        // If use_html is true, use legacy HTML-based method
        if (use_html && document.fileHtml?.value) {
            folderResponse = await RabbitSignService.createSignatureRequest({
                documentId: id,
                documentHtml: document.fileHtml.value,
                documentTitle: title || document.file_name || `Document ${id}`,
                signers,
                message
            });
        } else {
            // Use file-based flow (recommended)
            if (!uploadedFileUrl) {
                return next(new ErrorResponse('File URL or file content is required. Please upload the file first or provide file_url.', 400));
            }

            // Get today's date in local timezone (yyyy-MM-dd format)
            const today = new Date();
            const localDate = today.toISOString().split('T')[0]; // yyyy-MM-dd

            // RabbitSign uses top-left origin: Y = distance from top of page (same as frontend).
            // Apply template offset only: compact = nudge up (-6), classic/formal/modern = push down (+195).
            // const html = (file_content || document.fileHtml?.value || '');
            // const isCompact = html.includes('data-template="compact"');
            const pageHeightPoints = 842;
            // const Y_OFFSET_POINTS = isCompact ? -6 : 195;
            const Y_OFFSET_POINTS = -6;

            const applyYOffset = (fields) => (fields || []).map((f) => {
                if (f.position && typeof f.position.y === 'number') {
                    const h = f.position.height || 50;
                    const newY = Math.max(0, Math.min(pageHeightPoints - h, f.position.y + Y_OFFSET_POINTS));
                    return { ...f, position: { ...f.position, y: newY } };
                }
                return f;
            });

            // Build signerInfo object (email -> signer info mapping)
            const signerInfo = {};
            signers.forEach((signer) => {
                signerInfo[signer.email] = {
                    name: signer.name,
                    fields: applyYOffset(signer.fields)
                };
            });

            // Create folder with uploaded file (title = document name shown to signer, e.g. stipulation type)
            const docTitle = title || document.file_name || `Document ${id}`;
            folderResponse = await RabbitSignService.createFolder({
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
        }

        const folderId = folderResponse.folderId || folderResponse.id;

        // Update document with signature request ID
        const signatureData = {
            signature_request_id: folderId,
            signature_status: 'pending',
            signers: signers.map(s => ({
                email: s.email,
                name: s.name,
                role: s.role || 'signer',
                status: 'pending',
                signed_at: null
            })),
            initiated_at: new Date()
        };

        const updatedDocument = await Document.findByIdAndUpdate(id, {
            $set: {
                signature_data: signatureData
            }
        }, { new: true });

        // Sync signature_data to embedded documents in ApplicationOfferDocument and ApplicationDocument
        if (updatedDocument?.signature_data) {
            try {
                await Document.syncDocumentInfo(id, { signature_data: updatedDocument.signature_data });
            } catch (syncError) {
                console.error('Error syncing signature_data to embedded documents:', syncError);
                // Don't fail the request if sync fails
            }
        }

        // Broadcast WebSocket so list pages update status to "Pending" in real-time
        try {
            const wsMessage = {
                type: 'document_signature_update',
                documentId: id,
                event: 'signature_initiated',
                signatureStatus: 'pending',
                signers: signatureData.signers,
                timestamp: new Date().toISOString()
            };
            const documentPath = '/api/v1/documents';
            const clients = wsRouter.listClients();
            for (const { userId, path } of clients) {
                if (path === documentPath) {
                    const responder = wsRouter.getRespond(userId, path);
                    if (responder) responder.status(200).json(wsMessage);
                }
            }
        } catch (wsErr) {
            console.error('WebSocket broadcast on initiate:', wsErr);
        }

        res.status(200).json({
            success: true,
            data: {
                folder_id: folderId,
                signature_request_id: folderId,
                document_id: id,
                status: 'pending',
                signers: signatureData.signers,
                // Front-end can use this to redirect to signing page
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

        // Get document
        const document = await DocumentService.getDocumentById(id);

        if (!document) {
            return next(new ErrorResponse('Document not found', 404));
        }

        // If document has signature request ID, get status from RabbitSign
        if (document.signature_data?.signature_request_id) {
            try {
                const folderStatus = await RabbitSignService.getFolderStatus(
                    document.signature_data.signature_request_id
                );

                // Map RabbitSign status to our status
                let mappedStatus = 'pending';
                if (folderStatus.folderStatus === 'SIGNED' || folderStatus.folderStatus === 'COMPLETED') {
                    mappedStatus = 'completed';
                } else if (folderStatus.folderStatus === 'CANCELLED') {
                    mappedStatus = 'cancelled';
                }
                // 'CREATED' status already defaults to 'pending'

                // Map signers from RabbitSign format
                const mappedSigners = (folderStatus.signers || []).map(rsSigner => {
                    const existingSigner = document.signature_data.signers?.find(
                        s => s.email === rsSigner.email
                    );
                    return {
                        email: rsSigner.email,
                        name: rsSigner.name,
                        role: existingSigner?.role || 'signer',
                        status: rsSigner.status === 'SIGNED' ? 'completed' : 'pending',
                        signed_at: rsSigner.status === 'SIGNED' ? new Date() : null
                    };
                });

                // Update document with latest status
                await Document.findByIdAndUpdate(id, {
                    $set: {
                        'signature_data.signature_status': mappedStatus,
                        'signature_data.signers': mappedSigners,
                        'signature_data.download_url': folderStatus.downloadUrl || null
                    }
                });

                return res.status(200).json({
                    success: true,
                    data: {
                        document_id: id,
                        folder_id: document.signature_data.signature_request_id,
                        signature_request_id: document.signature_data.signature_request_id,
                        status: mappedStatus,
                        folder_status: folderStatus.folderStatus,
                        signers: mappedSigners,
                        download_url: folderStatus.downloadUrl || null,
                        signing_url: `https://www.rabbitsign.com/folder/${document.signature_data.signature_request_id}`
                    }
                });
            } catch (apiError) {
                // If API call fails, return stored status
                console.error('Error fetching status from RabbitSign:', apiError);
            }
        }

        // Return stored signature data
        res.status(200).json({
            success: true,
            data: {
                document_id: id,
                signature_request_id: document.signature_data?.signature_request_id || null,
                status: document.signature_data?.signature_status || 'not_initiated',
                signers: document.signature_data?.signers || []
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

        // Find document by signature request ID or document ID
        let document = null;

        if (event.signatureRequestId) {
            document = await Document.findOne({
                'signature_data.signature_request_id': event.signatureRequestId
            });
        }

        if (!document && event.documentId) {
            document = await Document.findById(event.documentId);
        }

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
                if (event.signer) {
                    // Update specific signer status
                    const signers = document.signature_data?.signers || [];
                    const signerIndex = signers.findIndex(s =>
                        s.email === event.signer.email || s.role === event.signer.role
                    );
                    if (signerIndex >= 0) {
                        signers[signerIndex].status = 'completed';
                        signers[signerIndex].signed_at = event.signedAt || new Date();
                    }
                    updateData['signature_data.signers'] = signers;
                    // Only set overall status to 'completed' when ALL signers have signed
                    const allSigned = signers.length > 0 && signers.every(s => s.status === 'completed');
                    updateData['signature_data.signature_status'] = allSigned ? 'completed' : 'pending';
                } else {
                    updateData['signature_data.signature_status'] = 'completed';
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
            default:
                // Update status from event if available
                if (event.status) {
                    updateData['signature_data.signature_status'] = event.status;
                }
        }

        // When any signer signs, fetch signed document URL from RabbitSign
        const folderId = document.signature_data?.signature_request_id;
        const signingEvents = ['signature_completed', 'document_signed', 'document_completed'];
        if (folderId && signingEvents.includes(event.eventType)) {
            try {
                const folderStatus = await RabbitSignService.getFolderStatus(folderId);
                if (folderStatus?.downloadUrl) {
                    updateData['signature_data.download_url'] = folderStatus.downloadUrl;
                }
            } catch (fetchErr) {
                console.error('Webhook: failed to fetch signed document URL:', fetchErr.message);
            }
        }

        const updatedDocument = await Document.findByIdAndUpdate(document._id, {
            $set: updateData
        }, { new: true });

        // Sync signature_data to embedded documents in ApplicationOfferDocument and ApplicationDocument
        // The updatedDocument should have the complete signature_data after the update
        if (updatedDocument?.signature_data) {
            try {
                await Document.syncDocumentInfo(document._id, { signature_data: updatedDocument.signature_data });
            } catch (syncError) {
                console.error('Error syncing signature_data to embedded documents:', syncError);
                // Don't fail the webhook if sync fails
            }
        }

        // Send WebSocket notification to connected clients for real-time UI update
        try {
            const documentPath = '/api/v1/documents';
            const signers = updatedDocument?.signature_data?.signers || updateData['signature_data.signers'] || document.signature_data?.signers || [];
            const wsMessage = {
                type: 'document_signature_update',
                documentId: document._id.toString(),
                event: event.eventType,
                signer: event.signer,
                signatureStatus: updatedDocument?.signature_data?.signature_status || updateData['signature_data.signature_status'],
                signers,
                timestamp: new Date().toISOString()
            };

            // Broadcast to all connected clients on the document path
            const clients = wsRouter.listClients();
            let sentCount = 0;

            for (const { userId, path } of clients) {
                if (path === documentPath) {
                    const responder = wsRouter.getRespond(userId, path);
                    if (responder) {
                        responder.status(200).json(wsMessage);
                        sentCount++;
                    }
                }
            }

            if (sentCount > 0) {
                console.log(`[WebSocket] Signature update for document ${document._id} sent to ${sentCount} client(s)`);
            }
        } catch (wsError) {
            console.error('Error sending WebSocket notification:', wsError);
            // Don't fail the webhook if WebSocket fails
        }

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
