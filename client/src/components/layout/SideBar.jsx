import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
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
  const { t } = useLanguage();
  const navigationItems = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'schools', name: 'Schools', icon: School },
    { id: 'games', name: 'Games', icon: Plus },
    { id: 'templates', name: 'Game Templates', icon: Plus },
    { id: 'badges', name: 'Badges', icon: Plus },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp }
  ];

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-surface-light border-r border-border-light shadow-sm transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-all duration-300 ease-out lg:translate-x-0 lg:static lg:inset-0`}>
      <div className="flex items-center justify-between h-16 px-6 border-b border-border-light">
        <div className="flex items-center space-x-3">
          <div className="icon-badge">
            <span className="material-icons-outlined text-lg">school</span>
          </div>
          <h1 className="text-xl font-bold text-text-main-light">
            Skill Snap
          </h1>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-2 rounded-lg text-text-muted-light hover:text-text-main-light hover:bg-slate-50 transition-colors"
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
                className={`group w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === item.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-muted-light hover:bg-slate-50 hover:text-text-main-light'
                  }`}
              >
                <IconComponent className={`mr-3 w-5 h-5 ${activeTab === item.id ? 'text-primary' : 'text-text-muted-light'
                  }`} />
                <span>{item.name}</span>
                {activeTab === item.id && (
                  <div className="ml-auto w-2 h-2 bg-primary rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div className="absolute bottom-6 left-4 right-4">
        <div className="bg-slate-50 rounded-lg p-4 border border-border-light">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
              <span className="text-slate-600 font-medium text-sm">{user?.name?.charAt(0) || 'A'}</span>
            </div>
            <div className="flex-1">
              <p className="text-text-main-light text-sm font-semibold">{user?.name}</p>
              <p className="text-text-muted-light text-xs capitalize">{user?.role}</p>
            </div>
            <Link
              to="/profile"
              className="p-1 text-text-muted-light hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title={t.profile}
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