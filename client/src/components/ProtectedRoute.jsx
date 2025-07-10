// client/src/components/ProtectedRoute.jsx
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// This component will wrap our protected pages.
// It checks if a user is logged in. If not, it redirects them to the login page.
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  // While we are checking for a user session, we can show a loading message.
  if (loading) {
    return <div>Loading...</div>;
  }

  // If there is no user, redirect to the /login page.
  // The 'replace' prop is used to replace the current entry in the history stack,
  // so the user can't click the "back" button to get back to the protected page.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If there is a user, render the child components (the actual protected page).
  return children;
};

export default ProtectedRoute;
