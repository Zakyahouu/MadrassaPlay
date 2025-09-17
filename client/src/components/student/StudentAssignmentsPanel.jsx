import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Clock, AlertTriangle, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoadingState from '../shared/LoadingState';
import EmptyState from '../shared/EmptyState';

/* StudentAssignmentsPanel
 * Enhanced assignment list with filters, pagination, and progress metrics.
 * Keeps original MyAssignments component untouched.
 */
export default function StudentAssignmentsPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]);
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [refreshToken, setRefreshToken] = useState(0);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [breakdownData, setBreakdownData] = useState(null);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  const [breakdownError, setBreakdownError] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = { page, limit };
      if (classFilter !== 'all') params.classId = classFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      const assignRes = await axios.get('/api/assignments/my-assignments/detailed', { params });
      const items = assignRes.data.items || [];
      setItems(items);
      setTotal(assignRes.data.total || 0);
      // Build class options from assignments (no extra API call)
      const inferred = new Map();
      items.forEach(a => {
        (a.classIds || []).forEach(id => inferred.set(id, { _id: id, name: 'Class' }));
      });
      setClasses(Array.from(inferred.values()));
    } catch (e) {
      setError('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [page, limit, classFilter, statusFilter, refreshToken]);

  useEffect(()=>{ fetchData(); }, [fetchData]);

  // Event-driven refresh after playing a game
  useEffect(() => {
    const handler = () => setRefreshToken(t => t + 1);
    window.addEventListener('assignmentProgressRefresh', handler);
    const onSaved = (e) => {
      const d = e.detail || {};
      setToast({
        message: `Result saved${d.counted===false ? ' (not counted)': ''}. XP +${d.xpAwarded || 0}. Attempts left: ${d.attemptsRemaining ?? '?'}`,
        ts: Date.now()
      });
      setTimeout(()=>setToast(null), 4000);
      // Trigger assignment data refresh so UI updates for further attempts
      setRefreshToken(t => t + 1);
    };
    window.addEventListener('assignmentResultSaved', onSaved);
    return () => {
      window.removeEventListener('assignmentProgressRefresh', handler);
      window.removeEventListener('assignmentResultSaved', onSaved);
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const openBreakdown = async (assignmentId) => {
    setLoadingBreakdown(true); setBreakdownError(null); setBreakdownData(null); setBreakdownOpen(true);
    try {
      const res = await axios.get(`/api/assignments/${assignmentId}/breakdown`);
      const data = res.data;
      // Fetch possible badges per template for preview
      const templateIds = [...new Set((data.games||[]).map(g=>g.templateId).filter(Boolean))];
      let badgesByTemplate = {};
      if (templateIds.length) {
        const results = await Promise.allSettled(templateIds.map(tid => axios.get(`/api/template-badges?template=${tid}`)));
        results.forEach((r, idx) => {
          if (r.status === 'fulfilled') badgesByTemplate[templateIds[idx]] = r.value.data || [];
        });
      }
      setBreakdownData({ ...data, badgesByTemplate });
    } catch (e) {
      setBreakdownError('Failed to load breakdown');
    } finally {
      setLoadingBreakdown(false);
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 bg-white/90 backdrop-blur border shadow-lg rounded-lg p-3 text-xs">
          {toast.message}
        </div>
      )}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-3 sm:p-5">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-indigo-900">My Assignments</h3>
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center text-xs">
            <div className="flex gap-1 bg-white/70 backdrop-blur border border-indigo-100 rounded-lg p-1 overflow-x-auto">
              <button onClick={()=>{setStatusFilter('all');setPage(1);}} className={`px-2 sm:px-3 py-1 rounded-md whitespace-nowrap ${statusFilter==='all'?'bg-indigo-600 text-white':'hover:bg-indigo-50'}`}>All</button>
              <button onClick={()=>{setStatusFilter('active');setPage(1);}} className={`px-2 sm:px-3 py-1 rounded-md whitespace-nowrap ${statusFilter==='active'?'bg-indigo-600 text-white':'hover:bg-indigo-50'}`}>Active</button>
              <button onClick={()=>{setStatusFilter('dueSoon');setPage(1);}} className={`px-2 sm:px-3 py-1 rounded-md whitespace-nowrap ${statusFilter==='dueSoon'?'bg-indigo-600 text-white':'hover:bg-indigo-50'}`}>Due Soon</button>
              <button onClick={()=>{setStatusFilter('upcoming');setPage(1);}} className={`px-2 sm:px-3 py-1 rounded-md whitespace-nowrap ${statusFilter==='upcoming'?'bg-indigo-600 text-white':'hover:bg-indigo-50'}`}>Upcoming</button>
              <button onClick={()=>{setStatusFilter('completed');setPage(1);}} className={`px-2 sm:px-3 py-1 rounded-md whitespace-nowrap ${statusFilter==='completed'?'bg-indigo-600 text-white':'hover:bg-indigo-50'}`}>Completed</button>
            </div>
            <div className="flex gap-1 bg-white/70 backdrop-blur border border-indigo-100 rounded-lg p-1">
              <select value={classFilter} onChange={e=>{setClassFilter(e.target.value);setPage(1);}} className="text-xs px-2 py-1 rounded-md focus:outline-none min-w-0">
                <option value="all">All Classes</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <button onClick={()=>setRefreshToken(t=>t+1)} className="px-2 sm:px-3 py-1 border rounded-md bg-white hover:bg-indigo-50 flex items-center justify-center gap-1 border-indigo-200"><Filter className="w-3 h-3 text-indigo-600" /> <span className="hidden sm:inline">Refresh</span></button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          <LoadingState message="Loading assignments…" />
          <div className="grid grid-cols-1 gap-3">
            {[...Array(3)].map((_,i)=> (
              <div key={i} className="p-5 rounded-2xl border bg-white animate-pulse">
                <div className="h-4 w-1/3 bg-gray-200 rounded mb-3" />
                <div className="h-3 w-2/3 bg-gray-100 rounded mb-2" />
                <div className="h-3 w-1/2 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      )}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && !error && items.length === 0 && (
        <EmptyState title="No assignments" message="No assignments match your filters." />
      )}

      <div className="space-y-4">
        {items.map(a => {
          const { progress } = a;
          const dueSoon = a.dueSoon;
          const status = a.status;
          // Color coding for statuses
          // active: green, dueSoon hint: orange dot, upcoming: blue, completed: slate, canceled: red, expired: amber
          const statusColor = (
            status === 'active' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
            status === 'upcoming' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
            status === 'completed' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
            status === 'canceled' ? 'bg-red-100 text-red-700 border border-red-200' :
            status === 'expired' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
            'bg-gray-100 text-gray-700 border border-gray-200'
          );
          const locked = status === 'upcoming';
          return (
            <div key={a._id} className={`p-5 rounded-2xl border shadow-sm transition group ${locked ? 'bg-gray-50 opacity-80' : 'bg-white hover:shadow-md'}` }>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-indigo-900 text-lg truncate flex items-center gap-2">
                    {a.title}
                    {progress.averagePercent >= 90 && <span title="High Score!" className="ml-2 text-yellow-500">🏆</span>}
                  </h4>
                  <div className="flex items-center gap-3 mt-2 text-xs flex-wrap">
                    <span className={`px-2 py-1 rounded-full ${statusColor} font-bold capitalize text-sm`}>{status}{dueSoon && status==='active' && <span className="ml-1 text-orange-600 animate-pulse">• Due Soon</span>}</span>
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 font-semibold">
                      <Clock className="w-4 h-4" /> Due: {new Date(a.endDate).toLocaleDateString()}
                    </span>
                    {a.attemptLimit && <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-semibold">Attempts: {a.attemptLimit}</span>}
                    {a.nextGameAttemptsRemaining !== undefined && status==='active' && progress.completed < progress.totalGames && (
                      <span className={`px-2 py-1 rounded-full border font-bold text-sm ${a.nextGameAttemptsRemaining>0 ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-300 bg-gray-100 text-gray-500'}`}>
                        {a.nextGameAttemptsRemaining} left
                      </span>
                    )}
                  </div>
                  {a.description && <p className="mt-2 text-sm text-gray-600 line-clamp-2 italic">{a.description}</p>}
                </div>
                <div className="text-right text-xs">
                  {a.nextGameAttemptsRemaining === 0 && a.nextGameId && (
                    <>
                      <div className="font-bold text-green-700 mb-1 text-lg flex items-center gap-1">Final Score: {progress.averagePercent}% {progress.averagePercent >= 90 ? '🌟' : progress.averagePercent >= 60 ? '👍' : '💡'}</div>
                      <div className="text-xs text-gray-500">All attempts used</div>
                    </>
                  )}
                  {a.nextGameAttemptsRemaining > 0 && a.nextGameId && (
                    <>
                      <div className="font-bold text-indigo-700 mb-1 text-lg flex items-center gap-1">Best Score: {progress.averagePercent}%</div>
                      <div className="text-xs text-gray-500">Attempts left: {a.nextGameAttemptsRemaining}</div>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${progress.completionPercent}%` }}></div>
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-gray-500">
                  <span className="font-bold text-indigo-700">{progress.completionPercent}% Complete</span>
                  {progress.completed < progress.totalGames && status === 'active' && <span className="font-bold text-purple-700">{progress.totalGames - progress.completed} game(s) left</span>}
                </div>
              </div>
              <div className="mt-4 flex gap-2 flex-wrap">
                {/* Determine next gameCreation to continue */}
                <Link to={!locked && progress.completed < progress.totalGames && a.nextGameAttemptsRemaining !== 0 ? `/student/play-game/${a.nextGameId || ''}` : '#'} state={{ assignmentId: a._id }}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 ${!locked && status==='active' && a.nextGameAttemptsRemaining > 0 && a.nextGameId ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}`}
                  onClick={e => { if (locked || status!=='active' || a.nextGameAttemptsRemaining <= 0 || !a.nextGameId) e.preventDefault(); }}
                >
                  {a.nextGameAttemptsRemaining > 0 && a.nextGameId ? 'Continue' : 'Completed'}
                </Link>
        <button onClick={()=>openBreakdown(a._id)} className="text-xs px-3 py-1.5 rounded-md font-medium border bg-white hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300">Details</button>
  <button onClick={()=>openBreakdown(a._id)} className="text-xs px-3 py-1.5 rounded-md font-bold border bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border-yellow-300 flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"><span>Details</span> <span className="text-lg">ℹ️</span></button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between pt-2 border-t mt-4 gap-2">
  <button disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-3 py-1 text-xs border rounded-md flex items-center gap-1 disabled:opacity-40 w-full sm:w-auto justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"><ChevronLeft className="w-3 h-3" /> Prev</button>
        <div className="text-xs text-gray-500">Page {page} / {totalPages}</div>
  <button disabled={page===totalPages} onClick={()=>setPage(p=>p+1)} className="px-3 py-1 text-xs border rounded-md flex items-center gap-1 disabled:opacity-40 w-full sm:w-auto justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300">Next <ChevronRight className="w-3 h-3" /></button>
      </div>

      {breakdownOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border animate-fadeIn relative">
            <div className="p-5 border-b flex items-start justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
              <div>
                <h3 className="text-lg font-semibold text-indigo-900">Assignment Breakdown</h3>
                {breakdownData && <p className="text-xs text-gray-600 mt-1">{breakdownData.title}</p>}
              </div>
              <button onClick={()=>{setBreakdownOpen(false);}} className="p-2 text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {loadingBreakdown && <LoadingState message="Loading…" />}
              {breakdownError && <div className="text-sm text-red-600">{breakdownError}</div>}
              {breakdownData && (
                <div className="space-y-4">
                  <div className="text-xs text-gray-700 flex gap-4 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">Total Games: {breakdownData.games.length}</span>
                    {breakdownData.attemptLimit && <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">Attempt Limit: {breakdownData.attemptLimit}</span>}
                  </div>
                  <div className="space-y-3">
                    {breakdownData.games.map(g => {
                      const remaining = breakdownData.attemptLimit ? Math.max(0, breakdownData.attemptLimit - g.attemptCount) : null;
                      const badgeDefs = breakdownData.badgesByTemplate?.[g.templateId] || [];
                      return (
                        <div key={g.gameId} className="p-4 rounded-xl border bg-gray-50">
                          <div className="flex flex-wrap justify-between gap-4">
                            <div>
                              <p className="font-medium text-sm text-gray-800">{g.name}</p>
                              <p className="text-[10px] text-gray-500">Best: {g.bestPercent}% {remaining !== null && <span className="ml-2">Remaining Attempts: {remaining}</span>}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Attempts: {g.attemptCount}</p>
                            </div>
                          </div>
                          {badgeDefs.length > 0 && (
                            <div className="mt-2 text-[10px] text-gray-600">
                              <p className="mb-1 font-medium text-gray-700">Possible Badges:</p>
                              <div className="flex flex-wrap gap-2">
                                {badgeDefs.map(b => (
                                  <span key={b._id} className="px-2 py-0.5 rounded-full bg-yellow-50 border border-yellow-200 text-yellow-800">
                                    {b.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="mt-2 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                            {g.attempts.map(a => (
                              <div key={a.attemptNumber} className="p-2 rounded-lg bg-white border text-[11px] flex justify-between">
                                <span className="text-gray-600">Try {a.attemptNumber}</span>
                                <span className="font-medium text-gray-800">{a.score}/{a.totalPossibleScore} ({a.percent}%)</span>
                              </div>
                            ))}
                            {g.attempts.length === 0 && <div className="text-[11px] text-gray-400">No attempts yet.</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t flex justify-end">
              <button onClick={()=>setBreakdownOpen(false)} className="px-4 py-2 text-sm border rounded-md bg-white hover:bg-indigo-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
