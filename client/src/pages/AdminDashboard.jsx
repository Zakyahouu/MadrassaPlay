import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

// Import layout components
import Sidebar from '../components/layout/Sidebar';
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
        />

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