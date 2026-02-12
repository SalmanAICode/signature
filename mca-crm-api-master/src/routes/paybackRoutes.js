const express = require('express');
const {
    getPaybacks,
    createPayback,
    getPaybackList,
    getPayback,
    updatePayback
} = require('../controllers/paybackController');

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

const router = express.Router();

router.use(protect);

router.route('/')
    .get(authorize(PERMISSIONS.PAYBACK.READ), getPaybacks)
    .post(authorize(PERMISSIONS.PAYBACK.CREATE), createPayback);

router.route('/list')
    .get(authorize(PERMISSIONS.PAYBACK.READ), getPaybackList);

router.route('/:id')
    .get(authorize(PERMISSIONS.PAYBACK.READ), getPayback)
    .put(authorize(PERMISSIONS.PAYBACK.UPDATE), updatePayback);

module.exports = router;