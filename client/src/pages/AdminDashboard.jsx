// client/src/pages/AdminDashboard.jsx
import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// Import the components for the dashboard
import SchoolManager from '../components/admin/SchoolManager';
import GameTemplateManager from '../components/admin/GameTemplateManager'; // 1. Import the new component
import AdminTestGames from '../components/admin/AdminTestGames';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
        <div>
          <span className="mr-4">Welcome, {user?.name}</span>
          <button 
            onClick={logout}
            className="px-4 py-2 font-semibold text-sm text-white bg-red-600 rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="p-8 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Platform Management</h2>
        {/* Admin's test games */}
        <AdminTestGames />
        {/* Render the SchoolManager component */}
        <SchoolManager />
        {/* 2. Render the GameTemplateManager component */}
        <GameTemplateManager />
      </main>
    </div>
  );
};

export default AdminDashboard;
