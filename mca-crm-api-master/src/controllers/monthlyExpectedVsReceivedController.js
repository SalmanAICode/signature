const monthlyExpectedVsReceivedService = require('../services/monthlyExpectedVsReceivedService');
const { ErrorResponse } = require('../utils/errorResponse');

/**
 * Get monthly expected vs received data for syndicator dashboard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getMonthlyExpectedVsReceived = async (req, res) => {
    try {
        console.log('\n--- getMonthlyExpectedVsReceived ---');
        console.log('Request params:', req.params);
        console.log('Request query:', req.query);

        const syndicatorId = req.params.syndicatorId || req.id;
        const {
            period = 'weekly',
            view = 'gross',
            start_date,
            end_date,
            syndication_status,
            funder_ids,
            min_amount,
            max_amount
        } = req.query;

        // Validate parameters
        if (!syndicatorId) {
            return res.status(400).json({
                success: false,
                message: 'Syndicator ID is required'
            });
        }

        const validPeriods = ['daily', 'weekly', 'monthly', 'all-time', '1week', '4weeks', '1month', '3months', '6months', '1year'];
        if (!validPeriods.includes(period)) {
            return res.status(400).json({
                success: false,
                message: `Period must be one of: ${validPeriods.join(', ')}`
            });
        }

        if (!['gross', 'net'].includes(view)) {
            return res.status(400).json({
                success: false,
                message: 'View must be one of: gross, net'
            });
        }

        // Parse array parameters
        const parsedSyndicationStatus = syndication_status ? 
            (Array.isArray(syndication_status) ? syndication_status : syndication_status.split(',')) : 
            undefined;
        
        const parsedFunderIds = funder_ids ? 
            (Array.isArray(funder_ids) ? funder_ids : funder_ids.split(',')) : 
            undefined;

        // Calculate monthly data
        const data = await monthlyExpectedVsReceivedService.calculateMonthlyData(syndicatorId, {
            period,
            view,
            start_date,
            end_date,
            syndication_status: parsedSyndicationStatus,
            funder_ids: parsedFunderIds,
            min_amount: min_amount ? parseFloat(min_amount) : undefined,
            max_amount: max_amount ? parseFloat(max_amount) : undefined
        });

        console.log('Returning data:', {
            summary: data.summary,
            time_series_count: data.time_series.length,
            metadata: data.metadata
        });

        res.status(200).json({
            success: true,
            data
        });

    } catch (error) {
        console.error('Error in getMonthlyExpectedVsReceived:', error);
        
        if (error instanceof ErrorResponse) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
