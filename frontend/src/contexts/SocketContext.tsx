import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
    socket: Socket | null;
    connected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, connected: false });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (user) {
            // Initialize socket connection
            // We need to remove the /api suffix from VITE_API_URL for socket.io if it's there
            let apiUri = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            if (apiUri.endsWith('/api')) {
                apiUri = apiUri.slice(0, -4);
            }
            
            const newSocket = io(apiUri, {
                reconnectionAttempts: 50, // Essayer beaucoup plus longtemps (environ 2-3 minutes au total)
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000, // Limiter le délai max de reconnexion
                transports: ['websocket', 'polling'],
                timeout: 20000, // Augmenter le timeout pour les réseaux lents
            });

            newSocket.on('connect', () => {
                console.log('[SOCKET] Connected to server successfully');
                setConnected(true);
                // Join user-specific room for private messages/notifications
                newSocket.emit('join', user.id);
            });

            newSocket.on('connect_error', (err) => {
                console.error('[SOCKET] Connection error:', err.message);
                setConnected(false);
            });

            newSocket.on('reconnect_attempt', (attempt) => {
                console.log(`[SOCKET] Reconnection attempt #${attempt}`);
            });

            newSocket.on('reconnect_failed', () => {
                console.error('[SOCKET] Reconnection failed after all attempts');
            });
            newSocket.on('disconnect', () => {
                console.log('[SOCKET] Disconnected from server');
                setConnected(false);
            });

            setSocket(newSocket);

            return () => {
                newSocket.close();
            };
        } else {
            setSocket(null);
            setConnected(false);
        }
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket, connected }}>
            {children}
        </SocketContext.Provider>
    );
};
