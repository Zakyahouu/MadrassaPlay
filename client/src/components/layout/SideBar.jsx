import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  School, 
  TrendingUp,
  X,
  Plus,
  Settings
} from 'lucide-react';

const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  sidebarOpen, 
  setSidebarOpen,
  user 
}) => {
  const navigationItems = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'schools', name: 'Schools', icon: School },
  { id: 'games', name: 'Games', icon: Plus },
    { id: 'templates', name: 'Game Templates', icon: Plus },
  { id: 'badges', name: 'Badges', icon: Plus },
  { id: 'analytics', name: 'Analytics', icon: TrendingUp }
  ];

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 shadow-sm transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-all duration-300 ease-out lg:translate-x-0 lg:static lg:inset-0`}>
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center overflow-hidden">
            <img src="/Logo.jpg" alt="Skill Snap Logo" className="w-full h-full object-cover rounded-lg" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            Skill Snap
          </h1>
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
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <IconComponent className={`mr-3 w-5 h-5 ${
                  activeTab === item.id ? 'text-indigo-500' : 'text-gray-400'
                }`} />
                <span>{item.name}</span>
                {activeTab === item.id && (
                  <div className="ml-auto w-2 h-2 bg-indigo-500 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div className="absolute bottom-6 left-4 right-4">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">{user?.name?.charAt(0) || 'A'}</span>
            </div>
            <div className="flex-1">
              <p className="text-gray-900 text-sm font-medium">{user?.name}</p>
              <p className="text-gray-500 text-xs capitalize">{user?.role}</p>
            </div>
            <Link 
              to="/profile" 
              className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
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

export default Sidebar;