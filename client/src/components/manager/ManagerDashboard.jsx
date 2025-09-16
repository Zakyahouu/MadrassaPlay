import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
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
import CatalogTab from './CatalogTab';
import RoomsTab from './RoomsTab';
import EquipmentTab from './EquipmentTab';
import EmployeesTab from './EmployeesTab';
import AttendanceTab from './AttendanceTab';
import ManagerTimetable from './ManagerTimetable';
import AdsTab from './AdsTab';
import { Link } from 'react-router-dom';  
import StatsCard from './shared/StatsCard';
import QuickActionCard from './shared/QuickActionCard';
import NotificationItem from './shared/NotificationItem'; 
import ManagerClassPanel from './shared/ManagerClassPanel';
import ManagerSchoolPanel from './shared/ManagerSchoolPanel';
import UnifiedSidebar from '../layout/UnifiedSidebar';
import TopNav from '../layout/TopNav';
// Main Dashboard Component
export const ManagerDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [stats, setStats] = useState([
    { title: 'Total Students', value: '0', icon: Users, color: 'text-blue-600', change: 0 },
    { title: 'Active Teachers', value: '0', icon: UserCheck, color: 'text-green-600', change: 0 },
    { title: 'Total Classes', value: '0', icon: BookOpen, color: 'text-purple-600', change: 0 },
    { title: 'Total Staff', value: '0', icon: BarChart3, color: 'text-orange-600', change: 0 },
  ]);
  const [loading, setLoading] = useState(true);

  // Fetch real stats data
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
        if (!token) return;

        const config = { headers: { Authorization: `Bearer ${token}` } };

        // Fetch counts for different user types
        const [studentsRes, teachersRes, classesRes, staffRes] = await Promise.all([
          axios.get('/api/users/count?role=student', config),
          axios.get('/api/users/count?role=teacher', config),
          axios.get('/api/classes', config),
          axios.get('/api/users/count?role=staff', config)
        ]);

        const newStats = [
          { 
            title: 'Total Students', 
            value: studentsRes.data.count?.toString() || '0', 
            icon: Users, 
            color: 'text-blue-600', 
            change: 0 
          },
          { 
            title: 'Active Teachers', 
            value: teachersRes.data.count?.toString() || '0', 
            icon: UserCheck, 
            color: 'text-green-600', 
            change: 0 
          },
          { 
            title: 'Total Classes', 
            value: (classesRes.data?.length || 0).toString(), 
            icon: BookOpen, 
            color: 'text-purple-600', 
            change: 0 
          },
          { 
            title: 'Total Staff', 
            value: staffRes.data.count?.toString() || '0', 
            icon: BarChart3, 
            color: 'text-orange-600', 
            change: 0 
          },
        ];

        setStats(newStats);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const quickActions = [
    {
      title: 'Schedule Management',
      description: 'View and manage class schedules',
      icon: Calendar,
      color: 'text-blue-600',
      onClick: () => setActiveTab('timetable')
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
      onClick: () => setActiveTab('catalog')
    },
  ];

  const notifications = [
    { message: 'New teacher application submitted', time: '2 minutes ago', type: 'info' },
    { message: 'Low attendance in Class 7B today', time: '15 minutes ago', type: 'warning' },
    { message: 'Parent-teacher meeting scheduled', time: '1 hour ago', type: 'info' },
    { message: 'System maintenance tonight at 2 AM', time: '2 hours ago', type: 'urgent' },
  ];

  const navigationItems = [
    { id: 'overview', name: 'Overview' },
    { id: 'classes', name: 'Classes' },
    { id: 'attendance', name: 'Attendance' },
    { id: 'students', name: 'Students' },
    { id: 'teachers', name: 'Teachers' },
    { id: 'employees', name: 'Staff' },
    { id: 'timetable', name: 'Timetable' },
    { id: 'rooms', name: 'Rooms' },
    { id: 'equipment', name: 'Equipment' },
    { id: 'catalog', name: 'Catalog' },
    { id: 'ads', name: 'Advertisements' },
    { id: 'reports', name: 'Reports' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab stats={stats} quickActions={quickActions} notifications={notifications} setActiveTab={setActiveTab} loading={loading} />;
      case 'classes':
        return <ClassesTab onNavigateToAttendance={(classId)=>{ setActiveTab('attendance'); setTimeout(()=>{
          const ev = new CustomEvent('attendance:setSelectedClass', { detail: { classId } });
          window.dispatchEvent(ev);
        }, 0); }} />;
      case 'attendance':
        return <AttendanceTab />;
      case 'timetable':
        return <ManagerTimetable />;
      case 'students':
        return <StudentsTab />;
      case 'teachers':
        return <TeachersTab />;
      case 'employees':
        return <EmployeesTab />;
      case 'catalog':
        return <CatalogTab />;
      case 'rooms':
        return <RoomsTab />;
      case 'equipment':
        return <EquipmentTab />;
      case 'ads':
        return <AdsTab />;
      case 'reports':
        return <ReportsTab />;
      case 'finance':
        // Redirect to dedicated Finance page
        window.location.href = '/manager/finance';
        return null;
  // legacy staff tab hidden
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
    <div className="min-h-screen bg-gray-50 lg:flex">
      <UnifiedSidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
        role="manager"
      />

      <div className="flex-1 relative">
        <TopNav 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeTab={activeTab}
          navigationItems={navigationItems}
          logout={logout}
        />

        {/* Ads bar removed for managers */}

        <main className="p-6">
          {renderTabContent()}
        </main>
      </div>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Removed side panel */}
    </div>
  );
};

export default ManagerDashboard;