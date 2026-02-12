const wsRouter = require('../../middleware/websocket/webSocketRouter');

// Register notification WebSocket routes
wsRouter.use('/api/v1/notifications', (req, res) => {
    // Handle notification WebSocket messages
    console.log(req.data);
    // Send a welcome message
    res.json({
        message: 'Connected to notifications',
        timestamp: new Date().toISOString()
    });
});

module.exports = wsRouter; 