import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Added Link import

// Import layout components
import Sidebar from '../components/layout/SideBar';
import TopNav from '../components/layout/TopNav';

// Import dashboard components
import SchoolManager from '../components/admin/SchoolManager';
import GameTemplateManager from '../components/admin/GameTemplateManager';
import Analytics from '../components/admin/Analytics';
import Overview from '../components/admin/Overview';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSchools: 0,
    totalTemplates: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [usersRes, schoolsRes, templatesRes] = await Promise.all([
        axios.get('/api/users/count'),
        axios.get('/api/schools/count'),
        axios.get('/api/templates/count')
      ]);

      setStats({
        totalUsers: usersRes.data.count || 0,
        totalSchools: schoolsRes.data.count || 0,
        totalTemplates: templatesRes.data.count || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigationItems = [
    { id: 'overview', name: 'Overview' },
    { id: 'schools', name: 'Schools' },
    { id: 'templates', name: 'Game Templates' },
    { id: 'analytics', name: 'Analytics' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview stats={stats} loading={loading} />;
      case 'schools':
        return <SchoolManager />;
      case 'templates':
        return <GameTemplateManager />;
      case 'analytics':
        return <Analytics />;
      default:
        return <Overview stats={stats} loading={loading} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
      />

      <div className="flex-1 relative">
        <TopNav 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeTab={activeTab}
          navigationItems={navigationItems}
          logout={logout}
        >
          <div className="flex items-center space-x-4">
            <Link 
              to="/" 
              className="p-3 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200 transform hover:scale-105"
              title="Home"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" />
              </svg>
            </Link>
            <Link 
              to="/profile" 
              className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 transform hover:scale-105"
              title="Profile"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
            <button
              onClick={logout}
              className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 transform hover:scale-105"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </TopNav>

        <main className="p-6">
          {renderContent()}
        </main>
      </div>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;