// client/src/components/admin/Analytics.jsx
import React from 'react';
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
  // Fake analytics data
  const kpis = [
    {
      id: 1,
      label: 'Active Users',
      value: '2,453',
      icon: <Users className="w-6 h-6 text-blue-500" />,
    },
    {
      id: 2,
      label: 'Sessions',
      value: '8,210',
      icon: <Activity className="w-6 h-6 text-green-500" />,
    },
    {
      id: 3,
      label: 'Bounce Rate',
      value: '32.5%',
      icon: <BarChart3 className="w-6 h-6 text-red-500" />,
    },
  ];

  const userTrends = [
    { day: 'Mon', users: 240 },
    { day: 'Tue', users: 390 },
    { day: 'Wed', users: 300 },
    { day: 'Thu', users: 460 },
    { day: 'Fri', users: 380 },
    { day: 'Sat', users: 220 },
    { day: 'Sun', users: 400 },
  ];

  const sessionStats = [
    { name: 'Chrome', sessions: 4000 },
    { name: 'Safari', sessions: 3000 },
    { name: 'Firefox', sessions: 2000 },
    { name: 'Edge', sessions: 1000 },
  ];

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
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={userTrends}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="bg-gray-50 border border-gray-100 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Sessions by Browser</h3>
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
        </div>
      </div>
    </div>
  );
};

export default Analytics;
