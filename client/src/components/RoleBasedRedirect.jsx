// client/src/components/RoleBasedRedirect.jsx
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// This component checks the logged-in user's role and redirects them
// to the appropriate dashboard.
const RoleBasedRedirect = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>;
  }

  // If a user is logged in, check their role and redirect.
  if (user) {
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'teacher':
        return <Navigate to="/teacher/dashboard" replace />;
      case 'student':
        return <Navigate to="/student/dashboard" replace />;
      case 'manager':
        return <Navigate to="/manager/dashboard" replace />;
      default:
        // If role is unknown, redirect to login as a fallback.
        return <Navigate to="/login" replace />;
    }
  }

  // If there is no user, this component does nothing,
  // allowing other routes (like the login page) to render.
  // In our setup, this case will be handled by the main router logic.
  return null;
};

export default RoleBasedRedirect;
