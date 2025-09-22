import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Users, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Eye,
  RefreshCw,
  Calendar,
  BookOpen,
  TrendingUp,
  Filter,
  Search
} from 'lucide-react';
import PayoutModal from './PayoutModal';
import TeacherDetailModal from './TeacherDetailModal';

const TeachersTab = ({ schoolId, year, month, onRefresh, loading }) => {
  const { t } = useLanguage();
  const [teachers, setTeachers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch teacher payout data
  const fetchTeacherPayouts = async () => {
    if (!schoolId) return;
    
    try {
      setLoadingData(true);
      setError(null);
      
      const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
      if (!token) {
        setError(t('authentication-required'));
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const response = await axios.get(
        `/api/finance/teachers/${schoolId}/${year}/${month}`,
        config
      );
      
      if (response.data.success) {
        setTeachers(response.data.data.teachers);
      }
      
    } catch (err) {
      console.error('Error fetching teacher payouts:', err);
      setError(err.response?.data?.message || t('failed-fetch-teacher-payout-data'));
    } finally {
      setLoadingData(false);
    }
  };

  // Load data when component mounts or dependencies change
  useEffect(() => {
    fetchTeacherPayouts();
  }, [schoolId, year, month]);

  // Handle refresh
  const handleRefresh = () => {
    fetchTeacherPayouts();
    if (onRefresh) onRefresh();
  };

  // Handle payout action
  const handlePayout = (teacher) => {
    setSelectedTeacher(teacher);
    setShowPayoutModal(true);
  };

  // Handle view details
  const handleViewDetails = (teacher) => {
    setSelectedTeacher(teacher);
    setShowDetailModal(true);
  };

  // Handle payout success
  const handlePayoutSuccess = () => {
    setShowPayoutModal(false);
    setSelectedTeacher(null);
    fetchTeacherPayouts(); // Refresh data
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Get status info
  const getStatusInfo = (status) => {
    switch (status) {
      case 'paid':
        return { 
          icon: CheckCircle, 
          color: 'text-green-600', 
          bgColor: 'bg-green-100',
          text: t('paid') 
        };
      case 'partial':
        return { 
          icon: Clock, 
          color: 'text-yellow-600', 
          bgColor: 'bg-yellow-100',
          text: t('partial') 
        };
      case 'pending':
        return { 
          icon: AlertTriangle, 
          color: 'text-red-600', 
          bgColor: 'bg-red-100',
          text: t('pending') 
        };
      default:
        return { 
          icon: Clock, 
          color: 'text-gray-600', 
          bgColor: 'bg-gray-100',
          text: t('unknown') 
        };
    }
  };

  // Filter teachers
  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.teacherName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || teacher.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">{t('loading-teacher-payout-data')}</p>
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
            <h3 className="text-lg font-medium text-red-800">{t('error-loading-data')}</h3>
            <p className="text-red-600 mt-1">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              {t('try-again')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{t('teacher-payouts')}</h2>
              <p className="text-sm text-gray-500">
                {month} {year} - {teachers.length} {t('teacher')}{teachers.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('search-teachers')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
              />
            </div>
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{t('all-status')}</option>
              <option value="pending">{t('pending')}</option>
              <option value="partial">{t('partial')}</option>
              <option value="paid">{t('paid')}</option>
            </select>
            
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{t('refresh')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredTeachers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('no-teachers-found')}</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? t('no-teachers-match-filters') 
                : t('no-teacher-payout-data-available')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('teacher')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('classes')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('students-paid')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('calculated-income')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('paid-amount')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('remaining')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTeachers.map((teacher) => {
                  const statusInfo = getStatusInfo(teacher.status);
                  const StatusIcon = statusInfo.icon;
                  const totalStudentsPaid = teacher.classes.reduce((sum, cls) => sum + cls.studentsPaid, 0);
                  
                  return (
                    <tr key={teacher.teacherId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {teacher.teacherName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {teacher.teacherEmail}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <BookOpen className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {teacher.classes.length} {t('class')}{teacher.classes.length !== 1 ? 'es' : ''}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {totalStudentsPaid}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(teacher.totalCalculatedIncome)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(teacher.totalPaidAmount)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          teacher.totalRemainingDebt > 0 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {formatCurrency(teacher.totalRemainingDebt)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.text}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewDetails(teacher)}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <Eye className="w-4 h-4 mr-1" />
{t('details')}
                          </button>
                          
                          {teacher.totalRemainingDebt > 0 && (
                            <button
                              onClick={() => handlePayout(teacher)}
                              className="text-green-600 hover:text-green-900 flex items-center"
                            >
                              <DollarSign className="w-4 h-4 mr-1" />
{t('pay')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showPayoutModal && selectedTeacher && (
        <PayoutModal
          teacher={selectedTeacher}
          onClose={() => setShowPayoutModal(false)}
          onSuccess={handlePayoutSuccess}
          schoolId={schoolId}
          year={year}
          month={month}
        />
      )}

      {showDetailModal && selectedTeacher && (
        <TeacherDetailModal
          teacher={selectedTeacher}
          onClose={() => setShowDetailModal(false)}
          schoolId={schoolId}
          year={year}
          month={month}
        />
      )}
    </div>
  );
};

export default TeachersTab;
