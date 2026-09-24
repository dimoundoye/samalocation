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

        // Authentification obligatoire : le JWT est transmis dans socket.handshake.auth.token
        io.use(async (socket, next) => {
            try {
                const { verifyToken } = require('./auth');
                const User = require('../models/userModel');
                const decoded = verifyToken(socket.handshake.auth?.token);
                if (!decoded) return next(new Error('Not authenticated'));

                const profile = await User.findProfileById(decoded.id);
                if (!profile || profile.is_blocked) return next(new Error('Not authorized'));

                socket.data.userId = String(profile.id);
                socket.data.parentId = profile.parent_id ? String(profile.parent_id) : null;
                next();
            } catch (err) {
                next(new Error('Authentication error'));
            }
        });

        io.on('connection', (socket) => {
            // Rejoint automatiquement sa propre room
            socket.join(socket.data.userId);

            // Seules sa propre room et celle de son agence (s'il est collaborateur) sont autorisées
            socket.on('join', (roomId) => {
                const room = roomId ? String(roomId) : null;
                if (room && (room === socket.data.userId || room === socket.data.parentId)) {
                    socket.join(room);
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
    },
    emitToWorkspace: (workspaceId, event, data = {}) => {
        try {
            if (io && workspaceId) {
                io.to(String(workspaceId)).emit(event, data);
            }
        } catch (err) {
            console.error('[SOCKET] Error emitting to workspace:', err.message);
        }
    }
};
