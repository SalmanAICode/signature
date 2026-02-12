const mongoose = require('mongoose');

const Upload = require('../models/Upload');
const Document = require('../models/Document');

const ErrorResponse = require('../utils/errorResponse');
const Validators = require('../utils/validators');

/**
 * Create a new upload record with document reference
 * @param {Object} documentId - The document ID to associate with the upload
 * @param {Object} uploadData - The upload data including file
 * @param {Array} populate - Fields to populate in the response
 * @param {string} select - Fields to select in the response
 * @returns {Promise<Object>} - The created upload document
 */
exports.createUpload = async (documentId, uploadData, populate = [], select = '') => {
    // Validate document ID
    Validators.checkValidateObjectId(documentId, 'Document ID');

    // Check if document exists
    const document = await Document.findById(documentId);
    Validators.checkResourceNotFound(document, 'Document');

    const { file, ...data } = uploadData;

    // Validate file
    if (!file) {
        throw new ErrorResponse('File is required', 400);
    }

    // Create GridFS bucket
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'uploads'
    });

    // Upload file to GridFS
    const uploadStream = bucket.openUploadStream(file.originalname, {
        metadata: {
            documentId,
            contentType: file.mimetype
        }
    });

    // Upload the file and create the record
    try {
        // Convert the file upload to a Promise
        await new Promise((resolve, reject) => {
            uploadStream.end(file.buffer, (err) => {
                if (err) {
                    console.error('Error uploading file to GridFS:', err);
                    reject(new ErrorResponse('File upload failed', 500));
                } else {
                    resolve();
                }
            });
        });

        // Create upload record
        const uploadRecord = await Upload.create({
            file: uploadStream.id,
            document: documentId,
            file_name: data.file_name || file.originalname,
            file_type: file.mimetype,
            file_size: file.size,
            ...data     // Mainly for upload_contact,upload_representative, upload_user, upload_syndicator, upload_admin, upload_bookkeeper
        });

        Validators.checkResourceCreated(uploadRecord, 'Upload');

        // Update the document with the new file information if needed
        document.file = uploadStream.id;
        document.file_name = data.file_name || file.originalname;
        document.file_type = file.mimetype;
        document.file_size = file.size;
        document.upload_contact = data.upload_contact;
        document.upload_representative = data.upload_representative;
        document.upload_user = data.upload_user;
        document.upload_syndicator = data.upload_syndicator;
        document.upload_admin = data.upload_admin;
        document.upload_bookkeeper = data.upload_bookkeeper;
        document.fileHtml = data?.fileHtml;
        await document.save();

        return await this.getUploadById(uploadRecord._id, populate, select);
    } catch (error) {
        // Attempt to delete the file if upload record creation fails
        try {
            bucket.delete(uploadStream.id);
        } catch (deleteError) {
            console.error('Error deleting uploaded file after failed record creation:', deleteError);
        }

        throw error;
    }
};

/**
 * Get upload by ID
 * @param {string} id - Upload ID
 * @param {Array} populate - Fields to populate
 * @returns {Promise<Object>} - The upload document
 */
exports.getUploadById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'Upload ID');

    const upload = await Upload
        .findById(id)
        .populate(populate)
        .select(select)
        .lean();

    Validators.checkResourceNotFound(upload, 'Upload');

    return upload;
};

/**
 * Download a file by upload ID
 * @param {string} id - Upload ID
 * @returns {Promise<Object>} - Stream and file info
 */
exports.downloadFile = async (id) => {
    Validators.checkValidateObjectId(id, 'Upload ID');

    const upload = await Upload.findById(id);
    Validators.checkResourceNotFound(upload, 'Upload');

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'uploads'
    });

    try {
        const downloadStream = bucket.openDownloadStream(upload.file);

        return {
            stream: downloadStream,
            filename: upload.file_name,
            contentType: upload.file_type
        };
    } catch (error) {
        throw new ErrorResponse('File not found or cannot be downloaded', 404);
    }
};