const express = require('express');
const {
    getFundingCredits,
    getFundingCreditList,
    createFundingCredit,
    getFundingCredit,
    updateFundingCredit,
    deleteFundingCredit
} = require('../controllers/fundingCreditController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

router.use(protect);

router.route('/')
    .get(authorize(PERMISSIONS.FUNDING_CREDIT.READ), getFundingCredits)
    .post(authorize(PERMISSIONS.FUNDING_CREDIT.CREATE), createFundingCredit);

router.route('/list')
    .get(authorize(PERMISSIONS.FUNDING_CREDIT.READ), getFundingCreditList);

router.route('/:id')
    .get(authorize(PERMISSIONS.FUNDING_CREDIT.READ), getFundingCredit)
    .put(authorize(PERMISSIONS.FUNDING_CREDIT.UPDATE), updateFundingCredit)
    .delete(authorize(PERMISSIONS.FUNDING_CREDIT.DELETE), deleteFundingCredit);

module.exports = router;