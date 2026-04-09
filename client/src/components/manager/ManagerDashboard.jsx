// ManagerDashboard.jsx
import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
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
import LandingPageSettings from './LandingPageSettings';
import LogTab from './LogTab';
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
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [stats, setStats] = useState([
    { title: t.totalStudents, value: '0', icon: Users, color: 'text-blue-600', change: 0 },
    { title: t.activeTeachers, value: '0', icon: UserCheck, color: 'text-green-600', change: 0 },
    { title: t.totalClasses, value: '0', icon: BookOpen, color: 'text-purple-600', change: 0 },
    { title: t.totalPersonnel, value: '0', icon: BarChart3, color: 'text-orange-600', change: 0 },
  ]);
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState({});
  const staffRoles = ['staff', 'employee', 'staff pedagogique'];
  const isManager = user?.role === 'manager';
  const isStaff = staffRoles.includes(user?.role);
  const hasPerm = (perm) => isManager || (isStaff && userPermissions?.[perm] === true);

  // School state
  const [school, setSchool] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [schoolTrial, setSchoolTrial] = useState(null);
  const [loadingTrial, setLoadingTrial] = useState(true);

  // Fetch user permissions for staff users
  const fetchUserPermissions = async () => {
    try {
      console.log('Fetching permissions for user:', user?.role, user?.username);

      if (['staff', 'employee', 'staff pedagogique'].includes(user?.role)) {
        const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
        if (!token) {
          console.log('No token found for staff user');
          return;
        }
        const config = { headers: { Authorization: `Bearer ${token}` } };
        console.log('Fetching employee data for user ID:', user._id);
        const response = await axios.get(`/api/employees/by-user/${user._id}`, config);

        if (response.data.success && response.data.data.permissions) {
          setUserPermissions(response.data.data.permissions);
        } else {
          setUserPermissions({});
        }
      } else if (user?.role === 'manager') {
        // Managers have all permissions
        setUserPermissions({ finance: true, logs: true });
      } else {
        setUserPermissions({});
      }
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      setUserPermissions({});
    }
  };

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
          { title: t.totalStudents, value: studentsRes.data.count?.toString() || '0', icon: Users, color: 'text-blue-600', change: 0 },
          { title: t.activeTeachers, value: teachersRes.data.count?.toString() || '0', icon: UserCheck, color: 'text-green-600', change: 0 },
          { title: t.totalClasses, value: (classesRes.data?.length || 0).toString(), icon: BookOpen, color: 'text-purple-600', change: 0 },
          { title: t.totalStaff, value: staffRes.data.count?.toString() || '0', icon: BarChart3, color: 'text-orange-600', change: 0 },
        ];
        setStats(newStats);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    /* ... (rest of useEffect) */
    const fetchSchoolData = async () => {
      try {
        const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
        if (!token || !user?.school) return;
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // Fetch school details and catalog in parallel
        const [schoolRes, catalogRes] = await Promise.all([
          axios.get(`/api/schools/${user.school}`, config),
          axios.get(`/api/catalog/${user.school}`, config)
        ]);

        const schoolData = schoolRes.data;
        setSchool(schoolData);
        setCatalog(catalogRes.data);

        // Calculate days left
        let daysLeft = null;
        if (schoolData.trialExpiresAt) {
          const now = new Date();
          const expires = new Date(schoolData.trialExpiresAt);
          daysLeft = Math.max(0, Math.ceil((expires - now) / (1000 * 60 * 60 * 24)));
        }

        setSchoolTrial({
          status: schoolData.status,
          trialExpiresAt: schoolData.trialExpiresAt,
          daysLeft,
        });
      } catch (err) {
        console.error('Error fetching school/catalog data:', err);
        setSchoolTrial(null);
      } finally {
        setLoadingTrial(false);
      }
    };
    fetchStats();
    fetchSchoolData();
    fetchUserPermissions();
  }, [activeTab, user?.school, user?.role, user?.username, t]); // Added t dependency

  const quickActions = [
    {
      title: t.scheduleManagement,
      description: t.viewManageSchedules,
      icon: Calendar,
      color: 'text-blue-600',
      onClick: () => setActiveTab('timetable'),
      perm: 'timetable'
    },
    {
      title: t.studentRecords,
      description: t.accessStudentInfo,
      icon: GraduationCap,
      color: 'text-green-600',
      onClick: () => setActiveTab('students'),
      perm: 'students'
    },
    {
      title: t.reportsAnalytics,
      description: t.generatePerformanceReports,
      icon: BarChart3,
      color: 'text-purple-600',
      onClick: () => setActiveTab('reports'),
      perm: 'reports'
    },
    {
      title: t.systemSettings,
      description: t.configureSchoolSettings,
      icon: Settings,
      color: 'text-gray-600',
      onClick: () => setActiveTab('catalog'),
      perm: 'catalog'
    },
  ].filter((action) => hasPerm(action.perm));

  const notifications = [
    { message: t.notificationsComingSoon, time: t.stayTuned, type: 'info' },
  ];

  const navigationItems = [
    { id: 'overview', name: t.overview },
    { id: 'classes', name: t.classes },
    { id: 'attendance', name: t.attendance },
    { id: 'students', name: t.students },
    { id: 'teachers', name: t.teachers },
    { id: 'employees', name: t.employees },
    { id: 'timetable', name: t.timetable },
    { id: 'rooms', name: t.rooms },
    { id: 'equipment', name: t.equipment },
    { id: 'catalog', name: t.catalog },
    { id: 'ads', name: t.ads },
    { id: 'landing', name: t.landing },
    { id: 'reports', name: t.reports },
    { id: 'finance', name: t.finance }
  ];

  const handleUpdateCatalog = async (updatedCatalog) => {
    try {
      const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
      if (!token || !user?.school) return;
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Use the correct catalog endpoint: PUT /api/catalog/:schoolId
      // and send fields directly in the body
      const response = await axios.put(`/api/catalog/${user.school}`, updatedCatalog, config);

      if (response.data) {
        setCatalog(response.data);
      }
    } catch (error) {
      console.error('Error updating catalog:', error);
      throw error;
    }
  };

  const renderTabContent = () => {
    const permissionByTab = {
      classes: 'classes',
      attendance: 'attendance',
      students: 'students',
      teachers: 'teachers',
      employees: 'employees',
      timetable: 'timetable',
      rooms: 'rooms',
      equipment: 'equipment',
      catalog: 'catalog',
      ads: 'ads',
      landing: 'landingPage',
      reports: 'reports',
      log: 'logs',
      finance: 'finance'
    };

    const requiredPerm = permissionByTab[activeTab];
    if (isStaff && requiredPerm && !userPermissions?.[requiredPerm]) {
      return (
        <div className="card-base p-8 text-center">
          <Settings className="w-16 h-16 text-text-muted-light mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text-main-light mb-2">{t.notAuthorized || 'Not authorized'}</h3>
          <p className="text-text-muted-light">
            {t.notAuthorizedDesc || 'You do not have access to this section. Please contact your administrator.'}
          </p>
        </div>
      );
    }

    if (activeTab === 'overview') {
      return (
        <>
          <div className="mb-6">
            <div className={
              schoolTrial?.status === 'trial'
                ? "bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between"
                : schoolTrial?.status === 'active'
                  ? "bg-green-50 border border-green-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between"
                  : "bg-slate-50 border border-border-light rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between"
            }>
              <div>
                <div className={
                  schoolTrial?.status === 'trial' ? "font-semibold text-yellow-700" :
                    schoolTrial?.status === 'active' ? "font-semibold text-green-700" :
                      "font-semibold text-text-muted-light"
                }>{t.schoolStatus}</div>
                {loadingTrial ? (
                  <div className="text-text-muted-light">{t.loadingTrialInfo}</div>
                ) : schoolTrial ? (
                  <div className="text-text-main-light mt-1">
                    Status: <span className="font-bold">{schoolTrial.status}</span><br />
                    {schoolTrial.status === 'trial' && (
                      <>
                        {t.trialEnds}: <span className="font-bold">{schoolTrial.trialExpiresAt ? new Date(schoolTrial.trialExpiresAt).toLocaleDateString() : 'N/A'}</span><br />
                        {t.daysLeft}: <span className="font-bold">{schoolTrial.daysLeft !== null ? schoolTrial.daysLeft : 'N/A'}</span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-red-500">{t.trialInfoNotAvailable}</div>
                )}
              </div>
            </div>
          </div>
          <OverviewTab stats={stats} quickActions={quickActions} notifications={notifications} setActiveTab={setActiveTab} loading={loading} />
        </>
      );
    }
    switch (activeTab) {
      case 'classes':
        return <ClassesTab onNavigateToAttendance={(classId) => {
          setActiveTab('attendance'); setTimeout(() => {
            const ev = new CustomEvent('attendance:setSelectedClass', { detail: { classId } });
            window.dispatchEvent(ev);
          }, 0);
        }} />;
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
        return <CatalogTab catalog={catalog || {}} onUpdate={handleUpdateCatalog} />;
      case 'rooms':
        return <RoomsTab />;
      case 'equipment':
        return <EquipmentTab />;
      case 'ads':
        return <AdsTab />;
      case 'landing':
        window.location.href = '/manager/landing-page-builder';
        return null;
      case 'reports':
        return <ReportsTab />;
      case 'log':
        return <LogTab schoolId={user?.school?._id || user?.school} />;
      case 'finance': // ✅ added finance support
        window.location.href = '/manager/finance';
        return null;
      default:
        return (
          <div className="card-base p-8 text-center">
            <Settings className="w-16 h-16 text-text-muted-light mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text-main-light mb-2">
              {t.management} {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h3>
            <p className="text-text-muted-light">
              {t.underDevelopment}. {t.contentForManagement.replace('{activeTab}', activeTab)}
            </p>
          </div>
        );
    }
  };

  console.log('ManagerDashboard rendering for user:', user);
  console.log('User role:', user?.role, 'permissions:', userPermissions);

  return (
    <div className="min-h-screen bg-background-light lg:flex">
      <UnifiedSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
        role="manager"
        userPermissions={userPermissions}
      />

      <div className="flex-1 relative">
        <TopNav
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeTab={activeTab}
          navigationItems={navigationItems}
          logout={logout}
        />

        <main className="p-4 md:p-4">
          {renderTabContent()}
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default ManagerDashboard;
