let io;

module.exports = {
    init: (httpServer) => {
        const { Server } = require('socket.io');
        io = new Server(httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        io.on('connection', (socket) => {
            console.log('[SOCKET] Client connected:', socket.id);

            socket.on('join', (userId) => {
                if (userId) {
                    console.log(`[SOCKET] User ${userId} joined their room`);
                    socket.join(userId);
                }
            });

            socket.on('disconnect', () => {
                console.log('[SOCKET] Client disconnected:', socket.id);
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
