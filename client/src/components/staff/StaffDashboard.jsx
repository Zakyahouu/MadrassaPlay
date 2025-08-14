// StaffDashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const StatCard = ({ label, value, color }) => (
  <div className="p-4 rounded-xl border bg-white shadow-sm">
    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
  </div>
);

const StaffDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get('/api/staff/overview');
        if (mounted) setStats(res.data);
      } catch (e) {
        if (mounted) setError('Failed to load overview');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-1">Staff Dashboard</h2>
        <p className="text-sm text-gray-600">Manage academic operations and monitor key metrics.</p>
      </div>

      <div>
        {loading && <div className="text-sm text-gray-500">Loading metrics…</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard label="Students" value={stats.students} color="text-indigo-600" />
            <StatCard label="Teachers" value={stats.teachers} color="text-blue-600" />
            <StatCard label="Staff" value={stats.staff} color="text-purple-600" />
            <StatCard label="Classes" value={stats.classes} color="text-emerald-600" />
            <StatCard label="Assignments" value={stats.assignments} color="text-orange-600" />
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-xl border space-y-4">
          <h3 className="font-semibold text-gray-800">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <button className="p-3 rounded-lg border hover:border-indigo-400 hover:bg-indigo-50 text-left">Add Staff</button>
              <button className="p-3 rounded-lg border hover:border-indigo-400 hover:bg-indigo-50 text-left">Enroll Student</button>
              <button className="p-3 rounded-lg border hover:border-indigo-400 hover:bg-indigo-50 text-left">Create Class</button>
              <button className="p-3 rounded-lg border hover:border-indigo-400 hover:bg-indigo-50 text-left">Record Payment</button>
            </div>
        </div>
        <div className="p-6 bg-white rounded-xl border space-y-4">
          <h3 className="font-semibold text-gray-800">Recent Activity</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex justify-between"><span>New class created</span><span className="text-xs text-gray-400">2h</span></li>
            <li className="flex justify-between"><span>Payment recorded</span><span className="text-xs text-gray-400">4h</span></li>
            <li className="flex justify-between"><span>Staff member added</span><span className="text-xs text-gray-400">Yesterday</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
