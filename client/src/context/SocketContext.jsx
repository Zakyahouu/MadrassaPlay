// client/src/context/SocketContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  // expose both socket instance and a connected boolean so consumers can reliably
  // know when it's safe to emit events
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user) {
      // if user signs out, ensure socket is cleared
      setConnected(false);
      if (socket) {
        try { socket.disconnect(); } catch {};
        setSocket(null);
      }
      return;
    }

    const backendUrl = process.env.NODE_ENV === 'production'
      ? 'https://wajibet.com'
      : 'http://localhost:5000';

    console.log('🔌 Connecting to Socket.IO:', backendUrl);

    const newSocket = io(backendUrl, {
      path: '/socket.io/',
      transports: ['websocket']
    });

    // set socket right away so consumers can attach listeners immediately
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      setConnected(true);
      try {
        const role = user?.role;
        const userId = user?._id;
        if (role && userId) newSocket.emit('identify', { role, userId });
      } catch (err) {
        console.warn('identify emit failed', err);
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('⚠️ Socket disconnected.', reason);
      setConnected(false);
      // keep socket in state briefly so consumers can read last instance if needed
    });

    newSocket.on('connect_error', (err) => {
      console.warn('⚠️ Socket connect_error', err && err.message);
    });

    return () => {
      try { newSocket.disconnect(); } catch {}
      setSocket(null);
      setConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};
