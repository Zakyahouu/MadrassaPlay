import React, { useState } from 'react';
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
            {reportType === 'academic' ? 'Grade Distribution' :
             reportType === 'attendance' ? 'Attendance Trends' : 'Revenue vs Expenses'}
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 mx-auto mb-2 text-gray-300" />
              <p>Chart visualization would be displayed here</p>
              <p className="text-sm">(Integration with charting library needed)</p>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Detailed Breakdown</h3>
          <div className="space-y-3">
            {reportType === 'academic' && (
              <>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Grade A</span>
                  <span className="font-medium">32%</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Grade B</span>
                  <span className="font-medium">41%</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Grade C</span>
                  <span className="font-medium">21%</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Grade D</span>
                  <span className="font-medium">4%</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Grade F</span>
                  <span className="font-medium">2%</span>
                </div>
              </>
            )}
            
            {reportType === 'attendance' && (
              <>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">95-100%</span>
                  <span className="font-medium">156 students</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">90-94%</span>
                  <span className="font-medium">284 students</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">85-89%</span>
                  <span className="font-medium">142 students</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">80-84%</span>
                  <span className="font-medium">89 students</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Below 80%</span>
                  <span className="font-medium">45 students</span>
                </div>
              </>
            )}

            {reportType === 'financial' && (
              <>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Tuition Fees</span>
                  <span className="font-medium">DA 1,890,000</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Registration Fees</span>
                  <span className="font-medium">DA 340,000</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Extra Activities</span>
                  <span className="font-medium">DA 220,000</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Staff Salaries</span>
                  <span className="font-medium text-red-600">-DA 1,200,000</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Operating Costs</span>
                  <span className="font-medium text-red-600">-DA 690,000</span>
                </div>
              </>
            )}
          </div>
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