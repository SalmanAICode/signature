const express = require('express');
const {
    getFundings,
    getFunding,
    getFundingList,
    createFunding,
    updateFunding,
    deleteFunding,
} = require('../controllers/fundingController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Apply protection to all routes
router.use(protect);

router.route('/')
    .get(authorize(PERMISSIONS.FUNDING.READ), getFundings)
    .post(authorize(PERMISSIONS.FUNDING.CREATE), createFunding);

router.route('/list')
    .get(authorize(PERMISSIONS.FUNDING.READ), getFundingList);

router.route('/:id')
    .get(authorize(PERMISSIONS.FUNDING.READ), getFunding)
    .put(authorize(PERMISSIONS.FUNDING.UPDATE), updateFunding)
    .delete(authorize(PERMISSIONS.FUNDING.DELETE), deleteFunding);

module.exports = router; 