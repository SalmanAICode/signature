const express = require('express');

const router = express.Router();

const {
    // API Key & Funder Management
    validateApiKey,
    getFundersByApiKey,
    createFunderWithApiKey,

    // Job Management
    createImportJob,
    getImportJobs,
    getActiveJobs,
    getJobStatus,
    pauseImportJob,
    resumeImportJob,
    cancelImportJob,
    resumeAllJobs,
    
    // Entity-specific queries
    getEntityJobStatus,
} = require('../controllers/import/orgMeterImportController');

// API Key & Funder Management Routes
router.route('/orgmeter/validate-api-key').post(validateApiKey);
router.route('/orgmeter/funders').post(getFundersByApiKey);
router.route('/orgmeter/funders/create').post(createFunderWithApiKey);

// Job Management Routes
router.route('/orgmeter/jobs').post(createImportJob).get(getImportJobs);
router.route('/orgmeter/jobs/active').get(getActiveJobs);
router.route('/orgmeter/jobs/resume-all').post(resumeAllJobs);
router.route('/orgmeter/jobs/:jobId').get(getJobStatus);
router.route('/orgmeter/jobs/:jobId/pause').post(pauseImportJob);
router.route('/orgmeter/jobs/:jobId/resume').post(resumeImportJob);
router.route('/orgmeter/jobs/:jobId/cancel').post(cancelImportJob);

// Entity-specific Routes
router.route('/orgmeter/entities/:entityType/status').get(getEntityJobStatus);

module.exports = router;
