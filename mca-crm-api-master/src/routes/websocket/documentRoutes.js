const wsRouter = require('../../middleware/websocket/webSocketRouter');

// Register document WebSocket routes
wsRouter.use('/api/v1/documents', (req, res) => {
    // Handle document WebSocket messages
    console.log('Document WebSocket message received:', req.data);
    
    // Send a welcome message
    res.json({
        message: 'Connected to document updates',
        timestamp: new Date().toISOString()
    });
});

module.exports = wsRouter;
