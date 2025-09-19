// client/src/components/RoleBasedRedirect.jsx
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// This component checks the logged-in user's role and redirects them
// to the appropriate dashboard.
const RoleBasedRedirect = () => {
  const { user, loading } = useContext(AuthContext);

  // Debug logging (remove in production)
  console.log('RoleBasedRedirect - user:', user, 'loading:', loading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
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

  // If there is no user, redirect to login page
  return <Navigate to="/login" replace />;
};

export default RoleBasedRedirect;
