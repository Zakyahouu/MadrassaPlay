import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Reports = () => {
  const [assignments, setAssignments] = useState([]);
  const [summaries, setSummaries] = useState({});
  const [loading, setLoading] = useState(true);
  const [openDetails, setOpenDetails] = useState(null);
  const [studentsByAssignment, setStudentsByAssignment] = useState({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const a = await axios.get('/api/assignments/teacher');
        if (!mounted) return;
        setAssignments(a.data || []);
        // Fetch summaries in parallel
        const pairs = await Promise.all((a.data || []).map(async (as) => {
          try {
            const s = await axios.get(`/api/reporting/assignments/${as._id}/summary`);
            return [as._id, s.data];
          } catch { return [as._id, null]; }
        }));
        const map = {};
        for (const [id, s] of pairs) map[id] = s;
        setSummaries(map);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div>Loading reports…</div>;

  return (
    <div className="space-y-4">
      {assignments.length === 0 && <div className="text-sm text-gray-500">No assignments yet.</div>}
      {assignments.map((a) => {
        const s = summaries[a._id];
        return (
          <div key={a._id} className="bg-white border p-4 rounded-xl">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-900">{a.title}</p>
                <p className="text-xs text-gray-500">{new Date(a.startDate).toLocaleDateString()} → {new Date(a.endDate).toLocaleDateString()}</p>
              </div>
              {s ? (
                <div className="text-right">
                  <p className="text-sm text-gray-700">Students: {s.totalStudents}</p>
                  <p className="text-sm text-gray-700">Submitted: {s.submittedCount} • Pending: {s.pendingCount}</p>
                  <p className="text-sm font-bold text-gray-900">Avg: {s.averagePercentage}%</p>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No results yet</div>
              )}
            </div>
            <div className="mt-3">
              <button
                className="text-xs text-indigo-600"
                onClick={async ()=>{
                  setOpenDetails(openDetails===a._id?null:a._id);
                  if (!studentsByAssignment[a._id]) {
                    try {
                      const resp = await axios.get(`/api/reporting/assignments/${a._id}/students`);
                      setStudentsByAssignment(prev=>({ ...prev, [a._id]: resp.data.items || [] }));
                    } catch {}
                  }
                }}
              >{openDetails===a._id ? 'Hide' : 'Show'} students</button>
            </div>
            {openDetails===a._id && (
              <div className="mt-3 border-t pt-3">
                {(studentsByAssignment[a._id]||[]).length===0 ? (
                  <div className="text-xs text-gray-500">No students yet.</div>
                ) : (
                  <ul className="text-sm text-gray-800 space-y-1">
                    {(studentsByAssignment[a._id]||[]).map(st => (
                      <li key={st.id} className="flex justify-between">
                        <span>{st.name}</span>
                        <span className="text-gray-600">Best: {st.bestPercentage}%</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Reports;
