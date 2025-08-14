import React, { useEffect, useState } from 'react';
import axios from 'axios';

const badgeFor = (status) => {
  const base = 'px-2 py-0.5 text-xs rounded-full';
  if (status === 'active') return `${base} bg-green-100 text-green-800`;
  if (status === 'upcoming') return `${base} bg-yellow-100 text-yellow-800`;
  return `${base} bg-gray-200 text-gray-700`;
};

const AssignmentsList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get('/api/assignments/teacher');
        if (mounted) setItems(res.data || []);
      } catch (_) { /* ignore */ }
      finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>;

  if (items.length === 0) return <div className="text-sm text-gray-500">No assignments yet.</div>;

  return (
    <div className="space-y-2">
      {items.map(a => (
        <div key={a._id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
          <div>
            <div className="font-medium text-gray-900">{a.title}</div>
            <div className="text-xs text-gray-500">{new Date(a.startDate).toLocaleString()} → {new Date(a.endDate).toLocaleString()}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className={badgeFor(a.status)}>{a.status}</span>
            <span className="text-xs text-gray-500">Games: {a.gameCreations?.length || 0}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AssignmentsList;
