/**
 * RabbitSign webhook controller
 * Handles POST /api/v1/rabbitsign/webhook
 * Payload: { folderId: string, eventName: string, signerEmail: string }
 */
exports.webhook = async (req, res) => {
    try {
        const {
            folderId,
            eventName,
            signerEmail
        } = req.body || {};

        if (process.env.NODE_ENV === 'development') {
            console.log('RabbitSign webhook received:', { folderId, eventName, signerEmail });
        }

        res.status(200).json({
            success: true,
            message: 'Webhook received',
            folderId: folderId || null
        });
    } catch (err) {
        console.error('RabbitSign webhook error:', err);
        res.status(200).json({
            success: false,
            message: 'Webhook processed with errors'
        });
    }
};
