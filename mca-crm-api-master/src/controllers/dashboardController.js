const Joi = require('joi');
const { TRANSACTION_TYPES } = require('../utils/constants');
const dashboardService = require('../services/dashboardService');

/**
 * @desc    Get financial report for a funder
 * @route   GET /api/v1/dashboard/financial-report
 * @access  Private (requires authentication)
 */
exports.getFinancialReport = async (req, res) => {
    try {
        // Handle categories parameter - support both array and comma-separated string
        let categoriesParam = req.query.categories;
        if (typeof categoriesParam === 'string') {
            categoriesParam = categoriesParam.split(',').map(cat => cat.trim()).filter(cat => cat);
        }
        
        // Validate query parameters
        const schema = Joi.object({
            startDate: Joi.string().isoDate().required(),
            endDate: Joi.string().isoDate().required(),
            aggregation: Joi.string().valid('day', 'week', 'month').default('month'),
            categories: Joi.array().items(Joi.string().valid(...Object.values(TRANSACTION_TYPES))).optional()
        });

        const { error, value } = schema.validate({
            ...req.query,
            categories: categoriesParam
        });
        
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        const { startDate, endDate, aggregation, categories = Object.values(TRANSACTION_TYPES) } = value;

        // Convert dates, notice startDate and endDate only have date, not time
        // The date is in UTC, so we need to convert it to local timezone
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Validate date range
        if (start > end) {
            return res.status(400).json({
                success: false,
                message: 'Start date must be before end date'
            });
        }

        if (!req.filter?.funder) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Single funder access required for financial reports'
            });
        }

        // Get financial data from service
        const financialData = await dashboardService.getFinancialData(req.filter.funder, start, end, aggregation, categories);

        res.json({
            success: true,
            data: financialData
        });

    } catch (error) {
        console.error('Error getting financial report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get financial report',
            error: error.message
        });
    }
}; 

/**
 * @desc    Get dashboard data for a funder
 * @route   GET /api/v1/dashboard/dashboard-data
 * @access  Private (requires authentication)
 */
exports.getDashboardData = async (req, res) => {
    try {
        if (!req.filter?.funder) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Single funder access required for dashboard data'
            });
        }

        const dashboardData = await dashboardService.getDashboardData(req.filter.funder);

        res.json({
            success: true,
            data: dashboardData
        });
    } catch (error) {
        console.error('Error getting dashboard data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get dashboard data',
            error: error.message
        });
    }
};