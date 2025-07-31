// client/src/context/SocketContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

// 1. Create the Context
export const SocketContext = createContext();

// 2. Create the Provider Component
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const { user } = useContext(AuthContext); // Get the logged-in user

  // This useEffect hook runs when the 'user' object changes.
  useEffect(() => {
    // If a user is logged in, we establish a new socket connection.
    if (user) {
      // Create socket with error handling
      const newSocket = io('http://localhost:5000', {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      });
      
      // --- Event Listeners for Debugging ---
      newSocket.on('connect', () => {
        console.log('Socket connected to server:', newSocket.id);
        setConnected(true);
        setConnectionError(null);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        setConnectionError(error.message);
        setConnected(false);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected from server:', reason);
        setConnected(false);
      });

      // Store the new socket connection in our state.
      setSocket(newSocket);

      // When the component unmounts or the user logs out, we need to
      // clean up by disconnecting the socket.
      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    } else {
      // If there is no user (they logged out), we disconnect any existing socket.
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [user]); // The dependency array ensures this runs when the user logs in or out.

  // The Provider makes the 'socket' and connection status available to all child components.
  return (
    <SocketContext.Provider value={{ socket, connected, connectionError }}>
      {children}
    </SocketContext.Provider>
  );
};
