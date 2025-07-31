// client/src/pages/AdminDashboard.jsx
import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// Import the components for the dashboard
import GameTemplateManager from '../components/admin/GameTemplateManager';
import SchoolPlatformManager from '../components/admin/SchoolPlatformManager';
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Platform Management</h2>
        </div>

        {/* Platform-level school management */}
        <div className="mb-8">
          <SchoolPlatformManager />
        </div>

        {/* Game templates management */}
        <div className="mb-8">
          <GameTemplateManager />
        </div>

        {/* Admin test games management */}
        <div className="mb-8">
          <AdminTestGames />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
