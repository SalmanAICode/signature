const { getSyndicatorDashboardData } = require('../services/dashboardService');
const SyndicatorFunder = require('../models/SyndicatorFunder');

/**
 * Get syndicator dashboard data aggregated across all funders
 * @route GET /api/v1/syndicator/dashboard-data
 * @access Private (Syndicator)
 */
const getSyndicatorDashboard = async (req, res) => {
    try {
        const syndicatorId = req.id;
        
        // Get all funder IDs associated with this syndicator
        const syndicatorFunders = await SyndicatorFunder.find({ syndicator: syndicatorId })
            .populate('funder', '_id')
            .lean();
        
        const funderIds = syndicatorFunders.map(sf => sf.funder._id);
        
        // Get aggregated dashboard data
        const dashboardData = await getSyndicatorDashboardData(syndicatorId, funderIds);
        
        res.status(200).json({
            success: true,
            data: dashboardData
        });
    } catch (error) {
        console.error('Error getting syndicator dashboard data:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting syndicator dashboard data',
            error: error.message
        });
    }
};

/**
 * Get syndicator dashboard data for specific funders
 * @route POST /api/v1/syndicator/dashboard-data
 * @access Private (Syndicator)
 * @body { funderIds: string[] }
 */
const getSyndicatorDashboardForFunders = async (req, res) => {
    try {
        const syndicatorId = req.id;
        const { funderIds } = req.body;
        
        if (!funderIds || !Array.isArray(funderIds) || funderIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'funderIds array is required'
            });
        }
        
        // Verify that all funder IDs belong to this syndicator
        const syndicatorFunders = await SyndicatorFunder.find({ 
            syndicator: syndicatorId,
            funder: { $in: funderIds }
        }).lean();
        
        const validFunderIds = syndicatorFunders.map(sf => sf.funder.toString());
        
        if (validFunderIds.length !== funderIds.length) {
            return res.status(403).json({
                success: false,
                message: 'Some funder IDs do not belong to this syndicator'
            });
        }
        
        // Get aggregated dashboard data for specified funders
        const dashboardData = await getSyndicatorDashboardData(syndicatorId, validFunderIds);
        
        res.status(200).json({
            success: true,
            data: dashboardData
        });
    } catch (error) {
        console.error('Error getting syndicator dashboard data for specific funders:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting syndicator dashboard data for specific funders',
            error: error.message
        });
    }
};

module.exports = {
    getSyndicatorDashboard,
    getSyndicatorDashboardForFunders
};
