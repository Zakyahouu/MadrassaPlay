// client/src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// 1. Create the Context
// ==============================================================================
// createContext() creates a context object. When React renders a component that
// subscribes to this Context object, it will read the current context value from
// the closest matching Provider in the tree.
export const AuthContext = createContext();

// 2. Create the Provider Component
// ==============================================================================
// This component will wrap our entire application and provide the user's
// authentication state to all components inside it.
export const AuthProvider = ({ children }) => {
  // 'user' state will hold the logged-in user's data (or null if not logged in).
  const [user, setUser] = useState(null);
  // 'loading' state will help us show a loading screen while we check for a session.
  const [loading, setLoading] = useState(true);

  // 'useEffect' is a hook that runs after the component renders.
  // This one runs only once when the app starts (due to the empty dependency array []).
  useEffect(() => {
    // Check if user data exists in localStorage. This is how we keep the user
    // logged in even if they refresh the page.
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      // We also need to tell axios to use this user's token for all future requests.
      axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
    }
    setLoading(false); // We're done checking, so we can stop loading.
  }, []);

  // --- Login Function ---
  const login = async (email, password) => {
    const response = await axios.post('/api/users/login', { email, password });
    const userData = response.data;
    
    // Save user data to localStorage to persist the session.
    localStorage.setItem('user', JSON.stringify(userData));
    // Set the user data in our state.
    setUser(userData);
    // Set the authorization header for all subsequent axios requests.
    axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
  };

  // --- Logout Function ---
  const logout = () => {
    // Remove user data from localStorage.
    localStorage.removeItem('user');
    // Clear the user from our state.
    setUser(null);
    // Remove the authorization header from axios.
    delete axios.defaults.headers.common['Authorization'];
  };

  // Update user function
  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
  };

  // The Provider component makes the 'user', 'login', 'logout', 'loading', and 'updateUser'
  // values available to any child component that calls useContext(AuthContext).
  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};