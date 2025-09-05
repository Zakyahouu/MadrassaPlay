import React, { useContext, useState, useEffect } from 'react';
import { 
  LogOut, 
  Play, 
  Users, 
  Trophy, 
  Star, 
  Clock, 
  Target, 
  Zap, 
  BookOpen, 
  Award,
  TrendingUp,
  Calendar,
  Flame,
  Crown,
  Medal,
  Gamepad2,
  Timer,
  CheckCircle,
  Megaphone,
  Lock,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import UnifiedCard from '../components/shared/UnifiedCard';
import AdsBar from '../components/shared/AdsBar';
import MyAssignments from '../components/student/MyAssignments';

// Main Student Dashboard Component
const StudentDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adsPanelOpen, setAdsPanelOpen] = useState(false);

  // Debug logs to verify AdsBar wiring and user context
  useEffect(() => {
    console.log('[StudentDashboard] mounted');
  }, []);

  useEffect(() => {
    console.log('[StudentDashboard] user context', user);
    console.log('[StudentDashboard] schoolId for AdsBar', user?.school);
  }, [user]);

  useEffect(() => {
    console.log('[StudentDashboard] activeTab changed ->', activeTab);
  }, [activeTab]);

  const stats = [
    { title: 'Games Completed', value: '24', icon: Trophy, color: 'text-yellow-600', change: '+12%' },
    { title: 'Current Streak', value: '7 days', icon: Flame, color: 'text-orange-600', change: '+2 days' },
    { title: 'Total Points', value: '1,847', icon: Star, color: 'text-purple-600', change: '+156 pts' },
    { title: 'Time Spent', value: '12.5 hrs', icon: Clock, color: 'text-blue-600', change: '+2.3 hrs' }
  ];

  const achievements = [
    { name: 'First Victory', description: 'Complete your first game', icon: Crown, earned: true },
    { name: 'Streak Master', description: 'Maintain a 7-day streak', icon: Flame, earned: true },
    { name: 'Speed Demon', description: 'Complete 5 games in under 10 minutes', icon: Zap, earned: false },
    { name: 'Perfect Score', description: 'Get 100% on any game', icon: Medal, earned: false }
  ];

  const recentGames = [
    { name: 'Math Quiz: Fractions', score: '92%', time: '15 min', date: '2 hours ago' },
    { name: 'Science Lab: Chemistry', score: '88%', time: '20 min', date: '1 day ago' },
    { name: 'History Timeline', score: '95%', time: '12 min', date: '2 days ago' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Welcome Section */}
            <UnifiedCard className="bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-blue-900 mb-2">Welcome back, {user?.name}!</h1>
                  <p className="text-blue-700">Ready to continue your learning journey?</p>
                </div>
                <div className="hidden md:block">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center border border-blue-200">
                    <Trophy className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </div>
            </UnifiedCard>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <UnifiedCard key={index} padding="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-green-600">{stat.change}</p>
                    </div>
                    <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </UnifiedCard>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Games */}
              <UnifiedCard>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Games</h3>
                <div className="space-y-3">
                  {recentGames.map((game, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Gamepad2 className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{game.name}</p>
                          <p className="text-sm text-gray-500">{game.time} • {game.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{game.score}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </UnifiedCard>

              {/* Achievements */}
              <UnifiedCard>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievements</h3>
                <div className="space-y-3">
                  {achievements.map((achievement, index) => (
                    <div key={index} className={`flex items-center space-x-3 p-3 rounded-lg border ${
                      achievement.earned 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        achievement.earned ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <achievement.icon className={`w-4 h-4 ${
                          achievement.earned ? 'text-green-600' : 'text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${
                          achievement.earned ? 'text-green-900' : 'text-gray-500'
                        }`}>{achievement.name}</p>
                        <p className="text-sm text-gray-500">{achievement.description}</p>
                      </div>
                      {achievement.earned && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  ))}
                </div>
              </UnifiedCard>
            </div>
          </div>
        );
      case 'assignments':
        return <MyAssignments />;
      case 'games':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Games</h2>
            <p className="text-gray-600">Browse and play educational games</p>
          </div>
        );
      case 'progress':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Learning Progress</h2>
            <p className="text-gray-600">Track your academic progress and achievements</p>
          </div>
        );
      case 'leaderboard':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Leaderboard</h2>
            <p className="text-gray-600">Compare your performance with classmates</p>
          </div>
        );
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h2>
            <p className="text-gray-600">Welcome to your student dashboard</p>
          </div>
        );
    }
  };

  const navigationItems = [
    { id: 'overview', name: 'Overview' },
    { id: 'assignments', name: 'My Assignments' },
    { id: 'games', name: 'Games' },
    { id: 'progress', name: 'Progress' },
    { id: 'leaderboard', name: 'Leaderboard' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setAdsPanelOpen(true)}
                className="inline-flex items-center px-3 py-2 border border-indigo-300 text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
              >
                <Megaphone className="w-4 h-4 mr-2" />
                Announcements
              </button>
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <button
                onClick={logout}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Announcements Bar (overview only) */}
      {activeTab === 'overview' && (() => {
        const role = 'student';
        const schoolId = user?.school;
        console.log('[StudentDashboard] Rendering AdsBar with', { role, schoolId });
        return <AdsBar userRole={role} schoolId={schoolId} />;
      })()}

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === item.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {item.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </div>

      {/* Removed side panel */}
    </div>
  );
};

export default StudentDashboard;