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
  const [kpis, setKpis] = useState([
    { id: 1, label: 'Total Users', value: '—', icon: <Users className="w-6 h-6 text-blue-500" /> },
    { id: 2, label: 'Total Schools', value: '—', icon: <Activity className="w-6 h-6 text-green-500" /> },
    { id: 3, label: 'Game Templates', value: '—', icon: <BarChart3 className="w-6 h-6 text-red-500" /> },
  ]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [u, s, t] = await Promise.all([
          axios.get('/api/users/count'),
          axios.get('/api/schools/count'),
          axios.get('/api/templates/count'),
        ]);
        if (!mounted) return;
        setKpis([
          { id: 1, label: 'Total Users', value: (u.data?.count ?? 0).toString(), icon: <Users className="w-6 h-6 text-blue-500" /> },
          { id: 2, label: 'Total Schools', value: (s.data?.count ?? 0).toString(), icon: <Activity className="w-6 h-6 text-green-500" /> },
          { id: 3, label: 'Game Templates', value: (t.data?.count ?? 0).toString(), icon: <BarChart3 className="w-6 h-6 text-red-500" /> },
        ]);
      } catch (_) {
        // leave placeholders
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