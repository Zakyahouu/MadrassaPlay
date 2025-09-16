// client/src/context/SocketContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';
import { AuthContext } from './AuthContext';

// 1. Create the Context
export const SocketContext = createContext();

// 2. Create the Provider Component
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useContext(AuthContext); // Get the logged-in user

  // This useEffect hook runs when the 'user' object changes.
  useEffect(() => {
    // If a user is logged in, we establish a new socket connection.
    if (user) {
  // We connect to our backend server. The URL must match the one our server is running on.
  const newSocket = io('http://localhost:5000');
      
      // Store the new socket connection in our state.
      setSocket(newSocket);

      // --- Event Listeners for Debugging ---
      newSocket.on('connect', () => {
        console.log('Socket connected to server:', newSocket.id);
        try {
          const role = user?.role;
          const userId = user?._id;
          if (role && userId) newSocket.emit('identify', { role, userId });
        } catch {}
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected from server.');
      });

      // When the component unmounts or the user logs out, we need to
      // clean up by disconnecting the socket.
      return () => newSocket.disconnect();
    } else {
      // If there is no user (they logged out), we disconnect any existing socket.
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [user]); // The dependency array ensures this runs when the user logs in or out.

  // The Provider makes the 'socket' object available to all child components.
  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
