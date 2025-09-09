import React, { useEffect, useState } from 'react';
import AssignmentCard from './AssignmentCard';

// A full list view for the "All" tab, reusing the same card component
export default function AssignmentsList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [summaryMap, setSummaryMap] = useState({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const axios = (await import('axios')).default;
        const res = await axios.get('/api/assignments/teacher', { params: { page, limit, status: 'all' } });
        const arr = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : [];
        if (!mounted) return;
        setItems(arr);
        setTotal(res.data?.total ?? arr.length ?? 0);
      } catch (_) {}
      finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [page, limit]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!items.length) { setSummaryMap({}); return; }
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
    })();
    return () => { mounted = false; };
  }, [items]);

  const handleDelete = async (a) => {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      const axios = (await import('axios')).default;
      await axios.delete(`/api/assignments/${a._id}`);
      // refresh current page
      const res = await axios.get('/api/assignments/teacher', { params: { page, limit, status: 'all' } });
      const arr = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : [];
      setItems(arr);
      setTotal(res.data?.total ?? arr.length ?? 0);
    } catch (e) {
      // noop
    }
  };

  const handleCancel = async (a) => {
    if (!window.confirm('Cancel this assignment? Students will no longer be able to submit.')) return;
    try {
      const axios = (await import('axios')).default;
      await axios.post(`/api/assignments/${a._id}/cancel`);
      const res = await axios.get('/api/assignments/teacher', { params: { page, limit, status: 'all' } });
      const arr = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : [];
      setItems(arr);
      setTotal(res.data?.total ?? arr.length ?? 0);
    } catch (_) {}
  };

  // Complete is now automatic (time or 100%), no manual action

  return (
    <div className="space-y-4">
      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {!loading && !items.length && <div className="text-sm text-gray-500">No assignments yet.</div>}
    {!loading && items.map(a => (
        <AssignmentCard
          key={a._id}
          assignment={a}
          summary={summaryMap[a._id]}
          onView={() => window.dispatchEvent(new CustomEvent('teacher:view-assignment', { detail: { assignment: a } }))}
          onEdit={null}
          onDelete={a.status === 'active' ? null : () => handleDelete(a)}
          onCancel={(a.status === 'upcoming' || a.status === 'active') ? () => handleCancel(a) : null}
        />
      ))}

      <div className="flex items-center justify-end gap-2 text-xs pt-2">
        <button disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
        <span className="text-gray-500">Page {page} / {Math.max(1, Math.ceil(total/limit))}</span>
        <button disabled={page>=Math.max(1, Math.ceil(total/limit))} onClick={()=>setPage(p=>p+1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
      </div>
    </div>
  );
}

