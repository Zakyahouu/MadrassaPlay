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
      color: 'from-purple-500 to-pink-500'
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
      color: 'from-blue-500 to-cyan-500'
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
      color: 'from-green-500 to-emerald-500'
    }
  ];

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => (
        <div key={assignment.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${assignment.color} rounded-xl flex items-center justify-center shadow-lg`}>
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{assignment.title}</h3>
                <p className="text-sm text-gray-500 mb-2">{assignment.subject} • {assignment.teacher}</p>
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {assignment.estimatedTime}
                  </span>
                  <span className={`px-2 py-1 rounded-full ${
                    assignment.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                    assignment.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
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
              <div className={`text-xs font-medium ${
                assignment.status === 'completed' ? 'text-green-600' :
                assignment.dueDate === 'Tomorrow' ? 'text-red-600' :
                'text-gray-600'
              }`}>
                {assignment.dueDate}
              </div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500">Progress</span>
              <span className="text-xs text-gray-700 font-medium">{assignment.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`bg-gradient-to-r ${assignment.color} h-2 rounded-full transition-all duration-300`}
                style={{ width: `${assignment.progress}%` }}
              ></div>
            </div>
          </div>
          
          {/* Action button */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {assignment.status === 'completed' && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
              <span className="text-sm font-medium text-gray-700">
                {assignment.status === 'completed' ? 'Completed!' :
                 assignment.status === 'in-progress' ? 'Continue Playing' :
                 'Start Game'}
              </span>
            </div>
            
            <button className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              assignment.status === 'completed' 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}>
              {assignment.status === 'completed' ? 'Review' : 
               assignment.status === 'in-progress' ? 'Continue' : 'Start'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Quick Actions Component
const QuickActions = () => {
  const actions = [
    { icon: Gamepad2, label: 'Practice Mode', color: 'from-purple-500 to-pink-500', description: 'Play games to improve skills' },
    { icon: Users, label: 'Study Groups', color: 'from-blue-500 to-cyan-500', description: 'Join classmates for group study' },
    { icon: Target, label: 'Daily Challenge', color: 'from-orange-500 to-red-500', description: 'Complete today\'s challenge' },
    { icon: BookOpen, label: 'Learning Path', color: 'from-green-500 to-emerald-500', description: 'Follow your personalized path' }
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {actions.map((action, index) => (
        <button 
          key={index}
          className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group text-left"
        >
          <div className={`w-10 h-10 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
            <action.icon className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">{action.label}</h3>
          <p className="text-xs text-gray-500">{action.description}</p>
        </button>
      ))}
    </div>
  );
};

// Achievements Component
const Achievements = () => {
  const badges = [
    { name: 'First Victory', icon: Trophy, earned: true, color: 'text-yellow-500' },
    { name: 'Speed Runner', icon: Zap, earned: true, color: 'text-blue-500' },
    { name: 'Scholar', icon: Award, earned: true, color: 'text-purple-500' },
    { name: 'Team Player', icon: Users, earned: false, color: 'text-gray-300' },
    { name: 'Perfect Score', icon: Target, earned: false, color: 'text-gray-300' },
    { name: 'Streak Master', icon: Flame, earned: false, color: 'text-gray-300' }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {badges.map((badge, index) => (
          <div key={index} className={`text-center p-3 rounded-xl transition-all duration-200 ${
            badge.earned ? 'bg-gradient-to-br from-yellow-50 to-orange-50 hover:scale-105' : 'bg-gray-50'
          }`}>
            <badge.icon className={`w-8 h-8 mx-auto mb-2 ${badge.color}`} />
            <p className={`text-xs font-medium ${badge.earned ? 'text-gray-900' : 'text-gray-400'}`}>
              {badge.name}
            </p>
            {!badge.earned && <Lock className="w-3 h-3 mx-auto mt-1 text-gray-300" />}
          </div>
        ))}
      </div>
    </div>
  );
};

// Leaderboard Component
const Leaderboard = () => {
  const [timeframe, setTimeframe] = useState('week');
  const leaderboard = [
    { rank: 1, name: 'Sarah M.', points: 1250, avatar: '👩', isMe: false },
    { rank: 2, name: 'Mike L.', points: 1180, avatar: '👨', isMe: false },
    { rank: 3, name: 'You', points: 1120, avatar: '🎯', isMe: true },
    { rank: 4, name: 'Emma K.', points: 1050, avatar: '👧', isMe: false },
    { rank: 5, name: 'Jake R.', points: 980, avatar: '👦', isMe: false }
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        {['week', 'month', 'all'].map((period) => (
          <button
            key={period}
            onClick={() => setTimeframe(period)}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              timeframe === period 
                ? 'bg-gray-900 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </button>
        ))}
      </div>
      
      <div className="space-y-2">
        {leaderboard.map((player) => (
          <div key={player.rank} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
            player.isMe ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200' : 'bg-gray-50 hover:bg-gray-100'
          }`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
              player.rank === 1 ? 'bg-yellow-400 text-white' :
              player.rank === 2 ? 'bg-gray-400 text-white' :
              player.rank === 3 ? 'bg-orange-400 text-white' :
              'bg-gray-200 text-gray-600'
            }`}>
              {player.rank <= 3 ? 
                (player.rank === 1 ? <Crown className="w-4 h-4" /> : 
                 player.rank === 2 ? <Medal className="w-4 h-4" /> : 
                 <Award className="w-4 h-4" />) 
                : player.rank}
            </div>
            
            <span className="text-2xl">{player.avatar}</span>
            
            <div className="flex-1">
              <p className={`font-medium ${player.isMe ? 'text-gray-900' : 'text-gray-700'}`}>
                {player.name}
              </p>
            </div>
            
            <div className="text-right">
              <p className="font-bold text-gray-900">{player.points}</p>
              <p className="text-xs text-gray-500">points</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StudentDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [roomCode, setRoomCode] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 border-b border-gray-200/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Student Launchpad
              </h1>
              <p className="text-sm text-gray-500">Ready for your next adventure?</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm rounded-2xl px-4 py-2 border border-gray-200/50">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-bold text-gray-900">{user?.streak}</span>
                <span className="text-xs text-gray-500">day streak</span>
              </div>
              
              <div className="w-px h-4 bg-gray-300"></div>
              
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-900">Level {user?.level}</span>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Welcome back!</p>
              <p className="text-xs text-gray-500">{user?.name}</p>
            </div>
            
            <button 
              onClick={logout}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors group"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" />
            </button>
          </div>
        </div>
      </header>

      <main className="px-6 py-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Join Live Game - Enhanced */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-200/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Join Live Game</h3>
                  <p className="text-gray-600">Enter a room code to join a live multiplayer game</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <input 
                  type="text" 
                  placeholder="Enter Room Code (e.g. ABC123)" 
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  className="flex-1 p-4 border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:outline-none transition-colors text-lg font-mono tracking-wider text-center"
                />
                <button className="px-8 py-4 font-bold text-white bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5">
                  Join Game
                </button>
              </div>
            </div>

            {/* My Assignments */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-200/50">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-indigo-600" />
                My Assignments
              </h3>
              <MyAssignments />
            </div>

            {/* Quick Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-200/50">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Zap className="w-8 h-8 text-purple-600" />
                Quick Actions
              </h3>
              <QuickActions />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Progress Card - Enhanced */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-gray-200/50">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
                My Progress
              </h3>
              
              <div className="space-y-6">
                {/* Level Progress */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold text-gray-700">Level {user?.level}</span>
                    <span className="text-sm text-gray-500">{user?.xp}% to next level</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-1000 shadow-lg"
                      style={{ width: `${user?.xp}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
                    <Star className="w-6 h-6 mx-auto mb-1 text-yellow-500" />
                    <p className="text-lg font-bold text-gray-900">{user?.totalPoints}</p>
                    <p className="text-xs text-gray-500">Total Points</p>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl">
                    <Trophy className="w-6 h-6 mx-auto mb-1 text-blue-500" />
                    <p className="text-lg font-bold text-gray-900">{user?.rank}</p>
                    <p className="text-xs text-gray-500">Current Rank</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-gray-200/50">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-6 h-6 text-yellow-600" />
                Achievements
              </h3>
              <Achievements />
            </div>

            {/* Class Leaderboard */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-gray-200/50">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-orange-600" />
                Class Leaderboard
              </h3>
              <Leaderboard />
            </div>
          </div>
        </div>

        {/* Footer decoration */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 text-gray-400 text-sm">
            <div className="w-8 h-px bg-gradient-to-r from-transparent to-gray-300"></div>
            <Gamepad2 className="w-4 h-4" />
            <span>Keep learning, keep growing!</span>
            <Gamepad2 className="w-4 h-4" />
            <div className="w-8 h-px bg-gradient-to-l from-transparent to-gray-300"></div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;