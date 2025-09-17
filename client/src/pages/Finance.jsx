import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  FileText, 
  BarChart3,
  Calendar,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import OverviewTab from '../components/finance/OverviewTab';
import TeachersTab from '../components/finance/TeachersTab';
import ExpensesTab from '../components/finance/ExpensesTab';
import AnalyticsTab from '../components/finance/AnalyticsTab';
import EmployeesTab from '../components/finance/EmployeesTab';

const Finance = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Generate years for dropdown (current year ± 2)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // Month names
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3, component: OverviewTab },
    { id: 'teachers', name: 'Teachers', icon: Users, component: TeachersTab },
    { id: 'employees', name: 'Employees', icon: Users, component: EmployeesTab },
    { id: 'expenses', name: 'Expenses', icon: FileText, component: ExpensesTab },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp, component: AnalyticsTab }
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const handleRefresh = () => {
    setLoading(true);
    // Trigger refresh in active tab component
    setTimeout(() => setLoading(false), 1000);
  };

  const handleGoBack = () => {
    if (user?.role === 'manager') {
      navigate('/manager/dashboard');
    } else if (user?.role === 'teacher') {
      navigate('/teacher/dashboard');
    } else if (user?.role === 'student') {
      navigate('/student/dashboard');
    } else if (user?.role === 'staff') {
      navigate('/manager/dashboard');
    } else {
      navigate('/'); // Fallback to home page
    }
  };

  const renderActiveTab = () => {
    // Check if user has a school assigned
    if (!user?.school) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <DollarSign className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No School Assigned
            </h3>
            <p className="text-gray-500">
              You need to be assigned to a school to access financial data.
            </p>
          </div>
        </div>
      );
    }

    const activeTabData = tabs.find(tab => tab.id === activeTab);
    if (!activeTabData || !activeTabData.component) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <activeTabData.icon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTabData.name} Tab
            </h3>
            <p className="text-gray-500">
              This feature will be available in the next phase.
            </p>
          </div>
        </div>
      );
    }

    const Component = activeTabData.component;
    return (
      <Component
        schoolId={user?.school?._id || user?.school}
        year={selectedYear}
        month={selectedMonth}
        onRefresh={handleRefresh}
        loading={loading}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleGoBack}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
                <p className="text-sm text-gray-500">
                  Manage your school's financial data and transactions
                </p>
              </div>
            </div>
            
            {/* Month/Year Selector */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {months.map((month, index) => (
                    <option key={index + 1} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {renderActiveTab()}
      </div>
    </div>
  );
};

export default Finance;
