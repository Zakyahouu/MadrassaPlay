// client/src/context/SocketContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [lobbyState, setLobbyState] = useState({
    isConnected: false,
    currentSession: null,
    lobbyStatus: null,
    error: null
  });
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      const backendUrl = process.env.NODE_ENV === 'production'
        ? 'https://wajibet.com'
        : 'http://localhost:5000';

      console.log('🔌 Connecting to Socket.IO:', backendUrl);
      
      const newSocket = io(backendUrl, {
        path: '/socket.io/',
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5
      });

      // Connection events
      newSocket.on('connect', () => {
        console.log('✅ Socket connected:', newSocket.id);
        setLobbyState(prev => ({ ...prev, isConnected: true, error: null }));
        
        try {
          const role = user?.role;
          const userId = user?._id;
          if (role && userId) {
            newSocket.emit('identify', { role, userId });
            console.log('👤 Identified as:', role, userId);
          }
        } catch (err) {
          console.error('❌ Identification failed:', err);
        }
        setSocket(newSocket);
      });

      // Lobby specific events
      newSocket.on('lobby:joined', (sessionData) => {
        console.log('🎮 Joined lobby:', sessionData);
        setLobbyState(prev => ({
          ...prev,
          currentSession: sessionData,
          lobbyStatus: 'joined'
        }));
      });

      newSocket.on('lobby:status', (status) => {
        console.log('📊 Lobby status:', status);
        setLobbyState(prev => ({ ...prev, lobbyStatus: status }));
      });

      newSocket.on('game:starting', (gameData) => {
        console.log('🎲 Game starting:', gameData);
        setLobbyState(prev => ({ ...prev, lobbyStatus: 'starting' }));
      });

      // Error handling
      newSocket.on('error', (error) => {
        console.error('❌ Socket error:', error);
        setLobbyState(prev => ({ ...prev, error: error.message }));
      });

      newSocket.on('disconnect', () => {
        console.log('⚠️ Socket disconnected.');
        setLobbyState(prev => ({
          ...prev,
          isConnected: false,
          lobbyStatus: 'disconnected'
        }));
        setSocket(null);
      });

      return () => {
        console.log('🔌 Cleaning up socket connection');
        newSocket.disconnect();
        setSocket(null);
        setLobbyState({
          isConnected: false,
          currentSession: null,
          lobbyStatus: null,
          error: null
        });
      };
    }
  }, [user]);

  const contextValue = {
    socket,
    ...lobbyState,
    isTeacher: user?.role === 'teacher',
    isStudent: user?.role === 'student'
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
