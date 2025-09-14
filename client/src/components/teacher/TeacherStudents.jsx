import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Users, Search, Trophy, Shuffle, X } from 'lucide-react';
import { useToast } from '../shared/ToastProvider';

const TeacherStudents = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [classes, setClasses] = useState([{ id: 'all', name: 'All Classes' }]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [wheelOpen, setWheelOpen] = useState(false);
  const [wheelMode, setWheelMode] = useState('normal'); // 'normal' | 'elimination'
  const [wheelPool, setWheelPool] = useState([]);
  const [wheelLastPick, setWheelLastPick] = useState(null);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelAngle, setWheelAngle] = useState(0);
  const [winnerModal, setWinnerModal] = useState({ open: false, name: '' });
  // Persist wheel pool per class (optional future improvement)
  const [perfLoading, setPerfLoading] = useState(false);
  const [perfItems, setPerfItems] = useState([]);
  // Class resources moved to dedicated Resources tab

  const authHeaders = () => {
    try { const token = JSON.parse(localStorage.getItem('user'))?.token; return token ? { Authorization: `Bearer ${token}` } : {}; } catch { return {}; }
  };
  const spinTimer = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
  (async () => {
      try {
    const axios = (await import('axios')).default;
    const res = await axios.get('/api/classes/teacher', { headers: authHeaders() });
        if (!mounted) return;
        const opts = [{ id: 'all', name: 'All Classes' }, ...res.data.map(c => ({ id: c._id, name: c.name }))];
        setClasses(opts);
      } catch (_) { /* ignore for V1 */ }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
  (async () => {
      if (selectedClass === 'all') { setStudents([]); return; }
      try {
        const axios = (await import('axios')).default;
    const res = await axios.get(`/api/classes/${selectedClass}/students`, { headers: authHeaders() });
        if (!mounted) return;
        setStudents(res.data.students || []);
        setWheelPool((res.data.students || []).map(s => s.id));
      } catch (_) { setStudents([]); }
    })();
    return () => { mounted = false; };
  }, [selectedClass]);

  // Fetch class performance summary when a class is selected
  useEffect(() => {
    let mounted = true;
  (async () => {
      if (selectedClass === 'all') { setPerfItems([]); return; }
      setPerfLoading(true);
      try {
        const axios = (await import('axios')).default;
    const res = await axios.get(`/api/reporting/classes/${selectedClass}/performance`, { headers: authHeaders() });
        if (!mounted) return;
        setPerfItems(res.data?.items || []);
      } catch (_) {
        setPerfItems([]);
      } finally {
        if (mounted) setPerfLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [selectedClass]);

  // Students are fetched from API when a class is selected

  // classes loaded from API above

  // When "All Classes" is selected, we only apply text search; for a specific class,
  // we display the fetched list as-is to avoid relying on a missing class field.
  const filteredStudents = selectedClass === 'all'
    ? students.filter(student => {
        const name = (student.name || '').toLowerCase();
        const email = (student.email || '').toLowerCase();
        const q = (searchTerm || '').toLowerCase();
        return name.includes(q) || email.includes(q);
      })
    : students;

  const leaderboard = [...students]
    .map(s => ({ ...s, xp: s.xp || 0, level: s.level || 1 }))
    .sort((a,b) => (b.xp||0) - (a.xp||0))
    .slice(0, 10);

  const openHistory = async (student) => {
    setSelectedStudent(student);
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const axios = (await import('axios')).default;
      const [resPerf, resAttendance, resPayments] = await Promise.all([
        axios.get(`/api/reporting/classes/${selectedClass}/students/${student.id}/history`, { headers: authHeaders() }),
        student.enrollmentId
          ? axios.get(`/api/attendance/history`, { params: { enrollmentId: student.enrollmentId }, headers: authHeaders() })
          : Promise.resolve({ data: { items: [] } }),
        axios.get(`/api/payments/teacher`, { params: { classId: selectedClass, studentId: student.id, limit: 100 }, headers: authHeaders() })
      ]);
      setHistoryData({
        assignments: resPerf.data?.assignments || [],
        attendance: resAttendance.data?.items || [],
        payments: resPayments.data?.items || [],
      });
    } catch (_) {
      setHistoryData({ assignments: [], attendance: [], payments: [] });
    } finally {
      setHistoryLoading(false);
    }
  };

  const wheelParticipants = useMemo(() => {
    // Build ordered participants list from current wheelPool
    const byId = new Map(students.map(s => [s.id, s]));
    const list = wheelPool.map(id => byId.get(id)).filter(Boolean);
    // Ensure at least 2 slices for visuals
    return list.length >= 2 ? list : list.length === 1 ? [...list, list[0]] : [];
  }, [wheelPool, students]);

  const buildWheelGradient = (parts) => {
    const n = parts.length;
    if (n === 0) return 'conic-gradient(#eee 0deg 360deg)';
    const slice = 360 / n;
    const palette = ['#fde68a','#bfdbfe','#c7d2fe','#fbcfe8','#fecaca','#bbf7d0','#a7f3d0','#fdba74','#fca5a5','#f5d0fe'];
    const stops = parts.map((_, i) => {
      const start = i * slice;
      const end = (i + 1) * slice;
      const color = palette[i % palette.length];
      return `${color} ${start}deg ${end}deg`;
    }).join(', ');
    return `conic-gradient(${stops})`;
  };

  // Clear any pending spin timer on unmount
  useEffect(() => {
    return () => { if (spinTimer.current) { clearTimeout(spinTimer.current); } };
  }, []);

  const rollWheel = () => {
    if (!wheelParticipants.length || wheelSpinning) return;
    // Choose a random index from actual participants (maps to wheelPool id)
    const idx = Math.floor(Math.random() * wheelParticipants.length);
    const pickId = wheelParticipants[idx]?.id;
    if (!pickId) return;
    setWheelLastPick(null);
    setWheelSpinning(true);
    const n = wheelParticipants.length;
    const slice = 360 / n;
    const center = (idx + 0.5) * slice;
    // Bias a tiny amount toward the slice interior so pointer doesn't sit on the separator line
    const pointerBias = Math.min(1.5, slice * 0.1); // degrees
    const baseOffset = 270; // align to top pointer
    const spins = 5 + Math.floor(Math.random() * 3); // 5-7 spins
    setWheelAngle(prev => {
      const current = ((prev % 360) + 360) % 360;
      const delta = spins * 360 + (baseOffset - center + pointerBias) - current;
      const next = prev + delta;
      // Complete action after animation
      if (spinTimer.current) clearTimeout(spinTimer.current);
      spinTimer.current = setTimeout(() => {
        setWheelLastPick(pickId);
        const winnerName = students.find(s=>s.id===pickId)?.name || 'Student';
        try { toast(`Winner: ${winnerName}`); } catch {}
        if (wheelMode === 'elimination') {
          setWheelPool(p => p.filter(id => id !== pickId));
        }
        setWheelSpinning(false);
        setWinnerModal({ open: true, name: winnerName });
      }, 4200);
      return next;
    });
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Classes</h1>
            <p className="text-gray-600 text-lg">Manage your students and track their progress</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-emerald-600">{students.length}</div>
            <div className="text-sm text-emerald-600">Students enrolled</div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters and Search */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search students by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-700">Class:</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm min-w-[200px]"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Enhanced Presence & Wheel */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Classroom Tools</h2>
            <p className="text-sm text-gray-500">Interactive tools for engaging your students</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={()=>{setWheelOpen(true); setWheelMode('normal');}} 
              className="px-4 py-2 text-sm font-medium rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center gap-2"
            >
              <Shuffle className="w-4 h-4"/> 
              Luck Wheel
            </button>
            <button 
              onClick={()=>{setWheelOpen(true); setWheelMode('elimination');}} 
              className="px-4 py-2 text-sm font-medium rounded-lg border border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors"
            >
              Elimination Mode
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Leaderboard */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Top Performers</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>XP Leaderboard</span>
          </div>
        </div>
        <div className="space-y-3">
          {leaderboard.length === 0 && (
            <div className="text-center py-8">
              <div className="text-sm text-gray-500">No students yet.</div>
            </div>
          )}
          {leaderboard.map((s, i) => (
            <div key={s.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  i === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white' :
                  i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                  i === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' :
                  'bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700'
                }`}>
                  {i < 3 ? '🏆' : i + 1}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{s.name}</div>
                  <div className="text-xs text-gray-500">Level {s.level || 1}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-bold text-gray-900">{s.xp || 0} XP</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Class Performance */}
      {selectedClass !== 'all' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Class performance</h2>
          {perfLoading && <div className="text-xs text-gray-500">Loading…</div>}
          {!perfLoading && perfItems.length === 0 && (
            <div className="text-xs text-gray-500">No assignment data yet.</div>
          )}
          {!perfLoading && perfItems.length > 0 && (
            <div className="space-y-2">
              {perfItems.map(item => (
                <div key={item.assignmentId} className="flex items-center justify-between p-2 rounded border bg-gray-50">
                  <span className="text-sm text-gray-800">{item.title}</span>
                  <span className="text-xs text-gray-600">Avg {item.averagePercentage}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}



      {/* Enhanced Students List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-xl font-bold text-gray-900">Students ({selectedClass==='all' ? filteredStudents.length : students.length})</h2>
          <p className="text-sm text-gray-500 mt-1">Manage and track student progress</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(selectedClass==='all' ? filteredStudents : students).map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-sm">
                        <span className="text-white font-bold text-sm">{(student.name||'??').slice(0,2).toUpperCase()}</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.email || student.studentCode}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                      (student.status || 'active') === 'active' 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {student.status || 'active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {selectedClass !== 'all' && (
                      <button 
                        onClick={()=>openHistory(student)} 
                        className="px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                      >
                        View History
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced History Drawer */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-stretch justify-end">
          <div className="bg-white w-full max-w-2xl shadow-2xl border-l relative">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Performance History</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedStudent ? `${selectedStudent.name}'s results and progress` : 'Student performance analytics'}</p>
                </div>
                <button 
                  onClick={()=>setHistoryOpen(false)} 
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6"/>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                  <span className="ml-3 text-gray-600">Loading performance data...</span>
                </div>
              ) : historyData && (historyData.assignments||[]).length === 0 && (historyData.attendance||[]).length === 0 && (historyData.payments||[]).length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">No results yet</p>
                  <p className="text-sm text-gray-400 mt-1">Student hasn't completed any assignments</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {(historyData.assignments||[]).map(a => (
                    <div key={a.assignmentId} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-900">{a.title}</h4>
                      </div>
                      <div className="p-4 space-y-4">
                        {a.games.map(g => (
                          <div key={g.gameId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div>
                                <h5 className="text-sm font-semibold text-gray-900">{g.name}</h5>
                                <div className="flex items-center gap-4 mt-1">
                                  <div className="flex items-center gap-1">
                                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                                    </svg>
                                    <span className="text-sm text-gray-600">Best: <span className="font-semibold text-green-700">{g.bestPercentage}%</span></span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-sm text-gray-600">Attempts: <span className="font-semibold text-blue-700">{g.attemptCount}</span></span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                              g.bestPercentage >= 80 ? 'bg-green-100 text-green-700' :
                              g.bestPercentage >= 60 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {g.bestPercentage >= 80 ? 'Excellent' :
                               g.bestPercentage >= 60 ? 'Good' : 'Needs Improvement'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {(historyData.attendance||[]).length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-900">Attendance</h4>
                      </div>
                      <div className="p-4 space-y-2">
                        {(historyData.attendance||[]).map((a, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-white">
                            <div className="text-sm text-gray-800">{new Date(a.date).toLocaleDateString()}</div>
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${a.status === 'present' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                              {a.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(historyData.payments||[]).length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-900">Payments</h4>
                      </div>
                      <div className="p-4 space-y-2">
                        {(historyData.payments||[]).map((p) => (
                          <div key={p._id} className="flex items-center justify-between p-3 rounded-lg border bg-white">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{p.kind === 'pay_cycles' ? 'Cycle purchase' : 'Session purchase'}</div>
                              <div className="text-xs text-gray-500">{new Date(p.createdAt || p.created_at || p.date || Date.now()).toLocaleString()}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-gray-900">{Number(p.taken ?? p.amount).toFixed(2)} DH</div>
                              {typeof p.debtDelta === 'number' && p.debtDelta !== 0 && (
                                <div className={`text-xs ${p.debtDelta > 0 ? 'text-red-600' : 'text-green-600'}`}>{p.debtDelta > 0 ? `Debt +${p.debtDelta}` : `Credit ${p.debtDelta}`}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1" onClick={()=>setHistoryOpen(false)} />
        </div>
      )}

      {/* Luck Wheel Modal with animated wheel */}
      {wheelOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border relative">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Luck Wheel</h3>
                <p className="text-xs text-gray-500">Mode: {wheelMode === 'elimination' ? 'Elimination' : 'Normal'}</p>
              </div>
              <button onClick={()=>setWheelOpen(false)} className="p-2 text-gray-500 hover:text-gray-700"><X className="w-4 h-4"/></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="text-xs text-gray-500">Students in wheel: {wheelPool.length}</div>
              <div className="flex items-center justify-center">
                <div className="relative" style={{ width: 320, height: 320 }}>
                  {/* Rotating container: wheel + labels rotate together for smooth animation */}
                  <div
                    className="absolute inset-0"
                    style={{
                      transform: `rotate(${wheelAngle}deg)`,
                      transition: wheelSpinning ? 'transform 4s cubic-bezier(.17,.67,.32,1.34)' : 'none'
                    }}
                  >
                    {/* Wheel background */}
                    <div className="absolute inset-0 rounded-full shadow-sm border border-gray-200"
                         style={{ background: buildWheelGradient(wheelParticipants) }} />
                    {/* Labels */}
                    {wheelParticipants.map((p, i) => {
                      const n = wheelParticipants.length || 1;
                      const slice = 360 / n;
                      const angle = i * slice + slice / 2 - 90; // center relative to top
                      const name = (p.name || '').slice(0, 16);
                      return (
                        <div
                          key={p.id}
                          className="absolute left-1/2 top-1/2 text-[11px] text-gray-800 font-medium"
                          style={{
                            transform: `rotate(${angle}deg) translate(0, -120px)`,
                            transformOrigin: '0 0'
                          }}
                        >
                          <span className="px-1.5 py-0.5 rounded bg-white/85 border border-gray-200 shadow-sm">
                            {name}
                          </span>
                        </div>
                      );
                    })}
                    {/* Center hub */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white border-2 border-gray-300 shadow-inner" />
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gray-400" />
                  </div>
                  {/* Pointer */}
                  <div className="absolute left-1/2 -translate-x-1/2 -top-1.5 drop-shadow">
                    <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-red-500" />
                  </div>
                </div>
              </div>
              <div className="text-center text-sm text-gray-500">
                {wheelSpinning ? 'Spinning…' : (wheelLastPick ? `Winner: ${students.find(s=>s.id===wheelLastPick)?.name || 'Student'}` : 'Ready')}
              </div>
              <div className="flex items-center gap-2">
                <button disabled={wheelSpinning || winnerModal.open || wheelPool.length===0} onClick={rollWheel} className="px-3 py-1.5 text-sm rounded-md border bg-white hover:bg-gray-50 disabled:opacity-50">Spin</button>
                {wheelMode === 'elimination' && (
                  <button onClick={()=>setWheelPool(students.map(s=>s.id))} className="px-3 py-1.5 text-sm rounded-md border bg-white hover:bg-gray-50">Reset Pool</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Winner Modal: appears after wheel stops; closing resets wheel to origin */}
      {winnerModal.open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border overflow-hidden">
            <div className="px-5 py-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold">Winner</h3>
            </div>
            <div className="px-6 py-8 text-center">
              <div className="text-5xl mb-3">🎉</div>
              <div className="text-gray-600 mb-1">Selected Student</div>
              <div className="text-2xl font-bold text-gray-900">{winnerModal.name}</div>
            </div>
            <div className="px-5 py-4 border-t bg-gray-50 flex items-center justify-end">
              <button
                className="px-4 py-2 text-sm rounded-md border bg-white hover:bg-gray-50"
                onClick={() => { setWinnerModal({ open: false, name: '' }); setWheelAngle(0); }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherStudents;

