import React, { useEffect, useMemo, useState } from 'react';
import { Plus, AlertCircle, FileText, CheckCircle, Calendar, Users } from 'lucide-react';
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
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-8 border border-purple-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Assignments</h1>
            <p className="text-gray-600 text-lg">Create and manage learning tasks for your students</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-3 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            <span>Create Assignment</span>
          </button>
        </div>
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

      {/* Enhanced Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-1 p-2">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === 'active'
                  ? 'bg-purple-100 text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${activeTab === 'active' ? 'bg-purple-500' : 'bg-gray-300'}`}></div>
                <span>Active</span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  activeTab === 'active' ? 'bg-purple-200 text-purple-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {counts.active}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === 'upcoming'
                  ? 'bg-amber-100 text-amber-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${activeTab === 'upcoming' ? 'bg-amber-500' : 'bg-gray-300'}`}></div>
                <span>Upcoming</span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  activeTab === 'upcoming' ? 'bg-amber-200 text-amber-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {counts.upcoming}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === 'completed'
                  ? 'bg-green-100 text-green-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${activeTab === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span>Completed</span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  activeTab === 'completed' ? 'bg-green-200 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {counts.completed}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('canceled')}
              className={`px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === 'canceled'
                  ? 'bg-red-100 text-red-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${activeTab === 'canceled' ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                <span>Canceled</span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  activeTab === 'canceled' ? 'bg-red-200 text-red-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {counts.canceled}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === 'all'
                  ? 'bg-gray-100 text-gray-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${activeTab === 'all' ? 'bg-gray-500' : 'bg-gray-300'}`}></div>
                <span>All</span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  activeTab === 'all' ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {counts.total}
                </span>
              </div>
            </button>
            <div className="ml-auto flex items-center gap-2">
              <button 
                disabled={page===1} 
                onClick={()=>setPage(p=>Math.max(1,p-1))} 
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500 px-2">
                Page {page} of {Math.max(1, Math.ceil(total/limit))}
              </span>
              <button 
                disabled={page>=Math.max(1, Math.ceil(total/limit))} 
                onClick={()=>setPage(p=>p+1)} 
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </nav>
        </div>
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

      {/* Enhanced Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 shadow-sm border border-purple-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700 mb-1">Total Assignments</p>
              <p className="text-3xl font-bold text-purple-900">{items.length}</p>
              <p className="text-xs text-purple-600 mt-1">All time</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 shadow-sm border border-blue-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 mb-1">Active</p>
              <p className="text-3xl font-bold text-blue-900">{active.length}</p>
              <p className="text-xs text-blue-600 mt-1">Currently running</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <AlertCircle className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 shadow-sm border border-green-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 mb-1">Completion Rate</p>
              <p className="text-3xl font-bold text-green-900">{completionRate === null ? '—' : `${completionRate}%`}</p>
              <p className="text-xs text-green-600 mt-1">Average success</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 shadow-sm border border-amber-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-700 mb-1">Upcoming</p>
              <p className="text-3xl font-bold text-amber-900">{upcoming.length}</p>
              <p className="text-xs text-amber-600 mt-1">Scheduled</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
              <Calendar className="w-7 h-7 text-white" />
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

      {/* Enhanced Details Modal */}
      {detailsAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDetailsAssignment(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{detailsAssignment.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      <span>Start: {new Date(detailsAssignment.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      <span>End: {new Date(detailsAssignment.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setDetailsAssignment(null)} 
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {detailsAssignment.description && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Description</h4>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{detailsAssignment.description}</p>
                  </div>
                </div>
              )}

              {/* Assignment Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-700">Attempt Limit</p>
                      <p className="text-xl font-bold text-blue-900">{detailsAssignment.attemptLimit || 1}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-700">Games Attached</p>
                      <p className="text-xl font-bold text-green-900">{Array.isArray(detailsAssignment.gameCreations) ? detailsAssignment.gameCreations.length : 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-700">Completion</p>
                      <p className="text-xl font-bold text-purple-900">{(() => {
                        const s = summaryMap[detailsAssignment._id];
                        return s ? `${s.submittedCount}/${s.totalStudents}` : '—';
                      })()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Submissions */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Student Submissions</h4>
                {studentsLoading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <span className="ml-3 text-gray-600">Loading submissions...</span>
                  </div>
                )}
                {!studentsLoading && (
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    {studentsList.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500">No submissions yet</p>
                        <p className="text-sm text-gray-400 mt-1">Students haven't completed this assignment</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {studentsList.map(s => (
                          <div key={s.id} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                                  <span className="text-white font-bold text-sm">{(s.name || 'S').slice(0, 1).toUpperCase()}</span>
                                </div>
                                <div>
                                  <h5 className="font-semibold text-gray-900">{s.name || 'Student'}</h5>
                                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                    <span>Attempts: <span className="font-medium text-gray-700">{s.attemptCount || 0}</span></span>
                                    <span>Best Score: <span className="font-medium text-gray-700">{s.bestPercentage ?? 0}%</span></span>
                                  </div>
                                </div>
                              </div>
                              <button
                                className="px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                                onClick={() => openAttemptsForStudent(s)}
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button 
                onClick={() => setDetailsAssignment(null)} 
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Attempts Modal */}
      {attemptsModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setAttemptsModal({ open: false, student: null, data: null, loading: false })} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {attemptsModal.student?.name || 'Student'} · Attempts
                  </h2>
                  {detailsAssignment && (
                    <p className="text-sm text-gray-600">Assignment: {detailsAssignment.title}</p>
                  )}
                </div>
                <button 
                  onClick={() => setAttemptsModal({ open: false, student: null, data: null, loading: false })} 
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {attemptsModal.loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <span className="ml-3 text-gray-600">Loading attempts...</span>
                </div>
              )}
              {!attemptsModal.loading && (
                <div className="space-y-6">
                  {(!attemptsModal.data || attemptsModal.data.games?.length === 0) && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                        </svg>
                      </div>
                      <p className="text-gray-500">No attempts yet</p>
                      <p className="text-sm text-gray-400 mt-1">Student hasn't started this assignment</p>
                    </div>
                  )}
                  {attemptsModal.data?.games?.map(g => (
                    <div key={g.gameId} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">{g.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                              </svg>
                              Best: {g.bestPercentage}%
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {g.attemptCount} attempts
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="divide-y divide-gray-200">
                        {g.attempts.map((a, idx) => (
                          <div key={idx} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  a.percentage >= 80 ? 'bg-green-100 text-green-700' :
                                  a.percentage >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  <span className="text-sm font-bold">{a.attemptNumber}</span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">Attempt {a.attemptNumber}</p>
                                  <p className="text-xs text-gray-500">{new Date(a.createdAt).toLocaleString()}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold text-gray-900">
                                  {a.score}/{a.totalPossibleScore} ({a.percentage}%)
                                </div>
                                {!a.counted && (
                                  <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                                    Not counted
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
              <button 
                onClick={() => setAttemptsModal({ open: false, student: null, data: null, loading: false })} 
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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

export default TeacherAssignments;
