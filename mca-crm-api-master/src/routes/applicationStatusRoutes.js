const express = require('express');
const {
    getApplicationStatuses,
    createApplicationStatus,
    getApplicationStatusList,
    updateApplicationStatus,
    deleteApplicationStatus,
    getApplicationStatus,
    updateApplicationStatusIndex
} = require('../controllers/applicationStatusController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Apply protection to all routes
router.use(protect);


router.route('/')
    .get(authorize(PERMISSIONS.APPLICATION_STATUS.READ), getApplicationStatuses)
    .post(authorize(PERMISSIONS.APPLICATION_STATUS.CREATE), createApplicationStatus)
    .put(authorize(PERMISSIONS.APPLICATION_STATUS.UPDATE), updateApplicationStatusIndex);

router.route('/list')
    .get(authorize(PERMISSIONS.APPLICATION_STATUS.READ), getApplicationStatusList);

router.route('/:id')
    .get(authorize(PERMISSIONS.APPLICATION_STATUS.READ), getApplicationStatus)
    .put(authorize(PERMISSIONS.APPLICATION_STATUS.UPDATE), updateApplicationStatus)
    .delete(authorize(PERMISSIONS.APPLICATION_STATUS.DELETE), deleteApplicationStatus);


module.exports = router; 