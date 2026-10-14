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
                const { verifyToken, isSessionRevoked } = require('./auth');
                const User = require('../models/userModel');
                const decoded = verifyToken(socket.handshake.auth?.token);
                if (!decoded) return next(new Error('Not authenticated'));

                const profile = await User.findProfileById(decoded.id);
                if (!profile || profile.is_blocked || isSessionRevoked(decoded, profile)) return next(new Error('Not authorized'));

                const Organization = require('../models/organizationModel');
                const organizations = await Organization.findForUser(profile.id);

                socket.data.userId = String(profile.id);
                socket.data.orgIds = new Set(organizations.map(o => String(o.id)));
                next();
            } catch (err) {
                next(new Error('Authentication error'));
            }
        });

        io.on('connection', (socket) => {
            // Rejoint automatiquement sa propre room
            socket.join(socket.data.userId);

            // Seules sa propre room et celles des organisations dont il est membre actif sont autorisées
            socket.on('join', (roomId) => {
                const room = roomId ? String(roomId) : null;
                if (room && (room === socket.data.userId || socket.data.orgIds.has(room))) {
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
    /**
     * Met à jour les connexions ouvertes d'un utilisateur quand il rejoint ou quitte une équipe :
     * un agent retiré cesse immédiatement de recevoir les événements de l'organisation.
     */
    syncMembership: async (userId, organizationId, isMember) => {
        try {
            if (!io || !userId || !organizationId) return;
            const orgId = String(organizationId);
            const sockets = await io.in(String(userId)).fetchSockets();
            for (const s of sockets) {
                if (isMember) {
                    s.data.orgIds?.add(orgId);
                } else {
                    s.data.orgIds?.delete(orgId);
                    s.leave(orgId);
                }
            }
        } catch (err) {
            console.error('[SOCKET] Error syncing membership:', err.message);
        }
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
