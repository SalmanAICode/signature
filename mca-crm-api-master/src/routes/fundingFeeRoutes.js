const express = require('express');
const {
    getFundingFees,
    getFundingFeeList,
    createFundingFee,
    getFundingFee,
    updateFundingFee,
    deleteFundingFee
} = require('../controllers/fundingFeeController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

router.use(protect);

router.route('/')
    .get(authorize(PERMISSIONS.FUNDING_FEE.READ), getFundingFees)
    .post(authorize(PERMISSIONS.FUNDING_FEE.CREATE), createFundingFee);

router.route('/list')
    .get(authorize(PERMISSIONS.FUNDING_FEE.READ), getFundingFeeList);

router.route('/:id')
    .get(authorize(PERMISSIONS.FUNDING_FEE.READ), getFundingFee)
    .put(authorize(PERMISSIONS.FUNDING_FEE.UPDATE), updateFundingFee)
    .delete(authorize(PERMISSIONS.FUNDING_FEE.DELETE), deleteFundingFee);

module.exports = router;