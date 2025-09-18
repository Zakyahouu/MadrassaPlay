import React, { useContext, useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
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
import { Copy as CopyIcon } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import UnifiedCard from '../components/shared/UnifiedCard';
import AdsBar from '../components/shared/AdsBar';
import StudentAssignmentsPanel from '../components/student/StudentAssignmentsPanel';
import StudentResources from '../components/student/StudentResources';
import StudentBadges from '../components/student/StudentBadges';
import { useToast } from '../components/shared/ToastProvider';

// Main Student Dashboard Component
const StudentDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adsPanelOpen, setAdsPanelOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ gamesCompleted: 0, currentStreakDays: 0, totalPoints: 0, timeSpentMinutes: 0 });
  const [recent, setRecent] = useState([]);
  const [liveRecent, setLiveRecent] = useState([]);
  const [liveAll, setLiveAll] = useState({ loading: false, error: null, items: [] });
  const [earnedBadges, setEarnedBadges] = useState([]);
  const recentBadges = useMemo(() => (earnedBadges || []).slice(0, 4), [earnedBadges]);
  // Games/Progress data
  const [assignDetails, setAssignDetails] = useState({ loading: false, error: null, items: [] });
  // Leaderboard data
  const [lbLoading, setLbLoading] = useState(false);
  const [lbError, setLbError] = useState(null);
  const [schoolLeaders, setSchoolLeaders] = useState([]);
  const [mySchoolRank, setMySchoolRank] = useState(null);
  const [classOptions, setClassOptions] = useState([]);
  const [lbClassId, setLbClassId] = useState('');
  const [classLeaders, setClassLeaders] = useState([]);
  const [myClassRank, setMyClassRank] = useState(null);
  // Join live state
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const { toast } = useToast();

  // Debug logs to verify AdsBar wiring and user context
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[StudentDashboard] mounted');
    }
  }, []);

  // Load more live results when Live Sessions tab is active
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (activeTab !== 'live') return;
      try {
        setLiveAll({ loading: true, error: null, items: [] });
        const res = await axios.get('/api/results/me/live?limit=25');
        if (!mounted) return;
        setLiveAll({ loading: false, error: null, items: Array.isArray(res.data) ? res.data : [] });
      } catch (e) {
        if (!mounted) return;
        setLiveAll({ loading: false, error: 'Failed to load', items: [] });
      }
    };
    load();
    return () => { mounted = false; };
  }, [activeTab]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[StudentDashboard] user context', user);
      console.log('[StudentDashboard] schoolId for AdsBar', user?.school);
    }
  }, [user]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[StudentDashboard] activeTab changed ->', activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [summaryRes, recentRes, liveRes, badgesRes, gamRes] = await Promise.all([
          axios.get('/api/results/me/summary'),
          axios.get('/api/results/me/recent?limit=5'),
          axios.get('/api/results/me/live?limit=5'),
          axios.get('/api/template-badges/me/list'),
          axios.get('/api/users/me/gamification')
        ]);
        if (!mounted) return;
        const s = summaryRes.data || {};
        // prefer totalPoints from gamification if available
        const gam = gamRes.data || {};
        s.totalPoints = typeof gam.totalPoints === 'number' ? gam.totalPoints : (s.totalPoints || 0);
        if (typeof gam.xp === 'number') s.xp = gam.xp;
        if (typeof gam.level === 'number') s.level = gam.level;
        setSummary({
          gamesCompleted: s.gamesCompleted || 0,
          currentStreakDays: s.currentStreakDays || 0,
          totalPoints: s.totalPoints || 0,
          timeSpentMinutes: s.timeSpentMinutes || 0,
          xp: s.xp || 0,
          level: s.level || 1,
        });
  setRecent(Array.isArray(recentRes.data) ? recentRes.data : []);
  setLiveRecent(Array.isArray(liveRes.data) ? liveRes.data : []);
        // earned badges list
        const earned = Array.isArray(badgesRes.data) ? badgesRes.data.filter(b => b.templateBadge).map(b => ({
          name: b.templateBadge.name,
          description: b.variantLabel || 'Badge earned',
          earned: true,
          iconUrl: b.iconUrl || b.templateBadge.iconUrl || null,
        })) : [];
        setEarnedBadges(earned);
      } catch (e) {
        if (mounted) {
          setSummary({ gamesCompleted: 0, currentStreakDays: 0, totalPoints: 0, timeSpentMinutes: 0 });
          setRecent([]);
          setEarnedBadges([]);
          setLiveRecent([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // Pick initial tab from navigation state (e.g., coming from PlayGame after live result)
  useEffect(() => {
    if (location.state && location.state.tab && typeof location.state.tab === 'string') {
      setActiveTab(location.state.tab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const hours = (summary.timeSpentMinutes || 0) / 60;
    return [
      { title: 'Games Completed', value: String(summary.gamesCompleted), icon: Trophy, color: 'text-yellow-600', change: '' },
      { title: 'Current Streak', value: `${summary.currentStreakDays} day${summary.currentStreakDays===1?'':'s'}`, icon: Flame, color: 'text-orange-600', change: '' },
      { title: 'Total Points', value: String(summary.totalPoints), icon: Star, color: 'text-purple-600', change: '' },
      { title: 'Time Spent', value: `${hours.toFixed(1)} hrs`, icon: Clock, color: 'text-blue-600', change: '' }
    ];
  }, [summary]);

  // Load assignments detail once for Games/Progress tabs
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (activeTab !== 'games' && activeTab !== 'progress') return;
        setAssignDetails(prev => ({ ...prev, loading: true, error: null }));
        const res = await axios.get('/api/assignments/my-assignments/detailed', { params: { page: 1, limit: 50 } });
        if (!mounted) return;
        setAssignDetails({ loading: false, error: null, items: res.data?.items || [] });
      } catch (e) {
        if (!mounted) return;
        setAssignDetails({ loading: false, error: 'Failed to load assignments', items: [] });
      }
    };
    load();
    return () => { mounted = false; };
  }, [activeTab]);

  // Load leaderboard data when tab is active
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (activeTab !== 'leaderboard') return;
        setLbLoading(true); setLbError(null);
        // school leaderboard & my rank
        const [schoolRes, myRankRes] = await Promise.all([
          axios.get('/api/leaderboard/school', { params: { metric: 'points' } }),
          axios.get('/api/leaderboard/school/rank', { params: { metric: 'points' } })
        ]);
        if (!mounted) return;
        const normalizeLeaders = (d) => Array.isArray(d) ? d : (Array.isArray(d?.items) ? d.items : (Array.isArray(d?.leaders) ? d.leaders : []));
        setSchoolLeaders(normalizeLeaders(schoolRes.data));
        setMySchoolRank(myRankRes.data || null);
        // classes for the student
        const cls = await axios.get('/api/classes/my');
        if (!mounted) return;
        const list = cls.data || [];
        setClassOptions(list);
        const initial = list[0]?._id || '';
        setLbClassId(prev => prev || initial);
      } catch (e) {
        if (!mounted) return;
        setLbError('Failed to load leaderboard');
      } finally {
        if (mounted) setLbLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [activeTab]);

  // Load class leaderboard when lbClassId changes and tab is active
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (activeTab !== 'leaderboard' || !lbClassId) return;
        const [classRes, myClassRankRes] = await Promise.all([
          axios.get(`/api/leaderboard/class/${lbClassId}`, { params: { metric: 'points' } }),
          axios.get(`/api/leaderboard/class/${lbClassId}/rank`, { params: { metric: 'points' } })
        ]);
        if (!mounted) return;
        const normalizeLeaders = (d) => Array.isArray(d) ? d : (Array.isArray(d?.items) ? d.items : (Array.isArray(d?.leaders) ? d.leaders : []));
        setClassLeaders(normalizeLeaders(classRes.data));
        setMyClassRank(myClassRankRes.data || null);
      } catch (e) {
        if (!mounted) return;
        // keep previous; surface inline error
      }
    };
    load();
    return () => { mounted = false; };
  }, [activeTab, lbClassId]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Join Live Game */}
            <UnifiedCard>
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Join Live Game</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Enter the 8‑character code your teacher gave you.</p>
                </div>
                <form
                  onSubmit={(e)=>{
                    e.preventDefault();
                    const code = (joinCode||'').trim().toUpperCase();
                    const valid = /^[A-Z0-9]{8}$/.test(code);
                    if (!valid) { setJoinError('Code must be 8 letters/numbers'); return; }
                    setJoinError('');
                    navigate(`/student/lobby/${code}`);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    value={joinCode}
                    onChange={(e)=>{ setJoinCode(e.target.value.toUpperCase()); if (joinError) setJoinError(''); }}
                    maxLength={8}
                    placeholder="ABCDEFGH"
                    className="px-3 py-2 border rounded-md text-sm tracking-widest uppercase w-40 sm:w-48"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                    disabled={(joinCode||'').trim().length!==8}
                  >Join</button>
                </form>
              </div>
              {joinError && <div className="text-xs text-red-600 mt-2">{joinError}</div>}
            </UnifiedCard>
            {/* Welcome Section */}
            <UnifiedCard className="bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img src="/Logo.jpg" alt="Skill Snap Logo" className="w-12 h-12 object-contain rounded-lg" />
                  <div>
                    <h1 className="text-2xl font-bold text-blue-900 mb-2">Bon retour, {user?.name} !</h1>
                    <p className="text-blue-700">Prêt à continuer votre parcours d'apprentissage ?</p>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center border border-blue-200">
                    <Trophy className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </div>
            </UnifiedCard>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {stats.map((stat, index) => (
                <UnifiedCard key={index} padding="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{stat.title}</p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-green-600">{stat.change}</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 flex-shrink-0">
                      <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
                    </div>
                  </div>
                </UnifiedCard>
              ))}
            </div>

            {/* XP & Level quick view + Recent Badges */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <UnifiedCard>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">My Progress</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
                    <div className="text-xs text-gray-600">XP</div>
                    <div className="text-xl font-extrabold text-indigo-900">{summary?.xp ?? 0}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                    <div className="text-xs text-gray-600">Level</div>
                    <div className="text-xl font-extrabold text-orange-900">{summary?.level ?? 1}</div>
                  </div>
                </div>
              </UnifiedCard>
              <UnifiedCard className="lg:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recently Earned Badges</h3>
                  <button onClick={()=>setActiveTab('badges')} className="text-xs text-indigo-600 hover:underline">View all</button>
                </div>
                {loading && <div className="text-sm text-gray-500">Loading…</div>}
                {!loading && recentBadges.length === 0 && <div className="text-sm text-gray-500">No badges yet.</div>}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {recentBadges.map((b, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border bg-white shadow-sm hover:shadow transition">
                      {b.iconUrl ? (
                        <img src={b.iconUrl} alt="" className="w-10 h-10 rounded-full ring-1 ring-indigo-200/70 object-contain" />
                      ) : (
                        <Award className="w-6 h-6 text-indigo-600" />
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{b.name}</div>
                        <div className="text-[11px] text-gray-500 truncate">{b.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </UnifiedCard>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Recent Games */}
              <UnifiedCard>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Recent Games</h3>
                <div className="space-y-2 sm:space-y-3">
                  {loading && <div className="text-sm text-gray-500">Loading…</div>}
                  {!loading && recent.length === 0 && <div className="text-sm text-gray-500">No recent games yet.</div>}
                  {!loading && recent.map((game, index) => (
                    <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Gamepad2 className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{game.name}</p>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">{new Date(game.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">{game.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </UnifiedCard>

              {/* Recent Live Sessions */}
              <UnifiedCard>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Recent Live Sessions</h3>
                <div className="space-y-2 sm:space-y-3">
                  {loading && <div className="text-sm text-gray-500">Loading…</div>}
                  {!loading && liveRecent.length === 0 && <div className="text-sm text-gray-500">No recent live sessions yet.</div>}
                  {!loading && liveRecent.map((game, index) => (
                    <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Gamepad2 className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{game.name}</p>
                          <p className="text-xs sm:text-sm text-gray-500 truncate flex items-center gap-2">
                            <span>{new Date(game.createdAt).toLocaleString()}</span>
                            {game.code && (
                              <span className="inline-flex items-center gap-1">
                                • Code <span className="font-mono select-all">{game.code}</span>
                                <button
                                  type="button"
                                  onClick={async (e)=>{ e.stopPropagation(); try{ await navigator.clipboard.writeText(game.code); toast('Code copied'); } catch{} }}
                                  title="Copy code"
                                  aria-label="Copy code"
                                  className="p-1 rounded hover:bg-gray-200 text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                                >
                                  <CopyIcon className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">{game.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </UnifiedCard>

              {/* Achievements */}
              <UnifiedCard>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Achievements</h3>
                <div className="space-y-2 sm:space-y-3">
                  {loading && <div className="text-sm text-gray-500">Loading…</div>}
                  {!loading && earnedBadges.length === 0 && <div className="text-sm text-gray-500">No achievements yet.</div>}
                  {!loading && earnedBadges.map((achievement, index) => (
                    <div key={index} className={`flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg border bg-green-50 border-green-200`}>
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        'bg-green-100'
                      }`}>
                        {achievement.iconUrl ? (
                          <img src={achievement.iconUrl} alt="" className="w-3 h-3 sm:w-4 sm:h-4" />
                        ) : (
                          <Award className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-green-900 text-sm sm:text-base truncate`}>{achievement.name}</p>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">{achievement.description}</p>
                      </div>
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </UnifiedCard>
            </div>
          </div>
        );
      case 'assignments':
        return <StudentAssignmentsPanel />;
      case 'games':
        return (
          <div className="space-y-6">
            <UnifiedCard className="bg-gray-50 border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Games</h3>
              <p className="text-xs text-gray-600">Coming Soon</p>
            </UnifiedCard>
          </div>
        );
      case 'progress':
        return (
          <div className="space-y-6">
            <UnifiedCard className="bg-gray-50 border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Progress</h3>
              <p className="text-xs text-gray-600">Coming Soon</p>
            </UnifiedCard>
          </div>
        );
      case 'badges':
        return <StudentBadges />;
      case 'leaderboard':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5">
              <h2 className="text-xl md:text-2xl font-extrabold text-indigo-900">Leaderboard</h2>
              <p className="text-indigo-700 text-sm">See top students in your school and class.</p>
            </div>
            {lbLoading && <div className="text-sm text-gray-500">Loading…</div>}
            {lbError && <div className="text-sm text-red-600">{lbError}</div>}
            {/* School leaderboard */}
            <UnifiedCard>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">School Top Students</h3>
                {mySchoolRank && <div className="text-xs text-gray-600">Your Rank: #{mySchoolRank.rank} • Points {summary.totalPoints}</div>}
              </div>
              <div className="divide-y border rounded-lg">
                {(Array.isArray(schoolLeaders) ? schoolLeaders : []).map((s, idx) => (
                  <div key={s._id || idx} className="flex items-center justify-between p-2 sm:p-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center flex-shrink-0 ${idx<3?'bg-yellow-50 text-yellow-700 border border-yellow-200':'bg-gray-100 text-gray-600 border border-gray-200'}`}>#{idx+1}</div>
                      <div className="text-sm font-medium text-gray-900 truncate">{s.name}</div>
                    </div>
                    <div className="text-xs text-gray-600 flex-shrink-0 ml-2">{s.totalPoints} pts</div>
                  </div>
                ))}
                {(!Array.isArray(schoolLeaders) || schoolLeaders.length===0) && <div className="p-3 text-sm text-gray-500">No data yet.</div>}
              </div>
            </UnifiedCard>

            {/* Class leaderboard */}
            <UnifiedCard>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Class Leaderboard</h3>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600">Class</label>
                  <select value={lbClassId} onChange={e=>setLbClassId(e.target.value)} className="px-2 py-1 text-xs border rounded-md">
                    {classOptions.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {myClassRank && <div className="text-xs text-gray-600 mb-2">Your Rank: #{myClassRank.rank} • Points {summary.totalPoints}</div>}
              <div className="divide-y border rounded-lg">
                {(Array.isArray(classLeaders) ? classLeaders : []).map((s, idx) => (
                  <div key={s._id || idx} className="flex items-center justify-between p-2 sm:p-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center flex-shrink-0 ${idx<3?'bg-indigo-50 text-indigo-700 border border-indigo-200':'bg-gray-100 text-gray-600 border border-gray-200'}`}>#{idx+1}</div>
                      <div className="text-sm font-medium text-gray-900 truncate">{s.name}</div>
                    </div>
                    <div className="text-xs text-gray-600 flex-shrink-0 ml-2">{s.totalPoints} pts</div>
                  </div>
                ))}
                {(!Array.isArray(classLeaders) || classLeaders.length===0) && <div className="p-3 text-sm text-gray-500">No data yet.</div>}
              </div>
            </UnifiedCard>
          </div>
        );
      case 'live':
        return (
          <div className="space-y-4">
            <UnifiedCard>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">My Live Sessions</h3>
              {liveAll.loading && <div className="text-sm text-gray-500">Loading…</div>}
              {!liveAll.loading && liveAll.items.length === 0 && <div className="text-sm text-gray-500">No past live sessions yet.</div>}
              <div className="divide-y divide-gray-100">
                {liveAll.items.map((g, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0"><Gamepad2 className="w-4 h-4 text-gray-600" /></div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{g.name}</p>
                        <p className="text-xs text-gray-500 truncate flex items-center gap-2">
                          <span>{new Date(g.createdAt).toLocaleString()}</span>
                          {g.code && (
                            <span className="inline-flex items-center gap-1">
                              • Code <span className="font-mono select-all">{g.code}</span>
                              <button
                                type="button"
                                onClick={async (e)=>{ e.stopPropagation(); try{ await navigator.clipboard.writeText(g.code); toast('Code copied'); } catch{} }}
                                title="Copy code"
                                aria-label="Copy code"
                                className="p-1 rounded hover:bg-gray-200 text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                              >
                                <CopyIcon className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="font-semibold text-gray-900 text-sm">{g.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </UnifiedCard>
          </div>
        );
      case 'resources':
        return <StudentResources />;
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
    { id: 'badges', name: 'Badges' },
  { id: 'leaderboard', name: 'Leaderboard' },
  { id: 'live', name: 'Live Sessions' },
  { id: 'resources', name: 'Resources' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 sm:py-4 gap-3 sm:gap-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Student Dashboard</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 lg:space-x-4 w-full sm:w-auto">
              <button
                onClick={() => setAdsPanelOpen(true)}
                className="inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 border border-indigo-300 text-xs sm:text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors w-full sm:w-auto justify-center"
              >
                <Megaphone className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Announcements
              </button>
              <button
                onClick={() => { setActiveTab('overview'); setTimeout(()=>{ const el = document.querySelector('input[placeholder="ABCDEFGH"]'); if (el) el.focus(); }, 0); }}
                className="inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 border border-purple-300 text-xs sm:text-sm font-medium rounded-md text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors w-full sm:w-auto justify-center"
              >
                <Gamepad2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Join Live
              </button>
              <span className="text-xs sm:text-sm text-gray-600">Welcome, {user?.name}</span>
              <button
                onClick={logout}
                className="inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors w-full sm:w-auto justify-center"
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <nav className="flex overflow-x-auto space-x-2 sm:space-x-4 lg:space-x-8 scrollbar-hide">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`py-3 sm:py-4 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {renderTabContent()}
      </div>

      {/* Removed side panel */}
    </div>
  );
};

export default StudentDashboard;