import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import {
  BarChart3,
  TrendingUp,
  X,
  Plus,
  Settings,
  BookOpen,
  School,
  Trophy,
  Users,
  Calendar,
  FileText,
  Play,
  Award,
  UserCheck,
  Building2,
  GraduationCap,
  Bell,
  Package,
  Megaphone,
  Gamepad2,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Activity,
  Box,
  Tag,
  FolderOpen,
  Globe
} from 'lucide-react';

const UnifiedSidebar = ({
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
  user,
  role = 'admin',
  userPermissions = {}
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t, isRTL } = useLanguage();
  const getNavigationItems = () => {
    // Helper to structure groups
    const createGroup = (title, items) => ({ group: title, items });

    console.log('Getting navigation items for role:', role, 'permissions:', userPermissions);

    switch (role) {
      case 'admin':
        return [
          createGroup(t.overview || 'Dashboard', [
            { id: 'overview', name: t.overview, icon: BarChart3 },
            { id: 'analytics', name: t.analytics, icon: TrendingUp }
          ]),
          createGroup(t.schoolManagement || 'Schools', [
            { id: 'schools', name: t.schools, icon: School },
            { id: 'badges', name: t.badges, icon: Award }
          ]),
          createGroup(t.content || 'Content', [
            { id: 'games', name: t.games, icon: Play },
            { id: 'template-games', name: t.templateGames, icon: Gamepad2 },
            { id: 'templates', name: t.templates, icon: Plus },
            { id: 'template-guide', name: t.templateGuide, icon: BookOpen },
            { id: '3d-management', name: t.model3dManagement, icon: Box, isExternal: true }
          ])
        ];
      case 'manager':
        // Helper to check permission (managers always have access, staff needs explicit permission)
        const hasPerm = (perm) => role === 'manager' || userPermissions?.[perm] === true;

        const academicItems = [];
        if (hasPerm('classes')) academicItems.push({ id: 'classes', name: t.classes, icon: BookOpen });
        if (hasPerm('students')) academicItems.push({ id: 'students', name: t.students, icon: Users });
        if (hasPerm('teachers')) academicItems.push({ id: 'teachers', name: t.teachers, icon: UserCheck });
        if (hasPerm('attendance')) academicItems.push({ id: 'attendance', name: t.attendance, icon: Calendar });
        if (hasPerm('timetable')) academicItems.push({ id: 'timetable', name: t.timetable, icon: Calendar });

        const adminItems = [];
        if (hasPerm('employees')) adminItems.push({ id: 'employees', name: t.employees, icon: Building2 });
        if (hasPerm('finance')) adminItems.push({ id: 'finance', name: t.finance, icon: DollarSign });
        if (hasPerm('logs')) adminItems.push({ id: 'log', name: t.log, icon: Activity });
        if (hasPerm('reports')) adminItems.push({ id: 'reports', name: t.reports || 'Reports', icon: TrendingUp }); // New Reports section

        const resourceItems = [];
        if (hasPerm('rooms')) resourceItems.push({ id: 'rooms', name: t.rooms, icon: Building2 });
        if (hasPerm('equipment')) resourceItems.push({ id: 'equipment', name: t.equipment, icon: Package });
        if (hasPerm('catalog')) resourceItems.push({ id: 'catalog', name: t.catalog, icon: Package });

        const marketingItems = [];
        if (hasPerm('ads')) marketingItems.push({ id: 'ads', name: t.ads, icon: Megaphone });
        if (hasPerm('landingPage')) marketingItems.push({ id: 'landing', name: t.landingPageBuilder, icon: Globe });

        const groups = [
          createGroup(t.overview || 'Dashboard', [
            { id: 'overview', name: t.overview, icon: BarChart3 }
          ])
        ];

        if (academicItems.length > 0) groups.push(createGroup(t.academic || 'Academic', academicItems));
        if (adminItems.length > 0) groups.push(createGroup(t.administration || 'Administration', adminItems));
        if (resourceItems.length > 0) groups.push(createGroup(t.resources || 'Resources', resourceItems));
        if (marketingItems.length > 0) groups.push(createGroup(t.marketing || 'Marketing', marketingItems));

        return groups;

      case 'teacher':
        return [
          createGroup(t.dashboard || 'Dashboard', [
            { id: 'overview', name: t.overview, icon: BarChart3 },
            { id: 'announcements', name: t.announcements, icon: Megaphone },
            { id: 'calendar', name: t.calendar, icon: Calendar }
          ]),
          createGroup(t.teaching || 'Teaching', [
            { id: 'students', name: t.myClasses, icon: Users },
            { id: 'timetable', name: t.timetable, icon: Calendar },
            { id: 'live-sessions', name: t.liveSessions, icon: Play },
            { id: 'assignments', name: t.assignments, icon: FileText }
          ]),
          createGroup(t.content || 'Content', [
            { id: 'my-games', name: t.myGames, icon: BookOpen },
            { id: 'create-game', name: t.createGame, icon: Plus },
            { id: 'resources', name: t.resources, icon: FileText },
            { id: '3d-library', name: t.model3dLibrary, icon: Box, isExternal: true }
          ])
        ];
      default:
        return [
          createGroup(t.overview || 'Dashboard', [
            { id: 'overview', name: t.overview, icon: BarChart3 }
          ])
        ];
    }
  };

  const activeColor = 'bg-primary/10 text-primary';

  const navigationItems = getNavigationItems();

  const renderNavItem = (item) => {
    const IconComponent = item.icon;
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => {
          if (activeTab !== item.id) {
            setActiveTab(item.id);
          }
          setSidebarOpen(false);
        }}
        className={`group relative w-full flex items-center ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'} px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${item.isExternal
          ? isActive
            ? 'bg-slate-50 text-slate-700 border border-slate-200'
            : 'text-text-muted-light hover:bg-slate-50 hover:text-text-main-light'
          : isActive
            ? `${activeColor}`
            : 'text-text-muted-light hover:bg-slate-50 hover:text-text-main-light'
          }`}
      >
        <IconComponent className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ease-in-out ${isActive ? 'text-current' : 'text-text-muted-light'
          }`} />
        <span className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 scale-95 w-0 overflow-hidden' : 'opacity-100 scale-100 w-auto'
          }`}>
          {item.name}
        </span>
        {item.isExternal && (
          <div className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 scale-95 w-0 overflow-hidden' : 'opacity-100 scale-100 w-auto'
            }`}>
            <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
          </div>
        )}
        {/* Tooltip for collapsed state */}
        {isCollapsed && (
          <div className={`absolute px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 ${isRTL ? 'right-full mr-2' : 'left-full ml-2'
            }`}>
            {item.name}
            <div className={`absolute top-1/2 transform -translate-y-1/2 w-0 h-0 ${isRTL
              ? 'right-0 border-r-4 border-l-0 border-t-4 border-b-4 border-transparent border-r-slate-900'
              : 'left-0 border-l-4 border-r-0 border-t-4 border-b-4 border-transparent border-l-slate-900'
              }`}></div>
          </div>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden transition-opacity duration-300 ease-in-out"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-surface-light border-r border-border-light transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-20' : 'w-64'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex flex-col h-full">


          {/* User Info */}
          <div className="p-4 border-b border-border-light transition-all duration-300 ease-in-out">
            <div className="flex items-center justify-between">
              <div className={`flex items-center min-w-0 ${isRTL ? 'space-x-reverse space-x-3 flex-row-reverse' : 'space-x-3'}`}>
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-slate-500" />
                </div>
                <div className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                  } ${isCollapsed ? 'w-0 overflow-hidden' : 'w-auto'}`}>
                  <p className="text-sm font-semibold text-text-main-light truncate">{user?.name || t.user}</p>
                  <p className="text-xs text-text-muted-light capitalize">{user?.role || t.user}</p>
                </div>
              </div>
              {/* Desktop collapse toggle */}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`hidden lg:flex p-1.5 rounded-md text-text-muted-light hover:text-text-main-light hover:bg-slate-50 transition-all duration-200 ease-in-out transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
                  }`}
                title={isCollapsed ? t.expandSidebar : t.collapseSidebar}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
              {/* Mobile close button */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1.5 rounded-md text-text-muted-light hover:text-text-main-light hover:bg-slate-50 transition-all duration-200 ease-in-out transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto transition-all duration-300 ease-in-out">
            {navigationItems.map((item, index) => {
              // Check if it's a group
              if (item.group) {
                return (
                  <div key={index} className="mb-6">
                    {!isCollapsed && (
                      <h3 className={`px-3 text-xs font-bold text-primary uppercase tracking-wider mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {item.group}
                      </h3>
                    )}
                    <div className="space-y-1">
                      {item.items.map(subItem => renderNavItem(subItem))}
                    </div>
                  </div>
                )
              }
              // Fallback for flat items (if any remain)
              return renderNavItem(item);
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border-light transition-all duration-300 ease-in-out">
            <div className={`flex items-center text-sm text-text-muted-light min-w-0 ${isRTL ? 'space-x-reverse space-x-3 flex-row-reverse' : 'space-x-3'}`}>
              <Bell className="w-4 h-4 flex-shrink-0" />
              <span className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 scale-95 w-0 overflow-hidden' : 'opacity-100 scale-100 w-auto'
                }`}>
                {t.notifications}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating expand button when collapsed */}
      {isCollapsed && (
        <div className={`fixed top-1/2 transform -translate-y-1/2 z-40 lg:block hidden ${isRTL ? 'right-20' : 'left-20'
          }`}>
          <button
            onClick={() => setIsCollapsed(false)}
            className={`p-3 bg-primary hover:bg-primary-hover border-2 border-primary shadow-xl hover:shadow-2xl transition-all duration-200 ease-in-out transform hover:scale-110 text-white ${isRTL ? 'rounded-l-lg' : 'rounded-r-lg'
              }`}
            title={t.expandSidebar}
          >
            {isRTL ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      )}
    </>
  );
};

export default UnifiedSidebar;
