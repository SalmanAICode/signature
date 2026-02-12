const express = require('express');
const router = express.Router();

const {
    createUploadJob,
    getUploadJobStatus,
    cancelUploadJob,
    getUploadJobs
} = require('../controllers/upload/orgMeterUploadController');

// Upload job management routes
router.route('/orgmeter/:entityType').post(createUploadJob);
router.route('/orgmeter/job/:jobId/status').get(getUploadJobStatus);
router.route('/orgmeter/job/:jobId/cancel').post(cancelUploadJob);
router.route('/orgmeter/jobs').post(getUploadJobs);

module.exports = router; 