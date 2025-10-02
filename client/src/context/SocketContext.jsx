// client/src/context/SocketContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      const backendUrl = process.env.NODE_ENV === 'production'
      ? 'https://wajibet.com'     // frontend + backend same domain
      : 'http://localhost:5000';
    


      console.log('🔌 Connecting to Socket.IO:', backendUrl);
      
      const newSocket = io(backendUrl, {
        path: '/socket.io/',        // go through Nginx proxy
        transports: ['websocket']
      });

      newSocket.on('connect', () => {
        console.log('✅ Socket connected:', newSocket.id);
        try {
          const role = user?.role;
          const userId = user?._id;
          if (role && userId) newSocket.emit('identify', { role, userId });
        } catch {}
      });

      newSocket.on('disconnect', () => {
        console.log('⚠️ Socket disconnected.');
      });

      return () => newSocket.disconnect();
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
