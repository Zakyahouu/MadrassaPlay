import React, { useEffect, useState } from 'react';
import { Users, Search, Trophy, Shuffle, X } from 'lucide-react';

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
  const [perfLoading, setPerfLoading] = useState(false);
  const [perfItems, setPerfItems] = useState([]);
  // Class resources moved to dedicated Resources tab

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await (await import('axios')).default.get('/api/classes/teacher');
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
        const res = await axios.get(`/api/classes/${selectedClass}/students`);
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
        const res = await axios.get(`/api/reporting/classes/${selectedClass}/performance`);
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
      const res = await axios.get(`/api/reporting/classes/${selectedClass}/students/${student.id}/history`);
      setHistoryData(res.data);
    } catch (_) {
      setHistoryData({ assignments: [] });
    } finally {
      setHistoryLoading(false);
    }
  };

  const rollWheel = () => {
    if (!wheelPool.length || wheelSpinning) return;
    setWheelSpinning(true);
    const idx = Math.floor(Math.random() * wheelPool.length);
    const pickId = wheelPool[idx];
    setTimeout(() => {
      setWheelLastPick(pickId);
      if (wheelMode === 'elimination') {
        setWheelPool(prev => prev.filter(id => id !== pickId));
      }
      setWheelSpinning(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
    <div className="flex items-center justify-between">
        <div>
      <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
      <p className="text-gray-600">View your classes and students</p>
        </div>
  <div />
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search students by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
                              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Presence & Wheel */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Presence</h2>
            <p className="text-xs text-gray-500">(coming soon)</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>{setWheelOpen(true); setWheelMode('normal');}} className="px-3 py-1.5 text-xs rounded-md border bg-white hover:bg-gray-50 flex items-center gap-1"><Shuffle className="w-3 h-3"/> Luck Wheel</button>
            <button onClick={()=>{setWheelOpen(true); setWheelMode('elimination');}} className="px-3 py-1.5 text-xs rounded-md border bg-white hover:bg-gray-50">Elimination Mode</button>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Top XP</h2>
        <div className="space-y-2">
          {leaderboard.length === 0 && <div className="text-xs text-gray-500">No students yet.</div>}
          {leaderboard.map((s, i) => (
            <div key={s.id} className="flex items-center justify-between p-2 rounded border bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-semibold">{i+1}</div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{s.name}</div>
                  <div className="text-[11px] text-gray-500">Lvl {s.level || 1}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-700"><Trophy className="w-3 h-3"/> {s.xp || 0} XP</div>
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



      {/* Students List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Students ({selectedClass==='all' ? filteredStudents.length : students.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">History</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(selectedClass==='all' ? filteredStudents : students).map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">{(student.name||'??').slice(0,2).toUpperCase()}</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.email || student.studentCode}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      (student.status || 'active') === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {student.status || 'active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {selectedClass !== 'all' && (
                      <button onClick={()=>openHistory(student)} className="text-xs px-3 py-1.5 rounded-md border bg-white hover:bg-gray-50">View</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Drawer */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-stretch justify-end">
          <div className="bg-white w-full max-w-md shadow-xl border-l animate-slideInRight relative">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-sm font-semibold">Results History {selectedStudent ? `– ${selectedStudent.name}` : ''}</h3>
              <button onClick={()=>setHistoryOpen(false)} className="p-2 text-gray-500 hover:text-gray-700"><X className="w-4 h-4"/></button>
            </div>
            <div className="p-4 space-y-3">
              {historyLoading && <div className="text-xs text-gray-500">Loading…</div>}
              {!historyLoading && historyData && (historyData.assignments||[]).length === 0 && (
                <div className="text-xs text-gray-500">No results yet.</div>
              )}
              {!historyLoading && historyData && (historyData.assignments||[]).map(a => (
                <div key={a.assignmentId} className="p-3 rounded-lg border bg-gray-50">
                  <div className="text-sm font-medium text-gray-800 mb-1">{a.title}</div>
                  <div className="space-y-1">
                    {a.games.map(g => (
                      <div key={g.gameId} className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-600">{g.name}</span>
                        <span className="text-gray-800">Best {g.bestPercentage}% • {g.attemptCount} attempts</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1" onClick={()=>setHistoryOpen(false)} />
        </div>
      )}

      {/* Luck Wheel Modal (UI-first) */}
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
              <div className={`h-48 rounded-xl border flex items-center justify-center ${wheelSpinning ? 'animate-pulse' : ''}`}>
                <div className="text-center">
                  <div className="text-xs text-gray-500">{wheelSpinning ? 'Spinning…' : 'Ready'}</div>
                  <div className="text-lg font-semibold text-gray-800 mt-1">
                    {wheelLastPick ? (students.find(s=>s.id===wheelLastPick)?.name || 'Student') : '—'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button disabled={wheelSpinning || wheelPool.length===0} onClick={rollWheel} className="px-3 py-1.5 text-sm rounded-md border bg-white hover:bg-gray-50 disabled:opacity-50">Spin</button>
                {wheelMode === 'elimination' && (
                  <button onClick={()=>setWheelPool(students.map(s=>s.id))} className="px-3 py-1.5 text-sm rounded-md border bg-white hover:bg-gray-50">Reset Pool</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherStudents;
