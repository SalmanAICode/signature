const express = require('express');
const router = express.Router();

const {
    startEntitySync,
    cancelSyncJob,
    continueSyncJob,
    getSyncJobs,
    getSyncJobStatus,
    getOverallSyncProgress,
    getImportedDataForReview,
    updateSyncSelection
} = require('../controllers/sync/orgMeterSyncController');

// All sync routes are public - API key validation happens in controllers
router.post('/orgmeter/progress', getOverallSyncProgress);
router.post('/orgmeter/jobs', getSyncJobs);

router.post('/orgmeter/review/:entityType', getImportedDataForReview);
router.put('/orgmeter/selection/:entityType', updateSyncSelection);
router.post('/orgmeter/start/:entityType', startEntitySync);
router.post('/orgmeter/job/:jobId/continue', continueSyncJob);
router.get('/orgmeter/job/:jobId/status', getSyncJobStatus);
router.post('/orgmeter/job/:jobId/cancel', cancelSyncJob);

module.exports = router; 