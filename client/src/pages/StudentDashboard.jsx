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
  Lock
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import UnifiedCard from '../components/shared/UnifiedCard';

// Mock MyAssignments component with student-focused features
const MyAssignments = () => {
  const assignments = [
    { 
      id: 1, 
      title: 'Math Quest: Fractions Adventure', 
      subject: 'Mathematics',
      teacher: 'Ms. Rodriguez',
      dueDate: 'Tomorrow',
      difficulty: 'Medium',
      estimatedTime: '15 min',
      progress: 60,
      status: 'in-progress',
      points: 150,
      color: 'text-purple-600'
    },
    { 
      id: 2, 
      title: 'Science Lab: Chemical Reactions', 
      subject: 'Science',
      teacher: 'Mr. Johnson',
      dueDate: '3 days',
      difficulty: 'Hard',
      estimatedTime: '25 min',
      progress: 0,
      status: 'new',
      points: 200,
      color: 'text-blue-600'
    },
    { 
      id: 3, 
      title: 'History Timeline Challenge', 
      subject: 'History',
      teacher: 'Mrs. Davis',
      dueDate: 'Completed',
      difficulty: 'Easy',
      estimatedTime: '10 min',
      progress: 100,
      status: 'completed',
      points: 120,
      color: 'text-green-600'
    }
  ];

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => (
        <UnifiedCard key={assignment.id} className="group">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                <BookOpen className={`w-6 h-6 ${assignment.color}`} />
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{assignment.title}</h3>
                <p className="text-sm text-gray-500 mb-2">{assignment.subject} • {assignment.teacher}</p>
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {assignment.estimatedTime}
                  </span>
                  <span className={`px-2 py-1 rounded-full border ${
                    assignment.difficulty === 'Easy' ? 'bg-green-50 text-green-700 border-green-200' :
                    assignment.difficulty === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                    'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {assignment.difficulty}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    {assignment.points} pts
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900 mb-1">
                {assignment.dueDate}
              </div>
              <div className="text-xs text-gray-500">
                {assignment.status === 'completed' ? 'Completed' : 
                 assignment.status === 'in-progress' ? 'In Progress' : 'New'}
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{assignment.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  assignment.progress === 100 ? 'bg-green-500' :
                  assignment.progress > 50 ? 'bg-blue-500' : 'bg-yellow-500'
                }`}
                style={{ width: `${assignment.progress}%` }}
              ></div>
            </div>
          </div>
          
          {/* Action Button */}
          <div className="flex justify-end">
            {assignment.status === 'completed' ? (
              <div className="flex items-center text-green-600 text-sm">
                <CheckCircle className="w-4 h-4 mr-1" />
                Completed
              </div>
            ) : (
              <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors">
                <Play className="w-4 h-4 mr-2" />
                {assignment.status === 'in-progress' ? 'Continue' : 'Start'}
              </button>
            )}
          </div>
        </UnifiedCard>
      ))}
    </div>
  );
};

// Main Student Dashboard Component
const StudentDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    </div>
  );
};

export default StudentDashboard;