import React, { useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

// Import layout components
import UnifiedSidebar from '../components/layout/UnifiedSidebar';
import TopNav from '../components/layout/TopNav';

// Import dashboard components
import TeacherOverview from '../components/teacher/TeacherOverview';
import TeacherLiveSessions from '../components/teacher/TeacherLiveSessions';
import TeacherAssignments from '../components/teacher/TeacherAssignments';
import TeacherResults from '../components/teacher/TeacherResults';
import TeacherStudents from '../components/teacher/TeacherStudents';
import TeacherResources from '../components/teacher/TeacherResources';
import MyCreations from '../components/teacher/MyCreations';
import TemplateSelector from '../components/teacher/TemplateSelector';
import Timetable from '../components/teacher/Timetable';
import AdsBar from '../components/shared/AdsBar';

// Lazy-load TeacherAnnouncements to avoid bundling CommonJS require in client bundle
const TeacherAnnouncementsLazy = React.lazy(() => import('../components/teacher/TeacherAnnouncements'));

// Import 3D Model Library component
import Model3dLibrary from '../components/teacher/Model3dLibrary';

const TeacherDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const { t } = useLanguage();
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
  // Removed fake stats state

  const [loading] = useState(false);

  // React to tab query param changes (e.g., when navigating back from summary)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && tabParam !== activeTab) setActiveTab(tabParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const navigationItems = [
    { id: 'announcements', name: t.announcements },
    { id: 'overview', name: t.overview },
    { id: 'my-games', name: t.myGames },
    { id: 'create-game', name: t.createGame },
    { id: 'live-sessions', name: t.liveSessions },
    { id: 'assignments', name: t.assignments },
    { id: 'results', name: t.results || 'Results' },
    { id: 'resources', name: t.resources },
    { id: 'timetable', name: t.timetable },
    { id: 'students', name: t.myClasses },
    { id: 'calendar', name: t.calendar }
  ];

  // Keep the active tab in session storage
  useEffect(() => {
    try { sessionStorage.setItem('teacher.activeTab', activeTab); } catch { }
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'announcements':
        // Use Suspense with the lazy-loaded TeacherAnnouncements
        return (
          <React.Suspense fallback={<div className="py-8 text-center">{t.loading}...</div>}>
            <TeacherAnnouncementsLazy />
          </React.Suspense>
        );
      case 'overview':
        return <TeacherOverview />;
      case 'my-games':
        return <MyCreations />;
      case 'create-game':
        return <TemplateSelector />;
      case 'live-sessions':
        return <TeacherLiveSessions />;
      case 'assignments':
        return <TeacherAssignments />;
      case 'results':
        return <TeacherResults />;
      case 'resources':
        return <TeacherResources />;
      case 'timetable':
        return <Timetable />;
      case 'students':
        return <TeacherStudents />;
      case 'calendar':
        return <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.calendar}</h2>
          <p className="text-gray-600">{t.calendarFeaturesComingSoon}</p>
        </div>;
      case '3d-library':
        return <Model3dLibrary />;
      default:
        return <TeacherOverview />;
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background-light lg:flex">
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

        <main className="p-4 md:p-8">
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
