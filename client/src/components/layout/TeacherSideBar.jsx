import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
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
  Award
} from 'lucide-react';

const TeacherSideBar = ({
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
  user,
  stats
}) => {
  const { t } = useLanguage();
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

  const quickStats = [
    { label: t.activeGames || 'Active Games', value: stats?.activeGames },
    { label: t.totalStudents || 'Total Students', value: stats?.totalStudents },
    { label: t.averageScore || 'Avg. Score', value: stats?.averageScore },
  ].filter((item) => item.value !== undefined && item.value !== null);

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-surface-light border-r border-border-light shadow-sm transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-all duration-300 ease-out lg:translate-x-0 lg:static lg:inset-0`}>
      <div className="flex items-center justify-between h-16 px-6 border-b border-border-light">
        <div className="flex items-center space-x-3">
          <div className="icon-badge">
            <span className="material-icons-outlined text-lg">school</span>
          </div>
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

      {quickStats.length > 0 && (
        <div className="mt-8 px-4">
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
            <h3 className="text-sm font-semibold text-text-main-light mb-3">Quick Stats</h3>
            <div className="space-y-2">
              {quickStats.map((stat) => (
                <div key={stat.label} className="flex justify-between text-xs">
                  <span className="text-text-muted-light">{stat.label}</span>
                  <span className="font-semibold text-text-main-light">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Footer */}
      <div className="absolute bottom-6 left-4 right-4">
        <div className="bg-slate-50 rounded-lg p-4 border border-border-light">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
              <span className="text-slate-600 font-medium text-sm">{user?.name?.charAt(0) || 'T'}</span>
            </div>
            <div className="flex-1">
              <p className="text-text-main-light text-sm font-semibold">{user?.name}</p>
              <p className="text-text-muted-light text-xs capitalize">{user?.subject || 'Teacher'}</p>
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

export default TeacherSideBar;
