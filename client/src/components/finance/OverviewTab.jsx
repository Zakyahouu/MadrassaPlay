import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Calculator,
  RefreshCw,
  Calendar,
  Users,
  BookOpen,
  Lock,
  Unlock,
  Snowflake
} from 'lucide-react';
import FinancialCards from './FinancialCards';
import TransactionsTable from './TransactionsTable';
import StudentPaymentDetailModal from './StudentPaymentDetailModal';

const OverviewTab = ({ schoolId, year, month, onRefresh, loading }) => {
  const [financialData, setFinancialData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [freezing, setFreezing] = useState(false);
  const [freezeError, setFreezeError] = useState(null);
  const [showPaymentDetailModal, setShowPaymentDetailModal] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);

  // Fetch financial overview data
  const fetchFinancialData = async () => {
    if (!schoolId) return;
    
    try {
      setLoadingData(true);
      setError(null);
      
      const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
      if (!token) {
        setError('Authentication required');
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Fetch overview data
      const overviewResponse = await axios.get(
        `/api/finance/overview/${schoolId}/${year}/${month}`,
        config
      );
      
      if (overviewResponse.data.success) {
        setFinancialData(overviewResponse.data.data);
      }
      
    } catch (err) {
      console.error('Error fetching financial data:', err);
      setError(err.response?.data?.message || 'Failed to fetch financial data');
    } finally {
      setLoadingData(false);
    }
  };

  // Fetch transactions data
  const fetchTransactions = async () => {
    if (!schoolId) return;
    
    try {
      const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
      if (!token) return;

      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Fetch transactions
      const transactionsResponse = await axios.get(
        `/api/finance/student-payments/${schoolId}/${year}/${month}`,
        config
      );
      
      if (transactionsResponse.data.success) {
        setTransactions(transactionsResponse.data.data.transactions);
      }
      
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  // Load data when component mounts or dependencies change
  useEffect(() => {
    fetchFinancialData();
    fetchTransactions();
  }, [schoolId, year, month]);

  // Handle refresh
  const handleRefresh = () => {
    fetchFinancialData();
    fetchTransactions();
    if (onRefresh) onRefresh();
  };

  const handleViewPaymentDetails = (transactionId) => {
    setSelectedTransactionId(transactionId);
    setShowPaymentDetailModal(true);
  };

  // Handle freeze month
  const handleFreezeMonth = async () => {
    if (!schoolId || !window.confirm(`Are you sure you want to freeze ${month}/${year}? This action cannot be undone.`)) {
      return;
    }

    try {
      setFreezing(true);
      setFreezeError(null);

      const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
      if (!token) {
        setFreezeError('Authentication required');
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const response = await axios.post(
        `/api/finance/freeze/${schoolId}/${year}/${month}`,
        {},
        config
      );

      if (response.data.success) {
        // Refresh data to show frozen status
        await fetchFinancialData();
        alert('Month frozen successfully!');
      } else {
        setFreezeError(response.data.message || 'Failed to freeze month');
      }

    } catch (err) {
      console.error('Error freezing month:', err);
      setFreezeError(err.response?.data?.message || 'Failed to freeze month');
    } finally {
      setFreezing(false);
    }
  };

  // Check if current month
  const isCurrentMonth = () => {
    const now = new Date();
    return year === now.getFullYear() && month === now.getMonth() + 1;
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

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading financial data...</p>
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
            <h3 className="text-lg font-medium text-red-800">Error Loading Data</h3>
            <p className="text-red-600 mt-1">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Month Status and Freeze Button */}
      {financialData && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                financialData.isFrozen ? 'bg-blue-100' : 'bg-green-100'
              }`}>
                {financialData.isFrozen ? (
                  <Lock className="w-6 h-6 text-blue-600" />
                ) : (
                  <Unlock className="w-6 h-6 text-green-600" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {financialData.monthName} {financialData.year}
                </h2>
                <p className={`text-sm font-medium ${
                  financialData.isFrozen ? 'text-blue-600' : 'text-green-600'
                }`}>
                  {financialData.isFrozen ? 'Summary Locked' : 'Live Calculation'}
                </p>
                {financialData.isFrozen && financialData.frozenAt && (
                  <p className="text-xs text-gray-500">
                    Frozen on {formatDate(financialData.frozenAt)}
                    {financialData.frozenBy && ` by ${financialData.frozenBy.firstName} ${financialData.frozenBy.lastName}`}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {!financialData.isFrozen && !isCurrentMonth() && (
                <button
                  onClick={handleFreezeMonth}
                  disabled={freezing}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {freezing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Freezing...</span>
                    </>
                  ) : (
                    <>
                      <Snowflake className="w-4 h-4" />
                      <span>Freeze Month</span>
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
          
          {/* Freeze Error */}
          {freezeError && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-red-400 mr-2 mt-0.5" />
                <p className="text-sm text-red-600">{freezeError}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Financial Summary Cards */}
      {financialData && (
        <FinancialCards 
          data={financialData}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Quick Stats Row */}
      {financialData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Payments</p>
                <p className="text-lg font-semibold text-gray-900">
                  {financialData.paymentCount || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Teacher Earnings</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(financialData.teacherEarnings)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <Calculator className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(financialData.lastCalculated)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Transactions
            </h3>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
        
        <TransactionsTable 
          transactions={transactions}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          loading={loading}
          onViewDetails={handleViewPaymentDetails}
        />
      </div>

      {showPaymentDetailModal && (
        <StudentPaymentDetailModal
          transactionId={selectedTransactionId}
          onClose={() => setShowPaymentDetailModal(false)}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      )}
    </div>
  );
};

export default OverviewTab;
