const express = require('express');
const {
    getFundingStatuses,
    createFundingStatus,
    getFundingStatusList,
    updateFundingStatus,
    deleteFundingStatus,
    getFundingStatus,
    updateFundingStatusIndex
} = require('../controllers/fundingStatusController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Apply protection to all routes
router.use(protect);


router.route('/')
    .get(authorize(PERMISSIONS.FUNDING_STATUS.READ), getFundingStatuses)
    .post(authorize(PERMISSIONS.FUNDING_STATUS.CREATE), createFundingStatus)
    .put(authorize(PERMISSIONS.FUNDING_STATUS.UPDATE), updateFundingStatusIndex);

router.route('/list')
    .get(authorize(PERMISSIONS.FUNDING_STATUS.READ), getFundingStatusList);

router.route('/:id')
    .get(authorize(PERMISSIONS.FUNDING_STATUS.READ), getFundingStatus)
    .put(authorize(PERMISSIONS.FUNDING_STATUS.UPDATE), updateFundingStatus)
    .delete(authorize(PERMISSIONS.FUNDING_STATUS.DELETE), deleteFundingStatus);


module.exports = router; 