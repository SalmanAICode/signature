const upcomingPayoutsService = require('../services/upcomingPayoutsService');

/**
 * Get upcoming payouts timeline for syndicator dashboard
 * @route GET /api/v1/syndicators/upcoming-payouts
 * @access Private (Syndicator)
 */
exports.getUpcomingPayouts = async (req, res) => {
    try {
        console.log('\n--- getUpcomingPayouts ---');
        console.log('Request params:', req.params);
        console.log('Request query:', req.query);

        const syndicatorId = req.id; // Get syndicatorId from auth (the logged-in syndicator)
        const {
            period = '4weeks',
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

        const validPeriods = ['1week', '4weeks', '1month', '3months', '6months', '1year'];
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

        // Get upcoming payouts data
        const data = await upcomingPayoutsService.getUpcomingPayouts(syndicatorId, {
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
            timeline_count: data.timeline.length,
            metadata: data.metadata
        });

        res.status(200).json({
            success: true,
            data: data
        });

    } catch (error) {
        console.error('Error in getUpcomingPayouts:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting upcoming payouts data',
            error: error.message
        });
    }
};
