import React, { useEffect, useMemo, useState, useContext } from 'react';
import { Play, Users, Clock, Plus, Eye, Settings, Trophy, Target, Activity, CheckCircle, Trash } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { SocketContext } from '../../context/SocketContext';
import { useToast } from '../shared/ToastProvider';

const TeacherLiveSessions = () => {
  const navigate = useNavigate();
  const socket = useContext(SocketContext);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('active');

  // Lists
  const [loadingActive, setLoadingActive] = useState(false);
  const [loadingPast, setLoadingPast] = useState(false);
  const [errorActive, setErrorActive] = useState(null);
  const [errorPast, setErrorPast] = useState(null);
  const [activeSessions, setActiveSessions] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);

  // New Session modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [games, setGames] = useState([]);
  const [classes, setClasses] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState({
    title: '',
    gameCreationId: '',
    classIds: [],
  });

  // Row actions popover
  const [actionsOpenId, setActionsOpenId] = useState(null);
  // Confirmations
  const [confirmEnd, setConfirmEnd] = useState({ open: false, id: null, title: '' });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, title: '' });

  // Quick results popup (trophy click)
  const [quickResults, setQuickResults] = useState({ open: false, id: null, title: '', loading: false, error: null, ranks: [], session: null });

  const authHeaders = () => {
    try { const token = JSON.parse(localStorage.getItem('user'))?.token; return token ? { Authorization: `Bearer ${token}` } : {}; } catch { return {}; }
  };

  useEffect(() => {
    fetchActive();
    fetchPast();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live participant counts per session
  useEffect(() => {
    if (!socket) return;
    const handleCount = ({ sessionId, participantsCount }) => {
      setActiveSessions(prev => prev.map(s => (String(s._id || s.id) === String(sessionId) ? { ...s, participantsCount } : s)));
    };
    socket.on('live:session-count', handleCount);
    return () => { socket.off('live:session-count', handleCount); };
  }, [socket]);

  const fetchActive = async () => {
    try {
      setLoadingActive(true);
  setErrorActive(null);
  const { data } = await axios.get('/api/live-sessions', { params: { status: 'active' }, headers: authHeaders() });
      setActiveSessions(Array.isArray(data) ? data : (data?.sessions || []));
    } catch (e) {
  console.error('Failed to load active sessions', e);
  setErrorActive('Failed to load active sessions');
  toast('Failed to load active sessions');
    } finally {
      setLoadingActive(false);
    }
  };

  const fetchPast = async () => {
    try {
      setLoadingPast(true);
  setErrorPast(null);
  const { data } = await axios.get('/api/live-sessions', { params: { status: 'past' }, headers: authHeaders() });
      setPastSessions(Array.isArray(data) ? data : (data?.sessions || []));
    } catch (e) {
  console.error('Failed to load past sessions', e);
  setErrorPast('Failed to load past sessions');
  toast('Failed to load past sessions');
    } finally {
      setLoadingPast(false);
    }
  };

  const openNewModal = async () => {
    setShowNewModal(true);
    try {
  const gamesRes = await axios.get('/api/creations', { headers: authHeaders() });
      setGames(Array.isArray(gamesRes.data) ? gamesRes.data : (gamesRes.data?.creations || []));
      try {
  const classesRes = await axios.get('/api/classes/teacher', { headers: authHeaders() });
        const cls = Array.isArray(classesRes.data) ? classesRes.data : (classesRes.data?.classes || []);
        setClasses(cls);
      } catch {}
    } catch (e) {
      console.error('Failed to load lists for new session', e);
    }
  };

  const toggleClass = (id) => {
    setNewForm(prev => {
      const has = prev.classIds.includes(id);
      return { ...prev, classIds: has ? prev.classIds.filter(x => x !== id) : [...prev.classIds, id] };
    });
  };

  const createSession = async (e) => {
    e.preventDefault();
    if (!newForm.gameCreationId) return;
    try {
      setCreating(true);
      const payload = {
        title: newForm.title?.trim() || undefined,
        gameCreationId: newForm.gameCreationId,
        classIds: newForm.classIds,
        config: { timePenaltyPerWrongMs: 3000 },
      };
  const res = await axios.post('/api/live-sessions', payload, { headers: authHeaders() });
    setShowNewModal(false);
  setNewForm({ title: '', gameCreationId: '', classIds: [] });
      fetchActive();
      setActiveTab('active');
      const code = res?.data?.code;
  if (code) toast(`Lobby created. Code: ${code}`);
    } catch (e) {
  console.error('Failed to create session', e);
  const msg = e?.response?.data?.message || 'Failed to create session';
	toast(msg);
    } finally {
      setCreating(false);
    }
  };

  const copyCode = async (code) => {
    try { await navigator.clipboard.writeText(code); toast('Code copied'); } catch (e) { console.error('Clipboard failed', e); }
  };

  const endSession = async (id) => {
    try {
  await axios.post(`/api/live-sessions/${id}/end`, null, { headers: authHeaders() });
      setActionsOpenId(null);
      fetchActive();
      fetchPast();
  toast('Session ended');
  // Navigate to summary after a short delay so toast is visible
  setTimeout(() => navigate(`/teacher/live-sessions/${id}`), 600);
    } catch (e) {
  console.error('Failed to end session', e);
  const msg = e?.response?.data?.message || 'Failed to end session';
  toast(msg);
    }
  };

  const deleteSession = async (id) => {
    try {
      await axios.delete(`/api/live-sessions/${id}`, { headers: authHeaders() });

  const openQuickResults = async (id, title) => {
    setQuickResults({ open: true, id, title, loading: true, error: null, ranks: [], session: null });
    try {
      const [sumRes, detRes] = await Promise.all([
        axios.get(`/api/live-sessions/${id}/summary`, { headers: authHeaders() }),
        axios.get(`/api/live-sessions/${id}`, { headers: authHeaders() })
      ]);
      const ranks = Array.isArray(sumRes.data?.ranks) ? sumRes.data.ranks : [];
      const session = sumRes.data?.session || detRes.data || null;
      setQuickResults(q => ({ ...q, loading: false, ranks, session }));
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to load results';
      setQuickResults(q => ({ ...q, loading: false, error: msg }));
      toast(msg);
    }
  };
  const closeQuickResults = () => setQuickResults({ open: false, id: null, title: '', loading: false, error: null, ranks: [], session: null });
  fetchPast();
  toast('Session deleted');
    } catch (e) {
      console.error('Failed to delete session', e);
      const msg = e?.response?.data?.message || 'Failed to delete session';
  toast(msg);
    }
  };

  // derived mini-stats
  const totalSessions = useMemo(() => activeSessions.length + pastSessions.length, [activeSessions, pastSessions]);
  const avgParticipants = useMemo(() => {
    const all = [...activeSessions, ...pastSessions];
    if (!all.length) return 0;
    const sum = all.reduce((acc, s) => acc + (s.participantsCount || s.participants || 0), 0);
    return (sum / all.length).toFixed(1);
  }, [activeSessions, pastSessions]);
  const avgDurationMin = useMemo(() => {
    const past = pastSessions;
    if (!past.length) return 0;
    let sum = 0, n = 0;
    past.forEach(s => {
      const start = s.startedAt ? new Date(s.startedAt).getTime() : null;
      const end = s.endedAt ? new Date(s.endedAt).getTime() : null;
      if (start && end && end > start) { sum += (end - start) / 60000; n++; }
    });
    return n ? (sum / n).toFixed(1) : 0;
  }, [pastSessions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Sessions</h1>
          <p className="text-gray-600">Manage your real-time gaming sessions</p>
        </div>
        <button
          onClick={openNewModal}
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" />
              {quickResults.open && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Quick Results {quickResults.title ? `- ${quickResults.title}` : ''}</h3>
                      <button onClick={closeQuickResults} className="text-gray-500 hover:text-gray-700">✕</button>
                    </div>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-auto">
                      {quickResults.loading && (
                        <div className="text-sm text-gray-500">Loading…</div>
                      )}
                      {!quickResults.loading && quickResults.error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{quickResults.error}</div>
                      )}
                      {!quickResults.loading && !quickResults.error && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Participants</p>
                              <p className="text-lg font-semibold">{quickResults.ranks.length}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Status</p>
                              <p className="text-lg font-semibold capitalize">{quickResults.session?.status || '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Code</p>
                              <p className="text-lg font-mono">{quickResults.session?.code || '—'}</p>
                            </div>
                          </div>
                          {quickResults.ranks.length === 0 ? (
                            <div className="text-sm text-gray-600">No results recorded.</div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-sm">
                                <thead className="bg-gray-100 text-gray-700">
                                  <tr>
                                    <th className="px-3 py-2 text-left">#</th>
                                    <th className="px-3 py-2 text-left">Name</th>
                                    <th className="px-3 py-2 text-left">Score</th>
                                    <th className="px-3 py-2 text-left">Time</th>
                                    <th className="px-3 py-2 text-left">Wrong</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {quickResults.ranks.slice(0, 10).map((r, i) => (
                                    <tr key={`${r.studentId || r.userId || i}`} className="border-t border-gray-100">
                                      <td className="px-3 py-2">{i + 1}</td>
                                      <td className="px-3 py-2">{[r.firstName, r.lastName].filter(Boolean).join(' ') || r.name || r.userId || '—'}</td>
                                      <td className="px-3 py-2">{r.score ?? 0}</td>
                                      <td className="px-3 py-2">{Number.isFinite(r.effectiveTimeMs) ? `${Math.round(r.effectiveTimeMs/100)/10}s` : '—'}</td>
                                      <td className="px-3 py-2">{r.wrong ?? 0}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {quickResults.ranks.length > 10 && (
                                <div className="text-xs text-gray-500 mt-2">Showing top 10 of {quickResults.ranks.length}</div>
                              )}
                            </div>
                          )}
                          <div className="flex items-center justify-end gap-2 pt-2">
                            <button onClick={() => { const id = quickResults.id; closeQuickResults(); navigate(`/teacher/live-sessions/${id}`); }} className="px-3 py-2 text-sm rounded-md border">Open Full Summary</button>
                            <button onClick={closeQuickResults} className="px-3 py-2 text-sm rounded-md bg-purple-600 text-white hover:bg-purple-700">Close</button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
          <span>New Session</span>
        </button>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('active')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'active'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Active Sessions ({activeSessions.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'past'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Past Sessions ({pastSessions.length})
          </button>
        </nav>
      </div>

      {activeTab === 'active' && (
        <div className="space-y-4">
          {loadingActive && (
            <div className="space-y-2">
              <div className="text-sm text-gray-500">Loading active sessions…</div>
              {[...Array(2)].map((_,i)=> (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
                  <div className="h-5 w-1/3 bg-gray-200 rounded mb-2" />
                  <div className="h-3 w-2/3 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          )}
          {!loadingActive && errorActive && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
              <span>{errorActive}</span>
              <button onClick={fetchActive} className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700">Retry</button>
            </div>
          )}
          {!loadingActive && !errorActive && !activeSessions.length && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-dashed border-gray-300 text-center">
              <p className="text-sm text-gray-600 mb-3">No active sessions. Create one to get started.</p>
              <button onClick={openNewModal} className="px-3 py-2 text-sm rounded-md text-white bg-purple-600 hover:bg-purple-700">New Session</button>
            </div>
          )}
          {activeSessions.map((s) => {
            const title = s?.title || s?.gameCreation?.name || s?.name || 'Live Session';
            const subject = s?.gameCreation?.subject || s?.subject;
            const difficulty = s?.gameCreation?.difficulty || s?.difficulty;
            const participants = s?.participantsCount ?? s?.participants ?? 0;
            const startedAt = s?.startedAt ? new Date(s.startedAt).toLocaleTimeString() : '—';
            const code = s?.code || s?.roomCode || '—';
            const key = s._id || s.id;
            return (
              <div key={key} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        {subject && (
                          <span className="flex items-center">
                            <Target className="w-4 h-4 mr-1" />
                            {subject}
                          </span>
                        )}
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          Started {startedAt}
                        </span>
                        {difficulty && (
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                            difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{participants}</span>
                      </div>
                      <p className="text-xs text-gray-500">Participants</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">Room: {code}</p>
                      <p className="text-xs text-gray-500">Live</p>
                    </div>
                    <div className="relative">
                      <div className="flex items-center space-x-2">
                        <button
                          title="Open Lobby"
                          aria-label="Open Lobby"
                          onClick={() => navigate(`/teacher/host-lobby/session/${key}`)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          title="Actions"
                          aria-label="Open actions"
                          onClick={() => setActionsOpenId(actionsOpenId === key ? null : key)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                      {actionsOpenId === key && (
                        <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <button onClick={() => { copyCode(code); setActionsOpenId(null); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300">Copy Room Code</button>
                          <button onClick={() => { setActionsOpenId(null); setConfirmEnd({ open: true, id: key, title }); }} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">End Session</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'past' && (
        <div className="space-y-4">
          {loadingPast && (
            <div className="space-y-2">
              <div className="text-sm text-gray-500">Loading past sessions…</div>
              {[...Array(2)].map((_,i)=> (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
                  <div className="h-5 w-1/3 bg-gray-200 rounded mb-2" />
                  <div className="h-3 w-2/3 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          )}
          {!loadingPast && errorPast && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
              <span>{errorPast}</span>
              <button onClick={fetchPast} className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700">Retry</button>
            </div>
          )}
          {!loadingPast && !errorPast && !pastSessions.length && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-dashed border-gray-300 text-center">
              <p className="text-sm text-gray-600">No past sessions yet. End a live session to see summaries here.</p>
            </div>
          )}
          {pastSessions.map((s) => {
            const title = s?.title || s?.gameCreation?.name || s?.name || 'Live Session';
            const subject = s?.gameCreation?.subject || s?.subject;
            const difficulty = s?.gameCreation?.difficulty || s?.difficulty;
            const participants = s?.participantsCount ?? s?.participants ?? 0;
            const avgScore = s?.averageScore ?? '—';
            const start = s?.startedAt ? new Date(s.startedAt).toLocaleTimeString() : '—';
            const end = s?.endedAt ? new Date(s.endedAt).toLocaleTimeString() : '—';
            const key = s._id || s.id;
            return (
              <div key={key} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        {subject && (
                          <span className="flex items-center">
                            <Target className="w-4 h-4 mr-1" />
                            {subject}
                          </span>
                        )}
                        {difficulty && (
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                            difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700 border border-gray-200"><Users className="w-3.5 h-3.5" /> {participants}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-indigo-50 text-indigo-700 border border-indigo-200">Avg {avgScore === '—' ? '—' : `${avgScore}%`}</span>
                      {difficulty && (
                        <span className={`px-2 py-1 rounded-full text-xs border ${
                          difficulty === 'Easy' ? 'bg-green-50 text-green-700 border-green-200' :
                          difficulty === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {difficulty}
                        </span>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{start} - {end}</p>
                      <p className="text-xs text-gray-500">Duration</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button title="Quick Results" aria-label="Quick results" onClick={() => openQuickResults(key, title)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300">
                        <Trophy className="w-4 h-4" />
                      </button>
                      <button title="View Summary" aria-label="View summary" onClick={() => navigate(`/teacher/live-sessions/${key}`)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button title="Delete Session" aria-label="Delete session" onClick={() => setConfirmDelete({ open: true, id: key, title })} className="p-2 text-red-600 hover:bg-red-50 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{totalSessions}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Play className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600">—</span>
            <span className="text-gray-500 ml-1">from last period</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Participants</p>
              <p className="text-2xl font-bold text-gray-900">{avgParticipants}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600">—</span>
            <span className="text-gray-500 ml-1">from last period</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Session Time</p>
              <p className="text-2xl font-bold text-gray-900">{avgDurationMin} min</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600">—</span>
            <span className="text-gray-500 ml-1">from last period</span>
          </div>
        </div>
      </div>

      {showNewModal && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between sticky top-0">
              <h3 className="text-lg font-semibold">Create Live Session</h3>
              <button onClick={() => setShowNewModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={createSession} className="px-6 py-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session name (optional)</label>
                  <input
                    type="text"
                    value={newForm.title}
                    onChange={(e) => setNewForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g., Friday Quiz – Class A"
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Game</label>
                  <select
                    value={newForm.gameCreationId}
                    onChange={(e) => setNewForm(f => ({ ...f, gameCreationId: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2"
                    required
                  >
                    <option value="">Select a game…</option>
                    {games.map(g => (
                      <option key={g._id} value={g._id}>{g.name || g.title || 'Untitled'}</option>
                    ))}
                  </select>
                  {!games.length && <p className="text-xs text-gray-500 mt-1">Your games list is empty.</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">Classes</label>
                    <span className="text-xs text-gray-500">Select at least one</span>
                  </div>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-auto border rounded-md p-2">
                    {classes.map(c => (
                      <label key={c._id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={newForm.classIds.includes(c._id)} onChange={() => toggleClass(c._id)} />
                        <span>{c.name || c.title || 'Untitled class'}</span>
                      </label>
                    ))}
                    {!classes.length && <p className="text-xs text-gray-500">No classes found.</p>}
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  Scoring: higher score wins; if tied, lower effective time wins; if still tied, fewer mistakes wins.
                  Effective time = total time + (wrong answers × 3000ms).
                </div>

                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Note: No late joins. Once the session starts, new students cannot join.
                </div>
              </div>
              <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-2 sticky bottom-0">
                <button type="button" onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm rounded-md border">Cancel</button>
                <button type="submit" disabled={creating || !newForm.gameCreationId || newForm.classIds.length === 0} className="px-4 py-2 text-sm rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50">{creating ? 'Creating…' : 'Create Session'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm End Session modal */}
      {confirmEnd.open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
              <h3 className="text-lg font-semibold">End Session</h3>
              <button onClick={() => setConfirmEnd({ open: false, id: null, title: '' })} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-700">Are you sure you want to end this session{confirmEnd.title ? `: ${confirmEnd.title}` : ''}? This will move it to Past.</p>
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => setConfirmEnd({ open: false, id: null, title: '' })} className="px-4 py-2 text-sm rounded-md border">Cancel</button>
                <button onClick={() => { const id = confirmEnd.id; setConfirmEnd({ open: false, id: null, title: '' }); endSession(id); }} className="px-4 py-2 text-sm rounded-md text-white bg-red-600 hover:bg-red-700">End Session</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Session modal (past only) */}
      {confirmDelete.open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Delete Session</h3>
              <button onClick={() => setConfirmDelete({ open: false, id: null, title: '' })} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-700">This will permanently remove this session and its results from your past sessions list for everyone. Proceed{confirmDelete.title ? `: ${confirmDelete.title}` : ''}?</p>
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => setConfirmDelete({ open: false, id: null, title: '' })} className="px-4 py-2 text-sm rounded-md border">Cancel</button>
                <button onClick={() => { const id = confirmDelete.id; setConfirmDelete({ open: false, id: null, title: '' }); deleteSession(id); }} className="px-4 py-2 text-sm rounded-md text-white bg-red-600 hover:bg-red-700">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

  {/* Toasts handled globally by ToastProvider */}
    </div>
  );
};

export default TeacherLiveSessions;
