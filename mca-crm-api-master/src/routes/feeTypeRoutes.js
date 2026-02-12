const express = require('express');
const {
    getFeeTypes,
    createFeeType,
    getFeeTypesList,
    updateFeeType,
    getFeeTypeById,
    deleteFeeType
} = require('../controllers/feeTypeController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

router.use(protect);

router.route('/')
    .get(authorize(PERMISSIONS.FEE_TYPE.READ), getFeeTypes)
    .post(authorize(PERMISSIONS.FEE_TYPE.CREATE), createFeeType);

router.route('/list')
    .get(authorize(PERMISSIONS.FEE_TYPE.READ), getFeeTypesList);

router.route('/:id')
    .get(authorize(PERMISSIONS.FEE_TYPE.READ), getFeeTypeById)
    .put(authorize(PERMISSIONS.FEE_TYPE.UPDATE), updateFeeType)
    .delete(authorize(PERMISSIONS.FEE_TYPE.DELETE), deleteFeeType);

module.exports = router;