// client/src/components/admin/Analytics.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TrendingUp, Users, Activity, BarChart3 } from 'lucide-react';

const Analytics = () => {
  // Pagination and search state for school breakdown
  const [userBreakdown, setUserBreakdown] = useState([]);
  const [loadingBreakdown, setLoadingBreakdown] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [orderBy, setOrderBy] = useState('student');
  const [orderDir, setOrderDir] = useState('desc');

  // Filtered, ordered, and paginated schools
  const filteredBreakdown = userBreakdown.filter(row =>
    row.school.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const orderedBreakdown = [...filteredBreakdown].sort((a, b) => {
    const aVal = a.breakdown[orderBy] || 0;
    const bVal = b.breakdown[orderBy] || 0;
    return orderDir === 'asc' ? aVal - bVal : bVal - aVal;
  });
  const totalPages = Math.ceil(orderedBreakdown.length / rowsPerPage);
  const paginatedRows = orderedBreakdown.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  const [kpis, setKpis] = useState([
    { id: 1, label: 'Total Users', value: '—', icon: <Users className="w-6 h-6 text-blue-500" /> },
    { id: 2, label: 'Total Schools', value: '—', icon: <Activity className="w-6 h-6 text-green-500" /> },
    { id: 3, label: 'Game Templates', value: '—', icon: <BarChart3 className="w-6 h-6 text-red-500" /> },
  ]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [u, s, t, breakdownRes] = await Promise.all([
          axios.get('/api/users/count'),
          axios.get('/api/schools/count'),
          axios.get('/api/templates/count'),
          axios.get('/api/users/analytics/user-breakdown'),
        ]);
        if (!mounted) return;
        setKpis([
          { id: 1, label: 'Total Users', value: (u.data?.count ?? 0).toString(), icon: <Users className="w-6 h-6 text-blue-500" /> },
          { id: 2, label: 'Total Schools', value: (s.data?.count ?? 0).toString(), icon: <Activity className="w-6 h-6 text-green-500" /> },
          { id: 3, label: 'Game Templates', value: (t.data?.count ?? 0).toString(), icon: <BarChart3 className="w-6 h-6 text-red-500" /> },
        ]);
        setUserBreakdown(breakdownRes.data || []);
      } catch (_) {
        // leave placeholders
      } finally {
        setLoadingBreakdown(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const [userTrends, setUserTrends] = useState([]);
  const [sessionStats, setSessionStats] = useState([]);

  useEffect(() => {
    let mounted = true;
    const token = (() => { try { return JSON.parse(localStorage.getItem('user'))?.token; } catch { return null; } })();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    (async () => {
      try {
        const [dau, tpl] = await Promise.all([
          axios.get('/api/reporting/analytics/weekly-active-users', { headers }),
          axios.get('/api/reporting/analytics/sessions-by-template', { headers }),
        ]);
        if (!mounted) return;
        const days = (dau.data?.items || []).map(i => ({ day: i.day.slice(5), users: i.users }));
        setUserTrends(days);
        setSessionStats(tpl.data?.items || []);
      } catch (_) {
        // keep empty
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
      {/* Header */}
      <div className="text-center mb-8 space-y-3">
        <div className="w-16 h-16 bg-indigo-100 rounded-full mx-auto flex items-center justify-center">
          <TrendingUp className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <p className="text-gray-600">Visual reports and performance tracking</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {kpis.map((kpi) => (
          <div
            key={kpi.id}
            className="flex items-center bg-gray-50 border border-gray-100 p-4 rounded-lg"
          >
            <div className="mr-4">{kpi.icon}</div>
            <div>
              <p className="text-sm text-gray-500">{kpi.label}</p>
              <p className="text-lg font-semibold text-gray-900">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* User Breakdown Table with Search, Ordering & Pagination */}
      <div className="mb-10">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">User Breakdown by School & Type</h3>
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <input
            type="text"
            className="border border-gray-300 rounded px-3 py-2 w-full sm:w-64"
            placeholder="Search school..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
          <div className="flex items-center gap-2">
            <span className="text-sm">Order by:</span>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={orderBy}
              onChange={e => { setOrderBy(e.target.value); setCurrentPage(1); }}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
            </select>
            <button
              className="px-2 py-1 border rounded text-sm"
              onClick={() => { setOrderDir(d => d === 'asc' ? 'desc' : 'asc'); setCurrentPage(1); }}
            >{orderDir === 'asc' ? 'Asc' : 'Desc'}</button>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                className="px-2 py-1 border rounded disabled:opacity-50"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >Prev</button>
              <span className="text-sm">Page {currentPage} / {totalPages}</span>
              <button
                className="px-2 py-1 border rounded disabled:opacity-50"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >Next</button>
            </div>
          )}
        </div>
        {loadingBreakdown ? (
          <div className="text-gray-500">Loading...</div>
        ) : filteredBreakdown.length === 0 ? (
          <div className="text-gray-500">No data available.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead>
                <tr>
                  <th className="px-4 py-2 border-b text-left">School</th>
                  <th className="px-4 py-2 border-b text-left">Student</th>
                  <th className="px-4 py-2 border-b text-left">Teacher</th>
                  <th className="px-4 py-2 border-b text-left">Manager</th>
                  <th className="px-4 py-2 border-b text-left">Employee</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row) => (
                  <tr key={row.school._id}>
                    <td className="px-4 py-2 border-b">{row.school.name}</td>
                    <td className="px-4 py-2 border-b">{row.breakdown.student || 0}</td>
                    <td className="px-4 py-2 border-b">{row.breakdown.teacher || 0}</td>
                    <td className="px-4 py-2 border-b">{row.breakdown.manager || 0}</td>
                    <td className="px-4 py-2 border-b">{row.breakdown.employee || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Line Chart */}
        <div className="bg-gray-50 border border-gray-100 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Active Users</h3>
          {userTrends.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-sm text-gray-500">No data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={userTrends}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar Chart */}
        <div className="bg-gray-50 border border-gray-100 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Sessions by Template</h3>
          {sessionStats.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-sm text-gray-500">No data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={sessionStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sessions" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;