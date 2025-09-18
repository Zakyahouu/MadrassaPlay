import React, { useEffect, useMemo, useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Trophy, 
  BookOpen, 
  Calendar,
  Star,
  Target,
  Activity
} from 'lucide-react';
import UnifiedCard from '../shared/UnifiedCard';
import axios from 'axios';

const TeacherOverview = ({ stats }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState({ totalGames: 0, activeStudents: 0, averageScore: 0, liveSessions: 0 });

  const authHeaders = () => {
    try { const token = JSON.parse(localStorage.getItem('user'))?.token; return token ? { Authorization: `Bearer ${token}` } : {}; } catch { return {}; }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true); setError(null);
        const headers = authHeaders();
        // Fetch creations and classes in parallel
        const [creRes, clsRes, pastRes, actRes, uniqRes] = await Promise.all([
          axios.get('/api/creations', { headers }),
          axios.get('/api/classes/teacher', { headers }),
          axios.get('/api/live-sessions', { params: { status: 'past' }, headers }),
          axios.get('/api/live-sessions', { params: { status: 'active' }, headers }),
          axios.get('/api/classes/teacher/students/count', { headers }),
        ]);
        if (!mounted) return;
        const creations = Array.isArray(creRes.data) ? creRes.data : (creRes.data?.creations || []);
        const classes = Array.isArray(clsRes.data) ? clsRes.data : (clsRes.data?.classes || []);
        const past = Array.isArray(pastRes.data) ? pastRes.data : (pastRes.data?.sessions || []);
        const active = Array.isArray(actRes.data) ? actRes.data : (actRes.data?.sessions || []);

  // Active students: use new aggregated endpoint
  const uniqueStudents = Number(uniqRes.data?.uniqueStudents || 0);

        // Average score from past live sessions (if controller provides averageScore)
        const avgScores = past.map(s => (typeof s.averageScore === 'number' ? s.averageScore : null)).filter(v => v !== null);
        const averageScore = avgScores.length ? Math.round((avgScores.reduce((a,b)=>a+b,0) / avgScores.length) * 10) / 10 : 0;

        setMetrics({
          totalGames: creations.length,
          activeStudents: uniqueStudents,
          averageScore,
          liveSessions: active.length + past.length,
        });
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || 'Failed to load teacher stats');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const display = useMemo(() => ({
    totalGames: metrics.totalGames || stats?.totalGames || 0,
    activeStudents: metrics.activeStudents || stats?.totalStudents || 0,
    averageScore: metrics.averageScore || stats?.averageScore || 0,
    liveSessions: metrics.liveSessions || stats?.liveSessions || 0,
  }), [metrics, stats]);
  const recentActivity = [
    {
      id: 1,
      type: 'game_created',
      title: 'Math Quiz: Fractions',
      description: 'Created a new game template',
      time: '2 hours ago',
      icon: BookOpen,
      color: 'text-blue-600'
    },
    {
      id: 2,
      type: 'session_hosted',
      title: 'Science Lab Session',
      description: 'Hosted live session with 24 students',
      time: '4 hours ago',
      icon: Users,
      color: 'text-green-600'
    },
    {
      id: 3,
      type: 'result_achieved',
      title: 'History Challenge',
      description: 'Class average: 92% - Excellent!',
      time: '1 day ago',
      icon: Trophy,
      color: 'text-yellow-600'
    }
  ];

  const quickActions = [
    { name: 'Create New Game', icon: BookOpen, color: 'text-blue-600' },
    { name: 'Host Live Session', icon: Users, color: 'text-green-600' },
    { name: 'View Results', icon: Trophy, color: 'text-yellow-600' },
    { name: 'Schedule Assignment', icon: Calendar, color: 'text-purple-600' }
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {/* Welcome Section */}
      <UnifiedCard className="bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/Logo.jpg" alt="Skill Snap Logo" className="w-12 h-12 object-contain rounded-lg" />
            <div>
              <h1 className="text-2xl font-bold text-blue-900 mb-2">Welcome back, Teacher!</h1>
              <p className="text-blue-700">Ready to create amazing learning experiences today?</p>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center border border-blue-200">
              <Star className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>
      </UnifiedCard>

  {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <UnifiedCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Games</p>
      <p className="text-2xl font-bold text-gray-900">{loading ? '—' : display.totalGames}</p>
            </div>
            <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+12%</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </UnifiedCard>

        <UnifiedCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Students</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '—' : display.activeStudents}</p>
            </div>
            <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+8%</span>
            <span className="text-gray-500 ml-1">from last week</span>
          </div>
        </UnifiedCard>

        <UnifiedCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '—' : `${display.averageScore}%`}</p>
            </div>
            <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+5%</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </UnifiedCard>

        <UnifiedCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Live Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '—' : display.liveSessions}</p>
            </div>
            <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+15%</span>
            <span className="text-gray-500 ml-1">from last week</span>
          </div>
        </UnifiedCard>
      </div>

      {/* Quick Actions */}
      <UnifiedCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-left group"
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 group-hover:bg-gray-100 transition-colors">
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <h4 className="font-medium text-gray-900">{action.name}</h4>
              </div>
            </button>
          ))}
        </div>
      </UnifiedCard>

      {/* Recent Activity */}
      <UnifiedCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <activity.icon className={`w-4 h-4 ${activity.color}`} />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{activity.title}</h4>
                <p className="text-sm text-gray-600">{activity.description}</p>
                <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </UnifiedCard>
    </div>
  );
};

export default TeacherOverview;
