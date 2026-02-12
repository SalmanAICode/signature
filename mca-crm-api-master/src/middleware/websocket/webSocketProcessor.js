const wsRouter = require('./webSocketRouter')

const url = require('url');
const jwt = require('jsonwebtoken');

const verifyWebSocketToken = (token) => {
    try {
        if (!token) throw new Error('No token provided');

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        return decoded;
    } catch (error) {
        console.error('WebSocket Token verification failed:', error.message);
    }
};

const webSocketProcessor = (ws, request) => {
    const req = {};
    const socketId = request.headers['sec-websocket-key'];
    const parsedUrl = url.parse(request.url, true);
    const path = parsedUrl.pathname
    const token = parsedUrl.query.token;

    const decoded = verifyWebSocketToken(token);
    req.request = request

    if (decoded?.id && decoded?.portal) req.id = decoded?.portal + '_' + decoded?.id;
    else {
        console.log('Unauthorized WebSocket connection attempt.');
        ws.close(4001, 'Unauthorized');
    }

    if (req.id) {
        wsRouter.addClient(req.id, ws, path, socketId);
        const res = wsRouter.getRespond(req.id, path)
        if (!res) { return; }
        ws.on("message", (message) => {
            try {
                const reqOnMessage = {};
                reqOnMessage.data = JSON.parse(message);
                reqOnMessage.user = req.id;
                reqOnMessage.request = request;
                try {
                    wsRouter.route(reqOnMessage, res);
                } catch (error) {
                    console.error(error)
                }

            } catch (error) {
                console.error("prase WebSocket error:", error);
            }
        });

        ws.on('close', () => {
            console.log(`Connection closed: ${req.id}`);
            wsRouter.removeClient(req.id, path, socketId);
        });
    } else {
        console.log('Unauthorized WebSocket connection attempt.');
        ws.close(4001, 'Unauthorized');
    }
};

module.exports = webSocketProcessor;
