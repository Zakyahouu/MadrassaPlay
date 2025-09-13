import React, { useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// Import layout components
import UnifiedSidebar from '../components/layout/UnifiedSidebar';
import TopNav from '../components/layout/TopNav';

// Import dashboard components
import TeacherOverview from '../components/teacher/TeacherOverview';
import TeacherLiveSessions from '../components/teacher/TeacherLiveSessions';
import TeacherAssignments from '../components/teacher/TeacherAssignments';
import TeacherStudents from '../components/teacher/TeacherStudents';
import TeacherResources from '../components/teacher/TeacherResources';
import MyCreations from '../components/teacher/MyCreations';
import TemplateSelector from '../components/teacher/TemplateSelector';
import Timetable from '../components/teacher/Timetable';
import AdsBar from '../components/shared/AdsBar';

const TeacherDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  // Persist active tab to avoid flicker/reset on remounts (e.g., StrictMode)
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam) return tabParam;
    const saved = sessionStorage.getItem('teacher.activeTab');
    return saved || 'overview';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adsPanelOpen, setAdsPanelOpen] = useState(false);
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

  // React to tab query param changes (e.g., when navigating back from summary)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && tabParam !== activeTab) setActiveTab(tabParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const navigationItems = [
    { id: 'overview', name: 'Overview' },
    { id: 'my-games', name: 'My Games' },
    { id: 'create-game', name: 'Create Game' },
    { id: 'live-sessions', name: 'Live Sessions' },
    { id: 'assignments', name: 'Assignments' },
  { id: 'resources', name: 'Resources' },
    { id: 'timetable', name: 'Timetable' },
  // Reports removed; entry points now inside Assignments and My Classes
  { id: 'students', name: 'My Classes' },
    { id: 'calendar', name: 'Calendar' }
  ];

  // Keep the active tab in session storage
  useEffect(() => {
    try { sessionStorage.setItem('teacher.activeTab', activeTab); } catch {}
  }, [activeTab]);

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
      case 'resources':
        return <TeacherResources />;
      case 'timetable':
        return <Timetable />;
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

        {/* Announcements Bar (overview only) */}
        {activeTab === 'overview' && (
          <AdsBar userRole="teacher" schoolId={user?.school} />
        )}

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

      {/* Removed side panel */}
    </div>
  );
};

export default TeacherDashboard;
