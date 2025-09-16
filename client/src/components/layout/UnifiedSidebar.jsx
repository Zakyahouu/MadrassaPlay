import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  DollarSign
} from 'lucide-react';

const UnifiedSidebar = ({ 
  activeTab, 
  setActiveTab, 
  sidebarOpen, 
  setSidebarOpen,
  user,
  role = 'admin'
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const getNavigationItems = () => {
    switch (role) {
      case 'admin':
        return [
          { id: 'overview', name: 'Overview', icon: BarChart3 },
          { id: 'schools', name: 'Schools', icon: School },
          { id: 'games', name: 'Games', icon: Play },
          { id: 'template-games', name: 'Games by Template', icon: Gamepad2 },
          { id: 'templates', name: 'Game Templates', icon: Plus },
          { id: 'template-guide', name: 'Template Guide', icon: BookOpen },
          { id: 'badges', name: 'Badges', icon: Award },
          { id: 'analytics', name: 'Analytics', icon: TrendingUp }
        ];
      case 'manager':
        return [
          { id: 'overview', name: 'Overview', icon: BarChart3 },
          { id: 'classes', name: 'Classes', icon: BookOpen },
          { id: 'attendance', name: 'Attendance', icon: Calendar },
          { id: 'timetable', name: 'Timetable', icon: Calendar },
          { id: 'students', name: 'Students', icon: Users },
          { id: 'teachers', name: 'Teachers', icon: UserCheck },
          { id: 'employees', name: 'Employees', icon: Building2 },
          { id: 'rooms', name: 'Rooms', icon: Building2 },
          { id: 'equipment', name: 'Equipment', icon: Package },
          { id: 'catalog', name: 'Catalog', icon: Package },
          { id: 'ads', name: 'Advertisements', icon: Megaphone },
          { id: 'finance', name: 'Finance', icon: DollarSign }
        ];
      case 'teacher':
        return [
          { id: 'overview', name: 'Overview', icon: BarChart3 },
          { id: 'my-games', name: 'My Games', icon: BookOpen },
          { id: 'create-game', name: 'Create Game', icon: Plus },
          { id: 'live-sessions', name: 'Live Sessions', icon: Play },
          { id: 'assignments', name: 'Assignments', icon: FileText },
          { id: 'resources', name: 'Resources', icon: FileText },
          { id: 'timetable', name: 'Timetable', icon: Calendar },
          { id: 'students', name: 'My Classes', icon: Users },
          { id: 'calendar', name: 'Calendar', icon: Calendar }
        ];
      default:
        return [
          { id: 'overview', name: 'Overview', icon: BarChart3 }
        ];
    }
  };

  const getActiveColor = () => {
    switch (role) {
      case 'admin':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'manager':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'teacher':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const navigationItems = getNavigationItems();

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
      <div className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="flex flex-col h-full">


          {/* User Info */}
          <div className="p-4 border-b border-gray-200 transition-all duration-300 ease-in-out">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${
                  isCollapsed ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                } ${isCollapsed ? 'w-0 overflow-hidden' : 'w-auto'}`}>
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role || 'User'}</p>
                </div>
              </div>
              {/* Desktop collapse toggle */}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`hidden lg:flex p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 ease-in-out transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 ${
                  isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
                className="lg:hidden p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 ease-in-out transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto transition-all duration-300 ease-in-out">
            {navigationItems.map((item) => {
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
                  className={`group relative w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 ${
                    isActive
                      ? `${getActiveColor()} border shadow-sm`
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                  }`}
                >
                  <IconComponent className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ease-in-out ${
                    isActive ? 'text-current scale-110' : 'text-gray-400'
                  }`} />
                  <span className={`transition-all duration-300 ease-in-out ${
                    isCollapsed ? 'opacity-0 scale-95 w-0 overflow-hidden' : 'opacity-100 scale-100 w-auto'
                  }`}>
                    {item.name}
                  </span>
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                      {item.name}
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-r-0 border-t-4 border-b-4 border-transparent border-l-gray-900"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 transition-all duration-300 ease-in-out">
            <div className="flex items-center space-x-3 text-sm text-gray-500 min-w-0">
              <Bell className="w-4 h-4 flex-shrink-0" />
              <span className={`transition-all duration-300 ease-in-out ${
                isCollapsed ? 'opacity-0 scale-95 w-0 overflow-hidden' : 'opacity-100 scale-100 w-auto'
              }`}>
                Notifications
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating expand button when collapsed */}
      {isCollapsed && (
        <div className="fixed left-20 top-1/2 transform -translate-y-1/2 z-40 lg:block hidden">
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-3 bg-blue-600 hover:bg-blue-700 border-2 border-blue-500 rounded-r-lg shadow-xl hover:shadow-2xl transition-all duration-200 ease-in-out transform hover:scale-110 text-white"
            title="Expand sidebar"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </>
  );
};

export default UnifiedSidebar;
