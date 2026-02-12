const url = require('url');
function WebSocketRouter() {
    const routes = []; // store routes
    const clients = new Map(); // store clients
    const addClient = (userId, ws, path, socketId) => {
        if (!clients.has(userId)) { clients.set(userId, new Map()); }
        const userPaths = clients.get(userId);
        if (!userPaths.has(path)) { userPaths.set(path, new Set()); }
        const userSockets = userPaths.get(path);
        userSockets.add({ ws, socketId });
        console.log(`[WebSocket] User ${userId} has connected on path ${path} (socketId: ${socketId}). Current online user count: ${clients.size}`);
        console.log(listClients())
    };
    const removeClient = (userId, path, socketId) => {
        if (clients.has(userId)) {
            const userPaths = clients.get(userId);

            if (userPaths.has(path)) {
                const userSockets = userPaths.get(path);
                for (const client of userSockets) {
                    if (client.socketId === socketId) {
                        client.ws.close();
                        userSockets.delete(client);
                        if (userSockets.size === 0) { userPaths.delete(path); }
                        if (userPaths.size === 0) { clients.delete(userId); }
                        console.log(`[WebSocket] User ${userId} (socketId: ${socketId}) has disconnected from path ${path}. Current online user count: ${clients.size}`);
                        console.log(listClients());
                        break;
                    }
                }
            }
        }
    };
    const getClient = (userId, path) => {
        const userIdStr = userId.toString(); // Maybe ObjectId
        if (clients.has(userIdStr)) {
            const userPaths = clients.get(userIdStr);
            return userPaths.get(path);
        }
        return null;
    };
    const hasClient = (userId, path) => {
        return clients.has(userId) && clients.get(userId).has(path);
    };
    const listClients = () => {
        const clientList = []
        for (const [userId, userPaths] of clients.entries()) {
            userPaths.forEach((ws, path) => {
                clientList.push({ userId, path });
            });
        }
        return clientList;
    };
    const getRespond = (userId, path) => {
        return {
            statusCode: null,
            status(code) {
                this.statusCode = code;
                return this;
            },
            json(data) {
                const wsList = getClient(userId, path);
                if (!wsList || wsList.size === 0) {
                    console.log(`${userId} is not online on path ${path}`);
                    return false;
                }
                let success = false;
                wsList.forEach(({ ws }) => {
                    try {
                        ws.send(JSON.stringify({ status: this.statusCode, dataList: data }));
                        success = true;
                    } catch (err) {
                        console.error(`Failed to send message to ${userId} on path ${path}:`, err);
                    }
                });
                return success;
            }
        };
    }
    return {
        addClient,
        removeClient,
        getClient,
        hasClient,
        getRespond,
        listClients,
        use(path, handler) {
            routes.push({ path, handler });
            return this;
        },
        route(req, res) {
            const parsedUrl = url.parse(req.request.url, true);
            const pathname = parsedUrl.pathname;
            const route = routes.find(r => r.path === pathname);
            if (route) {
                route.handler(req, res);
            } else {
                throw new Error(`No route found for: ${pathname}`)
            }
        },
        listRoutes() {
            return routes;
        }
    };
}
const wsRouter = WebSocketRouter();
module.exports = wsRouter;
