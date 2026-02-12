
let onlineUsers = {};

exports.socketHandler = (io) => {
    io.on('connection', async (socket) => {
        console.log('user connected: ', socket.id);

        socket.emit('getAllUsers', console.log('user connected: ', socket.id));

        socket.on('disconnect', () => {
            io.emit('updateUserStatus', { onlineUsers });
        });
    });
};