import React, { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { 
  Users, BookOpen, GraduationCap, Calendar, BarChart3, Settings, Bell, 
  UserCheck, Building2, FileText, Search, Plus, Edit, Trash2, Eye,
  Clock, Star, Award, TrendingUp, Filter, Download, Mail, Phone
} from 'lucide-react';
import OverviewTab from './OverviewTab';
import ClassesTab from './ClassesTab';
import StudentsTab from './StudentsTab';
import TeachersTab from './TeachersTab';
import ReportsTab from './ReportsTab';
import { Link } from 'react-router-dom';  
import StatsCard from './shared/StatsCard';
import QuickActionCard from './shared/QuickActionCard';
import NotificationItem from './shared/NotificationItem'; 
import ManagerClassPanel from './shared/ManagerClassPanel';
import ManagerSchoolPanel from './shared/ManagerSchoolPanel';
import StaffesTab from './StaffesTab';
// Main Dashboard Component
export const ManagerDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    { title: 'Total Students', value: '1,247', icon: Users, color: 'text-blue-600', change: 5.2 },
    { title: 'Active Teachers', value: '89', icon: UserCheck, color: 'text-green-600', change: 2.1 },
    { title: 'Classes Today', value: '156', icon: BookOpen, color: 'text-purple-600', change: -1.3 },
    { title: 'Attendance Rate', value: '94%', icon: BarChart3, color: 'text-orange-600', change: 1.8 },
  ];

  const quickActions = [
    {
      title: 'Schedule Management',
      description: 'View and manage class schedules',
      icon: Calendar,
      color: 'text-blue-600',
      onClick: () => setActiveTab('schedule')
    },
    {
      title: 'Student Records',
      description: 'Access student information and grades',
      icon: GraduationCap,
      color: 'text-green-600',
      onClick: () => setActiveTab('students')
    },
    {
      title: 'Reports & Analytics',
      description: 'Generate performance reports',
      icon: BarChart3,
      color: 'text-purple-600',
      onClick: () => setActiveTab('reports')
    },
    {
      title: 'System Settings',
      description: 'Configure school settings',
      icon: Settings,
      color: 'text-gray-600',
      onClick: () => setActiveTab('settings')
    },
  ];

  const notifications = [
    { message: 'New teacher application submitted', time: '2 minutes ago', type: 'info' },
    { message: 'Low attendance in Class 7B today', time: '15 minutes ago', type: 'warning' },
    { message: 'Parent-teacher meeting scheduled', time: '1 hour ago', type: 'info' },
    { message: 'System maintenance tonight at 2 AM', time: '2 hours ago', type: 'urgent' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab stats={stats} quickActions={quickActions} notifications={notifications} setActiveTab={setActiveTab} />;
      case 'classes':
        return <ClassesTab />;
      case 'students':
        return <StudentsTab />;
      case 'teachers':
        return <TeachersTab />;
      case 'reports':
        return <ReportsTab />;
      case 'staffes':
        return <StaffesTab />;
      default:
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management
            </h3>
            <p className="text-gray-600">
              This section is under development. Content for {activeTab} management will be displayed here.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 bg-white rounded-lg border border-gray-200 p-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name || 'Manager'}</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">3</span>
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-1 bg-white rounded-lg border border-gray-200 p-1">
          {['overview', 'classes', 'students', 'teachers', 'reports','staffes'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default ManagerDashboard;