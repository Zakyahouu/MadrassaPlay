import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  BookOpen, 
  TrendingUp,
  X,
  Plus,
  Settings,
  Trophy,
  Users,
  Calendar,
  FileText,
  Play,
  Award,
  Target,
  Sparkles
} from 'lucide-react';

const TeacherSideBar = ({ 
  activeTab, 
  setActiveTab, 
  sidebarOpen, 
  setSidebarOpen,
  user 
}) => {
  const navigationItems = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'my-games', name: 'My Games', icon: BookOpen },
    { id: 'create-game', name: 'Create Game', icon: Plus },
    { id: 'live-sessions', name: 'Live Sessions', icon: Play },
    { id: 'results', name: 'Results & Analytics', icon: Trophy },
    { id: 'assignments', name: 'Assignments', icon: FileText },
    { id: 'students', name: 'My Students', icon: Users },
    { id: 'calendar', name: 'Calendar', icon: Calendar },
    { id: 'performance', name: 'Performance', icon: TrendingUp },
    { id: 'achievements', name: 'Achievements', icon: Award }
  ];

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 shadow-sm transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-all duration-300 ease-out lg:translate-x-0 lg:static lg:inset-0`}>
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <nav className="mt-6 px-4">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`group w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border border-purple-200'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <IconComponent className={`mr-3 w-5 h-5 ${
                  activeTab === item.id ? 'text-purple-500' : 'text-gray-400'
                }`} />
                <span>{item.name}</span>
                {activeTab === item.id && (
                  <div className="ml-auto w-2 h-2 bg-purple-500 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Quick Stats */}
      <div className="mt-8 px-4">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
          <h3 className="text-sm font-semibold text-purple-900 mb-3">Quick Stats</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-purple-700">Active Games</span>
              <span className="font-semibold text-purple-900">12</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-purple-700">Total Students</span>
              <span className="font-semibold text-purple-900">156</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-purple-700">Avg. Score</span>
              <span className="font-semibold text-purple-900">87%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="absolute bottom-6 left-4 right-4">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">{user?.name?.charAt(0) || 'T'}</span>
            </div>
            <div className="flex-1">
              <p className="text-gray-900 text-sm font-medium">{user?.name}</p>
              <p className="text-gray-500 text-xs capitalize">{user?.subject || 'Teacher'}</p>
            </div>
            <Link 
              to="/profile" 
              className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="Profile"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherSideBar;
