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
            const apiUri = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const newSocket = io(apiUri, {
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            newSocket.on('connect', () => {
                console.log('[SOCKET] Connected to server');
                setConnected(true);
                // Join user-specific room for private messages/notifications
                newSocket.emit('join', user.id);
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
