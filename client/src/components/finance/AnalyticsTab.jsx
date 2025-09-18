import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Download,
  FileText,
  RefreshCw,
  AlertTriangle,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Filter,
  Search
} from 'lucide-react';
import enhancedPdfExportService from '../../services/enhancedPdfExportService';
import fallbackPdfExportService from '../../services/fallbackPdfExportService';
import chartCaptureService from '../../services/chartCaptureService';
import PDFExportTest from './PDFExportTest';

const AnalyticsTab = ({ schoolId, year, month, onRefresh, loading }) => {
  const { user } = useContext(AuthContext);
  const [monthData, setMonthData] = useState(null);
  const [teacherPayouts, setTeacherPayouts] = useState([]);
  const [debtData, setDebtData] = useState(null);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [employeeSalaries, setEmployeeSalaries] = useState({ byRole: [], summary: {} });
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChart, setSelectedChart] = useState('overview');
  const [schoolData, setSchoolData] = useState(null);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  // Chart colors
  const colors = {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#06B6D4',
    income: '#10B981',
    expenses: '#EF4444',
    net: '#3B82F6',
    debt: '#F59E0B',
    teachers: ['#8B5CF6', '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1', '#F59E0B', '#EF4444'],
    categories: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16', '#F97316']
  };

  // Fetch all analytics data in parallel
  const fetchAnalyticsData = async () => {
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

      // Fetch all analytics data and school data in parallel
      const [
        trendsResponse,
        teacherPayoutsResponse,
        debtTrendsResponse,
        expenseCategoriesResponse,
        employeeSalariesResponse,
        schoolResponse
      ] = await Promise.all([
        axios.get(`/api/finance/analytics/trends/${schoolId}/${year}/${month}`, config),
        axios.get(`/api/finance/analytics/teacher-payouts/${schoolId}/${year}/${month}`, config),
        axios.get(`/api/finance/analytics/debt-trends/${schoolId}/${year}/${month}`, config),
        axios.get(`/api/finance/analytics/expense-categories/${schoolId}/${year}/${month}`, config),
        axios.get(`/api/finance/analytics/employee-salaries/${schoolId}/${year}/${month}`, config),
        axios.get(`/api/schools/${schoolId}`, config)
      ]);

      if (trendsResponse.data.success) {
        setMonthData(trendsResponse.data.data.monthData);
      }

      if (teacherPayoutsResponse.data.success) {
        setTeacherPayouts(teacherPayoutsResponse.data.data.teachers);
      }

      if (debtTrendsResponse.data.success) {
        setDebtData(debtTrendsResponse.data.data.monthData);
      }

      if (expenseCategoriesResponse.data.success) {
        setExpenseCategories(expenseCategoriesResponse.data.data.categories);
      }

      if (employeeSalariesResponse.data.success) {
        setEmployeeSalaries(employeeSalariesResponse.data.data);
      }

      // Set school data
      if (schoolResponse.data) {
        setSchoolData(schoolResponse.data);
      }

    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err.response?.data?.message || 'Failed to fetch analytics data');
    } finally {
      setLoadingData(false);
    }
  };

  // Load data when component mounts or year/month changes
  useEffect(() => {
    fetchAnalyticsData();
  }, [schoolId, year, month]);

  // Register charts for PDF capture
  useEffect(() => {
    const registerCharts = () => {
      const incomeExpensesChart = document.getElementById('income-expenses-chart');
      const teacherPayoutsChart = document.getElementById('teacher-payouts-chart');
      const expenseCategoriesChart = document.getElementById('expense-categories-chart');

      if (incomeExpensesChart) {
        chartCaptureService.registerChart('income-expenses-chart', incomeExpensesChart);
      }
      if (teacherPayoutsChart) {
        chartCaptureService.registerChart('teacher-payouts-chart', teacherPayoutsChart);
      }
      if (expenseCategoriesChart) {
        chartCaptureService.registerChart('expense-categories-chart', expenseCategoriesChart);
      }
    };

    // Register charts after a short delay to ensure DOM is ready
    const timer = setTimeout(registerCharts, 1000);
    
    return () => {
      clearTimeout(timer);
      chartCaptureService.clearAllCharts();
    };
  }, [monthData, teacherPayouts, expenseCategories]);

  // Handle refresh
  const handleRefresh = () => {
    fetchAnalyticsData();
    if (onRefresh) onRefresh();
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

  // Calculate percentage change
  const calculatePercentageChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Chart components
  const DonutChart = ({ data, colors, size = 200 }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let cumulativePercentage = 0;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const circumference = 2 * Math.PI * (size / 2 - 20);
            const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((cumulativePercentage / 100) * circumference);
            
            cumulativePercentage += percentage;

            return (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={size / 2 - 20}
                fill="none"
                stroke={colors[index % colors.length]}
                strokeWidth="20"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300 hover:stroke-width-24"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
        </div>
      </div>
    );
  };

  const BarChart = ({ data, colors, height = 300 }) => {
    const maxValue = Math.max(...data.map(item => item.value));
    
    return (
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
              <span className="text-sm font-bold text-gray-900">{formatCurrency(item.value)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: colors[index % colors.length]
                }}
              ></div>
            </div>
            <div className="text-xs text-gray-500">
              {((item.value / maxValue) * 100).toFixed(1)}% of max
            </div>
          </div>
        ))}
      </div>
    );
  };

  const LineChart = ({ data, colors, height = 200 }) => {
    const maxValue = Math.max(...data.map(item => item.value));
    const minValue = Math.min(...data.map(item => item.value));
    const range = maxValue - minValue;
    
    return (
      <div className="relative" style={{ height }}>
        <svg width="100%" height="100%" className="overflow-visible">
          <polyline
            fill="none"
            stroke={colors[0]}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={data.map((item, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = 100 - ((item.value - minValue) / range) * 100;
              return `${x}%,${y}%`;
            }).join(' ')}
            className="drop-shadow-sm"
          />
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - ((item.value - minValue) / range) * 100;
            return (
              <circle
                key={index}
                cx={`${x}%`}
                cy={`${y}%`}
                r="4"
                fill={colors[0]}
                className="hover:r-6 transition-all duration-200"
              />
            );
          })}
        </svg>
      </div>
    );
  };

  const AreaChart = ({ data, colors, height = 200 }) => {
    const maxValue = Math.max(...data.map(item => item.value));
    const minValue = Math.min(...data.map(item => item.value));
    const range = maxValue - minValue;
    
    const pathData = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((item.value - minValue) / range) * 100;
      return `${x},${y}`;
    }).join(' L');
    
    return (
      <div className="relative" style={{ height }}>
        <svg width="100%" height="100%" className="overflow-visible">
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colors[0]} stopOpacity="0.3"/>
              <stop offset="100%" stopColor={colors[0]} stopOpacity="0.05"/>
            </linearGradient>
          </defs>
          <path
            d={`M 0,100 L ${pathData} L 100,100 Z`}
            fill="url(#areaGradient)"
            className="transition-all duration-500"
          />
          <polyline
            fill="none"
            stroke={colors[0]}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={data.map((item, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = 100 - ((item.value - minValue) / range) * 100;
              return `${x}%,${y}%`;
            }).join(' ')}
          />
        </svg>
      </div>
    );
  };

  const MetricCard = ({ title, value, change, icon: Icon, color, subtitle }) => (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 ${color === 'success' ? 'border-l-4 border-l-green-500' : color === 'danger' ? 'border-l-4 border-l-red-500' : color === 'warning' ? 'border-l-4 border-l-yellow-500' : 'border-l-4 border-l-blue-500'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
          color === 'success' ? 'bg-green-100' : 
          color === 'danger' ? 'bg-red-100' : 
          color === 'warning' ? 'bg-yellow-100' : 
          'bg-blue-100'
        }`}>
          <Icon className={`w-6 h-6 ${
            color === 'success' ? 'text-green-600' : 
            color === 'danger' ? 'text-red-600' : 
            color === 'warning' ? 'text-yellow-600' : 
            'text-blue-600'
          }`} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center space-x-1 ${
            change >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span className="text-sm font-medium">{Math.abs(change).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );

  // Prepare chart data
  const incomeExpenseData = monthData ? [
    { label: 'Student Income', value: monthData.breakdown?.studentIncome || 0 },
    { label: 'Manual Income', value: monthData.breakdown?.manualIncome || 0 }
  ] : [];

  const expenseBreakdownData = monthData ? [
    { label: 'Manual Expenses', value: monthData.breakdown?.manualExpenses || 0 },
    { label: 'Teacher Earnings', value: monthData.breakdown?.teacherEarnings || 0 },
    { label: 'Employee Salaries', value: monthData.breakdown?.employeeSalaries || 0 }
  ] : [];

  const teacherPayoutData = teacherPayouts.map(teacher => ({
    label: teacher.teacherName,
    value: teacher.totalCalculated
  }));

  const expenseCategoryData = expenseCategories.map(category => ({
    label: category._id,
    value: category.totalAmount
  }));

  const employeeRoleData = employeeSalaries.byRole.map(role => ({
    label: role._id,
    value: role.totalCalculated
  }));

  // Export functions
  const exportToPDF = async () => {
    try {
      setExportingPDF(true);
      const filename = `financial-analytics-report-${year}-${month}.pdf`;
      
      const exportData = {
        monthData,
        teacherPayouts,
        debtData,
        expenseCategories,
        employeeSalaries,
        schoolData: schoolData || { name: 'Skill Snap' },
        schoolName: schoolData?.name || 'Skill Snap',
        reportDate: new Date().toLocaleDateString(),
        reportTime: new Date().toLocaleTimeString(),
        generatedBy: user?.name || 'User',
        userRole: user?.role || 'User'
      };

      // Try enhanced PDF export first, fallback to HTML if it fails
      try {
        // Chart IDs to capture
        const chartIds = [
          'income-expenses-chart',
          'teacher-payouts-chart',
          'expense-categories-chart'
        ];

        await enhancedPdfExportService.exportAnalyticsToPDF(exportData, chartIds, filename);
      } catch (enhancedError) {
        console.warn('Enhanced PDF export failed, using fallback:', enhancedError);
        
        // Use fallback HTML export
        await fallbackPdfExportService.exportAnalyticsToPDF(exportData, [], filename);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    } finally {
      setExportingPDF(false);
    }
  };

  const exportToExcel = () => {
    // Basic CSV export for now (can be opened in Excel)
    const csvData = generateCSVData();
    downloadCSV(csvData, `financial-report-${year}-${month}.csv`);
  };

  const generateCSVData = () => {
    let csv = `Financial Report - ${monthData?.monthName || month}/${year}\n\n`;
    
    // Month summary
    if (monthData) {
      csv += 'Month Summary\n';
      csv += `Month,${monthData.monthName} ${monthData.year}\n`;
      csv += `Total Income,${monthData.income}\n`;
      csv += `Total Expenses,${monthData.expenses}\n`;
      csv += `Net Balance,${monthData.net}\n\n`;
      
      if (monthData.breakdown) {
        csv += 'Income Breakdown\n';
        csv += `Student Income,${monthData.breakdown.studentIncome}\n`;
        csv += `Manual Income,${monthData.breakdown.manualIncome}\n\n`;
        
        csv += 'Expense Breakdown\n';
        csv += `Manual Expenses,${monthData.breakdown.manualExpenses}\n`;
        csv += `Teacher Earnings,${monthData.breakdown.teacherEarnings}\n`;
        csv += `Employee Salaries,${monthData.breakdown.employeeSalaries}\n\n`;
      }
    }
    
    // Teacher payouts
    csv += 'Teacher Payouts\n';
    csv += 'Teacher,Classes,Students,Calculated Income,Paid Amount,Remaining\n';
    teacherPayouts.forEach(teacher => {
      csv += `${teacher.teacherName},${teacher.classCount},${teacher.totalStudents},${teacher.totalCalculated},${teacher.totalPaid},${teacher.totalRemaining}\n`;
    });
    
    // Expense categories
    csv += '\nExpense Categories\n';
    csv += 'Category,Amount,Transaction Count,Percentage\n';
    const totalExpenses = expenseCategories.reduce((sum, c) => sum + c.totalAmount, 0);
    expenseCategories.forEach(category => {
      const percentage = totalExpenses > 0 ? ((category.totalAmount / totalExpenses) * 100).toFixed(1) : 0;
      csv += `${category._id},${category.totalAmount},${category.transactionCount},${percentage}%\n`;
    });
    
    // Debt data
    if (debtData) {
      csv += '\nStudent Debt Summary\n';
      csv += 'Total Debt,New Debt,Student Count,Avg Debt Per Student\n';
      csv += `${debtData.totalDebt},${debtData.newDebt},${debtData.studentCount},${debtData.avgDebtPerStudent}\n`;
    }
    
    // Employee salaries
    csv += '\nEmployee Salary Analytics\n';
    csv += 'Role,Employee Count,Total Calculated,Total Paid,Total Remaining,Avg per Employee\n';
    employeeSalaries.byRole.forEach(role => {
      csv += `${role._id},${role.employeeCount},${role.totalCalculated},${role.totalPaid},${role.totalRemaining},${role.totalCalculated / role.employeeCount}\n`;
    });
    
    return csv;
  };

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

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading analytics data...</p>
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
            <h3 className="text-lg font-medium text-red-800">Error Loading Analytics</h3>
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
      {/* PDF Export Test - Remove this in production */}
      <PDFExportTest />
      
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Financial Analytics Dashboard</h2>
              <p className="text-gray-600">
                Comprehensive analysis for {monthData?.monthName || month} {year}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={exportToPDF}
              disabled={exportingPDF}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {exportingPDF ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              <span>{exportingPDF ? 'Generating PDF...' : 'Export PDF'}</span>
            </button>
            
            <button
              onClick={exportToExcel}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
            
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chart Type Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'overview', name: 'Overview', icon: BarChart3 },
            { id: 'income', name: 'Income Analysis', icon: TrendingUp },
            { id: 'expenses', name: 'Expense Analysis', icon: TrendingDown },
            { id: 'teachers', name: 'Teacher Payouts', icon: Users },
            { id: 'employees', name: 'Employee Salaries', icon: Users },
            { id: 'debts', name: 'Debt Analysis', icon: AlertTriangle }
          ].map(({ id, name, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedChart(id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                selectedChart === id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Overview Charts */}
      {selectedChart === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Key Metrics */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Key Performance Indicators</h3>
            <div className="grid grid-cols-2 gap-4">
              <MetricCard
                title="Total Income"
                value={formatCurrency(monthData?.income || 0)}
                icon={TrendingUp}
                color="success"
                subtitle={`${monthData?.breakdown?.studentIncome ? 'Students: ' + formatCurrency(monthData.breakdown.studentIncome) : ''} ${monthData?.breakdown?.manualIncome ? '| Manual: ' + formatCurrency(monthData.breakdown.manualIncome) : ''}`}
              />
              <MetricCard
                title="Total Expenses"
                value={formatCurrency(monthData?.expenses || 0)}
                icon={TrendingDown}
                color="danger"
                subtitle={`${monthData?.breakdown?.manualExpenses ? 'Manual: ' + formatCurrency(monthData.breakdown.manualExpenses) : ''} ${monthData?.breakdown?.teacherEarnings ? '| Teachers: ' + formatCurrency(monthData.breakdown.teacherEarnings) : ''}`}
              />
              <MetricCard
                title="Net Balance"
                value={formatCurrency(monthData?.net || 0)}
                icon={DollarSign}
                color={monthData?.net >= 0 ? 'success' : 'danger'}
                subtitle={monthData?.net >= 0 ? 'Positive balance' : 'Negative balance'}
              />
              <MetricCard
                title="Total Debts"
                value={formatCurrency(debtData?.totalDebt || 0)}
                icon={AlertTriangle}
                color="warning"
                subtitle={`${debtData?.studentCount || 0} students | Avg: ${formatCurrency(debtData?.avgDebtPerStudent || 0)}`}
              />
            </div>
          </div>

          {/* Income vs Expenses Donut Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6" id="income-expenses-chart">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Income vs Expenses Distribution</h3>
            <div className="flex justify-center">
              <DonutChart
                data={[
                  { label: 'Income', value: monthData?.income || 0 },
                  { label: 'Expenses', value: monthData?.expenses || 0 }
                ]}
                colors={[colors.success, colors.danger]}
                size={250}
              />
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-700">Income</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(monthData?.income || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span className="text-sm text-gray-700">Expenses</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(monthData?.expenses || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Income Analysis */}
      {selectedChart === 'income' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Income Sources Breakdown</h3>
            <BarChart
              data={incomeExpenseData}
              colors={[colors.success, colors.info]}
            />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Income Distribution</h3>
            <DonutChart
              data={incomeExpenseData}
              colors={[colors.success, colors.info]}
              size={200}
            />
          </div>
        </div>
      )}

      {/* Expense Analysis */}
      {selectedChart === 'expenses' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Expense Breakdown</h3>
              <BarChart
                data={expenseBreakdownData}
                colors={[colors.danger, colors.warning, colors.info]}
              />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6" id="expense-categories-chart">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Expense Categories</h3>
              <DonutChart
                data={expenseCategoryData}
                colors={colors.categories}
                size={200}
              />
            </div>
          </div>
          
          {expenseCategories.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Expense Categories Details</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Transactions</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseCategories.map((category, index) => {
                      const total = expenseCategories.reduce((sum, c) => sum + c.totalAmount, 0);
                      const percentage = total > 0 ? ((category.totalAmount / total) * 100).toFixed(1) : 0;
                      return (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: colors.categories[index % colors.categories.length] }}
                              ></div>
                              <span className="font-medium text-gray-900">{category._id}</span>
                            </div>
                          </td>
                          <td className="text-right py-3 px-4 font-semibold text-gray-900">
                            {formatCurrency(category.totalAmount)}
                          </td>
                          <td className="text-right py-3 px-4 text-gray-600">
                            {category.transactionCount}
                          </td>
                          <td className="text-right py-3 px-4 text-gray-600">
                            {percentage}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Teacher Payouts */}
      {selectedChart === 'teachers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Teacher Payouts Distribution</h3>
              <BarChart
                data={teacherPayoutData}
                colors={colors.teachers}
              />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6" id="teacher-payouts-chart">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Teacher Payouts Overview</h3>
              <DonutChart
                data={teacherPayoutData}
                colors={colors.teachers}
                size={200}
              />
            </div>
          </div>
          
          {teacherPayouts.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Teacher Payouts Details</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Teacher</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Classes</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Students</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Calculated</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Paid</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Remaining</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacherPayouts.map((teacher, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: colors.teachers[index % colors.teachers.length] }}
                            ></div>
                            <span className="font-medium text-gray-900">{teacher.teacherName}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 text-gray-600">{teacher.classCount}</td>
                        <td className="text-right py-3 px-4 text-gray-600">{teacher.totalStudents}</td>
                        <td className="text-right py-3 px-4 font-semibold text-gray-900">
                          {formatCurrency(teacher.totalCalculated)}
                        </td>
                        <td className="text-right py-3 px-4 text-green-600">
                          {formatCurrency(teacher.totalPaid)}
                        </td>
                        <td className="text-right py-3 px-4 text-red-600">
                          {formatCurrency(teacher.totalRemaining)}
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            teacher.totalRemaining === 0 
                              ? 'bg-green-100 text-green-800' 
                              : teacher.totalPaid > 0 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-red-100 text-red-800'
                          }`}>
                            {teacher.totalRemaining === 0 ? 'Paid' : teacher.totalPaid > 0 ? 'Partial' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Employee Salaries */}
      {selectedChart === 'employees' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Employee Salary Distribution</h3>
              <BarChart
                data={employeeRoleData}
                colors={colors.teachers}
              />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Salary Overview</h3>
              <DonutChart
                data={employeeRoleData}
                colors={colors.teachers}
                size={200}
              />
            </div>
          </div>
          
          {employeeSalaries.summary && employeeSalaries.summary.employeeCount > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <MetricCard
                title="Total Employees"
                value={employeeSalaries.summary.employeeCount}
                icon={Users}
                color="info"
              />
              <MetricCard
                title="Total Calculated"
                value={formatCurrency(employeeSalaries.summary.totalCalculated)}
                icon={DollarSign}
                color="success"
              />
              <MetricCard
                title="Total Paid"
                value={formatCurrency(employeeSalaries.summary.totalPaid)}
                icon={CheckCircle}
                color="success"
              />
              <MetricCard
                title="Remaining"
                value={formatCurrency(employeeSalaries.summary.totalRemaining)}
                icon={AlertTriangle}
                color="warning"
              />
            </div>
          )}
        </div>
      )}

      {/* Debt Analysis */}
      {selectedChart === 'debts' && debtData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Total Debt"
              value={formatCurrency(debtData.totalDebt)}
              icon={AlertTriangle}
              color="warning"
            />
            <MetricCard
              title="New Debt"
              value={formatCurrency(debtData.newDebt)}
              icon={TrendingUp}
              color="danger"
            />
            <MetricCard
              title="Students with Debt"
              value={debtData.studentCount}
              icon={Users}
              color="info"
            />
            <MetricCard
              title="Average Debt"
              value={formatCurrency(debtData.avgDebtPerStudent)}
              icon={Target}
              color="warning"
            />
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Debt Analysis</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-4">Debt Distribution</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Outstanding</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(debtData.totalDebt)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">New This Month</span>
                    <span className="font-semibold text-red-600">{formatCurrency(debtData.newDebt)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average per Student</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(debtData.avgDebtPerStudent)}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-4">Debt Metrics</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Students Affected</span>
                    <span className="font-semibold text-gray-900">{debtData.studentCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Debt Rate</span>
                    <span className="font-semibold text-gray-900">
                      {debtData.studentCount > 0 ? ((debtData.totalDebt / debtData.studentCount) / 1000).toFixed(1) : 0}K DZD/student
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsTab;