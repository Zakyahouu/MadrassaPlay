import React, { useEffect, useMemo, useState } from 'react';
import { Plus, AlertCircle, FileText, CheckCircle } from 'lucide-react';
import AssignmentCreate from './AssignmentCreate';
import AssignmentsList from './AssignmentsList';
import AssignmentCard from './AssignmentCard';

const TeacherAssignments = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [summaryMap, setSummaryMap] = useState({}); // id -> { submittedCount, totalStudents }
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [detailsAssignment, setDetailsAssignment] = useState(null);
  const [studentsList, setStudentsList] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [counts, setCounts] = useState({ active: 0, upcoming: 0, completed: 0, canceled: 0, total: 0 });
  const [attemptsModal, setAttemptsModal] = useState({ open: false, student: null, data: null, loading: false });

  const loadAssignments = async () => {
    try {
      const axios = (await import('axios')).default;
  const params = { page, limit };
  if (activeTab !== 'all') params.status = activeTab;
  const res = await axios.get('/api/assignments/teacher', { params });
      if (Array.isArray(res.data?.items)) {
        setItems(res.data.items);
        setTotal(res.data.total || 0);
        if (res.data.counts) setCounts(res.data.counts);
      } else {
        // fallback to list
        setItems(res.data || []);
        const totalLen = res.data?.length || 0;
        setTotal(totalLen);
  setCounts({ active: 0, upcoming: 0, completed: 0, canceled: 0, total: totalLen });
      }
    } catch (_) { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      await loadAssignments();
    })();
    return () => { mounted = false; };
  }, [page, limit, activeTab]);

  // Load lightweight summaries for completion rates (best-effort, limit to 25 to keep it snappy)
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!items.length) { setSummaryMap({}); return; }
      setSummaryLoading(true);
      try {
        const axios = (await import('axios')).default;
        const slice = items.slice(0, 25);
        const results = await Promise.allSettled(slice.map(a => axios.get(`/api/reporting/assignments/${a._id}/summary`)));
        if (!mounted) return;
        const map = {};
        for (let i = 0; i < slice.length; i++) {
          const r = results[i];
          if (r.status === 'fulfilled') {
            const d = r.value.data;
            map[slice[i]._id] = { submittedCount: d.submittedCount || 0, totalStudents: d.totalStudents || 0 };
          }
        }
        setSummaryMap(map);
      } catch (_) { setSummaryMap({}); }
      finally { if (mounted) setSummaryLoading(false); }
    })();
    return () => { mounted = false; };
  }, [items]);

  const active = useMemo(() => items.filter(a => a.status === 'active'), [items]);
  const completed = useMemo(() => items.filter(a => a.status === 'completed'), [items]);
  const upcoming = useMemo(() => items.filter(a => a.status === 'upcoming'), [items]);
  const canceled = useMemo(() => items.filter(a => a.status === 'canceled'), [items]);

  const deleteAssignment = async (a) => {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      const axios = (await import('axios')).default;
      await axios.delete(`/api/assignments/${a._id}`);
      await loadAssignments();
    } catch (_) {}
  };

  const cancelAssignment = async (a) => {
    if (!window.confirm('Cancel this assignment?')) return;
    try {
      const axios = (await import('axios')).default;
      await axios.post(`/api/assignments/${a._id}/cancel`);
      await loadAssignments();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to cancel.';
      alert(msg);
    }
  };

  const openDetails = async (a) => {
    setDetailsAssignment(a);
    setStudentsLoading(true);
    try {
      const axios = (await import('axios')).default;
      const res = await axios.get(`/api/reporting/assignments/${a._id}/students`);
      setStudentsList(res.data?.items || []);
    } catch (_) { setStudentsList([]); }
    finally { setStudentsLoading(false); }
  };

  const openAttemptsForStudent = async (student) => {
    if (!detailsAssignment) return;
    setAttemptsModal({ open: true, student, data: null, loading: true });
    try {
      const axios = (await import('axios')).default;
      const res = await axios.get(`/api/reporting/assignments/${detailsAssignment._id}/students/${student.id}/attempts`);
      setAttemptsModal(prev => ({ ...prev, data: res.data || { games: [] }, loading: false }));
    } catch (_) {
      setAttemptsModal(prev => ({ ...prev, data: { games: [] }, loading: false }));
    }
  };

  const completionRate = useMemo(() => {
    // Average across summaries we have
    const vals = Object.values(summaryMap);
    if (!vals.length) return null;
    let totalSubmitted = 0, totalAll = 0;
    for (const v of vals) { totalSubmitted += v.submittedCount; totalAll += v.totalStudents; }
    if (totalAll === 0) return 0;
    return Math.round((totalSubmitted / totalAll) * 100);
  }, [summaryMap]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600">Manage homework and learning tasks</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" />
          <span>New Assignment</span>
        </button>
      </div>

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">New Assignment</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <AssignmentCreate onCreated={async () => { await loadAssignments(); setShowCreateModal(false); }} />
          </div>
        </div>
      )}

  {/* Tab Navigation (Active / Upcoming / Completed / All) */}
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
            Active ({counts.active})
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upcoming'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Upcoming ({counts.upcoming})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'completed'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Completed ({counts.completed})
          </button>
          <button
            onClick={() => setActiveTab('canceled')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'canceled'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Canceled ({counts.canceled})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Assignments ({counts.total})
          </button>
          <div className="ml-auto flex items-center gap-2 text-xs">
            <button disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
            <span className="text-gray-500">Page {page} / {Math.max(1, Math.ceil(total/limit))}</span>
            <button disabled={page>=Math.max(1, Math.ceil(total/limit))} onClick={()=>setPage(p=>p+1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
          </div>
        </nav>
      </div>

      {/* Active Assignments (live data) */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {loading && <div className="text-sm text-gray-500">Loading…</div>}
          {!loading && active.length === 0 && <div className="text-sm text-gray-500">No active assignments.</div>}
      {!loading && active.map((a) => (
            <AssignmentCard
              key={a._id}
              assignment={a}
              summary={summaryMap[a._id]}
              onView={() => openDetails(a)}
              onEdit={null}
        onDelete={null}
              onCancel={() => cancelAssignment(a)}
            />
          ))}
        </div>
      )}

      {/* Upcoming Assignments */}
      {activeTab === 'upcoming' && (
        <div className="space-y-4">
          {loading && <div className="text-sm text-gray-500">Loading…</div>}
          {!loading && upcoming.length === 0 && <div className="text-sm text-gray-500">No upcoming assignments.</div>}
          {!loading && upcoming.map((a) => (
            <AssignmentCard
              key={a._id}
              assignment={{ ...a, status: 'upcoming' }}
              onView={() => openDetails(a)}
              onEdit={null}
              onDelete={() => deleteAssignment(a)}
              onCancel={() => cancelAssignment(a)}
            />
          ))}
        </div>
      )}

      {/* Completed Assignments (live data) */}
      {activeTab === 'completed' && (
        <div className="space-y-4">
          {loading && <div className="text-sm text-gray-500">Loading…</div>}
          {!loading && completed.length === 0 && <div className="text-sm text-gray-500">No completed assignments.</div>}
          {!loading && completed.map((a) => (
            <AssignmentCard
              key={a._id}
              assignment={{ ...a, status: 'completed' }}
              summary={summaryMap[a._id]}
              onView={() => openDetails(a)}
              onEdit={null}
              onDelete={() => deleteAssignment(a)}
            />
          ))}
        </div>
      )}

      {/* Canceled Assignments */}
      {activeTab === 'canceled' && (
        <div className="space-y-4">
          {loading && <div className="text-sm text-gray-500">Loading…</div>}
          {!loading && canceled.length === 0 && <div className="text-sm text-gray-500">No canceled assignments.</div>}
          {!loading && canceled.map((a) => (
            <AssignmentCard
              key={a._id}
              assignment={{ ...a, status: 'canceled' }}
              onView={() => openDetails(a)}
              onEdit={null}
              onDelete={() => deleteAssignment(a)}
            />
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Assignments</p>
              <p className="text-2xl font-bold text-gray-900">{items.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{active.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{completionRate === null ? '—' : `${completionRate}%`}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* All Assignments List */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">All Assignments</h3>
            <AssignmentsList />
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailsAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetailsAssignment(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{detailsAssignment.title}</h2>
                <p className="text-sm text-gray-500">{new Date(detailsAssignment.startDate).toLocaleString()} → {new Date(detailsAssignment.endDate).toLocaleString()}</p>
              </div>
              <button onClick={() => setDetailsAssignment(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            {detailsAssignment.description && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{detailsAssignment.description}</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Attempt limit</p>
                <p className="text-sm font-medium text-gray-900">{detailsAssignment.attemptLimit || 1}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Games attached</p>
                <p className="text-sm font-medium text-gray-900">{Array.isArray(detailsAssignment.gameCreations) ? detailsAssignment.gameCreations.length : 0}</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-500">Completion</p>
              <p className="text-sm font-medium text-gray-900">{(() => {
                const s = summaryMap[detailsAssignment._id];
                return s ? `${s.submittedCount}/${s.totalStudents} submitted` : '—';
              })()}</p>
            </div>
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Submissions</h4>
              {studentsLoading && <div className="text-xs text-gray-500">Loading…</div>}
              {!studentsLoading && (
                <div className="max-h-60 overflow-auto border rounded-lg divide-y">
                  {studentsList.length === 0 && (
                    <div className="text-xs text-gray-500 p-3">No targeted students or no results yet.</div>
                  )}
                  {studentsList.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 text-sm">
                      <div className="flex flex-col">
                        <span className="text-gray-800">{s.name || 'Student'}</span>
                        <span className="text-xs text-gray-500">Attempts: {s.attemptCount || 0} • Best: {s.bestPercentage ?? 0}%</span>
                      </div>
                      <button
                        className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
                        onClick={() => openAttemptsForStudent(s)}
                      >
                        View attempts
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDetailsAssignment(null)} className="px-4 py-2 rounded border">Close</button>
              {/* Placeholder for future reporting route/button */}
            </div>
          </div>
        </div>
      )}

      {/* Attempts Modal */}
      {attemptsModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAttemptsModal({ open: false, student: null, data: null, loading: false })} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl mx-4 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{attemptsModal.student?.name || 'Student'} · Attempts</h2>
                {detailsAssignment && (
                  <p className="text-xs text-gray-500">Assignment: {detailsAssignment.title}</p>
                )}
              </div>
              <button onClick={() => setAttemptsModal({ open: false, student: null, data: null, loading: false })} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            {attemptsModal.loading && <div className="text-sm text-gray-500">Loading…</div>}
            {!attemptsModal.loading && (
              <div className="space-y-4 max-h-80 overflow-auto">
                {(!attemptsModal.data || attemptsModal.data.games?.length === 0) && (
                  <div className="text-sm text-gray-500">No attempts yet.</div>
                )}
                {attemptsModal.data?.games?.map(g => (
                  <div key={g.gameId} className="border rounded-lg">
                    <div className="px-3 py-2 bg-gray-50 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800">{g.name}</span>
                      <span className="text-xs text-gray-500">Best: {g.bestPercentage}% · {g.attemptCount} attempts</span>
                    </div>
                    <div className="divide-y">
                      {g.attempts.map((a, idx) => (
                        <div key={idx} className="px-3 py-2 text-sm flex items-center justify-between">
                          <span className="text-gray-700">Attempt {a.attemptNumber} · {new Date(a.createdAt).toLocaleString()}</span>
                          <span className="text-gray-600">{a.score}/{a.totalPossibleScore} ({a.percentage}%) {a.counted ? '' : '· not counted'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button onClick={() => setAttemptsModal({ open: false, student: null, data: null, loading: false })} className="px-4 py-2 rounded border">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAssignments;
