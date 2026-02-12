const SyncOrgMeterLenderService = require('../../services/sync/OrgMeter/syncOrgMeterLenderService');
const SyncOrgMeterIsoService = require('../../services/sync/OrgMeter/syncOrgMeterIsoService');
const SyncOrgMeterMerchantService = require('../../services/sync/OrgMeter/syncOrgMeterMerchantService');
const SyncOrgMeterSyndicatorService = require('../../services/sync/OrgMeter/syncOrgMeterSyndicatorService');
const SyncOrgMeterUserService = require('../../services/sync/OrgMeter/syncOrgMeterUserService');
const SyncOrgMeterUnderwriterService = require('../../services/sync/OrgMeter/syncOrgMeterUnderwriterService');
const SyncOrgMeterRepresentativeService = require('../../services/sync/OrgMeter/syncOrgMeterRepresentativeService');
const SyncOrgMeterAdvanceService = require('../../services/sync/OrgMeter/syncOrgMeterAdvanceService');
const SyncJob = require('../../models/SyncJob');
const Funder = require('../../models/Funder');
const Joi = require('joi');
const mongoose = require('mongoose');

// Define sync order for step-by-step process
const SYNC_ORDER = [
    'lender', // orgmeter-lenders
    'iso', // orgmeter-isos
    'merchant', // orgmeter-merchants
    'syndicator', // orgmeter-syndicators
    'user', // orgmeter-users
    'underwriter', // orgmeter-underwriter-users
    'representative', // orgmeter-sales-rep-users
    'advance', // orgmeter-advances, orgmeter-payments and orgmeter-advance-underwrittings
];

// Map entity types to their respective service classes and models
const entitySyncServiceMap = {
    lender: {
        service: SyncOrgMeterLenderService,
        model: require('../../models/OrgMeter/Lender'),
        methodName: 'syncAllLenders'
    },
    iso: {
        service: SyncOrgMeterIsoService,
        model: require('../../models/OrgMeter/Iso'),
        methodName: 'syncAllIsos'
    },
    merchant: {
        service: SyncOrgMeterMerchantService,
        model: require('../../models/OrgMeter/Merchant'),
        methodName: 'syncAllMerchants'
    },
    syndicator: {
        service: SyncOrgMeterSyndicatorService,
        model: require('../../models/OrgMeter/Syndicator'),
        methodName: 'syncAllSyndicators'
    },
    user: {
        service: SyncOrgMeterUserService,
        model: require('../../models/OrgMeter/User'),
        methodName: 'syncAllUsers'
    },
    underwriter: {
        service: SyncOrgMeterUnderwriterService,
        model: require('../../models/OrgMeter/UnderwriterUser').model,
        methodName: 'syncAllUnderwriters'
    },
    representative: {
        service: SyncOrgMeterRepresentativeService,
        model: require('../../models/OrgMeter/SalesRepUser').model,
        methodName: 'syncAllRepresentatives'
    },
    advance: {
        service: SyncOrgMeterAdvanceService,
        model: require('../../models/OrgMeter/Advance'),
        methodName: 'syncAllAdvances'
    }
};

// Track running sync jobs for cancellation support
const runningSyncJobs = new Map(); // jobId -> { cancelled: boolean }

/**
 * Validate API key against funder's import settings
 * @param {string} funderId - The funder ID
 * @param {string} apiKey - The API key to validate
 * @returns {Object} - { success: boolean, funder?: Object, message?: string }
 */
async function validateApiKey(funderId, apiKey) {
    try {
        if (!apiKey) {
            return {
                success: false,
                message: 'API key is required'
            };
        }

        if (!funderId) {
            return {
                success: false,
                message: 'Funder ID is required'
            };
        }

        // Find the funder and check if the API key matches
        const funder = await Funder.findById(funderId);

        if (!funder) {
            return {
                success: false,
                message: 'Funder not found'
            };
        }

        if (!funder.import?.api_key) {
            return {
                success: false,
                message: 'Funder does not have an API key configured'
            };
        }

        if (funder.import.api_key !== apiKey) {
            return {
                success: false,
                message: 'Invalid API key for this funder'
            };
        }

        if (funder.inactive) {
            return {
                success: false,
                message: 'Funder account is inactive'
            };
        }

        return {
            success: true,
            funder
        };
    } catch (error) {
        console.error('❌ ValidateApiKey Debug - Unexpected error:', error);
        return {
            success: false,
            message: 'API key validation failed',
            error: error.message
        };
    }
}

/**
 * Execute sync job in the background
 * @param {string} jobId - The job ID to execute
 * @param {number} resumeFromIndex - Optional index to resume from (default: 0)
 */
async function executeSyncJob(jobId, resumeFromIndex = 0) {
    let syncJob;
    
    try {
        syncJob = await SyncJob.findOne({ jobId });
        if (!syncJob) {
            console.error(`Sync job ${jobId} not found`);
            return;
        }

        // Add job to running jobs tracker
        runningSyncJobs.set(jobId, { cancelled: false });

        // Mark job as started
        await syncJob.markStarted();

        const { entityType, parameters } = syncJob;
        const { apiKey, funder, updateExisting, onlySelected, dryRun } = parameters;

        // Check if service is available
        const serviceConfig = entitySyncServiceMap[entityType];
        if (!serviceConfig) {
            throw new Error(`Sync service for entity type '${entityType}' is not yet implemented`);
        }

        // Initialize the appropriate sync service
        const ServiceClass = serviceConfig.service;
        // For API-based jobs, create identifier from funder name, otherwise use createdBy
        const createdByIdentifier = apiKey ? `api_key_sync_${funder}` : syncJob.createdBy;
        const syncService = new ServiceClass(new mongoose.Types.ObjectId(funder), createdByIdentifier);

        // Get total count of entities to sync
        const Model = serviceConfig.model;
        let query = {
            'importMetadata.funder': new mongoose.Types.ObjectId(funder)
        };
        if (onlySelected) {
            query['syncMetadata.needsSync'] = true;
        }
        
        const totalEntities = await Model.countDocuments(query);

        // Update job with total count and resume index
        await syncJob.updateProgress(resumeFromIndex, totalEntities);

        // Helper function to check if job is cancelled
        const checkCancellation = async () => {
            const jobTracker = runningSyncJobs.get(jobId);
            if (jobTracker && jobTracker.cancelled) {
                throw new Error('Sync job was cancelled by user');
            }
            
            // Also check database status in case it was cancelled externally
            const currentJob = await SyncJob.findOne({ jobId });
            if (currentJob && currentJob.status === 'cancelled') {
                if (jobTracker) {
                    jobTracker.cancelled = true;
                }
                throw new Error('Sync job was cancelled');
            }
        };

        // Check for cancellation before starting the main sync
        await checkCancellation();

        // Create progress callback to update SyncJob
        const progressCallback = async (processed, total, currentEntity) => {
            await checkCancellation(); // Check for cancellation on each progress update
            // Adjust processed count to account for resume index
            const adjustedProcessed = resumeFromIndex + processed;
            await syncJob.updateProgress(adjustedProcessed, total, currentEntity);
        };

        // Execute the sync with resume information
        const methodName = serviceConfig.methodName;
        const results = await syncService[methodName]({
            updateExisting,
            onlySelected,
            dryRun,
            progressCallback,
            resumeFromIndex // Pass resume index to sync service
        });

        // Mark job as completed
        await syncJob.markCompleted({
            synced: results.stats?.totalSynced || 0,
            updated: results.stats?.totalUpdated || 0,
            skipped: results.stats?.totalSkipped || 0,
            failed: results.stats?.totalFailed || 0,
            details: results
        });

        console.log(`Sync job ${jobId} completed successfully`);

    } catch (error) {
        console.error(`Sync job ${jobId} failed:`, error);
        
        if (syncJob) {
            // Check if this was a cancellation
            if (error.message.includes('cancelled')) {
                await syncJob.markCancelled();
                console.log(`Sync job ${jobId} was cancelled`);
            } else {
                await syncJob.markFailed(error);
            }
        }
    } finally {
        // Clean up running job tracker
        runningSyncJobs.delete(jobId);
    }
}

/**
 * @desc    Start async sync for specific entity type
 * @route   POST /api/sync/orgmeter/:entityType/start
 * @access  Public (API key validation in body)
 */
exports.startEntitySync = async (req, res) => {
    try {
        const entityType = req.params.entityType;
        
        // Validate entity type
        if (!SYNC_ORDER.includes(entityType)) {
            return res.status(400).json({
                success: false,
                message: `Invalid entity type: ${entityType}. Valid types: ${SYNC_ORDER.join(', ')}`
            });
        }

        // Check if service is implemented
        if (!entitySyncServiceMap[entityType]) {
            return res.status(400).json({
                success: false,
                message: `Sync service for entity type '${entityType}' is not yet implemented`
            });
        }

        const schema = Joi.object({
            funderId: Joi.string().required(),
            apiKey: Joi.string().required(),
            updateExisting: Joi.boolean().default(true),
            onlySelected: Joi.boolean().default(true),
            dryRun: Joi.boolean().default(false)
        });

        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                success: false, 
                message: error.message 
            });
        }

        const { funderId, apiKey, updateExisting, onlySelected, dryRun } = req.body;

        // Validate API key
        const validation = await validateApiKey(funderId, apiKey);
        if (!validation.success) {
            return res.status(validation.message.includes('not found') ? 404 : 401).json({
                success: false,
                message: validation.message
            });
        }

        // Check if there's already a running sync job for this entity type and funder
        const existingJob = await SyncJob.findOne({
            entityType,
            'parameters.funder': funderId,
            status: { $in: ['pending', 'running'] }
        });

        if (existingJob) {
            return res.status(409).json({
                success: false,
                message: `A sync job for ${entityType} is already running`,
                jobId: existingJob.jobId
            });
        }

        // Create new sync job (API-based job, no user createdBy)
        const syncJob = await SyncJob.createJob({
            entityType,
            parameters: {
                apiKey,
                funder: funderId,
                updateExisting,
                onlySelected,
                dryRun
            }
            // Note: createdBy is omitted for API-based jobs since it expects ObjectId
        });

        // Start sync job in background
        setImmediate(() => executeSyncJob(syncJob.jobId));

        res.status(202).json({
            success: true,
            message: `Sync job for ${entityType} started`,
            jobId: syncJob.jobId,
            job: syncJob
        });

    } catch (error) {
        console.error('Error starting sync job:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start sync job',
            error: error.message
        });
    }
};

/**
 * @desc    Cancel sync job
 * @route   POST /api/sync/orgmeter/job/:jobId/cancel
 * @access  Public (API key validation in body)
 */
exports.cancelSyncJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        
        const schema = Joi.object({
            funderId: Joi.string().required(),
            apiKey: Joi.string().required()
        });

        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                success: false, 
                message: error.message 
            });
        }

        const { funderId, apiKey } = req.body;

        // Validate API key
        const validation = await validateApiKey(funderId, apiKey);
        if (!validation.success) {
            return res.status(validation.message.includes('not found') ? 404 : 401).json({
                success: false,
                message: validation.message
            });
        }
        
        const syncJob = await SyncJob.findOne({ jobId });

        if (!syncJob) {
            return res.status(404).json({
                success: false,
                message: 'Sync job not found'
            });
        }

        // Verify the job belongs to the same funder as the API key
        if (syncJob.parameters.funder !== funderId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: This sync job belongs to a different funder'
            });
        }

        // Check if job can be cancelled
        if (!['pending', 'running'].includes(syncJob.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel sync job with status: ${syncJob.status}`
            });
        }

        // Mark job for cancellation
        const jobTracker = runningSyncJobs.get(jobId);
        if (jobTracker) {
            jobTracker.cancelled = true;
        }

        // Update job status in database
        await syncJob.markCancelled();

        res.json({
            success: true,
            message: 'Sync job cancelled successfully',
            job: syncJob
        });

    } catch (error) {
        console.error('Error cancelling sync job:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel sync job',
            error: error.message
        });
    }
};

/**
 * @desc    Continue sync job from where it left off
 * @route   POST /api/v1/sync/orgmeter/job/:jobId/continue
 * @access  Public (API key validation in body)
 */
exports.continueSyncJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        
        const schema = Joi.object({
            funderId: Joi.string().required(),
            apiKey: Joi.string().required(),
            resumeFromIndex: Joi.number().integer().min(0).optional(),
            updateParameters: Joi.object({
                updateExisting: Joi.boolean().optional(),
                onlySelected: Joi.boolean().optional(),
                dryRun: Joi.boolean().optional()
            }).optional()
        });

        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                success: false, 
                message: error.message 
            });
        }

        const { funderId, apiKey, resumeFromIndex = 0, updateParameters = {} } = req.body;

        // Validate API key
        const validation = await validateApiKey(funderId, apiKey);
        
        if (!validation.success) {
            return res.status(validation.message.includes('not found') ? 404 : 401).json({
                success: false,
                message: validation.message
            });
        }
        
        const syncJob = await SyncJob.findOne({ jobId });

        if (!syncJob) {
            return res.status(404).json({
                success: false,
                message: 'Sync job not found'
            });
        }

        // Verify the job belongs to the same funder as the API key
        if (syncJob.parameters.funder !== funderId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: This sync job belongs to a different funder'
            });
        }

        // Check if job can be continued
        if (!['failed', 'cancelled', 'running', 'pending'].includes(syncJob.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot continue sync job with status: ${syncJob.status}. Only failed, cancelled, running, or pending jobs can be continued.`
            });
        }

        // Check if there's already a running sync job for this entity type and funder
        const existingRunningJob = await SyncJob.findOne({
            entityType: syncJob.entityType,
            'parameters.funder': funderId,
            status: { $in: ['pending', 'running'] }
        });

        if (existingRunningJob && existingRunningJob.jobId !== jobId) {
            return res.status(409).json({
                success: false,
                message: `A sync job for ${syncJob.entityType} is already running`,
                jobId: existingRunningJob.jobId
            });
        }

        // Update job parameters if provided
        if (Object.keys(updateParameters).length > 0) {
            syncJob.parameters = { ...syncJob.parameters, ...updateParameters };
        }

        // Reset job status and progress for continuation
        await syncJob.resetForContinuation(resumeFromIndex);

        // Start sync job in background with resume information
        setImmediate(() => executeSyncJob(syncJob.jobId, resumeFromIndex));

        res.status(202).json({
            success: true,
            message: `Sync job for ${syncJob.entityType} continued from index ${resumeFromIndex}`,
            jobId: syncJob.jobId,
            job: syncJob,
            resumeFromIndex
        });

    } catch (error) {
        console.error('Failed to continue sync job:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to continue sync job',
            error: error.message
        });
    }
};

/**
 * @desc    Get sync jobs list
 * @route   POST /api/sync/orgmeter/jobs
 * @access  Public (API key validation in body)
 */
exports.getSyncJobs = async (req, res) => {
    try {
        const schema = Joi.object({
            status: Joi.string().optional(),
            entityType: Joi.string().valid(...SYNC_ORDER).optional(),
            funderId: Joi.string().required(),
            apiKey: Joi.string().required()
        });

        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                success: false, 
                message: error.message 
            });
        }

        const { status, entityType, funderId, apiKey } = req.body;

        // Validate API key
        const validation = await validateApiKey(funderId, apiKey);
        if (!validation.success) {
            return res.status(validation.message.includes('not found') ? 404 : 401).json({
                success: false,
                message: validation.message
            });
        }

        // Build query - only show jobs for this funder  
        let query = {
            'parameters.funder': funderId
        };

        if (status) {
            query.status = { $in: status.split(',').map(s => s.trim()) };
        }

        if (entityType) {
            query.entityType = entityType;
        }

        const jobs = await SyncJob.find(query)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: {
                jobs
            }
        });

    } catch (error) {
        console.error('Error getting sync jobs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get sync jobs',
            error: error.message
        });
    }
};

/**
 * @desc    Get sync job status and details
 * @route   GET /api/sync/orgmeter/job/:jobId/status
 * @access  Public (no API key required for status monitoring)
 */
exports.getSyncJobStatus = async (req, res) => {
    try {
        const { jobId } = req.params;

        const syncJob = await SyncJob.findOne({ jobId })
            .populate('createdBy', 'name email')
            .lean();

        if (!syncJob) {
            return res.status(404).json({
                success: false,
                message: 'Sync job not found'
            });
        }

        // Get related jobs for the same funder and entity type
        const relatedJobs = await SyncJob.find({
            entityType: syncJob.entityType,
            'parameters.funder': syncJob.parameters.funder,
            jobId: { $ne: jobId }
        })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        // Get entity statistics if the sync job is completed
        let entityStats = null;
        if (syncJob.status === 'completed' && syncJob.entityType) {
            const serviceConfig = entitySyncServiceMap[syncJob.entityType];
            if (serviceConfig && serviceConfig.model) {
                const Model = serviceConfig.model;
                
                const stats = await Model.aggregate([
                    { $match: { 'importMetadata.funder': new mongoose.Types.ObjectId(syncJob.parameters.funder) } },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: 1 },
                            synced: {
                                $sum: {
                                    $cond: [{ $ne: ['$syncMetadata.syncId', null] }, 1, 0]
                                }
                            },
                            pending: {
                                $sum: {
                                    $cond: [
                                        {
                                            $and: [
                                                { $eq: ['$syncMetadata.needsSync', true] },
                                                { $eq: ['$syncMetadata.syncId', null] }
                                            ]
                                        },
                                        1,
                                        0
                                    ]
                                }
                            }
                        }
                    }
                ]);

                entityStats = stats[0] || { total: 0, synced: 0, pending: 0 };
            }
        }

        res.json({
            success: true,
            data: {
                job: syncJob,
                relatedJobs,
                entityStats,
                isRunning: runningSyncJobs.has(jobId)
            }
        });

    } catch (error) {
        console.error('Error getting sync job status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get sync job status',
            error: error.message
        });
    }
};

/**
 * @desc    Get overall sync progress across all entity types
 * @route   POST /api/sync/orgmeter/progress
 * @access  Public (API key validation in body)
 */
exports.getOverallSyncProgress = async (req, res) => {
    try {
        const schema = Joi.object({
            funderId: Joi.string().required(),
            apiKey: Joi.string().required()
        });

        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                success: false, 
                message: error.message 
            });
        }

        const { funderId, apiKey } = req.body;

        // Validate API key
        const validation = await validateApiKey(funderId, apiKey);
        if (!validation.success) {
            return res.status(validation.message.includes('not found') ? 404 : 401).json({
                success: false,
                message: validation.message
            });
        }

        // Get overall statistics for each entity type
        const entityProgress = {};
        let totalEntities = 0;
        let totalSynced = 0;
        let totalSelected = 0;
        let totalIgnored = 0;

        // Check running jobs for each entity type
        const runningJobs = {};
        const activeJobs = await SyncJob.find({
            'parameters.funder': funderId,
            status: { $in: ['pending', 'running'] }
        }).lean();

        activeJobs.forEach(job => {
            runningJobs[job.entityType] = {
                jobId: job.jobId,
                status: job.status,
                progress: job.progress || { processed: 0, total: 0 },
                startedAt: job.startedAt,
                parameters: job.parameters
            };
        });

        // Get stats for each implemented entity type
        for (const entityType of SYNC_ORDER) {
            const serviceConfig = entitySyncServiceMap[entityType];
            
            if (serviceConfig && serviceConfig.model) {
                const Model = serviceConfig.model;
                
                try {
                    // Get entity statistics
                    const stats = await Model.aggregate([   
                        { $match: { 'importMetadata.funder': new mongoose.Types.ObjectId(funderId) } },
                        {
                            $group: {
                                _id: null,
                                total: { $sum: 1 },
                                synced: {
                                    $sum: {
                                        $cond: [{ $ne: ['$syncMetadata.syncId', null] }, 1, 0]
                                    }
                                },
                                selected: {
                                    $sum: {
                                        $cond: [{ $eq: ['$syncMetadata.needsSync', true] }, 1, 0]
                                    }
                                },
                                ignored: {
                                    $sum: {
                                        $cond: [{ $eq: ['$syncMetadata.needsSync', false] }, 1, 0]
                                    }
                                }
                            }
                        }
                    ]);

                    const entityStats = stats[0] || { total: 0, synced: 0, selected: 0, ignored: 0 };
                    
                    // Get most recent sync job for this entity
                    const lastSyncJob = await SyncJob.findOne({
                        entityType,
                        'parameters.funder': funderId,
                        status: { $in: ['completed', 'failed'] }
                    })
                        .sort({ completedAt: -1 })
                        .populate('createdBy', 'name email')
                        .lean();

                    entityProgress[entityType] = {
                        name: entityType,
                        implemented: true,
                        total: entityStats.total,
                        synced: entityStats.synced,
                        selected: entityStats.selected,
                        pending: entityStats.selected - entityStats.synced,
                        ignored: entityStats.ignored,
                        completionRate: entityStats.total > 0 ? ((entityStats.synced / entityStats.total) * 100).toFixed(1) : 0,
                        selectionRate: entityStats.total > 0 ? ((entityStats.selected / entityStats.total) * 100).toFixed(1) : 0,
                        hasData: entityStats.total > 0,
                        isRunning: !!runningJobs[entityType],
                        runningJob: runningJobs[entityType] || null,
                        lastSyncJob
                    };

                    // Add to totals
                    totalEntities += entityStats.total;
                    totalSynced += entityStats.synced;
                    totalSelected += entityStats.selected;
                    totalIgnored += entityStats.ignored;

                } catch (error) {
                    console.error(`Error getting stats for ${entityType}:`, error);
                    entityProgress[entityType] = {
                        name: entityType,
                        implemented: true,
                        error: error.message,
                        hasData: false,
                        isRunning: !!runningJobs[entityType],
                        runningJob: runningJobs[entityType] || null
                    };
                }
            } else {
                // Entity type not yet implemented
                entityProgress[entityType] = {
                    name: entityType,
                    implemented: false,
                    hasData: false,
                    isRunning: false,
                    runningJob: null
                };
            }
        }

        // Calculate overall progress
        const overallStats = {
            totalEntities,
            totalSynced,
            totalSelected,
            totalPending: totalSelected - totalSynced,
            totalIgnored,
            overallCompletionRate: totalEntities > 0 ? ((totalSynced / totalEntities) * 100).toFixed(1) : 0,
            overallSelectionRate: totalEntities > 0 ? ((totalSelected / totalEntities) * 100).toFixed(1) : 0,
            hasAnyData: totalEntities > 0,
            hasRunningJobs: Object.keys(runningJobs).length > 0,
            implementedEntityTypes: SYNC_ORDER.filter(type => entitySyncServiceMap[type]).length,
            totalEntityTypes: SYNC_ORDER.length
        };

        // Get recent sync activity across all entity types
        const recentActivity = await SyncJob.find({
            'parameters.funder': funderId
        })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        // Calculate sync timeline progress (based on SYNC_ORDER)
        const syncTimeline = SYNC_ORDER.map((entityType, index) => {
            const entityData = entityProgress[entityType];
            const isCurrentStep = entityData.isRunning;
            const isCompleted = entityData.hasData && entityData.synced > 0 && !entityData.isRunning;
            const isPending = entityData.hasData && entityData.pending > 0 && !entityData.isRunning;
            
            return {
                step: index + 1,
                entityType,
                name: entityType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                status: isCurrentStep ? 'running' : isCompleted ? 'completed' : isPending ? 'pending' : 'waiting',
                implemented: entityData.implemented,
                hasData: entityData.hasData,
                progress: entityData.completionRate || 0,
                runningJob: entityData.runningJob
            };
        });

        res.json({
            success: true,
            data: {
                funderId,
                overallStats,
                entityProgress,
                syncTimeline,
                runningJobs: Object.keys(runningJobs).length > 0 ? runningJobs : null,
                recentActivity,
                syncOrder: SYNC_ORDER,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error getting overall sync progress:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get overall sync progress',
            error: error.message
        });
    }
};

/**
 * @desc    Get imported OrgMeter data for sync review
 * @route   POST /api/sync/orgmeter/review/:entityType
 * @access  Public (API key validation in body)
 */
exports.getImportedDataForReview = async (req, res) => {
    try {
        const entityType = req.params.entityType;
        
        // Validate entity type
        if (!SYNC_ORDER.includes(entityType)) {
            return res.status(400).json({
                success: false,
                message: `Invalid entity type: ${entityType}. Valid types: ${SYNC_ORDER.join(', ')}`
            });
        }

        // Check if service is implemented
        const serviceConfig = entitySyncServiceMap[entityType];
        if (!serviceConfig) {
            return res.status(400).json({
                success: false,
                message: `Sync service for entity type '${entityType}' is not yet implemented`
            });
        }

        const schema = Joi.object({
            funderId: Joi.string().required(),
            apiKey: Joi.string().required(),
            search: Joi.string().optional(),
            syncStatus: Joi.string()
                .valid('all', 'pending', 'synced', 'ignored')
                .default('all')
        });

        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                success: false, 
                message: error.message 
            });
        }

        const { search, syncStatus, funderId, apiKey } = req.body;

        // Validate API key
        const validation = await validateApiKey(funderId, apiKey);
        if (!validation.success) {
            return res.status(validation.message.includes('not found') ? 404 : 401).json({
                success: false,
                message: validation.message
            });
        }

        const Model = serviceConfig.model;

        // Build query
        let query = {
            'importMetadata.funder': new mongoose.Types.ObjectId(funderId)
        };

        // Filter by sync status
        if (syncStatus !== 'all') {
            switch (syncStatus) {
            case 'pending':
                query['syncMetadata.needsSync'] = true;
                query['syncMetadata.syncId'] = { $exists: false };
                break;
            case 'synced':
                query['syncMetadata.syncId'] = { $exists: true, $ne: null };
                break;
            case 'ignored':
                query['syncMetadata.needsSync'] = false;
                break;
            }
        }

        // Add search functionality
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            const searchFields = [];

            // Add common searchable fields based on entity type
            switch (entityType) {
            case 'user':
                searchFields.push(
                    { username: searchRegex }
                );
            // eslint-disable-next-line no-fallthrough
            case 'underwriter':
            case 'representative':
                searchFields.push(
                    { firstName: searchRegex },
                    { lastName: searchRegex },
                    { email: searchRegex }
                );
                break;
            case 'merchant':
                searchFields.push(
                    { 'businessName': searchRegex },
                    { 'businessDba': searchRegex }
                );
                break;
            case 'lender':
            case 'iso':
            case 'syndicator':
                searchFields.push(
                    { name: searchRegex },
                    { email: searchRegex }
                );
                break;
            default:
                searchFields.push({ name: searchRegex });
                break;
            }

            if (searchFields.length > 0) {
                query.$or = searchFields;
            }
        }

        // Get all data (not paginated as requested)
        const data = await Model.find(query)
            .sort({ 'importMetadata.importedAt': -1 })
            .lean();

        // Get import and sync history for each record
        const enrichedData = await Promise.all(data.map(async (item) => {
            // Get sync history from SyncJob collection
            const syncHistory = await SyncJob.find({
                entityType,
                'parameters.funder': funderId,
                status: { $in: ['completed', 'failed'] }
            })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('createdBy', 'name email')
                .lean();

            // Add deleted field based on entity type
            let deleted;
            switch (entityType) {
            case 'lender':
            case 'merchant':
            case 'iso':
            case 'syndicator':
            case 'advance':
                // Include existing deleted field
                deleted = item.deleted;
                break;
            case 'user':
                // Turn enabled to deleted (deleted = !enabled)
                deleted = !item.enabled;
                break;
            case 'underwriter':
            case 'representative':
                // Add deleted=true
                deleted = false;
                break;
            default:
                // For other entity types, default to false if no deleted field exists
                deleted = item.deleted || false;
                break;
            }

            return {
                ...item,
                deleted,
                history: {
                    import: {
                        importedAt: item.importMetadata?.importedAt,
                        importedBy: item.importMetadata?.importedBy,
                        source: item.importMetadata?.source,
                        lastUpdatedAt: item.importMetadata?.lastUpdatedAt,
                        lastUpdatedBy: item.importMetadata?.lastUpdatedBy
                    },
                    sync: {
                        needsSync: item.syncMetadata?.needsSync,
                        lastSyncedAt: item.syncMetadata?.lastSyncedAt,
                        lastSyncedBy: item.syncMetadata?.lastSyncedBy,
                        syncId: item.syncMetadata?.syncId,
                        syncedEntity: item.syncMetadata?.syncId ? item.syncMetadata.syncId : null,
                        recentJobs: syncHistory
                    }
                }
            };
        }));

        // Calculate sync statistics
        const syncStats = await Model.aggregate([
            { $match: { 'importMetadata.funder': new mongoose.Types.ObjectId(funderId) } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    selected: {
                        $sum: {
                            $cond: [{ $eq: ['$syncMetadata.needsSync', true] }, 1, 0]
                        }
                    },
                    synced: {
                        $sum: {
                            $cond: [{ $ne: ['$syncMetadata.syncId', null] }, 1, 0]
                        }
                    },
                    ignored: {
                        $sum: {
                            $cond: [{ $eq: ['$syncMetadata.needsSync', false] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        const stats = syncStats[0] || {
            total: 0,
            selected: 0,
            synced: 0,
            ignored: 0
        };

        // Get recent sync jobs for this entity type and funder
        const recentSyncJobs = await SyncJob.find({
            entityType,
            'parameters.funder': funderId
        })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        res.json({
            success: true,
            message: `Retrieved ${entityType} data for sync review`,
            data: {
                entityType,
                funderId,
                items: enrichedData,
                totalCount: enrichedData.length,
                filteredCount: enrichedData.length,
                syncStatistics: {
                    total: stats.total,
                    selected: stats.selected,
                    pending: stats.selected - stats.synced,
                    synced: stats.synced,
                    ignored: stats.ignored
                },
                recentSyncJobs,
                filters: {
                    syncStatus,
                    search: search || null
                }
            }
        });

    } catch (error) {
        console.error(`Error getting imported data for sync review (${req.params.entityType}):`, error);
        res.status(500).json({
            success: false,
            message: `Failed to retrieve ${req.params.entityType} data for sync review`,
            error: error.message
        });
    }
};

/**
 * @desc    Update sync selection status for specific records
 * @route   PUT /api/sync/orgmeter/selection/:entityType
 * @access  Public (API key validation in body)
 */
exports.updateSyncSelection = async (req, res) => {
    try {
        const entityType = req.params.entityType;
        
        // Validate entity type
        if (!SYNC_ORDER.includes(entityType)) {
            return res.status(400).json({
                success: false,
                message: `Invalid entity type: ${entityType}. Valid types: ${SYNC_ORDER.join(', ')}`
            });
        }

        // Check if service is implemented
        const serviceConfig = entitySyncServiceMap[entityType];
        if (!serviceConfig) {
            return res.status(400).json({
                success: false,
                message: `Sync service for entity type '${entityType}' is not yet implemented`
            });
        }

        const schema = Joi.object({
            funderId: Joi.string().required(),
            apiKey: Joi.string().required(),
            records: Joi.array()
                .items(
                    Joi.object({
                        id: Joi.alternatives()
                            .try(Joi.string(), Joi.number())
                            .required(),
                        needsSync: Joi.boolean().required()
                    })
                )
                .optional(),
            selectAll: Joi.boolean().optional(),
            selectValue: Joi.boolean().when('selectAll', {
                is: true,
                then: Joi.required(),
                otherwise: Joi.optional()
            })
        });

        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                success: false, 
                message: error.message 
            });
        }

        const { records, selectAll, selectValue, funderId, apiKey } = req.body;

        // Validate API key
        const validation = await validateApiKey(funderId, apiKey);
        if (!validation.success) {
            return res.status(validation.message.includes('not found') ? 404 : 401).json({
                success: false,
                message: validation.message
            });
        }

        const funder = validation.funder;
        const Model = serviceConfig.model;
        let updateResult;

        if (selectAll) {
            // Update all records for this funder
            updateResult = await Model.updateMany(
                { 'importMetadata.funder': new mongoose.Types.ObjectId(funderId) },
                {
                    $set: {
                        'syncMetadata.needsSync': selectValue,
                        'syncMetadata.lastUpdatedAt': new Date(),
                        'syncMetadata.lastUpdatedBy': `api_key_${funder.name}`
                    }
                }
            );
        } else if (records && records.length > 0) {
            // Update specific records
            const updates = records.map(record => ({
                updateOne: {
                    filter: { 
                        id: record.id,
                        'importMetadata.funder': new mongoose.Types.ObjectId(funderId)
                    },
                    update: {
                        $set: {
                            'syncMetadata.needsSync': record.needsSync,
                            'syncMetadata.lastUpdatedAt': new Date(),
                            'syncMetadata.lastUpdatedBy': `api_key_${funder.name}`
                        }
                    }
                }
            }));

            updateResult = await Model.bulkWrite(updates);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Either records array or selectAll must be provided'
            });
        }

        res.json({
            success: true,
            message: 'Sync selections updated successfully',
            data: {
                entityType,
                modifiedCount: updateResult.modifiedCount || updateResult.nModified,
                matchedCount: updateResult.matchedCount || updateResult.n,
                operation: selectAll ? 'bulk_update_all' : 'bulk_update_records'
            }
        });

    } catch (error) {
        console.error(`Error updating sync selections for ${req.params.entityType}:`, error);
        res.status(500).json({
            success: false,
            message: `Failed to update sync selections for ${req.params.entityType}`,
            error: error.message
        });
    }
};