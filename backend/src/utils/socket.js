let io;

module.exports = {
    init: (httpServer) => {
        const { Server } = require('socket.io');
        io = new Server(httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            },
            pingInterval: 10000,
            pingTimeout: 5000,
            transports: ['websocket']
        });

        io.on('connection', (socket) => {

            socket.on('join', (userId) => {
                if (userId) {
                    socket.join(userId);
                }
            });

            socket.on('disconnect', () => {
            });
        });

        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error("Socket.io not initialized!");
        }
        return io;
    }
};
