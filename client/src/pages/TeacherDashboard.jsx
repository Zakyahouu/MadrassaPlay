import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

// Import layout components
import UnifiedSidebar from '../components/layout/UnifiedSidebar';
import TopNav from '../components/layout/TopNav';

// Import dashboard components
import TeacherOverview from '../components/teacher/TeacherOverview';
import TeacherLiveSessions from '../components/teacher/TeacherLiveSessions';
import TeacherAssignments from '../components/teacher/TeacherAssignments';
import TeacherStudents from '../components/teacher/TeacherStudents';
import MyCreations from '../components/teacher/MyCreations';
import TemplateSelector from '../components/teacher/TemplateSelector';
import Reports from '../components/teacher/Reports';

const TeacherDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalGames: 24,
    totalStudents: 156,
    averageScore: 87,
    liveSessions: 8
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const navigationItems = [
    { id: 'overview', name: 'Overview' },
    { id: 'my-games', name: 'My Games' },
    { id: 'create-game', name: 'Create Game' },
    { id: 'live-sessions', name: 'Live Sessions' },
    { id: 'assignments', name: 'Assignments' },
    { id: 'reports', name: 'Reports' },
    { id: 'students', name: 'My Students' },
    { id: 'calendar', name: 'Calendar' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <TeacherOverview stats={stats} />;
      case 'my-games':
        return <MyCreations />;
      case 'create-game':
        return <TemplateSelector />;
      case 'live-sessions':
        return <TeacherLiveSessions />;
      case 'assignments':
        return <TeacherAssignments />;
      case 'reports':
        return <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
              <p className="text-gray-600">View assignment performance and analytics</p>
            </div>
          </div>
          <Reports />
        </div>;
      case 'students':
        return <TeacherStudents />;
      case 'calendar':
        return <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Calendar</h2>
          <p className="text-gray-600">Calendar and scheduling features coming soon...</p>
        </div>;
      default:
        return <TeacherOverview stats={stats} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your dashboard...</p>
      </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      <UnifiedSidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
        role="teacher"
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

export default TeacherDashboard;
