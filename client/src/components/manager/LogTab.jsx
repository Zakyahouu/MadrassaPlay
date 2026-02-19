import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { useLanguage } from '../../context/LanguageContext';
import {
  Activity,
  Filter,
  Search,
  Download,
  RefreshCw,
  Calendar,
  User,
  Shield,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Trash2,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  BookOpen,
  Settings
} from 'lucide-react';

const LogTab = ({ schoolId }) => {
  const { t, isRTL } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    userRole: '',
    action: '',
    category: '',
    severity: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [pagination, setPagination] = useState({});
  const [selectedLog, setSelectedLog] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch activity logs
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
      if (!token) {
        setError(t.authenticationRequired);
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };
      const params = new URLSearchParams();

      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await axios.get(`/api/logs/${schoolId}?${params}`, config);

      if (response.data.success) {
        setLogs(response.data.data.logs);
        setPagination({
          total: response.data.data.total,
          page: response.data.data.page,
          pages: response.data.data.pages
        });
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(err.response?.data?.message || t.failedToFetchLogs);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
      if (!token) return;

      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`/api/logs/${schoolId}/stats?days=30`, config);

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    if (schoolId) {
      fetchLogs();
      fetchStats();
    }
  }, [schoolId, filters]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 50,
      userRole: '',
      action: '',
      category: '',
      severity: '',
      startDate: '',
      endDate: '',
      search: ''
    });
  };

  // Export logs
  const exportLogs = async () => {
    try {
      const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
      if (!token) return;

      const config = { headers: { Authorization: `Bearer ${token}` } };
      const params = new URLSearchParams();

      Object.keys(filters).forEach(key => {
        if (filters[key] && key !== 'page' && key !== 'limit') {
          params.append(key, filters[key]);
        }
      });

      const response = await axios.get(`/api/logs/${schoolId}/export?${params}`, config);

      if (response.data.success) {
        // Convert to CSV and download
        const csvContent = convertToCSV(response.data.data);
        downloadCSV(csvContent, `activity-logs-${new Date().toISOString().split('T')[0]}.csv`);
      }
    } catch (err) {
      console.error('Error exporting logs:', err);
      alert(t.failedToExportLogs);
    }
  };

  // Convert data to CSV
  const convertToCSV = (data) => {
    const headers = ['Timestamp', 'User', 'Role', 'Action', 'Description', 'Category', 'Severity'];
    const csvContent = [
      headers.join(','),
      ...data.map(log => [
        log.timestamp,
        log.user,
        log.role,
        log.action,
        `"${log.description}"`,
        log.category,
        log.severity
      ].join(','))
    ].join('\n');

    return csvContent;
  };

  // Download CSV
  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'authentication': return Shield;
      case 'student_management': return Users;
      case 'teacher_management': return BookOpen;
      case 'employee_management': return Users;
      case 'class_management': return BookOpen;
      case 'attendance': return CheckCircle;
      case 'payments': return DollarSign;
      case 'finance': return BarChart3;
      case 'reports': return TrendingUp;
      case 'system': return Settings;
      default: return Activity;
    }
  };

  // Get action icon
  const getActionIcon = (action) => {
    if (action.includes('login') || action.includes('logout')) return Shield;
    if (action.includes('payment') || action.includes('salary')) return DollarSign;
    if (action.includes('attendance')) return CheckCircle;
    if (action.includes('create')) return XCircle;
    if (action.includes('update')) return RefreshCw;
    if (action.includes('delete')) return Trash2;
    if (action.includes('export') || action.includes('report')) return Download;
    return Activity;
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">{t.loadingActivityLogs}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-red-800">{t.errorLoadingLogs}</h3>
            <p className="text-red-600 mt-1">{error}</p>
            <button
              onClick={fetchLogs}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              {t.tryAgain}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{t.activityLogs}</h2>
              <p className="text-sm text-gray-600">
                {t.activityLogsDesc}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <Filter className="w-3 h-3" />
              <span>{showFilters ? t.hideFilters : t.showFilters}</span>
            </button>

            <button
              onClick={exportLogs}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>{t.export}</span>
            </button>

            <button
              onClick={fetchLogs}
              disabled={loading}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>{t.refresh}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">{t.totalActivities}</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalActivities}</p>
              </div>
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">{t.byRole}</p>
                <p className="text-lg font-semibold text-gray-900">
                  {Object.keys(stats.byRole).length} {t.roles}
                </p>
              </div>
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">{t.categories}</p>
                <p className="text-lg font-semibold text-gray-900">
                  {Object.keys(stats.byCategory).length} {t.types}
                </p>
              </div>
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">{t.severityLevels}</p>
                <p className="text-lg font-semibold text-gray-900">
                  {Object.keys(stats.bySeverity).length} {t.levels}
                </p>
              </div>
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">{t.filters}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{t.search}</label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                <input
                  type="text"
                  placeholder={t.searchLogs}
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{t.userRole}</label>
              <select
                value={filters.userRole}
                onChange={(e) => handleFilterChange('userRole', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t.allRoles}</option>
                <option value="student">{t.student}</option>
                <option value="teacher">{t.teacher}</option>
                <option value="manager">{t.manager}</option>
                <option value="staff">{t.staff}</option>
                <option value="employee">{t.employee}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{t.category}</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t.allCategories}</option>
                <option value="authentication">{t.authentication}</option>
                <option value="student_management">{t.studentManagement}</option>
                <option value="teacher_management">{t.teacherManagement}</option>
                <option value="employee_management">{t.employeeManagement}</option>
                <option value="class_management">{t.classManagement}</option>
                <option value="attendance">{t.attendance}</option>
                <option value="payments">{t.payments}</option>
                <option value="finance">{t.finance}</option>
                <option value="reports">{t.reports}</option>
                <option value="system">{t.system}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{t.severity}</label>
              <select
                value={filters.severity}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t.allSeverities}</option>
                <option value="low">{t.low}</option>
                <option value="medium">{t.medium}</option>
                <option value="high">{t.high}</option>
                <option value="critical">{t.critical}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{t.startDate}</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{t.endDate}</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                {t.clearFilters}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Logs Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  {t.timestamp}
                </th>
                <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  {t.user}
                </th>
                <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">{t.action}</th>
                <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-48">{t.description}</th>
                <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">{t.category}</th>
                <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  {t.severity}
                </th>
                <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => {
                const CategoryIcon = getCategoryIcon(log.category);
                const ActionIcon = getActionIcon(log.action);

                return (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-xs text-gray-900">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 text-gray-400 mr-1 flex-shrink-0" />
                        <span className="truncate">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center">
                        <User className="w-3 h-3 text-gray-400 mr-1 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-gray-900 truncate">{log.userName}</div>
                          <div className="text-xs text-gray-500 capitalize truncate">{log.userRole}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center">
                        <ActionIcon className="w-3 h-3 text-gray-400 mr-1 flex-shrink-0" />
                        <span className="text-xs text-gray-900 capitalize truncate">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-900">
                      <div className="truncate max-w-xs" title={log.description}>
                        {log.description}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center">
                        <CategoryIcon className="w-3 h-3 text-gray-400 mr-1 flex-shrink-0" />
                        <span className="text-xs text-gray-900 capitalize truncate">
                          {log.category.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(log.severity)}`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs font-medium">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                      >
                        <Eye className="w-3 h-3 mr-1" />{t.view}</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
                  disabled={filters.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >{t.previous}</button>
                <button
                  onClick={() => handleFilterChange('page', Math.min(pagination.pages, filters.page + 1))}
                  disabled={filters.page === pagination.pages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >{t.next}</button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    {t.showing} <span className="font-medium">{((filters.page - 1) * filters.limit) + 1}</span> {t.to}{' '}
                    <span className="font-medium">
                      {Math.min(filters.page * filters.limit, pagination.total)}
                    </span>{' '}
                    {t.of} <span className="font-medium">{pagination.total}</span> {t.results}
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
                      disabled={filters.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >{t.previous}</button>
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handleFilterChange('page', page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${filters.page === page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handleFilterChange('page', Math.min(pagination.pages, filters.page + 1))}
                      disabled={filters.page === pagination.pages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >{t.next}</button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{t.logDetails}</h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t.timestamp}</label>
                    <p className="mt-1 text-sm text-gray-900">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t.user}</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLog.userName} ({selectedLog.userRole})</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t.action}</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{selectedLog.action.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t.category}</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{selectedLog.category.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t.severity}</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(selectedLog.severity)}`}>
                      {selectedLog.severity}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.description}</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLog.description}</p>
                </div>

                {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t.additionalDetails}</label>
                    <pre className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md overflow-auto">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >{t.close}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogTab;
