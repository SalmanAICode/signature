const Joi = require('joi');
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 1024 * 1024 * (process.env.MAX_FILE_SIZE || 5) // Max file size in MB
    }
});

const DocumentService = require('../services/documentService');
const ApplicationOfferService = require('../services/applicationOfferService');
const Document = require('../models/Document');
const ErrorResponse = require('../utils/errorResponse');
const Validators = require('../utils/validators');
const { PORTAL_TYPES } = require('../utils/constants');
const Helpers = require('../utils/helpers');
const { accessControl } = require('../middleware/auth');
const { generatePDF } = require('../pdfService');
const path = require('path');
const wordTemplateService = require('../services/wordTemplateService');
const { mapApplicationOfferToPlaceholders } = require('../utils/applicationOfferPlaceholders');

const default_populate = [
    { path: 'upload_count' },
    { path: 'upload_history_list' }
];

// Query schema for document
const querySchema = {
    sort: Joi.string().optional(),
    search: Joi.string().optional(),
    merchant: Joi.string().optional(),
    funder: Joi.string().optional(),
    iso: Joi.string().optional(),
    syndicator: Joi.string().optional(),
    include_archived: Joi.boolean().optional(),
    file_type: Joi.string().optional(),
    upload_contact: Joi.string().optional(),
    upload_representative: Joi.string().optional(),
    upload_user: Joi.string().optional(),
    upload_admin: Joi.string().optional(),
    upload_bookkeeper: Joi.string().optional(),
    upload_syndicator: Joi.string().optional()
};

// Build dbQuery from query
const buildDbQuery = (req, query) => {
    let dbQuery = {};

    dbQuery.$and = [];

    const funderFilter = Helpers.buildFunderFilter(req, query.funder);
    const merchantFilter = Helpers.buildMerchantFilter(req, query.merchant);
    const isoFilter = Helpers.buildIsoFilter(req, query.iso);
    const syndicatorFilter = Helpers.buildSyndicatorFilter(req, query.syndicator);

    if (funderFilter) dbQuery.$and.push({ 'funder.id': funderFilter });
    if (merchantFilter) dbQuery.$and.push({ 'merchant.id': merchantFilter });
    if (isoFilter) dbQuery.$and.push({ 'iso.id': isoFilter });
    if (syndicatorFilter) dbQuery.$and.push({ 'syndicator.id': syndicatorFilter });

    // File type filter
    if (query.file_type) dbQuery.$and.push({ file_type: query.file_type });

    // Upload admin filter
    if (query.upload_admin) dbQuery.$and.push({ 'upload_admin.id': query.upload_admin });

    // Upload bookkeeper filter
    if (query.upload_bookkeeper) dbQuery.$and.push({ 'upload_bookkeeper.id': query.upload_bookkeeper });

    // Upload user filter
    if (query.upload_user) dbQuery.$and.push({ 'upload_user.id': query.upload_user });

    // Upload contact filter
    if (query.upload_contact) dbQuery.$and.push({ 'upload_contact.id': query.upload_contact });

    // Upload representative filter
    if (query.upload_representative) dbQuery.$and.push({ 'upload_representative.id': query.upload_representative });

    // Upload syndicator filter
    if (query.upload_syndicator) dbQuery.$and.push({ 'upload_syndicator.id': query.upload_syndicator });

    // Archived filter (default: show non-archived)
    if (!query.include_archived) dbQuery.$and.push({ archived: { $ne: true } });

    // Document list: exclude uploads - show template docs and docs sent for signature
    dbQuery.$and.push({
        $or: [
            { source: 'template' },
            { 'signature_data.signature_request_id': { $exists: true, $nin: [null, ''] } },
            { source: { $exists: false } },
            { source: null }
        ]
    });

    // Search
    if (query.search) {
        dbQuery.$and.push({
            $or: [
                { file_name: { $regex: query.search, $options: 'i' } },
                { file_type: { $regex: query.search, $options: 'i' } },
                { 'funder.name': { $regex: query.search, $options: 'i' } },
                { 'funder.email': { $regex: query.search, $options: 'i' } },
                { 'funder.phone': { $regex: query.search, $options: 'i' } },
                { 'iso.name': { $regex: query.search, $options: 'i' } },
                { 'iso.email': { $regex: query.search, $options: 'i' } },
                { 'iso.phone': { $regex: query.search, $options: 'i' } },
                { 'merchant.name': { $regex: query.search, $options: 'i' } },
                { 'merchant.dba_name': { $regex: query.search, $options: 'i' } },
                { 'merchant.email': { $regex: query.search, $options: 'i' } },
                { 'merchant.phone': { $regex: query.search, $options: 'i' } },
                { 'syndicator.name': { $regex: query.search, $options: 'i' } },
                { 'syndicator.first_name': { $regex: query.search, $options: 'i' } },
                { 'syndicator.last_name': { $regex: query.search, $options: 'i' } },
                { 'syndicator.email': { $regex: query.search, $options: 'i' } },
                { 'syndicator.phone_mobile': { $regex: query.search, $options: 'i' } },
                { 'upload_admin.first_name': { $regex: query.search, $options: 'i' } },
                { 'upload_admin.last_name': { $regex: query.search, $options: 'i' } },
                { 'upload_admin.email': { $regex: query.search, $options: 'i' } },
                { 'upload_admin.phone_mobile': { $regex: query.search, $options: 'i' } },
                { 'upload_bookkeeper.first_name': { $regex: query.search, $options: 'i' } },
                { 'upload_bookkeeper.last_name': { $regex: query.search, $options: 'i' } },
                { 'upload_bookkeeper.email': { $regex: query.search, $options: 'i' } },
                { 'upload_bookkeeper.phone_mobile': { $regex: query.search, $options: 'i' } },
                { 'upload_user.first_name': { $regex: query.search, $options: 'i' } },
                { 'upload_user.last_name': { $regex: query.search, $options: 'i' } },
                { 'upload_user.email': { $regex: query.search, $options: 'i' } },
                { 'upload_user.phone_mobile': { $regex: query.search, $options: 'i' } },
                { 'upload_contact.first_name': { $regex: query.search, $options: 'i' } },
                { 'upload_contact.last_name': { $regex: query.search, $options: 'i' } },
                { 'upload_contact.email': { $regex: query.search, $options: 'i' } },
                { 'upload_contact.phone_mobile': { $regex: query.search, $options: 'i' } },
                { 'upload_representative.first_name': { $regex: query.search, $options: 'i' } },
                { 'upload_representative.last_name': { $regex: query.search, $options: 'i' } },
                { 'upload_representative.email': { $regex: query.search, $options: 'i' } },
                { 'upload_representative.phone_mobile': { $regex: query.search, $options: 'i' } },
                { 'upload_syndicator.name': { $regex: query.search, $options: 'i' } },
                { 'upload_syndicator.first_name': { $regex: query.search, $options: 'i' } },
                { 'upload_syndicator.last_name': { $regex: query.search, $options: 'i' } },
                { 'upload_syndicator.email': { $regex: query.search, $options: 'i' } },
                { 'upload_syndicator.phone_mobile': { $regex: query.search, $options: 'i' } },
            ]
        });
    }

    return dbQuery;
};

// @desc    Get all documents
// @route   GET /api/v1/documents
// @access  Private
exports.getDocuments = async (req, res, next) => {
    try {
        const schema = Joi.object({
            page: Joi.number().default(1).optional(),
            limit: Joi.number().default(10).optional(),
            ...querySchema
        });
        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { page, limit, sort, ...query } = value;

        // Build dbQuery from query
        const dbQuery = buildDbQuery(req, query);

        // Handle sort - default: recently updated first (sent for signature shows at top)
        const dbSort = Helpers.buildSort(sort, { updatedAt: -1 });

        const documents = await DocumentService.getDocuments(
            dbQuery,
            page,
            limit,
            dbSort,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: documents
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new document
// @route   POST /api/v1/documents
// @access  Private
exports.createDocument = async (req, res, next) => {
    const uploadMiddleware = upload.single('file');
    uploadMiddleware(req, res, async (err) => {
        if (err) {
            return next(new ErrorResponse(`File upload error: ${err.message}`, 400));
        }
        try {
            const schema = Joi.object({
                merchant: Joi.string().optional().allow(null, ''),
                funder: Joi.string().optional().allow(null, ''),
                iso: Joi.string().optional().allow(null, ''),
                syndicator: Joi.string().optional().allow(null, ''),
                file_name: Joi.string().optional(),
                application_offer_id: Joi.string().optional() // For Word template processing
            });

            const { value, error } = schema.validate(req.body);
            if (error) {
                return next(new ErrorResponse(error.message, 400));
            }

            // Clean the data - remove empty strings and null values
            const documentData = {};
            Object.keys(value).forEach(key => {
                if (value[key] !== null && value[key] !== '' && value[key] !== undefined) {
                    documentData[key] = value[key];
                }
            });

            if (!req.file) {
                return next(new ErrorResponse('Please upload a file', 400));
            }

            if (!documentData.file_name) {
                documentData.file_name = req.file.originalname;
            }

            documentData.portal = req.portal;

            // Apply permission checks
            accessControl(req, documentData);

            // Check the portal and set the upload user info
            switch (req.portal) {
                case PORTAL_TYPES.MERCHANT:
                    documentData.upload_contact = req.id;
                    break;
                case PORTAL_TYPES.ISO:
                    documentData.upload_representative = req.id;
                    break;
                case PORTAL_TYPES.FUNDER:
                    if (!documentData.funder) documentData.funder = req.filter.funder;
                    documentData.upload_user = req.id;
                    break;
                case PORTAL_TYPES.SYNDICATOR:
                    documentData.upload_syndicator = req.id;
                    break;
                case PORTAL_TYPES.ADMIN:
                    documentData.upload_admin = req.id;
                    break;
                case PORTAL_TYPES.BOOKKEEPER:
                    documentData.upload_bookkeeper = req.id;
                    break;
            }

            // Process file based on type
            let result = { value: '' };
            let processedFile = req.file;
            const fileExtension = req.file.originalname.split('.').pop().toLowerCase();

            // Check if this is a Word template for an application offer
            const applicationOfferId = req.body.application_offer_id;
            const isWordTemplate = (fileExtension === 'docx' || fileExtension === 'doc') && applicationOfferId;

            if (isWordTemplate) {
                try {
                    // Get application offer data
                    const populate = [
                        { path: 'application', select: 'name request_amount _id merchant syndicator' },
                        { path: 'merchant', select: 'name dba_name address_list primary_contact primary_owner email phone business_detail' },
                        { path: 'funder', select: 'name email phone address' },
                        { path: 'lender', select: 'name email phone address_detail' },
                        { path: 'iso', select: 'name email phone address_list' }
                    ];

                    const offer = await ApplicationOfferService.getApplicationOfferById(applicationOfferId, populate);

                    // Get merchant account if available
                    const MerchantAccount = require('../models/MerchantAccount');
                    let merchantAccount = null;
                    if (offer.merchant?._id || offer.merchant?.id) {
                        const merchantId = offer.merchant._id || offer.merchant.id;
                        const accounts = await MerchantAccount.find({ merchant: merchantId, inactive: { $ne: true } })
                            .sort({ createdAt: -1 })
                            .limit(1)
                            .lean();
                        if (accounts && accounts.length > 0) {
                            merchantAccount = accounts[0];
                        }
                    }

                    // Get syndicator if available
                    let syndicator = null;
                    if (offer.application?.syndicator) {
                        const Syndicator = require('../models/Syndicator');
                        syndicator = await Syndicator.findById(offer.application.syndicator).lean();
                    }

                    // Map offer data to placeholders
                    const placeholderData = mapApplicationOfferToPlaceholders(offer, merchantAccount, syndicator);

                    // Process Word template: replace placeholders and convert to PDF
                    const pdfBuffer = await wordTemplateService.processWordTemplate(req.file.buffer, placeholderData);

                    // Replace the file with PDF
                    processedFile = {
                        ...req.file,
                        buffer: pdfBuffer,
                        originalname: req.file.originalname.replace(/\.(docx?)$/i, '.pdf'),
                        mimetype: 'application/pdf'
                    };

                    documentData.file_name = documentData.file_name.replace(/\.(docx?)$/i, '.pdf');
                    documentData.file_type = 'application/pdf';
                    documentData.source = 'word_template';

                    console.log('Processed Word template and converted to PDF');
                } catch (templateError) {
                    console.error('Word template processing error:', templateError);
                    if (templateError instanceof ErrorResponse) {
                        return next(templateError);
                    }
                    return next(new ErrorResponse(`Failed to process Word template: ${templateError.message}`, 400));
                }
            } else if (fileExtension === 'docx' || fileExtension === 'doc') {
                // Regular Word file processing (existing behavior)
                try {
                    const docx2html = require('docx2html');
                    const htmlInstance = await docx2html(req.file.buffer);
                    result = { value: htmlInstance.toString() };
                    console.log('Converted DOCX to HTML');
                } catch (conversionError) {
                    console.error('DOCX conversion error:', conversionError);
                    result = { value: '' };
                }
            }

            if (!isWordTemplate) {
                documentData.source = 'upload';
            }

            const document = await DocumentService.createDocument(
                documentData,
                processedFile,
                default_populate,
                result
            );

            res.status(201).json({
                success: true,
                data: document
            });
        } catch (error) {
            console.error('Document creation error:', error);
            return next(new ErrorResponse(error.message, 400));
        }
    });
};

// @desc    Get document list without pagination
// @route   GET /api/v1/documents/list
// @access  Private
exports.getDocumentList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            ...querySchema
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { sort, ...query } = value;

        // Build dbQuery from query
        const dbQuery = buildDbQuery(req, query);

        // Handle sort - default: recently updated first (sent for signature shows at top)
        const dbSort = Helpers.buildSort(sort, { updatedAt: -1 });

        const documents = await DocumentService.getDocumentList(dbQuery, dbSort, [], 'file_name file_type file_size');

        res.status(200).json({
            success: true,
            data: documents
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update document with file upload
// @route   PUT /api/v1/documents/:id/file
// @access  Private
exports.updateDocumentFile = async (req, res, next) => {
    const uploadMiddleware = upload.single('file');

    uploadMiddleware(req, res, async (err) => {
        if (err) {
            return next(new ErrorResponse(`File upload error: ${err.message}`, 400));
        }

        try {
            if (!req.file) {
                return next(new ErrorResponse('Please upload a file', 400));
            }

            const schema = Joi.object({
                id: Joi.string().required(),
                file_name: Joi.string().optional(),
            });

            const { value, error } = schema.validate({ ...req.params, ...req.body });

            if (error) {
                return next(new ErrorResponse(error.message, 400));
            }

            const { id, ...updateData } = value;

            // Check if document exists and user has permission
            const document = await DocumentService.getDocumentById(id);

            // Permission checks based on the portal type and user role
            accessControl(req, document);

            // Check the portal and set the upload user info
            switch (req.portal) {
                case PORTAL_TYPES.MERCHANT:
                    updateData.upload_contact = req.id;
                    break;
                case PORTAL_TYPES.ISO:
                    updateData.upload_representative = req.id;
                    break;
                case PORTAL_TYPES.FUNDER:
                    updateData.upload_user = req.id;
                    break;
                case PORTAL_TYPES.SYNDICATOR:
                    updateData.upload_syndicator = req.id;
                    break;
                case PORTAL_TYPES.ADMIN:
                    updateData.upload_admin = req.id;
                    break;
                case PORTAL_TYPES.BOOKKEEPER:
                    updateData.upload_bookkeeper = req.id;
                    break;
            }

            // If file_name not provided, use the original filename
            if (!updateData.file_name && req.file) {
                updateData.file_name = req.file.originalname;
            }

            // Update the document with the new file
            const updatedDocument = await DocumentService.updateDocumentFile(
                id,
                updateData,
                req.file,
                default_populate
            );

            res.status(200).json({
                success: true,
                data: updatedDocument
            });
        } catch (error) {
            return next(new ErrorResponse(error.message, 400));
        }
    });
};

// @desc    Update document without file
// @route   PUT /api/v1/documents/:id
// @access  Private
exports.updateDocument = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            merchant: Joi.string().optional(),
            funder: Joi.string().optional(),
            iso: Joi.string().optional(),
            syndicator: Joi.string().optional(),
            file_name: Joi.string().optional(),
            archived: Joi.boolean().optional()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, ...updateData } = value;

        // Check if document exists and user has permission
        const document = await DocumentService.getDocumentById(id);

        // Permission checks based on the portal type and user role
        accessControl(req, document);

        // Update the document
        const updatedDocument = await DocumentService.updateDocument(id, updateData, default_populate);

        res.status(200).json({
            success: true,
            data: updatedDocument
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single document
// @route   GET /api/v1/documents/:id
// @access  Private
exports.getDocument = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const document = await DocumentService.getDocumentById(value.id, default_populate);

        // Permission checks based on the portal type and user role
        accessControl(req, document);

        res.status(200).json({
            success: true,
            data: document
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete document (set archived flag)
// @route   DELETE /api/v1/documents/:id
// @access  Private
exports.deleteDocument = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        // Check if document exists and user has permission
        const document = await DocumentService.getDocumentById(value.id);

        // Permission checks based on the portal type and user role
        accessControl(req, document);

        // Soft delete the document (set archived flag)
        const deletedDocument = await DocumentService.deleteDocument(value.id);

        res.status(200).json({
            success: true,
            data: deletedDocument
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Download document file
// @route   GET /api/v1/documents/:id/download
// @access  Private
exports.downloadDocument = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        // Check if document exists and user has permission
        const document = await DocumentService.getDocumentById(value.id);

        // Permission checks based on the portal type and user role
        accessControl(req, document);

        // Get the file stream and metadata
        const { stream, filename, contentType } = await DocumentService.downloadDocumentFile(value.id);

        // Set headers for file download
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Pipe the file stream to the response
        stream.pipe(res);
    } catch (error) {
        next(error);
    }
};

// @desc    Create multiple documents
// @route   POST /api/v1/documents/bulk
// @access  Private
exports.bulkCreateDocuments = async (req, res, next) => {
    try {
        // Use multer's array method to handle multiple files
        const uploadMiddleware = upload.array('files', process.env.MAX_FILE_COUNT || 10); // Max 10 files at once

        uploadMiddleware(req, res, async (err) => {
            try {
                if (err) {
                    return next(new ErrorResponse(`File upload error: ${err.message}`, 400));
                }

                if (!req.files || req.files.length === 0) {
                    return next(new ErrorResponse('Please upload at least one file', 400));
                }

                // Validate file count against environment limit
                const maxFileCount = parseInt(process.env.MAX_FILE_COUNT) || 10;
                if (req.files.length > maxFileCount) {
                    return next(new ErrorResponse(`Maximum ${maxFileCount} files allowed per batch`, 400));
                }

                const schema = Joi.object({
                    merchant: Joi.string().optional(),
                    funder: Joi.string().optional(),
                    iso: Joi.string().optional(),
                    syndicator: Joi.string().optional()
                });

                const { value, error } = schema.validate(req.body);

                if (error) {
                    return next(new ErrorResponse(error.message, 400));
                }

                // Common data for all documents
                const data = { ...value };

                data.portal = req.portal;

                // Apply permission checks
                accessControl(req, data);

                // Set uploader info based on portal
                switch (req.portal) {
                    case PORTAL_TYPES.MERCHANT:
                        data.upload_contact = req.id;
                        break;
                    case PORTAL_TYPES.ISO:
                        data.upload_representative = req.id;
                        break;
                    case PORTAL_TYPES.FUNDER:
                        if (!data.funder) data.funder = req.filter.funder;
                        data.upload_user = req.id;
                        break;
                    case PORTAL_TYPES.SYNDICATOR:
                        data.upload_syndicator = req.id;
                        break;
                    case PORTAL_TYPES.ADMIN:
                        data.upload_admin = req.id;
                        break;
                    case PORTAL_TYPES.BOOKKEEPER:
                        data.upload_bookkeeper = req.id;
                        break;
                }

                // Create document data array for batch processing with optimized mapping
                const documentsData = req.files.map(file => ({
                    ...data,
                    file_name: file.originalname
                }));

                // Use batch processing with individual handling
                // Funder information will be auto-populated by the service
                const results = await DocumentService.createDocumentsBatch(
                    documentsData,
                    req.files,
                    default_populate
                );

                // Return appropriate response based on results
                const statusCode = results.errorCount > 0 && results.successCount === 0
                    ? 500  // All operations failed
                    : 201; // At least some succeeded

                res.status(statusCode).json({
                    success: results.successCount > 0,
                    data: {
                        totalProcessed: documentsData.length,
                        successCount: results.successCount,
                        errorCount: results.errorCount,
                        docs: results.documents,
                        errors: results.errors
                    }
                });
            } catch (error) {
                return next(new ErrorResponse(error.message, 400));
            }
        });
    } catch (error) {
        next(error);
    }
};


// rabbit sign configuration
// rabbit sign configuration
// rabbit sign configuration
// rabbit sign configuration

const rabbitsignConfig = {
    apiKey: process.env.RABBITSIGN_API_KEY,
    apiSecret: process.env.RABBITSIGN_API_SECRET,
    apiUrl: process.env.RABBITSIGN_API_BASE_URL // Replace with actual URL
};

async function sendToRabbitSign(data) {
    const fetch = require('node-fetch'); // or use axios

    const response = await fetch(`${rabbitsignConfig.apiUrl}/documents`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${rabbitsignConfig.apiKey}`,
            'X-API-Secret': rabbitsignConfig.apiSecret
        },
        body: JSON.stringify({
            document: {
                html: data.html,
                title: data.subject
            },
            signers: data.signers,
            message: data.message
        })
    });

    if (!response.ok) {
        throw new Error(`Rabbit Sign API error: ${response.statusText}`);
    }

    return await response.json();
}

exports.sendDocumentViaRabbitSign = async (req, res) => {
    try {
        const { signerEmail, signerName, documentData } = req.body;

        // Load and compile HBS template
        // const templatePath = path.join(__dirname, 'templates', 'document.hbs');
        // const templateSource = fs.readFileSync(templatePath, 'utf8');
        // const template = Handlebars.compile(templateSource);

        // // Generate HTML from template with data
        // const htmlContent = template(documentData);

        const htmlContent = await generatePDF(documentData, 'templates/sample.hbs');

        // Send to Rabbit Sign via EMS
        const response = await sendToRabbitSign({
            html: htmlContent,
            signers: [{
                email: signerEmail,
                name: signerName
            }],
            subject: 'Document for Signature',
            message: 'Please review and sign'
        });

        res.json({
            success: true,
            documentId: response.documentId,
            message: 'Document sent successfully'
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Generate document from template
// @route   POST /api/v1/documents/generate-from-template
// @access  Private
exports.generateDocumentFromTemplate = async (req, res, next) => {
    try {
        const schema = Joi.object({
            template_id: Joi.string().required(),
            offer_id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { template_id, offer_id } = value;

        // Get application offer with fully populated data
        const populate = [
            { path: 'application', select: 'name request_amount _id merchant' },
            { path: 'merchant', select: 'name dba_name address_list primary_contact primary_owner email phone business_detail' },
            { path: 'funder', select: 'name email phone address' },
            { path: 'lender', select: 'name email phone address_detail' },
            { path: 'iso', select: 'name email phone address_list' }
        ];

        const offer = await ApplicationOfferService.getApplicationOfferById(offer_id, populate);

        // Get merchant account (first active account)
        const MerchantAccount = require('../models/MerchantAccount');
        let merchantAccount = null;
        if (offer.merchant?._id || offer.merchant?.id) {
            const merchantId = offer.merchant._id || offer.merchant.id;
            const accounts = await MerchantAccount.find({ merchant: merchantId, inactive: { $ne: true } })
                .sort({ createdAt: -1 })
                .limit(1)
                .lean();
            if (accounts && accounts.length > 0) {
                merchantAccount = accounts[0];
            }
        }

        // Get syndicator if available (from funding or application)
        let syndicator = null;
        if (offer.application?.syndicator) {
            const Syndicator = require('../models/Syndicator');
            syndicator = await Syndicator.findById(offer.application.syndicator).lean();
        }

        // Helper function to format currency
        const formatCurrency = (amount) => {
            if (!amount && amount !== 0) return '0.00';
            return (typeof amount === 'number' ? amount : parseFloat(amount)).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        };

        // Calculate financial details
        const purchasePrice = offer.offered_amount || 0;
        const purchasedAmount = offer.payback_amount || 0;
        const specifiedPercentage = offer.payment_amount && offer.offered_amount
            ? ((offer.payment_amount / offer.offered_amount) * 100).toFixed(2)
            : '10.00';
        const frequency = offer.frequency || 'WEEKLY';
        const initialPeriodicAmount = offer.payment_amount || 0;

        // Calculate fees
        const originationFee = offer.fee_list?.find(f => f.name?.toLowerCase().includes('origination'))?.amount || 0;
        const wireFee = offer.fee_list?.find(f => f.name?.toLowerCase().includes('wire'))?.amount || 0;
        const priorBalance = 0; // Default to 0, can be calculated from funding history if needed

        // Calculate net amount funded
        const totalFees = (offer.fee_amount || 0) + (originationFee || 0);
        const netAmountFunded = purchasePrice - totalFees - (wireFee || 0) - priorBalance;

        // Format merchant address data
        const merchantAddress = offer.merchant?.address_list?.[0] || {};
        const merchantMailingAddress = offer.merchant?.address_list?.[1] || offer.merchant?.address_list?.[0] || {};
        const merchantBusinessDetail = offer.merchant?.business_detail || {};
        const merchantPrimaryContact = offer.merchant?.primary_contact || offer.merchant?.primary_owner || {};

        // Format funder address
        const funderAddress = offer.funder?.address
            ? `${offer.funder.address.address_1 || ''}${offer.funder.address.address_2 ? ', ' + offer.funder.address.address_2 : ''}, ${offer.funder.address.city || ''}, ${offer.funder.address.state || ''} ${offer.funder.address.zip || ''}`.trim()
            : '';

        // Format lender address
        const lenderAddress = offer.lender?.address_detail
            ? `${offer.lender.address_detail.address_1 || ''}${offer.lender.address_detail.address_2 ? ', ' + offer.lender.address_detail.address_2 : ''}, ${offer.lender.address_detail.city || ''}, ${offer.lender.address_detail.state || ''} ${offer.lender.address_detail.zip || ''}`.trim()
            : '';

        // Format ISO address
        const isoAddress = offer.iso?.address_list?.[0]
            ? `${offer.iso.address_list[0].address_1 || ''}${offer.iso.address_list[0].address_2 ? ', ' + offer.iso.address_list[0].address_2 : ''}, ${offer.iso.address_list[0].city || ''}, ${offer.iso.address_list[0].state || ''} ${offer.iso.address_list[0].zip || ''}`.trim()
            : '';

        // Map offer data to template variables based on template type
        let templateData = {};
        let templatePath;

        const isSaleOfFutureReceipts = ['sale-of-future-receipts', 'sale-of-future-receipts-modern', 'sale-of-future-receipts-compact', 'sale-of-future-receipts-formal'].includes(template_id);
        const sfrTemplateData = {
            merchant: {
                name: offer.merchant?.name || 'N/A',
                dba_name: offer.merchant?.dba_name || '',
                business_entity_type: merchantBusinessDetail.entity_type || '',
                state_of_incorporation: merchantBusinessDetail.state_of_incorporation || '',
                street_address: merchantAddress.address_1 || '',
                city: merchantAddress.city || '',
                state: merchantAddress.state || '',
                zip: merchantAddress.zip || '',
                mailing_street: merchantMailingAddress.address_1 || '',
                mailing_city: merchantMailingAddress.city || '',
                mailing_state: merchantMailingAddress.state || '',
                mailing_zip: merchantMailingAddress.zip || '',
                primary_contact_name: merchantPrimaryContact.first_name && merchantPrimaryContact.last_name
                    ? `${merchantPrimaryContact.first_name} ${merchantPrimaryContact.last_name}`
                    : (merchantPrimaryContact.first_name || merchantPrimaryContact.last_name || 'N/A'),
                primary_contact_title: merchantPrimaryContact.title || 'Owner',
                primary_contact_email: merchantPrimaryContact.email || offer.merchant?.email || '',
                primary_contact_phone: merchantPrimaryContact.phone_mobile || merchantPrimaryContact.phone || offer.merchant?.phone || '',
                bank_name: merchantAccount?.bank_name || '',
                routing_number: merchantAccount?.routing_number || '',
                account_number: merchantAccount?.account_number || ''
            },
            iso: {
                name: offer.iso?.name || '',
                email: offer.iso?.email || '',
                phone: offer.iso?.phone || '',
                address: isoAddress || ''
            },
            syndicator: {
                name: syndicator?.name || '',
                first_name: syndicator?.first_name || '',
                last_name: syndicator?.last_name || '',
                email: syndicator?.email || '',
                phone_mobile: syndicator?.phone_mobile || ''
            },
            funder: {
                name: offer.funder?.name || 'N/A',
                address: funderAddress || '',
                email: offer.funder?.email || '',
                phone: offer.funder?.phone || ''
            },
            lender: {
                name: offer.lender?.name || '',
                address: lenderAddress || '',
                email: offer.lender?.email || '',
                phone: offer.lender?.phone || ''
            },
            purchase_price: formatCurrency(purchasePrice),
            purchased_amount: formatCurrency(purchasedAmount),
            specified_percentage: specifiedPercentage,
            frequency: frequency.charAt(0) + frequency.slice(1).toLowerCase(),
            initial_periodic_amount: formatCurrency(initialPeriodicAmount),
            prior_balance: formatCurrency(priorBalance),
            wire_fee: formatCurrency(wireFee),
            origination_fee: formatCurrency(originationFee),
            net_amount_funded: formatCurrency(netAmountFunded),
            fee_list: (offer.fee_list && offer.fee_list.length > 0) ? offer.fee_list.map(fee => ({
                name: fee.name || 'Fee',
                fee_type: fee.fee_type || '',
                amount: formatCurrency(fee.amount || 0)
            })) : [],
            effective_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
            generation_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            document_id: offer._id.toString().substring(0, 8)
        };

        if (template_id === 'sale-of-future-receipts') {
            templatePath = 'templates/sale-of-future-receipts.hbs';
            templateData = sfrTemplateData;
        } else if (template_id === 'sale-of-future-receipts-modern') {
            templatePath = 'templates/sale-of-future-receipts-modern.hbs';
            templateData = sfrTemplateData;
        } else if (template_id === 'sale-of-future-receipts-compact') {
            templatePath = 'templates/sale-of-future-receipts-compact.hbs';
            templateData = sfrTemplateData;
        } else if (template_id === 'sale-of-future-receipts-formal') {
            templatePath = 'templates/sale-of-future-receipts-formal.hbs';
            templateData = sfrTemplateData;
        } else {
            // Default template (sample) - keep existing mapping
            templatePath = 'templates/sample.hbs';
            templateData = {
                customerName: offer.merchant?.name || offer.application?.name || 'N/A',
                lpoNumber: offer.application?._id?.toString().substring(0, 8) || offer.application?.name || 'N/A',
                invoiceNumber: `INV-${offer._id.toString().substring(0, 8)}`,
                invoiceDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
                deliverySite: offer.merchant?.address_list?.[0]
                    ? `${offer.merchant.address_list[0].address_1 || ''}, ${offer.merchant.address_list[0].city || ''}`.trim().replace(/^,\s*|,\s*$/g, '')
                    : 'N/A',
                items: [
                    {
                        name: 'Funding Amount',
                        description: 'Merchant Cash Advance',
                        quantity: 1,
                        price: formatCurrency(offer.offered_amount || 0),
                        total: formatCurrency(offer.offered_amount || 0)
                    }
                ],
                subTotal: formatCurrency(offer.offered_amount || 0),
                taxAmount: '0.00',
                grandTotal: formatCurrency(offer.payback_amount || 0),
                receiverName: offer.merchant?.primary_contact
                    ? `${offer.merchant.primary_contact.first_name || ''} ${offer.merchant.primary_contact.last_name || ''}`.trim()
                    : 'N/A',
                receiverMobile: offer.merchant?.primary_contact?.phone_mobile || offer.merchant?.primary_contact?.phone || 'N/A',
                logoDataUri: ''
            };
        }

        // Determine template file path
        if (!templatePath) {
            switch (template_id) {
                case 'sample':
                    templatePath = 'templates/sample.hbs';
                    break;
                default:
                    return next(new ErrorResponse(`Template '${template_id}' not found`, 404));
            }
        }

        // Generate HTML from template
        const htmlContent = await generatePDF(templateData, templatePath);

        // Create document data
        const documentData = {
            file_name: isSaleOfFutureReceipts
                ? `Sale of Future Receipts`
                : `${templateData.invoiceNumber || 'DOC'}_${offer._id}.html`,
            merchant: offer.merchant?._id || offer.merchant?.id || offer.application?.merchant,
            funder: offer.funder?._id || offer.funder?.id,
            iso: offer.iso?._id || offer.iso?.id,
            syndicator: syndicator?._id || syndicator?.id,
            portal: req.portal
        };

        // Apply permission checks
        accessControl(req, documentData);

        // Set upload user based on portal type
        switch (req.portal) {
            case PORTAL_TYPES.MERCHANT:
                documentData.upload_contact = req.id;
                break;
            case PORTAL_TYPES.ISO:
                documentData.upload_representative = req.id;
                break;
            case PORTAL_TYPES.FUNDER:
                if (!documentData.funder) documentData.funder = req.filter.funder;
                documentData.upload_user = req.id;
                break;
            case PORTAL_TYPES.SYNDICATOR:
                documentData.upload_syndicator = req.id;
                break;
            case PORTAL_TYPES.ADMIN:
                documentData.upload_admin = req.id;
                break;
            case PORTAL_TYPES.BOOKKEEPER:
                documentData.upload_bookkeeper = req.id;
                break;
        }

        // Create document via DocumentService (converts funder/merchant to embedded format for list queries)
        documentData.fileHtml = { value: htmlContent };
        documentData.file_type = 'text/html';
        documentData.source = 'template';

        const populatedDocument = await DocumentService.createDocument(
            documentData,
            null, // no file upload
            default_populate,
            { value: htmlContent },
            ''
        );

        Validators.checkResourceCreated(populatedDocument, 'Document');

        res.status(201).json({
            success: true,
            data: populatedDocument
        });
    } catch (error) {
        console.error('Error generating document from template:', error);
        return next(new ErrorResponse(error.message || 'Failed to generate document from template', 500));
    }
};

// @desc    Get available placeholders for Word templates
// @route   GET /api/v1/documents/word-template-placeholders
// @access  Private
exports.getWordTemplatePlaceholders = async (req, res, next) => {
    try {
        const { getAvailablePlaceholders } = require('../utils/applicationOfferPlaceholders');
        const placeholders = getAvailablePlaceholders();
        
        res.status(200).json({
            success: true,
            data: {
                placeholders: placeholders,
                format: '{{FieldName}}',
                description: 'Use these placeholders in your Word template. Placeholders will be replaced with actual values from the application offer. Placeholders not found in the data will be left as-is.'
            }
        });
    } catch (error) {
        next(error);
    }
};