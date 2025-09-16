import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  X, 
  Users, 
  BookOpen, 
  DollarSign, 
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';

const TeacherDetailModal = ({ teacher, onClose, schoolId, year, month }) => {
  const [payoutDetails, setPayoutDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch detailed payout information
  const fetchPayoutDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
      if (!token) {
        setError('Authentication required');
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const response = await axios.get(
        `/api/finance/teachers/${teacher.teacherId}/${year}/${month}`,
        config
      );

      if (response.data.success) {
        setPayoutDetails(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch payout details');
      }

    } catch (err) {
      console.error('Error fetching payout details:', err);
      setError(err.response?.data?.message || 'Failed to fetch payout details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayoutDetails();
  }, [teacher.teacherId, year, month]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status info
  const getStatusInfo = (status) => {
    switch (status) {
      case 'paid':
        return { 
          icon: CheckCircle, 
          color: 'text-green-600', 
          bgColor: 'bg-green-100',
          text: 'Paid' 
        };
      case 'partial':
        return { 
          icon: Clock, 
          color: 'text-yellow-600', 
          bgColor: 'bg-yellow-100',
          text: 'Partial' 
        };
      case 'pending':
        return { 
          icon: AlertTriangle, 
          color: 'text-red-600', 
          bgColor: 'bg-red-100',
          text: 'Pending' 
        };
      default:
        return { 
          icon: Clock, 
          color: 'text-gray-600', 
          bgColor: 'bg-gray-100',
          text: 'Unknown' 
        };
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
                  <p className="text-gray-500">Loading payout details...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center">
                <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
                <div>
                  <h3 className="text-lg font-medium text-red-800">Error Loading Details</h3>
                  <p className="text-red-600 mt-1">{error}</p>
                  <button
                    onClick={onClose}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const teacherSummary = payoutDetails?.teacherSummary || teacher;
  const payoutHistory = payoutDetails?.payoutDetails || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <Users className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{teacher.teacherName}</h3>
                  <p className="text-sm text-gray-500">{teacher.teacherEmail}</p>
                  <p className="text-sm text-gray-500">{month} {year}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <DollarSign className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Income</p>
                    <p className="text-xl font-bold text-blue-900">
                      {formatCurrency(teacherSummary.totalCalculatedIncome)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-green-600 font-medium">Paid Amount</p>
                    <p className="text-xl font-bold text-green-900">
                      {formatCurrency(teacherSummary.totalPaidAmount)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
                  <div>
                    <p className="text-sm text-red-600 font-medium">Remaining</p>
                    <p className="text-xl font-bold text-red-900">
                      {formatCurrency(teacherSummary.totalRemainingDebt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center">
                  <BookOpen className="w-8 h-8 text-gray-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Classes</p>
                    <p className="text-xl font-bold text-gray-900">
                      {teacherSummary.classes?.length || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Classes Breakdown */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Classes Breakdown</h4>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Class
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Students Paid
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Calculated Income
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Paid Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remaining
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teacherSummary.classes?.map((cls) => {
                      const statusInfo = getStatusInfo(cls.status);
                      const StatusIcon = statusInfo.icon;
                      
                      return (
                        <tr key={cls.classId}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <BookOpen className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm font-medium text-gray-900">
                                {cls.className}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Users className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">
                                {cls.studentsPaid}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(cls.calculatedIncome)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-green-600">
                              {formatCurrency(cls.paidAmount)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-medium ${
                              cls.remainingDebt > 0 ? 'text-red-600' : 'text-gray-500'
                            }`}>
                              {formatCurrency(cls.remainingDebt)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusInfo.text}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payout History */}
            {payoutHistory.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Payout History</h4>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Class
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Paid By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Note
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payoutHistory.map((payout) => 
                        payout.payoutHistory.map((history, index) => (
                          <tr key={`${payout._id}-${index}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <BookOpen className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-sm font-medium text-gray-900">
                                  {payout.classData.className}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-green-600">
                                {formatCurrency(history.amount)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900 capitalize">
                                {history.method.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900">
                                {history.paidBy ? `${history.paidBy.firstName} ${history.paidBy.lastName}` : 'Unknown'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-sm text-gray-900">
                                  {formatDate(history.paidAt)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-500">
                                {history.note || '-'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDetailModal;
