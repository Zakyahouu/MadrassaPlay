import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { LogOut, Play, Users, Trophy, Star, Target, Zap, BookOpen, Award, TrendingUp, Flame, Crown, Medal, Gamepad2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import MyAssignments from '../components/student/MyAssignments'; // legacy (kept for now elsewhere if needed)
import StudentAssignmentsPanel from '../components/student/StudentAssignmentsPanel';
import { SocketContext } from '../context/SocketContext';
import StudentBadges from '../components/student/StudentBadges';
import { useNavigate } from 'react-router-dom';

// Removed mock MyAssignments; using the real component from ../components/student/MyAssignments

// QuickActions removed per new UX requirements.

// Achievements Component (Template Badge System)
const Achievements = () => {
  const [earned, setEarned] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get('/api/template-badges/me/list');
        if (mounted) setEarned(res.data || []);
      } catch (_) {
        if (mounted) setEarned([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="text-sm text-gray-500">Loading achievements…</div>;

  if (!earned.length) return <div className="text-sm text-gray-500">No template badges yet. Keep playing!</div>;

  const resolveIcon = (tb, label) => tb?.variants?.find(v => v.label === label)?.iconUrl;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {earned.map(eb => {
          const iconUrl = resolveIcon(eb.templateBadge, eb.variantLabel);
          const next = eb.progress?.nextVariant;
          const needed = eb.progress?.neededForNext;
          const pct = eb.progress?.percentage ?? null;
          return (
            <div key={eb._id} className="p-3 rounded-xl bg-white border hover:shadow-sm transition flex items-center gap-4">
              <div className="shrink-0">
                {iconUrl ? (
                  <img src={iconUrl} alt={eb.variantLabel} className="w-12 h-12 object-contain" />
                ) : (
                  <Trophy className="w-10 h-10 text-yellow-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{eb.templateBadge?.name || 'Badge'}</p>
                <p className="text-[10px] text-indigo-600 font-medium">{eb.variantLabel}</p>
                {pct !== null && (
                  <div className="mt-1">
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${Math.min(100, pct)}%` }}></div>
                    </div>
                    {next ? (
                      <p className="mt-1 text-[10px] text-gray-500">{needed} pts to {next.label}</p>
                    ) : (
                      <p className="mt-1 text-[10px] text-emerald-600 font-medium">Top tier achieved</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Leaderboard Component (API-backed) with class/global toggle
const Leaderboard = () => {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metric, setMetric] = useState('points');
  const [timeframe, setTimeframe] = useState('all'); // UI-only for now
  const [scope, setScope] = useState('auto'); // auto | class | school
  const [myClasses, setMyClasses] = useState([]);

  const [offset, setOffset] = useState(0);
  const pageSize = 5;
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        let params = { metric, limit: pageSize, offset };
        if (timeframe !== 'all') {
          const now = new Date();
          const since = new Date(now);
            if (timeframe === 'month') since.setDate(now.getDate() - 30);
            if (timeframe === 'week') since.setDate(now.getDate() - 7);
          params.since = since.toISOString();
        }
        const classesRes = await axios.get('/api/classes/my');
        const classes = classesRes.data || [];
        if (mounted) setMyClasses(classes);
        let endpoint;
        if (scope === 'school') endpoint = '/api/leaderboard/school';
        else if (scope === 'class' && classes.length) endpoint = `/api/leaderboard/class/${classes[0]._id}`;
        else {
          // auto: prefer class if exists
          endpoint = classes.length ? `/api/leaderboard/class/${classes[0]._id}` : '/api/leaderboard/school';
        }
        const res = await axios.get(endpoint, { params });
        if (mounted) setItems(res.data?.items || []);
      } catch (e) {
        if (mounted) setError('Failed to load leaderboard');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [metric, offset, timeframe, scope]);

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>;
  if (error) return <div className="text-sm text-red-500">{error}</div>;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end gap-2 mb-1 flex-wrap">
        <select value={metric} onChange={(e)=>setMetric(e.target.value)} className="text-xs border rounded px-2 py-1">
          <option value="points">Points</option>
          <option value="xp">XP</option>
        </select>
        {/* timeframe UI placeholder */}
        <select value={timeframe} onChange={(e)=>setTimeframe(e.target.value)} className="text-xs border rounded px-2 py-1">
          <option value="all">All-time</option>
          <option value="month">This month</option>
          <option value="week">This week</option>
        </select>
        <select value={scope} onChange={(e)=>{setScope(e.target.value); setOffset(0);}} className="text-xs border rounded px-2 py-1">
          <option value="auto">Auto ({myClasses.length ? 'Class' : 'School'})</option>
          <option value="class" disabled={!myClasses.length}>Class Only</option>
          <option value="school">School</option>
        </select>
      </div>
      {items.length === 0 && (
        <div className="text-sm text-gray-500">No leaderboard data yet.</div>
      )}
      {items.map((stu, idx) => {
        const rank = idx + 1;
        const isMe = stu._id === user?._id;
        return (
          <div key={stu._id} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
            isMe ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200' : 'bg-gray-50 hover:bg-gray-100'
          }`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
              rank === 1 ? 'bg-yellow-400 text-white' :
              rank === 2 ? 'bg-gray-400 text-white' :
              rank === 3 ? 'bg-orange-400 text-white' :
              'bg-gray-200 text-gray-600'
            }`}>
              {rank <= 3 ? (
                rank === 1 ? <Crown className="w-4 h-4" /> : rank === 2 ? <Medal className="w-4 h-4" /> : <Award className="w-4 h-4" />
              ) : rank}
            </div>
            <span className="text-2xl">🎯</span>
            <div className="flex-1">
              <p className={`font-medium ${isMe ? 'text-gray-900' : 'text-gray-700'}`}>{stu.name}</p>
              <p className="text-[10px] text-gray-500">Lvl {stu.level} • {stu.totalPoints} pts</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">{stu.totalPoints}</p>
              <p className="text-xs text-gray-500">points</p>
            </div>
          </div>
        );
      })}
      <div className="flex items-center justify-between mt-2">
        <button disabled={offset===0} onClick={()=>setOffset(Math.max(0, offset - pageSize))} className="text-xs px-2 py-1 border rounded disabled:opacity-50">Prev</button>
        <button onClick={()=>setOffset(offset + pageSize)} className="text-xs px-2 py-1 border rounded">Next</button>
      </div>
    </div>
  );
};

const StudentDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [gamification, setGamification] = useState(null);
  const [rankInfo, setRankInfo] = useState({ rank: null, total: null });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get('/api/users/me/gamification');
        if (mounted) setGamification(res.data);
      } catch (_) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Fetch my rank within my first class if any, otherwise within my school
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const classesRes = await axios.get('/api/classes/my');
        const classes = classesRes.data || [];
        if (classes.length > 0) {
          const classId = classes[0]._id;
          const r = await axios.get(`/api/leaderboard/class/${classId}/rank`, { params: { metric: 'points' } });
          if (mounted) setRankInfo({ rank: r.data?.rank ?? null, total: r.data?.total ?? null });
        } else {
          const r = await axios.get('/api/leaderboard/school/rank', { params: { metric: 'points' } });
          if (mounted) setRankInfo({ rank: r.data?.rank ?? null, total: r.data?.total ?? null });
        }
      } catch (_) {
        if (mounted) setRankInfo({ rank: null, total: null });
      }
    })();
    return () => { mounted = false; };
  }, []);

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
                <button
                  onClick={() => {
                    const code = roomCode.trim();
                    if (socket && code) {
                      socket.emit('join-game', { roomCode: code, playerName: user?.name || 'Student', userId: user?._id });
                      navigate(`/student/lobby/${code}`);
                    }
                  }}
                  className="px-8 py-4 font-bold text-white bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
                >
                  Join Game
                </button>
              </div>
            </div>

            {/* Assignments (Enhanced Panel) */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-200/50">
              <StudentAssignmentsPanel />
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
                    <span className="text-sm font-semibold text-gray-700">Level {gamification?.level ?? user?.level ?? 1}</span>
                    <span className="text-sm text-gray-500">{(gamification?.xp ?? user?.xp ?? 0) % 100}% to next level</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-1000 shadow-lg"
                      style={{ width: `${(gamification?.xp ?? user?.xp ?? 0) % 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
                    <Star className="w-6 h-6 mx-auto mb-1 text-yellow-500" />
                    <p className="text-lg font-bold text-gray-900">{gamification?.totalPoints ?? user?.totalPoints ?? 0}</p>
                    <p className="text-xs text-gray-500">Total Points</p>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl">
                    <Trophy className="w-6 h-6 mx-auto mb-1 text-blue-500" />
                    <p className="text-lg font-bold text-gray-900">
                      {rankInfo.rank ? `${rankInfo.rank}${rankInfo.total ? ` / ${rankInfo.total}` : ''}` : '—'}
                    </p>
                    <p className="text-xs text-gray-500">Current Rank {rankInfo.total ? '(cohort)' : ''}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Badges & Achievements Unified */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-gray-200/50">
              <StudentBadges />
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