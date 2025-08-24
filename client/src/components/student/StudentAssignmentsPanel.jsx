import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Clock, AlertTriangle, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

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

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = { page, limit };
      if (classFilter !== 'all') params.classId = classFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      const [assignRes, classRes] = await Promise.all([
        axios.get('/api/assignments/my-assignments/detailed', { params }),
        axios.get('/api/classes/my').catch(()=>({ data: [] }))
      ]);
      setItems(assignRes.data.items || []);
      setTotal(assignRes.data.total || 0);
      setClasses(classRes.data || []);
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
    return () => window.removeEventListener('assignmentProgressRefresh', handler);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const openBreakdown = async (assignmentId) => {
    setLoadingBreakdown(true); setBreakdownError(null); setBreakdownData(null); setBreakdownOpen(true);
    try {
      const res = await axios.get(`/api/assignments/${assignmentId}/breakdown`);
      setBreakdownData(res.data);
    } catch (e) {
      setBreakdownError('Failed to load breakdown');
    } finally {
      setLoadingBreakdown(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">My Assignments</h3>
        <div className="flex flex-wrap gap-2 items-center text-xs">
          <div className="flex gap-1 bg-white border rounded-lg p-1">
            <button onClick={()=>{setStatusFilter('all');setPage(1);}} className={`px-3 py-1 rounded-md ${statusFilter==='all'?'bg-indigo-600 text-white':'hover:bg-gray-100'}`}>All</button>
            <button onClick={()=>{setStatusFilter('active');setPage(1);}} className={`px-3 py-1 rounded-md ${statusFilter==='active'?'bg-indigo-600 text-white':'hover:bg-gray-100'}`}>Active</button>
            <button onClick={()=>{setStatusFilter('dueSoon');setPage(1);}} className={`px-3 py-1 rounded-md ${statusFilter==='dueSoon'?'bg-indigo-600 text-white':'hover:bg-gray-100'}`}>Due Soon</button>
            <button onClick={()=>{setStatusFilter('upcoming');setPage(1);}} className={`px-3 py-1 rounded-md ${statusFilter==='upcoming'?'bg-indigo-600 text-white':'hover:bg-gray-100'}`}>Upcoming</button>
            <button onClick={()=>{setStatusFilter('closed');setPage(1);}} className={`px-3 py-1 rounded-md ${statusFilter==='closed'?'bg-indigo-600 text-white':'hover:bg-gray-100'}`}>Closed</button>
          </div>
          <div className="flex gap-1 bg-white border rounded-lg p-1">
            <select value={classFilter} onChange={e=>{setClassFilter(e.target.value);setPage(1);}} className="text-xs px-2 py-1 rounded-md focus:outline-none">
              <option value="all">All Classes</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <button onClick={()=>setRefreshToken(t=>t+1)} className="px-3 py-1 border rounded-md bg-white hover:bg-gray-50 flex items-center gap-1"><Filter className="w-3 h-3" /> Refresh</button>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-500">Loading assignments…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && !error && items.length === 0 && (
        <div className="text-sm text-gray-500">No assignments match your filters.</div>
      )}

      <div className="space-y-4">
        {items.map(a => {
          const { progress } = a;
          const dueSoon = a.dueSoon;
          const status = a.status;
          const statusColor = status === 'active' ? 'bg-emerald-100 text-emerald-700' : status === 'upcoming' ? 'bg-blue-100 text-blue-700' : status === 'closed' ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-600';
          const locked = status === 'upcoming';
          return (
            <div key={a._id} className={`p-5 rounded-xl border shadow-sm transition group ${locked ? 'bg-gray-50 opacity-80' : 'bg-white hover:shadow-md'}` }>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm truncate">{a.title}</h4>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full ${statusColor} font-medium capitalize`}>{status}{dueSoon && status==='active' && <span className="ml-1 text-orange-600">• Due Soon</span>}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(a.endDate).toLocaleDateString()}</span>
                    {a.attemptLimit && <span className="flex items-center gap-1">Limit: {a.attemptLimit}</span>}
                    {a.nextGameAttemptsRemaining !== undefined && status==='active' && progress.completed < progress.totalGames && (
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] ${a.nextGameAttemptsRemaining>0 ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-300 bg-gray-100 text-gray-500'}`}>
                        {a.nextGameAttemptsRemaining} attempt{a.nextGameAttemptsRemaining===1?'':'s'} left for next game
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-semibold text-gray-900 mb-1">{progress.completed}/{progress.totalGames} done</div>
                  <div className="text-[10px] text-gray-500">Avg {progress.averagePercent}%</div>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${progress.completionPercent}%` }}></div>
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-gray-500">
                  <span>{progress.completionPercent}% Complete</span>
                  {progress.completed < progress.totalGames && status === 'active' && <span>{progress.totalGames - progress.completed} left</span>}
                </div>
              </div>
              <div className="mt-4 flex gap-2 flex-wrap">
                {/* Determine next gameCreation to continue */}
                <Link to={!locked && progress.completed < progress.totalGames && a.nextGameAttemptsRemaining !== 0 ? `/student/play-game/${a.nextGameId || ''}` : '#'} state={{ assignmentId: a._id }}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium border ${!locked && progress.completed < progress.totalGames && status==='active' && a.nextGameAttemptsRemaining !== 0 ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}`}
                  onClick={e => { if (locked || progress.completed >= progress.totalGames || status!=='active' || a.nextGameAttemptsRemaining===0) e.preventDefault(); }}
                >
                  {progress.completed < progress.totalGames ? 'Continue' : 'Completed'}
                </Link>
        <button onClick={()=>openBreakdown(a._id)} className="text-xs px-3 py-1.5 rounded-md font-medium border bg-white hover:bg-gray-50">Details</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2 border-t mt-4">
        <button disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-3 py-1 text-xs border rounded-md flex items-center gap-1 disabled:opacity-40"><ChevronLeft className="w-3 h-3" /> Prev</button>
        <div className="text-[11px] text-gray-500">Page {page} / {totalPages}</div>
        <button disabled={page===totalPages} onClick={()=>setPage(p=>p+1)} className="px-3 py-1 text-xs border rounded-md flex items-center gap-1 disabled:opacity-40">Next <ChevronRight className="w-3 h-3" /></button>
      </div>

      {breakdownOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border animate-fadeIn relative">
            <div className="p-5 border-b flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">Assignment Breakdown</h3>
                {breakdownData && <p className="text-xs text-gray-500 mt-1">{breakdownData.title}</p>}
              </div>
              <button onClick={()=>{setBreakdownOpen(false);}} className="p-2 text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {loadingBreakdown && <div className="text-sm text-gray-500">Loading…</div>}
              {breakdownError && <div className="text-sm text-red-600">{breakdownError}</div>}
              {breakdownData && (
                <div className="space-y-4">
                  <div className="text-xs text-gray-600 flex gap-4 flex-wrap">
                    <span>Total Games: {breakdownData.games.length}</span>
                    {breakdownData.attemptLimit && <span>Attempt Limit: {breakdownData.attemptLimit}</span>}
                  </div>
                  <div className="space-y-3">
                    {breakdownData.games.map(g => {
                      const remaining = breakdownData.attemptLimit ? Math.max(0, breakdownData.attemptLimit - g.attemptCount) : null;
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
              <button onClick={()=>setBreakdownOpen(false)} className="px-4 py-2 text-sm border rounded-md bg-white hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
