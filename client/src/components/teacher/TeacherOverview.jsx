import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  Trophy,
  BookOpen,
  Calendar,
  Star,
  Target,
  Activity,
  Clock
} from 'lucide-react';
import UnifiedCard from '../shared/UnifiedCard';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';

const TeacherOverview = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
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
          axios.get('/api/live-sessions', { params: { status: 'past', limit: 50 }, headers }),
          axios.get('/api/live-sessions', { params: { status: 'active', limit: 50 }, headers }),
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
        const averageScore = avgScores.length ? Math.round((avgScores.reduce((a, b) => a + b, 0) / avgScores.length) * 10) / 10 : 0;

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
    totalGames: metrics.totalGames || 0,
    activeStudents: metrics.activeStudents || 0,
    averageScore: metrics.averageScore || 0,
    liveSessions: metrics.liveSessions || 0,
  }), [metrics]);

  // Real actions with navigation
  const quickActions = [
    { name: t.createGame || 'Create New Game', icon: BookOpen, color: 'text-blue-600', path: '/teacher/dashboard?tab=create-game' },
    { name: t.hostLive || 'Host Live Session', icon: Users, color: 'text-green-600', path: '/teacher/dashboard?tab=my-games' },
    { name: t.viewResults || 'View Results', icon: Trophy, color: 'text-yellow-600', path: '/teacher/dashboard?tab=my-games' }, // Usually results are linked from games
    { name: t.assignments || 'Assignments', icon: Calendar, color: 'text-purple-600', path: '/teacher/dashboard?tab=assignments' }
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {/* Welcome Section */}
      <UnifiedCard className="bg-white border-none shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* <img src="/Logo.jpg" alt="Logo" className="w-12 h-12 object-contain rounded-lg" /> */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{t.welcomeBack}</h1>
              <p className="text-gray-500">{t.readyToContinue}</p>
            </div>
          </div>
          {/* Decorative element or date */}
          <div className="hidden md:block text-right">
            <div className="text-sm font-medium text-gray-400">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      </UnifiedCard>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <UnifiedCard className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t.totalGames}</p>
              <h3 className="text-2xl font-bold text-gray-900">{loading ? '-' : display.totalGames}</h3>
            </div>
          </div>
        </UnifiedCard>

        <UnifiedCard className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t.activeStudents}</p>
              <h3 className="text-2xl font-bold text-gray-900">{loading ? '-' : display.activeStudents}</h3>
            </div>
          </div>
        </UnifiedCard>

        <UnifiedCard className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t.averageScore}</p>
              <h3 className="text-2xl font-bold text-gray-900">{loading ? '-' : `${display.averageScore}%`}</h3>
            </div>
          </div>
        </UnifiedCard>

        <UnifiedCard className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t.liveSessions}</p>
              <h3 className="text-2xl font-bold text-gray-900">{loading ? '-' : display.liveSessions}</h3>
            </div>
          </div>
        </UnifiedCard>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.quickActions}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => navigate(action.path)}
              className="flex items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${action.color.replace('text-', 'bg-').replace('600', '50')} `}>
                <action.icon className={`w-5 h-5 ${action.color}`} />
              </div>
              <span className="font-medium text-gray-700">{action.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Placeholder for Recent Activity - hidden if no data to avoid fake data */}
      {/* 
      <UnifiedCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.recentActivity}</h3>
        <div className="text-center py-8 text-gray-500">
           <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
           <p>{t.noActivityYet || 'No recent activity to show.'}</p>
        </div>
      </UnifiedCard>
      */}
    </div>
  );
};

export default TeacherOverview;
