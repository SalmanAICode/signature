/**
 * RabbitSign Controller - Standalone Integration Code
 * 
 * Express.js controller for RabbitSign endpoints.
 * Copy this file to your controllers directory.
 */

const RabbitSignService = require('../services/rabbitsignService');

/**
 * Get upload URL for document file
 * GET /api/v1/rabbitsign/documents/:id/upload-url
 */
exports.getUploadUrl = async (req, res, next) => {
    try {
        const { id } = req.params;
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
        return next(new Error(error.message || 'Failed to get upload URL'));
    }
};

/**
 * Upload document file to RabbitSign S3
 * POST /api/v1/rabbitsign/documents/:id/upload-file
 */
exports.uploadFile = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { upload_url, file_content, content_type = 'application/pdf' } = req.body;

        // Convert base64 to Buffer if needed
        let fileBuffer = file_content;
        if (typeof file_content === 'string') {
            const base64Data = file_content.includes(',') 
                ? file_content.split(',')[1] 
                : file_content;
            fileBuffer = Buffer.from(base64Data, 'base64');
        }

        await RabbitSignService.uploadFileToS3(upload_url, fileBuffer, content_type);

        res.status(200).json({
            success: true,
            data: {
                document_id: id,
                message: 'File uploaded successfully'
            }
        });
    } catch (error) {
        return next(new Error(error.message || 'Failed to upload file'));
    }
};

/**
 * Initiate signature request for a document
 * POST /api/v1/rabbitsign/documents/:id/sign
 * 
 * Body: {
 *   signers: [{ email, name, role, fields: [{ type, position: { x, y, width, height, pageIndex } }] }],
 *   file_content?: string (base64),
 *   file_url?: string (S3 URL),
 *   message?: string,
 *   title?: string
 * }
 */
exports.initiateSignature = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { signers, message, title, summary, file_url, file_content } = req.body;

        let uploadedFileUrl = file_url;

        // If file_content provided, upload it first
        if (file_content && !file_url) {
            const uploadUrlResponse = await RabbitSignService.getUploadUrl();
            const uploadUrl = uploadUrlResponse.uploadUrl;

            let fileBuffer = file_content;
            if (typeof file_content === 'string') {
                const base64Data = file_content.includes(',') 
                    ? file_content.split(',')[1] 
                    : file_content;
                fileBuffer = Buffer.from(base64Data, 'base64');
            }

            await RabbitSignService.uploadFileToS3(uploadUrl, fileBuffer, 'application/pdf');
            uploadedFileUrl = uploadUrl.split('?')[0]; // Remove query params
        }

        if (!uploadedFileUrl) {
            return next(new Error('File URL or file content is required'));
        }

        // Get today's date
        const localDate = new Date().toISOString().split('T')[0];

        // Build signerInfo object
        const signerInfo = {};
        signers.forEach((signer) => {
            signerInfo[signer.email] = {
                name: signer.name,
                fields: signer.fields || []
            };
        });

        // Create folder
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
        return next(new Error(error.message || 'Failed to initiate signature'));
    }
};

/**
 * Get signature status for a document
 * GET /api/v1/rabbitsign/documents/:id/signature-status?folder_id=xxx
 */
exports.getSignatureStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const folderId = req.query.folder_id;

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

        const folderStatus = await RabbitSignService.getFolderStatus(folderId);

        // Map status
        let mappedStatus = 'pending';
        if (folderStatus.folderStatus === 'SIGNED' || folderStatus.folderStatus === 'COMPLETED') {
            mappedStatus = 'completed';
        } else if (folderStatus.folderStatus === 'CANCELLED') {
            mappedStatus = 'cancelled';
        }

        // Map signers
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
        return next(new Error(error.message || 'Failed to get signature status'));
    }
};

/**
 * Handle RabbitSign webhook
 * POST /api/v1/rabbitsign/webhook
 */
exports.handleWebhook = async (req, res) => {
    try {
        const event = RabbitSignService.processWebhookEvent(req.body);

        // TODO: Update your document record here
        // const document = await YourDocumentModel.findOne({
        //     signature_request_id: event.signatureRequestId
        // });
        // if (document) {
        //     await YourDocumentModel.findByIdAndUpdate(document._id, {
        //         $set: {
        //             signature_status: event.eventType === 'signature_completed' ? 'completed' : 'pending'
        //         }
        //     });
        // }

        res.status(200).json({
            success: true,
            message: 'Webhook processed successfully',
            event: event.eventType
        });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(200).json({
            success: false,
            message: 'Webhook processed with errors'
        });
    }
};

module.exports = exports;
