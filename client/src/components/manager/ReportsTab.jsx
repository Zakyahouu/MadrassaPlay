import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { 
  Users, BookOpen, GraduationCap, Calendar, BarChart3, Settings, Bell, 
  UserCheck, Building2, FileText, Search, Plus, Edit, Trash2, Eye,
  Clock, Star, Award, TrendingUp, Filter, Download, Mail, Phone
} from 'lucide-react';
import StatsCard from './shared/StatsCard';
import QuickActionCard from './shared/QuickActionCard';
import NotificationItem from './shared/NotificationItem'; 
import ManagerClassPanel from './shared/ManagerClassPanel';
import ManagerSchoolPanel from './shared/ManagerSchoolPanel';
// Reports Tab Component
const ReportsTab = () => {
  const [reportType, setReportType] = useState('academic');
  const [dateRange, setDateRange] = useState('month');
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [performance, setPerformance] = useState({ items: [] });
  const [loadingPerf, setLoadingPerf] = useState(false);

  // Load classes for this manager's school (server will scope by role)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get('/api/classes');
        if (!mounted) return;
        setClasses(res.data || []);
        if ((res.data || []).length > 0) setSelectedClass(res.data[0]._id);
      } catch (_) {
        setClasses([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Load performance for the selected class
  useEffect(() => {
    if (!selectedClass) return;
    let mounted = true;
    (async () => {
      setLoadingPerf(true);
      try {
        const res = await axios.get(`/api/reporting/classes/${selectedClass}/performance`);
        if (mounted) setPerformance(res.data || { items: [] });
      } catch (_) {
        if (mounted) setPerformance({ items: [] });
      } finally {
        if (mounted) setLoadingPerf(false);
      }
    })();
    return () => { mounted = false; };
  }, [selectedClass]);

  const reportData = {
    academic: {
      avgGrade: 'B+',
      passRate: '94%',
      topPerformer: 'Ahmed Hassan',
      improvement: '+5.2%'
    },
    attendance: {
      avgAttendance: '92%',
      perfectAttendance: '156 students',
      tardiness: '8%',
      improvement: '+2.1%'
    },
    financial: {
      totalRevenue: 'DA 2,450,000',
      expenses: 'DA 1,890,000',
      profit: 'DA 560,000',
      improvement: '+12.3%'
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="academic">Academic Performance</option>
            <option value="attendance">Attendance Reports</option>
            <option value="financial">Financial Reports</option>
          </select>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a Class</option>
            {classes.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Report Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Trend</h3>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">Positive</p>
          <p className="text-sm text-gray-600 mt-1">Consistent improvement</p>
        </div>
      </div>

      {/* Detailed Report Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Area */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">
            {selectedClass ? 'Class Assignment Performance' : 'Select a class'}
          </h3>
          <div className="h-64">
            {selectedClass && performance.items?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performance.items} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="title" angle={-20} textAnchor="end" interval={0} height={60} tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v)=>`${v}%`} />
                  <Bar dataKey="averagePercentage" fill="#6366f1" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 mx-auto mb-2 text-gray-300" />
                  <p>No performance data to display</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Class Performance</h3>
          {!selectedClass && <div className="text-sm text-gray-500">Select a class to view performance.</div>}
          {selectedClass && (
            <div className="space-y-3">
              {loadingPerf && <div className="text-sm text-gray-500">Loading…</div>}
              {!loadingPerf && performance.items?.length === 0 && (
                <div className="text-sm text-gray-500">No performance data yet.</div>
              )}
              {!loadingPerf && performance.items?.map((item) => (
                <div key={item.assignmentId} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">{item.title}</span>
                  <span className="font-medium">{item.averagePercentage}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 py-3 border-b border-gray-100">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">Monthly academic report generated</p>
              <p className="text-xs text-gray-500">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-3 border-b border-gray-100">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">Attendance report exported to PDF</p>
              <p className="text-xs text-gray-500">5 hours ago</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">Financial report sent to board</p>
              <p className="text-xs text-gray-500">1 day ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ReportsTab;