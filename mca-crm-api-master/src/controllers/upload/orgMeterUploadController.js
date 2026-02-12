const Joi = require('joi');
const multer = require('multer');
const path = require('path');

const UploadJob = require('../../models/UploadJob');
const UploadOrgMeterPaymentService = require('../../services/upload/OrgMeter/uploadOrgMeterPaymentService');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
        files: 1
    },
    fileFilter: (req, file, cb) => {
        // Only allow CSV files
        if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'), false);
        }
    }
});

// Track running upload jobs for cancellation support
const runningUploadJobs = new Map();

/**
 * Execute upload job in the background
 * @param {string} jobId - The job ID to execute
 * @param {string} entityType - The entity type being uploaded
 */
async function executeUploadJob(jobId, entityType) {
    try {
        // Add job to running jobs tracker
        runningUploadJobs.set(jobId, { cancelled: false });

        switch (entityType) {
        case 'payment': {
            // Extract funder ID from job parameters
            const uploadJob = await UploadJob.findOne({ jobId });
            if (!uploadJob) {
                console.error(`Upload job ${jobId} not found`);
                return;
            }

            const uploadService = new UploadOrgMeterPaymentService(
                uploadJob.parameters.funder,
                uploadJob.createdBy
            );
            await uploadService.processPaymentUpload(jobId);
            break;
        }
        default:
            throw new Error(`Upload processing for entity type '${entityType}' is not yet implemented`);
        }

    } catch (error) {
        console.error(`Upload job ${jobId} failed:`, error);
        
        // Update job status to failed
        const uploadJob = await UploadJob.findOne({ jobId });
        if (uploadJob) {
            await uploadJob.markFailed(error);
        }
    } finally {
        // Clean up running job tracker
        runningUploadJobs.delete(jobId);
    }
}

/**
 * Parse CSV file content
 * @param {Buffer} fileBuffer - File buffer
 * @returns {Promise<Array>} Parsed CSV data
 */
function parseCsvFile(fileBuffer) {
    return new Promise((resolve, reject) => {
        const results = [];
        const csvString = fileBuffer.toString('utf8');
        
        // Split by lines and parse manually for better control
        const lines = csvString.split('\n').map(line => line.trim()).filter(line => line);
        
        if (lines.length === 0) {
            reject(new Error('CSV file is empty'));
            return;
        }

        try {
            for (const line of lines) {
                // Simple CSV parsing - split by comma and handle quoted values
                const row = [];
                let current = '';
                let inQuotes = false;
                
                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    
                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        row.push(current.trim());
                        current = '';
                    } else {
                        current += char;
                    }
                }
                
                // Add the last field
                row.push(current.trim());
                results.push(row);
            }
            
            resolve(results);
        } catch (error) {
            reject(new Error(`Error parsing CSV: ${error.message}`));
        }
    });
}

/**
 * @desc    Create a new upload job for specific entity type
 * @route   POST /api/upload/orgmeter/:entityType
 * @access  Private
 */
exports.createUploadJob = [
    upload.single('csvFile'),
    async (req, res) => {
        try {
            const { entityType } = req.params;

            // Validate entity type
            if (!['payment'].includes(entityType)) {
                return res.status(400).json({
                    success: false,
                    message: `Unsupported entity type: ${entityType}. Supported types: payment`
                });
            }

            // Validate request body
            const schema = Joi.object({
                funder: Joi.string().required(),
                fieldMappings: Joi.object().required(),
                skipFirstRow: Joi.boolean().default(true)
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            const { funder, fieldMappings, skipFirstRow } = value;

            // Check if file was uploaded
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'CSV file is required'
                });
            }

            // Parse field mappings if it's a string
            let parsedFieldMappings;
            try {
                parsedFieldMappings = typeof fieldMappings === 'string' 
                    ? JSON.parse(fieldMappings) 
                    : fieldMappings;
            } catch (parseError) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid fieldMappings format. Must be a valid JSON object.'
                });
            }

            // Parse CSV file
            let csvData;
            try {
                csvData = await parseCsvFile(req.file.buffer);
            } catch (parseError) {
                return res.status(400).json({
                    success: false,
                    message: `Error parsing CSV file: ${parseError.message}`
                });
            }

            if (csvData.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'CSV file is empty'
                });
            }

            // Validate CSV structure based on entity type
            let validation;
            switch (entityType) {
            case 'payment':
                validation = UploadOrgMeterPaymentService.validateCsvStructure(
                    csvData[0], 
                    parsedFieldMappings
                );
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: `Validation for entity type '${entityType}' is not implemented`
                });
            }

            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'CSV file structure is invalid',
                    details: {
                        missingFields: validation.missingFields,
                        foundFields: validation.foundFields,
                        requiredFields: ['paymentId', 'advanceId', 'amount', 'paidDate', 'dueAt', 'paid']
                    }
                });
            }

            // Check if there's already an active upload job for this entity type and funder
            const existingJob = await UploadJob.findOne({
                entityType,
                'parameters.funder': funder,
                status: { $in: ['pending', 'running'] }
            });

            if (existingJob) {
                return res.status(409).json({
                    success: false,
                    message: `An upload job for ${entityType} is already running for this funder`,
                    data: {
                        jobId: existingJob.jobId,
                        status: existingJob.status,
                        progress: existingJob.progress
                    }
                });
            }

            // Calculate total rows (excluding header if skipFirstRow is true)
            const totalRows = skipFirstRow ? csvData.length - 1 : csvData.length;

            // Create the upload job
            const uploadJob = await UploadJob.createJob({
                entityType,
                parameters: {
                    funder,
                    fileName: req.file.originalname,
                    fieldMappings: parsedFieldMappings,
                    columnIndexes: validation.columnIndexes,
                    skipFirstRow
                },
                uploadData: {
                    fileSize: req.file.size,
                    totalRows,
                    csvData
                },
                createdBy: req.user?.id || null
            });

            // Start the background upload process
            setImmediate(() => {
                executeUploadJob(uploadJob.jobId, entityType);
            });

            res.status(202).json({
                success: true,
                message: `Upload job for ${entityType} created successfully`,
                data: {
                    jobId: uploadJob.jobId,
                    entityType: uploadJob.entityType,
                    status: uploadJob.status,
                    fileName: req.file.originalname,
                    fileSize: req.file.size,
                    totalRows,
                    validation: {
                        foundFields: validation.foundFields,
                        columnIndexes: validation.columnIndexes
                    }
                }
            });

        } catch (error) {
            console.error('Error creating upload job:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating upload job',
                error: error.message
            });
        }
    }
];

/**
 * @desc    Get upload job status and progress
 * @route   GET /api/upload/orgmeter/job/:jobId/status
 * @access  Private
 */
exports.getUploadJobStatus = async (req, res) => {
    try {
        const { jobId } = req.params;

        const uploadJob = await UploadJob.findOne({ jobId })
            .populate('createdBy', 'first_name last_name email');

        if (!uploadJob) {
            return res.status(404).json({
                success: false,
                message: 'Upload job not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Upload job status retrieved',
            data: {
                jobId: uploadJob.jobId,
                entityType: uploadJob.entityType,
                status: uploadJob.status,
                progress: uploadJob.progress,
                parameters: {
                    funder: uploadJob.parameters.funder,
                    fileName: uploadJob.parameters.fileName,
                    fieldMappings: uploadJob.parameters.fieldMappings,
                    skipFirstRow: uploadJob.parameters.skipFirstRow
                },
                uploadData: {
                    fileSize: uploadJob.uploadData.fileSize,
                    totalRows: uploadJob.uploadData.totalRows
                },
                results: uploadJob.results,
                error: uploadJob.error,
                startedAt: uploadJob.startedAt,
                completedAt: uploadJob.completedAt,
                estimatedTimeRemaining: uploadJob.estimatedTimeRemaining,
                lastProgressUpdate: uploadJob.lastProgressUpdate,
                createdAt: uploadJob.createdAt,
                createdBy: uploadJob.createdBy,
                isRunning: runningUploadJobs.has(jobId)
            }
        });

    } catch (error) {
        console.error(`Error getting upload job status for ${req.params.jobId}:`, error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving upload job status',
            error: error.message
        });
    }
};

/**
 * @desc    Cancel a running upload job
 * @route   POST /api/upload/orgmeter/job/:jobId/cancel
 * @access  Private
 */
exports.cancelUploadJob = async (req, res) => {
    try {
        const { jobId } = req.params;

        const uploadJob = await UploadJob.findOne({ jobId });
        if (!uploadJob) {
            return res.status(404).json({
                success: false,
                message: 'Upload job not found'
            });
        }

        if (!['pending', 'running'].includes(uploadJob.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel job with status: ${uploadJob.status}. Only pending or running jobs can be cancelled.`
            });
        }

        // Signal cancellation to running process
        const jobTracker = runningUploadJobs.get(jobId);
        if (jobTracker) {
            jobTracker.cancelled = true;
            console.log(`Signaled cancellation for running upload job ${jobId}`);
        }

        // Update database status
        await uploadJob.markCancelled();

        res.status(200).json({
            success: true,
            message: 'Upload job cancellation initiated',
            data: {
                jobId: uploadJob.jobId,
                status: uploadJob.status,
                completedAt: uploadJob.completedAt,
                wasRunning: !!jobTracker
            }
        });

    } catch (error) {
        console.error(`Error cancelling upload job ${req.params.jobId}:`, error);
        res.status(500).json({
            success: false,
            message: 'Error cancelling upload job',
            error: error.message
        });
    }
};

/**
 * @desc    Get all upload jobs with optional filtering
 * @route   POST /api/upload/orgmeter/jobs
 * @access  Private
 */
exports.getUploadJobs = async (req, res) => {
    try {
        const schema = Joi.object({
            funder: Joi.string().optional(),
            status: Joi.string().valid('pending', 'running', 'completed', 'failed', 'cancelled').optional(),
            entityType: Joi.string().valid('payment').optional()
        });

        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        const { funder, status, entityType } = req.body;

        // Build query filter
        let queryFilter = {};
        if (funder) queryFilter['parameters.funder'] = funder;
        if (status) queryFilter.status = status;
        if (entityType) queryFilter.entityType = entityType;

        // Get all jobs
        const jobs = await UploadJob.find(queryFilter)
            .sort({ createdAt: -1 })
            .populate('createdBy', 'first_name last_name email')
            .lean();

        // Add runtime information
        const jobsWithRuntime = jobs.map(job => ({
            ...job,
            isRunning: runningUploadJobs.has(job.jobId)
        }));

        // Get job statistics
        const stats = await UploadJob.aggregate([
            { $match: funder ? { 'parameters.funder': funder } : {} },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const statistics = stats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {});

        res.status(200).json({
            success: true,
            message: 'Upload jobs retrieved',
            data: {
                jobs: jobsWithRuntime,
                total: jobs.length,
                statistics,
                runningJobs: runningUploadJobs.size
            }
        });

    } catch (error) {
        console.error('Error getting upload jobs:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving upload jobs',
            error: error.message
        });
    }
};

module.exports = {
    createUploadJob: exports.createUploadJob,
    getUploadJobStatus: exports.getUploadJobStatus,
    cancelUploadJob: exports.cancelUploadJob,
    getUploadJobs: exports.getUploadJobs
}; 