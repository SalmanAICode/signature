const express = require('express');
const router = express.Router();

const {
    getFinancialReport,
    getDashboardData
} = require('../controllers/dashboardController');

const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Dashboard routes
router.route('/financial-report').get(protect, authorize(PERMISSIONS.REPORT.READ), getFinancialReport);
router.route('/dashboard-data').get(protect, authorize(PERMISSIONS.REPORT.READ), getDashboardData);

module.exports = router; 