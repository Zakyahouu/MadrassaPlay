import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  School, 
  TrendingUp,
  X,
  Plus,
  Settings,
  BookOpen,
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
  Package
} from 'lucide-react';

const UnifiedSidebar = ({ 
  activeTab, 
  setActiveTab, 
  sidebarOpen, 
  setSidebarOpen,
  user,
  role = 'admin'
}) => {
  const getNavigationItems = () => {
    switch (role) {
      case 'admin':
        return [
          { id: 'overview', name: 'Overview', icon: BarChart3 },
          { id: 'schools', name: 'Schools', icon: School },
          { id: 'templates', name: 'Game Templates', icon: Plus },
          { id: 'badges', name: 'Badges', icon: Award },
          { id: 'analytics', name: 'Analytics', icon: TrendingUp }
        ];
      case 'manager':
        return [
          { id: 'overview', name: 'Overview', icon: BarChart3 },
          { id: 'classes', name: 'Classes', icon: BookOpen },
          { id: 'students', name: 'Students', icon: Users },
          { id: 'teachers', name: 'Teachers', icon: UserCheck },
          { id: 'staffes', name: 'Staff', icon: Building2 },
          { id: 'rooms', name: 'Rooms', icon: Building2 },
          { id: 'equipment', name: 'Equipment', icon: Package },
          { id: 'catalog', name: 'Catalog', icon: Package },
          { id: 'reports', name: 'Reports', icon: TrendingUp }
        ];
      case 'teacher':
        return [
          { id: 'overview', name: 'Overview', icon: BarChart3 },
          { id: 'my-games', name: 'My Games', icon: BookOpen },
          { id: 'create-game', name: 'Create Game', icon: Plus },
          { id: 'live-sessions', name: 'Live Sessions', icon: Play },
          { id: 'assignments', name: 'Assignments', icon: FileText },
          { id: 'reports', name: 'Reports', icon: TrendingUp },
          { id: 'students', name: 'My Students', icon: Users },
          { id: 'calendar', name: 'Calendar', icon: Calendar }
        ];
      default:
        return [
          { id: 'overview', name: 'Overview', icon: BarChart3 }
        ];
    }
  };

  const getRoleTitle = () => {
    switch (role) {
      case 'admin':
        return 'MadrassaPlay Admin';
      case 'manager':
        return 'School Management';
      case 'teacher':
        return 'Teacher Hub';
      default:
        return 'MadrassaPlay';
    }
  };

  const getRoleColor = () => {
    switch (role) {
      case 'admin':
        return 'bg-blue-600';
      case 'manager':
        return 'bg-indigo-600';
      case 'teacher':
        return 'bg-purple-600';
      default:
        return 'bg-gray-600';
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
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`flex items-center justify-between p-6 ${getRoleColor()}`}>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <School className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-white">{getRoleTitle()}</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role || 'User'}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? `${getActiveColor()} border`
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <IconComponent className={`w-5 h-5 ${
                    isActive ? 'text-current' : 'text-gray-400'
                  }`} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 text-sm text-gray-500">
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UnifiedSidebar;
