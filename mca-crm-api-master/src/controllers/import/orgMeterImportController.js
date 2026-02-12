const Joi = require('joi');

const PORTAL_TYPES = require('../../utils/constants');

const OrgMeterApiService = require('../../services/import/OrgMeter/orgMeterApiService');
const OrgMeterAdvanceService = require('../../services/import/OrgMeter/orgMeterAdvanceService');
const OrgMeterIsoService = require('../../services/import/OrgMeter/orgMeterIsoService');
const OrgMeterLenderService = require('../../services/import/OrgMeter/orgMeterLenderService');
const OrgMeterMerchantService = require('../../services/import/OrgMeter/orgMeterMerchantService');
const OrgMeterSyndicatorService = require('../../services/import/OrgMeter/orgMeterSyndicatorService');
const OrgMeterUserService = require('../../services/import/OrgMeter/orgMeterUserService');

const FunderService = require('../../services/funderService');

const ImportJob = require('../../models/ImportJob');

const defaultFundingStatuses = require('../../../data/default/orgmeter/fundingStatus');
const defaultFeeTypes = require('../../../data/default/orgmeter/feeType');

// Map entity types to their respective service classes and models
const entityServiceMap = {
    user: {
        service: OrgMeterUserService,
        model: require('../../models/OrgMeter/User'),
        methodPrefix: 'User',
    },
    lender: {
        service: OrgMeterLenderService,
        model: require('../../models/OrgMeter/Lender'),
        methodPrefix: 'Lender',
    },
    iso: {
        service: OrgMeterIsoService,
        model: require('../../models/OrgMeter/Iso'),
        methodPrefix: 'Iso',
    },
    merchant: {
        service: OrgMeterMerchantService,
        model: require('../../models/OrgMeter/Merchant'),
        methodPrefix: 'Merchant',
    },
    syndicator: {
        service: OrgMeterSyndicatorService,
        model: require('../../models/OrgMeter/Syndicator'),
        methodPrefix: 'Syndicator',
    },
    advance: {
        service: OrgMeterAdvanceService,
        model: require('../../models/OrgMeter/Advance'),
        methodPrefix: 'Advance',
    },
};

// Define import order for step-by-step process
const IMPORT_ORDER = [
    'user',
    'lender',
    'iso',
    'merchant',
    'syndicator',
    'advance',
];

// Track running import jobs for cancellation support
const runningJobs = new Map(); // jobId -> { cancelled: boolean, abortController: AbortController }

/**
 * Execute import job in the background
 * @param {string} jobId - The job ID to execute
 */
async function executeImportJob(jobId) {
    let importJob;
    
    try {
        importJob = await ImportJob.findOne({ jobId });
        if (!importJob) {
            console.error(`Import job ${jobId} not found`);
            return;
        }

        // Add job to running jobs tracker
        runningJobs.set(jobId, { cancelled: false, paused: false });

        // Mark job as started (only if not resuming)
        if (importJob.status !== 'running') {
            await importJob.markStarted();
        }

        const { entityType, parameters } = importJob;
        const { apiKey, funder, batchSize, updateExisting } = parameters;

        // Initialize the appropriate service
        const ServiceClass = entityServiceMap[entityType].service;
        const importService = new ServiceClass(apiKey, funder);

        // Get total count for progress tracking
        const orgMeterApiService = new OrgMeterApiService(apiKey);
        const totalEntities = await orgMeterApiService.getTotalCount(entityType);

        // Update job with total count
        await importJob.updateProgress(0, totalEntities);

        // Helper function to check if job is cancelled or paused
        const checkCancellationOrPause = async () => {
            const jobTracker = runningJobs.get(jobId);
            if (jobTracker && jobTracker.cancelled) {
                throw new Error('Import job was cancelled by user');
            }
            if (jobTracker && jobTracker.paused) {
                throw new Error('Import job was paused by user');
            }
            
            // Also check database status in case it was cancelled/paused externally
            const currentJob = await ImportJob.findOne({ jobId });
            if (currentJob && currentJob.status === 'cancelled') {
                if (jobTracker) {
                    jobTracker.cancelled = true;
                }
                throw new Error('Import job was cancelled');
            }
            if (currentJob && currentJob.status === 'paused') {
                if (jobTracker) {
                    jobTracker.paused = true;
                }
                throw new Error('Import job was paused');
            }
        };

        // Check for cancellation/pause before starting the main import
        await checkCancellationOrPause();

        // Create progress callback similar to sync controller
        const progressCallback = async (processed, total, currentEntity) => {
            await checkCancellationOrPause(); // Check for cancellation/pause on each progress update
            await importJob.updateProgress(processed, total, currentEntity);
        };

        // Execute the import with progress callback
        const methodName = `importAll${entityServiceMap[entityType].methodPrefix}s`;
        const results = await importService[methodName]({
            updateExisting,
            dryRun: false,
            batchSize,
            progressCallback
        });

        // Mark job as completed
        await importJob.markCompleted({
            imported: results.stats?.totalSaved || 0,
            updated: results.stats?.totalUpdated || 0,
            errors: results.stats?.errorCount || 0,
            skipped: results.stats?.totalSkipped || 0,
            details: results
        });

        console.log(`Import job ${jobId} completed successfully`);

    } catch (error) {
        console.error(`Import job ${jobId} failed:`, error);
        
        if (importJob) {
            // Check if this was a cancellation or pause
            if (error.message.includes('cancelled')) {
                await importJob.markCancelled();
                console.log(`Import job ${jobId} was cancelled`);
            } else if (error.message.includes('paused')) {
                // Job was paused, no need to mark as failed
                console.log(`Import job ${jobId} was paused`);
            } else {
                await importJob.markFailed(error);
            }
        }
    } finally {
        // Clean up running job tracker
        runningJobs.delete(jobId);
    }
}

/**
 * @desc    Test OrgMeter API connection and validate API key
 * @route   POST /api/import/orgmeter/validate-api
 * @access  Private
 */
exports.validateApiKey = async (req, res) => {
    try {
        const schema = Joi.object({
            apiKey: Joi.string().required(),
        });

        const { error } = schema.validate(req.body);
        if (error) {
            return res
                .status(400)
                .json({ success: false, message: error.message });
        }

        const { apiKey } = req.body;

        const orgMeterApiService = new OrgMeterApiService(apiKey);
        const isConnected = await orgMeterApiService.testConnection();
        const apiInfo = orgMeterApiService.getApiInfo();

        if (isConnected) {
            res.status(200).json({
                success: true,
                message: 'API key is valid and connection successful',
                data: {
                    connected: isConnected,
                    apiInfo: apiInfo,
                    importSteps: IMPORT_ORDER,
                },
            });
        } else {
            throw new Error('API key is invalid or connection failed');
        }
    } catch (error) {
        console.error('Error validating API key:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: error.message,
        });
    }
};

/**
 * @desc    Create a new import job for specific entity type
 * @route   POST /api/import/orgmeter/jobs
 * @access  Private
 */
exports.createImportJob = async (req, res) => {
    try {
        const schema = Joi.object({
            entityType: Joi.string().valid(...Object.keys(entityServiceMap)).required(),
            apiKey: Joi.string().required(),
            funder: Joi.string().required(),
            batchSize: Joi.number().min(1).max(100).default(20),
            updateExisting: Joi.boolean().default(true),
        });

        const { error } = schema.validate(req.body);
        if (error) {
            return res
                .status(400)
                .json({ success: false, message: error.message });
        }

        const { entityType, apiKey, funder, batchSize, updateExisting } = req.body;

        // Check if there's already an active import job for this entity type and funder
        // Active jobs include: pending, running, and paused (user must resume or cancel paused jobs)
        const existingJob = await ImportJob.findOne({
            entityType,
            'parameters.funder': funder,
            status: { $in: ['pending', 'running', 'paused'] }
        });

        if (existingJob) {
            const actionSuggestion = existingJob.status === 'paused' 
                ? 'Please resume or cancel the paused job before creating a new one.'
                : 'Please wait for the current job to complete or cancel it.';
                
            return res.status(409).json({
                success: false,
                message: `An import job for ${entityType} already exists for this funder (status: ${existingJob.status}). ${actionSuggestion}`,
                data: {
                    jobId: existingJob.jobId,
                    status: existingJob.status,
                    progress: existingJob.progress,
                    pausedAt: existingJob.pausedAt,
                    canResume: existingJob.status === 'paused',
                    canCancel: ['pending', 'running', 'paused'].includes(existingJob.status)
                }
            });
        }

        // Validate API key before creating job
        const orgMeterApiService = new OrgMeterApiService(apiKey);
        const isConnected = await orgMeterApiService.testConnection();
        if (!isConnected) {
            return res.status(400).json({
                success: false,
                message: 'Invalid API key or connection failed'
            });
        }

        // Create the import job
        const importJob = await ImportJob.createJob({
            entityType,
            parameters: {
                apiKey,
                funder,
                batchSize,
                updateExisting
            },
            createdBy: req.user?.id || null
        });

        // Start the background import process
        setImmediate(() => {
            executeImportJob(importJob.jobId);
        });

        // Return immediately with job ID
        res.status(202).json({
            success: true,
            message: `Import job started for ${entityType}`,
            data: {
                jobId: importJob.jobId,
                entityType: importJob.entityType,
                status: importJob.status,
                progress: importJob.progress,
                estimatedTimeRemaining: importJob.estimatedTimeRemaining
            }
        });

    } catch (error) {
        console.error('Error creating import job:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating import job',
            error: error.message,
        });
    }
};

// This function has been removed as it references syncMetadata which is not part of import functionality
// Use getEntityJobStatus for entity-specific import information

// This function has been removed as it references syncMetadata which is not part of import functionality
// Use getEntityJobStatus for entity-specific import information

/**
 * @desc    Get funders list with matching API key for resume import
 * @route   POST /api/import/orgmeter/funders
 * @access  Private
 */
exports.getFundersByApiKey = async (req, res) => {
    try {
        const schema = Joi.object({
            apiKey: Joi.string().required(),
        });

        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        const { apiKey } = req.body;

        // Validate API key first
        const orgMeterApiService = new OrgMeterApiService(apiKey);
        const isConnected = await orgMeterApiService.testConnection();
        if (!isConnected) {
            return res.status(400).json({
                success: false,
                message: 'Invalid API key or connection failed'
            });
        }

        // First, get all funders that have this API key in their import settings
        const FunderService = require('../../services/funderService');
        const query = {
            'import.api_key': apiKey,
            inactive: { $ne: true } // Exclude inactive funders
        };
        const fundersWithApiKey = await FunderService.getFunderList(query, { createdAt: -1 });

        if (!fundersWithApiKey || fundersWithApiKey.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No funders found with this API key',
                data: {
                    apiKey: {
                        isValid: true,
                        apiInfo: orgMeterApiService.getApiInfo()
                    },
                    funders: [],
                    summary: {
                        totalFunders: 0,
                        fundersWithActiveJobs: 0,
                        totalActiveJobs: 0,
                        totalCompletedJobs: 0
                    }
                }
            });
        }

        // Get job statistics for each funder
        const fundersWithDetails = [];

        for (const funder of fundersWithApiKey) {
            try {
                // Get job statistics for this funder
                const jobStats = await ImportJob.aggregate([
                    {
                        $match: {
                            'parameters.funder': funder._id.toString()
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalJobs: { $sum: 1 },
                            activeJobs: {
                                $sum: {
                                    $cond: [
                                        { $in: ['$status', ['pending', 'running']] },
                                        1,
                                        0
                                    ]
                                }
                            },
                            completedJobs: {
                                $sum: {
                                    $cond: [
                                        { $eq: ['$status', 'completed'] },
                                        1,
                                        0
                                    ]
                                }
                            },
                            failedJobs: {
                                $sum: {
                                    $cond: [
                                        { $eq: ['$status', 'failed'] },
                                        1,
                                        0
                                    ]
                                }
                            },
                            cancelledJobs: {
                                $sum: {
                                    $cond: [
                                        { $eq: ['$status', 'cancelled'] },
                                        1,
                                        0
                                    ]
                                }
                            },
                            lastJobCreated: { $max: '$createdAt' },
                            lastJobCompleted: { $max: '$completedAt' },
                            entityTypes: { $addToSet: '$entityType' }
                        }
                    }
                ]);

                const stats = jobStats[0] || {
                    totalJobs: 0,
                    activeJobs: 0,
                    completedJobs: 0,
                    failedJobs: 0,
                    cancelledJobs: 0,
                    lastJobCreated: null,
                    lastJobCompleted: null,
                    entityTypes: []
                };

                fundersWithDetails.push({
                    funderId: funder._id.toString(),
                    funderName: funder.name,
                    funderEmail: funder.email || null,
                    funderWebsite: funder.website || null,
                    importSettings: {
                        apiKey: funder.import?.api_key ? '***' + funder.import.api_key.slice(-4) : null,
                        clientName: funder.import?.client_name || null,
                        source: funder.import?.source || null
                    },
                    importStats: {
                        totalJobs: stats.totalJobs,
                        activeJobs: stats.activeJobs,
                        completedJobs: stats.completedJobs,
                        failedJobs: stats.failedJobs,
                        cancelledJobs: stats.cancelledJobs,
                        entityTypes: stats.entityTypes,
                        lastJobCreated: stats.lastJobCreated,
                        lastJobCompleted: stats.lastJobCompleted
                    },
                    hasActiveJobs: stats.activeJobs > 0,
                    canResume: true,
                    createdAt: funder.createdAt,
                    updatedAt: funder.updatedAt
                });

            } catch (error) {
                console.error(`Error getting job stats for funder ${funder._id}:`, error);
                // Include funder even if we can't get job stats
                fundersWithDetails.push({
                    funderId: funder._id.toString(),
                    funderName: funder.name,
                    funderEmail: funder.email || null,
                    funderWebsite: funder.website || null,
                    importSettings: {
                        apiKey: funder.import?.api_key ? '***' + funder.import.api_key.slice(-4) : null,
                        clientName: funder.import?.client_name || null,
                        source: funder.import?.source || null
                    },
                    importStats: {
                        totalJobs: 0,
                        activeJobs: 0,
                        completedJobs: 0,
                        failedJobs: 0,
                        cancelledJobs: 0,
                        entityTypes: [],
                        lastJobCreated: null,
                        lastJobCompleted: null
                    },
                    hasActiveJobs: false,
                    canResume: true,
                    createdAt: funder.createdAt,
                    updatedAt: funder.updatedAt,
                    note: 'Job statistics not available'
                });
            }
        }

        // Sort by last job created (most recent first), then by funder creation date
        fundersWithDetails.sort((a, b) => {
            if (a.importStats.lastJobCreated && b.importStats.lastJobCreated) {
                return new Date(b.importStats.lastJobCreated) - new Date(a.importStats.lastJobCreated);
            }
            if (a.importStats.lastJobCreated && !b.importStats.lastJobCreated) return -1;
            if (!a.importStats.lastJobCreated && b.importStats.lastJobCreated) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        // Get API info for additional context
        const apiInfo = orgMeterApiService.getApiInfo();

        res.status(200).json({
            success: true,
            message: `Found ${fundersWithDetails.length} funders with import history for this API key`,
            data: {
                apiKey: {
                    isValid: true,
                    apiInfo: apiInfo
                },
                funders: fundersWithDetails,
                summary: {
                    totalFunders: fundersWithDetails.length,
                    fundersWithActiveJobs: fundersWithDetails.filter(f => f.hasActiveJobs).length,
                    totalActiveJobs: fundersWithDetails.reduce((sum, f) => sum + f.importStats.activeJobs, 0),
                    totalCompletedJobs: fundersWithDetails.reduce((sum, f) => sum + f.importStats.completedJobs, 0)
                }
            }
        });

    } catch (error) {
        console.error('Error getting funders by API key:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving funders for API key',
            error: error.message
        });
    }
};

/**
 * @desc    Get job status for specific entity type and funder
 * @route   GET /api/import/orgmeter/entities/:entityType/status
 * @access  Private
 */
exports.getEntityJobStatus = async (req, res) => {
    try {
        const schema = Joi.object({
            funder: Joi.string().required(),
        });

        const { error } = schema.validate(req.query);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        const entityType = req.params.entityType;
        if (!entityServiceMap[entityType]) {
            return res.status(400).json({
                success: false,
                message: `Invalid entity type: ${entityType}. Valid types: ${Object.keys(entityServiceMap).join(', ')}`,
            });
        }

        const { funder } = req.query;

        // Find all jobs for this entity type and funder
        const allJobs = await ImportJob.find({
            entityType,
            'parameters.funder': funder
        })
            .select('-parameters.apiKey') // Exclude sensitive API key
            .sort({ createdAt: -1 }) // Get the most recent ones first
            .limit(10) // Limit to last 10 jobs
            .lean();

        // Categorize jobs by status
        const activeJob = allJobs.find(job => ['pending', 'running'].includes(job.status));
        const pausedJob = allJobs.find(job => job.status === 'paused');
        const lastCompletedJob = allJobs.find(job => job.status === 'completed');
        const lastFailedJob = allJobs.find(job => ['failed', 'cancelled'].includes(job.status));

        // Get job statistics
        const jobStats = await ImportJob.aggregate([
            {
                $match: {
                    entityType,
                    'parameters.funder': funder
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    lastCreated: { $max: '$createdAt' },
                    totalImported: { $sum: '$results.imported' },
                    totalUpdated: { $sum: '$results.updated' },
                    totalErrors: { $sum: '$results.errors' }
                }
            }
        ]);

        const stats = jobStats.reduce((acc, stat) => {
            acc[stat._id] = {
                count: stat.count,
                lastCreated: stat.lastCreated,
                totalImported: stat.totalImported || 0,
                totalUpdated: stat.totalUpdated || 0,
                totalErrors: stat.totalErrors || 0
            };
            return acc;
        }, {});

        // Get current entity collection count
        const Model = entityServiceMap[entityType].model;
        const collectionCount = await Model.countDocuments({
            'importMetadata.funder': funder
        });

        // Calculate summary statistics
        const totalJobs = allJobs.length;
        const completedJobs = stats.completed?.count || 0;
        const failedJobs = (stats.failed?.count || 0) + (stats.cancelled?.count || 0);
        const runningJobs = stats.running?.count || 0;
        const pendingJobs = stats.pending?.count || 0;
        const pausedJobs = stats.paused?.count || 0;

        res.status(200).json({
            success: true,
            message: `Job status for ${entityType} entity type retrieved`,
            data: {
                entityType,
                funder,
                canCreateNewJob: !activeJob && !pausedJob, // Can create new job if no active or paused job exists
                
                // Entity collection information
                entityCollection: {
                    totalRecords: collectionCount,
                    entityType: entityType
                },
                
                // Job summary statistics
                jobSummary: {
                    totalJobs: totalJobs,
                    completedJobs: completedJobs,
                    failedJobs: failedJobs,
                    runningJobs: runningJobs,
                    pendingJobs: pendingJobs,
                    pausedJobs: pausedJobs,
                    hasActiveJobs: (runningJobs + pendingJobs) > 0,
                    hasPausedJobs: pausedJobs > 0
                },
                
                // Current job statuses
                activeJob: activeJob ? {
                    jobId: activeJob.jobId,
                    status: activeJob.status,
                    progress: activeJob.progress,
                    startedAt: activeJob.startedAt,
                    estimatedTimeRemaining: activeJob.estimatedTimeRemaining,
                    lastProgressUpdate: activeJob.lastProgressUpdate,
                    createdAt: activeJob.createdAt
                } : null,
                
                pausedJob: pausedJob ? {
                    jobId: pausedJob.jobId,
                    status: pausedJob.status,
                    progress: pausedJob.progress,
                    pausedAt: pausedJob.pausedAt,
                    canResume: true,
                    createdAt: pausedJob.createdAt
                } : null,
                
                lastCompletedJob: lastCompletedJob ? {
                    jobId: lastCompletedJob.jobId,
                    status: lastCompletedJob.status,
                    results: lastCompletedJob.results,
                    completedAt: lastCompletedJob.completedAt,
                    createdAt: lastCompletedJob.createdAt
                } : null,
                
                lastFailedJob: lastFailedJob ? {
                    jobId: lastFailedJob.jobId,
                    status: lastFailedJob.status,
                    error: lastFailedJob.error,
                    completedAt: lastFailedJob.completedAt,
                    canResume: lastFailedJob.status === 'failed', // Failed jobs can be resumed, cancelled cannot
                    createdAt: lastFailedJob.createdAt
                } : null,
                
                // Detailed statistics by status
                detailedStatistics: stats,
                
                // Recent job history
                recentJobs: allJobs.slice(0, 5).map(job => ({
                    jobId: job.jobId,
                    status: job.status,
                    createdAt: job.createdAt,
                    completedAt: job.completedAt
                }))
            }
        });

    } catch (error) {
        console.error(`Error getting existing job for ${req.params.entityType}:`, error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving existing job information',
            error: error.message
        });
    }
};

/**
 * @desc    Get import job status and progress
 * @route   GET /api/import/orgmeter/jobs/:jobId
 * @access  Private
 */
exports.getJobStatus = async (req, res) => {
    try {
        const { jobId } = req.params;

        const importJob = await ImportJob.findOne({ jobId });
        if (!importJob) {
            return res.status(404).json({
                success: false,
                message: 'Import job not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Job status retrieved',
            data: {
                jobId: importJob.jobId,
                entityType: importJob.entityType,
                status: importJob.status,
                progress: importJob.progress,
                parameters: {
                    funder: importJob.parameters.funder,
                    batchSize: importJob.parameters.batchSize,
                    updateExisting: importJob.parameters.updateExisting
                },
                results: importJob.results,
                error: importJob.error,
                startedAt: importJob.startedAt,
                completedAt: importJob.completedAt,
                estimatedTimeRemaining: importJob.estimatedTimeRemaining,
                lastProgressUpdate: importJob.lastProgressUpdate,
                createdAt: importJob.createdAt
            }
        });

    } catch (error) {
        console.error(`Error getting job status for ${req.params.jobId}:`, error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving job status',
            error: error.message
        });
    }
};

/**
 * @desc    Get all import jobs for a funder with optional filtering
 * @route   GET /api/import/orgmeter/jobs
 * @access  Private
 */
exports.getImportJobs = async (req, res) => {
    try {
        const schema = Joi.object({
            funder: Joi.string().optional(),
            status: Joi.string().valid('pending', 'running', 'completed', 'failed', 'cancelled', 'paused').optional(),
            entityType: Joi.string().valid(...Object.keys(entityServiceMap)).optional(),
            page: Joi.number().min(1).default(1),
            limit: Joi.number().min(1).max(100).default(20)
        });

        const { error } = schema.validate(req.query);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        const { funder, status, entityType, page, limit } = req.query;

        // Build query filter
        let queryFilter = {};
        if (funder) queryFilter['parameters.funder'] = funder;
        if (status) queryFilter.status = status;
        if (entityType) queryFilter.entityType = entityType;

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Get jobs with pagination
        const jobs = await ImportJob.find(queryFilter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-parameters.apiKey') // Exclude sensitive API key
            .lean();

        // Get total count
        const totalCount = await ImportJob.countDocuments(queryFilter);

        // Get job statistics
        const stats = await ImportJob.aggregate([
            { $match: funder ? { 'parameters.funder': funder } : {} },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const jobStats = stats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {});

        res.status(200).json({
            success: true,
            message: 'Import jobs retrieved',
            data: {
                jobs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalCount,
                    pages: Math.ceil(totalCount / limit)
                },
                statistics: jobStats,
                filters: {
                    funder: funder || 'all',
                    status: status || 'all',
                    entityType: entityType || 'all'
                }
            }
        });

    } catch (error) {
        console.error('Error getting import jobs:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving import jobs',
            error: error.message
        });
    }
};

/**
 * @desc    Cancel a running import job
 * @route   POST /api/import/orgmeter/jobs/:jobId/cancel
 * @access  Private
 */
exports.cancelImportJob = async (req, res) => {
    try {
        const { jobId } = req.params;

        const importJob = await ImportJob.findOne({ jobId });
        if (!importJob) {
            return res.status(404).json({
                success: false,
                message: 'Import job not found'
            });
        }

        if (!['pending', 'running', 'paused'].includes(importJob.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel job with status: ${importJob.status}. Only pending, running, or paused jobs can be cancelled.`
            });
        }

        // Signal cancellation to running process
        const jobTracker = runningJobs.get(jobId);
        if (jobTracker) {
            jobTracker.cancelled = true;
            console.log(`Signaled cancellation for running job ${jobId}`);
        }

        // Update database status
        await importJob.markCancelled();

        res.status(200).json({
            success: true,
            message: 'Import job cancellation initiated',
            data: {
                jobId: importJob.jobId,
                status: importJob.status,
                completedAt: importJob.completedAt,
                wasRunning: !!jobTracker
            }
        });

    } catch (error) {
        console.error(`Error cancelling job ${req.params.jobId}:`, error);
        res.status(500).json({
            success: false,
            message: 'Error cancelling import job',
            error: error.message
        });
    }
};

/**
 * @desc    Get active import jobs summary
 * @route   GET /api/import/orgmeter/jobs/active
 * @access  Private
 */
exports.getActiveJobs = async (req, res) => {
    try {
        const activeJobs = await ImportJob.findActiveJobs()
            .select('-parameters.apiKey') // Exclude sensitive API key
            .lean();

        // Add runtime information for running jobs
        const jobsWithRuntime = activeJobs.map(job => ({
            ...job,
            isActuallyRunning: runningJobs.has(job.jobId),
            canBeCancelled: runningJobs.has(job.jobId) || job.status === 'pending',
            canBePaused: job.status === 'running' && runningJobs.has(job.jobId),
            canBeResumed: job.status === 'paused' || job.status === 'failed'
        }));

        res.status(200).json({
            success: true,
            message: 'Active import jobs retrieved',
            data: {
                activeJobs: jobsWithRuntime,
                count: activeJobs.length,
                runningInMemory: runningJobs.size,
                runningJobIds: Array.from(runningJobs.keys())
            }
        });

    } catch (error) {
        console.error('Error getting active jobs:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving active jobs',
            error: error.message
        });
    }
};

/**
 * @desc    Create a new funder with OrgMeter API key validation
 * @route   POST /api/import/orgmeter/create-funder
 * @access  Private
 */
exports.createFunderWithApiKey = async (req, res) => {
    try {
        const schema = Joi.object({
            name: Joi.string().required(),
            email: Joi.string().email().optional(),
            phone: Joi.string().optional(),
            website: Joi.string().uri().optional(),
            business_detail: Joi.object().optional(),
            address_detail: Joi.object().optional(),
            bgcolor: Joi.string().optional(),
            import: Joi.object({
                api_key: Joi.string().required(),
                client_name: Joi.string().optional(),
            }).required()
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return res
                .status(400)
                .json({ success: false, message: error.message });
        }
        
        const data = { ...value };
        const funderDataWithImport = {
            ...data,
            import: {
                ...data.import,
                source: 'OrgMeter',
            },
        };

        const user_list = [];
        if (req.portal === PORTAL_TYPES.FUNDER && req.id) {
            user_list.push(req.id);
        }

        const newFunder =
            await FunderService.createFunder(funderDataWithImport, [], '', false, user_list, [], defaultFundingStatuses, [], defaultFeeTypes);


        res.status(201).json({
            success: true,
            message: 'Funder created successfully with OrgMeter integration',
            data: newFunder,
        });
    } catch (error) {
        console.error('Error creating funder with API key:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating funder with API key',
            error: error.message,
        });
    }
};

/**
 * @desc    Pause a running import job
 * @route   POST /api/import/orgmeter/job/:jobId/pause
 * @access  Private
 */
exports.pauseImportJob = async (req, res) => {
    try {
        const { jobId } = req.params;

        const importJob = await ImportJob.findOne({ jobId });
        if (!importJob) {
            return res.status(404).json({
                success: false,
                message: 'Import job not found'
            });
        }

        if (importJob.status !== 'running') {
            return res.status(400).json({
                success: false,
                message: `Cannot pause job with status: ${importJob.status}. Only running jobs can be paused.`
            });
        }

        // Signal pause to running process
        const jobTracker = runningJobs.get(jobId);
        if (jobTracker) {
            jobTracker.paused = true;
            console.log(`Signaled pause for running job ${jobId}`);
        }

        // Update database status
        await importJob.markPaused();

        res.status(200).json({
            success: true,
            message: 'Import job pause initiated',
            data: {
                jobId: importJob.jobId,
                status: importJob.status,
                pausedAt: importJob.pausedAt,
                progress: importJob.progress,
                wasRunning: !!jobTracker
            }
        });

    } catch (error) {
        console.error(`Error pausing job ${req.params.jobId}:`, error);
        res.status(500).json({
            success: false,
            message: 'Error pausing import job',
            error: error.message
        });
    }
};

/**
 * @desc    Resume a paused or failed import job
 * @route   POST /api/import/orgmeter/job/:jobId/resume
 * @access  Private
 */
exports.resumeImportJob = async (req, res) => {
    try {
        const schema = Joi.object({
            resumeFrom: Joi.string().valid('current', 'beginning').default('current'),
            parameters: Joi.object({
                batchSize: Joi.number().min(1).max(200).optional(),
                updateExisting: Joi.boolean().optional()
            }).optional()
        });

        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        const { jobId } = req.params;
        const { resumeFrom = 'current', parameters } = req.body;

        const importJob = await ImportJob.findOne({ jobId });
        if (!importJob) {
            return res.status(404).json({
                success: false,
                message: 'Import job not found'
            });
        }

        if (!['paused', 'failed'].includes(importJob.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot resume job with status: ${importJob.status}. Only paused or failed jobs can be resumed.`
            });
        }

        // Mark job as resumed
        await importJob.markResumed(resumeFrom, parameters);

        // Start the import job execution in background
        setImmediate(() => executeImportJob(jobId));

        res.status(200).json({
            success: true,
            message: 'Import job resume initiated',
            data: {
                jobId: importJob.jobId,
                status: importJob.status,
                resumeFrom: resumeFrom,
                progress: importJob.progress,
                parameters: {
                    funder: importJob.parameters.funder,
                    batchSize: importJob.parameters.batchSize,
                    updateExisting: importJob.parameters.updateExisting
                },
                resumedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error(`Error resuming job ${req.params.jobId}:`, error);
        res.status(500).json({
            success: false,
            message: 'Error resuming import job',
            error: error.message
        });
    }
};

/**
 * @desc    Resume all paused jobs for a funder
 * @route   POST /api/import/orgmeter/jobs/resume-all
 * @access  Private
 */
exports.resumeAllJobs = async (req, res) => {
    try {
        const schema = Joi.object({
            funder: Joi.string().required(),
            entityTypes: Joi.array().items(
                Joi.string().valid(...Object.keys(entityServiceMap))
            ).optional(),
            resumeFrom: Joi.string().valid('current', 'beginning').default('current'),
            parameters: Joi.object({
                batchSize: Joi.number().min(1).max(200).optional(),
                updateExisting: Joi.boolean().optional()
            }).optional()
        });

        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        const { funder, entityTypes, resumeFrom = 'current', parameters } = req.body;

        // Find paused jobs for the funder
        const pausedJobs = await ImportJob.findPausedJobs(funder, entityTypes);

        if (pausedJobs.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No paused jobs found for the specified criteria',
                data: {
                    resumedJobs: [],
                    totalResumed: 0
                }
            });
        }

        const resumedJobs = [];
        
        // Resume each paused job
        for (const job of pausedJobs) {
            try {
                await job.markResumed(resumeFrom, parameters);
                
                // Start the import job execution in background
                setImmediate(() => executeImportJob(job.jobId));
                
                resumedJobs.push({
                    jobId: job.jobId,
                    entityType: job.entityType,
                    status: 'running',
                    resumeFrom: resumeFrom
                });
                
                console.log(`Resumed job ${job.jobId} (${job.entityType}) for funder ${funder}`);
            } catch (jobError) {
                console.error(`Error resuming job ${job.jobId}:`, jobError);
                // Continue with other jobs even if one fails
            }
        }

        res.status(200).json({
            success: true,
            message: `Successfully initiated resume for ${resumedJobs.length} paused jobs`,
            data: {
                resumedJobs,
                totalResumed: resumedJobs.length,
                funder: funder,
                entityTypes: entityTypes || 'all',
                resumeFrom: resumeFrom
            }
        });

    } catch (error) {
        console.error('Error resuming all jobs:', error);
        res.status(500).json({
            success: false,
            message: 'Error resuming paused jobs',
            error: error.message
        });
    }
};
