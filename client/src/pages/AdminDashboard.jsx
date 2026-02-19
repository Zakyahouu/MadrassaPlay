import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';

// Import layout components
import UnifiedSidebar from '../components/layout/UnifiedSidebar';
import TopNav from '../components/layout/TopNav';

// Import dashboard components
import SchoolManager from '../components/admin/SchoolManager';
import GameTemplateManager from '../components/admin/GameTemplateManager';
import Analytics from '../components/admin/Analytics';
import AdminTestGames from '../components/admin/AdminTestGames';
import AdminTemplateGames from '../components/admin/AdminTemplateGames';
import BadgeManager from '../components/admin/BadgeManager';
import TemplateGuide from '../components/admin/TemplateGuide';
import Overview from '../components/admin/Overview';

// Import 3D Model components
import Model3dManagement from '../components/admin/Model3dManagement';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const { t } = useLanguage();
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
    { id: 'overview', name: t.overview },
    { id: 'schools', name: t.schools },
    { id: 'games', name: t.games },
    { id: 'template-games', name: t.templateGames },
    { id: 'templates', name: t.templates },
    { id: 'template-guide', name: t.templateGuide },
    { id: 'badges', name: t.badges },
    { id: 'analytics', name: t.analytics }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview stats={stats} loading={loading} onNavigate={(tab) => setActiveTab(tab)} />;
      case 'schools':
        return <SchoolManager />;
      case 'games':
        return <AdminTestGames />;
      case 'template-games':
        return <AdminTemplateGames />;
      case 'templates':
        return <GameTemplateManager />;
      case 'template-guide':
        return <TemplateGuide />;
      case 'badges':
        return <BadgeManager />;
      case 'analytics':
        return <Analytics />;
      case '3d-management':
        return <Model3dManagement />;
      default:
        return <Overview stats={stats} loading={loading} />;
    }
  };

  return (
    <div className="min-h-screen bg-background-light lg:flex">
      <UnifiedSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
        role="admin"
      />

      <div className="flex-1 relative">
        <TopNav
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeTab={activeTab}
          navigationItems={navigationItems}
          logout={logout}
        />

        <main className="p-6 md:p-8">
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