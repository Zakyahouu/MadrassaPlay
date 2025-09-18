// ManagerDashboard.jsx
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
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [stats, setStats] = useState([
    { title: 'Total Students', value: '0', icon: Users, color: 'text-blue-600', change: 0 },
    { title: 'Active Teachers', value: '0', icon: UserCheck, color: 'text-green-600', change: 0 },
    { title: 'Total Classes', value: '0', icon: BookOpen, color: 'text-purple-600', change: 0 },
    { title: 'Total Staff', value: '0', icon: BarChart3, color: 'text-orange-600', change: 0 },
  ]);
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState({});

  // School trial status state
  const [schoolTrial, setSchoolTrial] = useState(null);
  const [loadingTrial, setLoadingTrial] = useState(true);

  // Fetch user permissions for staff users
  const fetchUserPermissions = async () => {
    try {
      console.log('Fetching permissions for user:', user?.role, user?.username);
      
      if (user?.role === 'staff') {
        const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
        if (!token) {
          console.log('No token found for staff user');
          return;
        }
        const config = { headers: { Authorization: `Bearer ${token}` } };
        console.log('Fetching employee data for user ID:', user._id);
        const response = await axios.get(`/api/employees/by-user/${user._id}`, config);
        console.log('Employee response:', response.data);
        console.log('Employee data:', response.data.data);
        console.log('Employee permissions:', response.data.data?.permissions);
        
        if (response.data.success && response.data.data.permissions) {
          setUserPermissions(response.data.data.permissions);
          console.log('Set permissions:', response.data.data.permissions);
        } else {
          console.log('No permissions found in response');
          setUserPermissions({});
        }
      } else if (user?.role === 'manager') {
        // Managers have all permissions
        setUserPermissions({ finance: true, logs: true });
        console.log('Set manager permissions: all access');
      } else {
        // Default permissions for any other role
        console.log('Setting default permissions for role:', user?.role);
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
          { title: 'Total Students', value: studentsRes.data.count?.toString() || '0', icon: Users, color: 'text-blue-600', change: 0 },
          { title: 'Active Teachers', value: teachersRes.data.count?.toString() || '0', icon: UserCheck, color: 'text-green-600', change: 0 },
          { title: 'Total Classes', value: (classesRes.data?.length || 0).toString(), icon: BookOpen, color: 'text-purple-600', change: 0 },
          { title: 'Total Staff', value: staffRes.data.count?.toString() || '0', icon: BarChart3, color: 'text-orange-600', change: 0 },
        ];
        setStats(newStats);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    const fetchSchoolTrial = async () => {
      try {
        const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
        if (!token || !user?.school) return;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get(`/api/schools/${user.school}`, config);
        const school = res.data;
        // Calculate days left
        let daysLeft = null;
        if (school.trialExpiresAt) {
          const now = new Date();
          const expires = new Date(school.trialExpiresAt);
          daysLeft = Math.max(0, Math.ceil((expires - now) / (1000 * 60 * 60 * 24)));
        }
        setSchoolTrial({
          status: school.status,
          trialExpiresAt: school.trialExpiresAt,
          daysLeft,
        });
      } catch (err) {
        setSchoolTrial(null);
      } finally {
        setLoadingTrial(false);
      }
    };
    fetchStats();
    fetchSchoolTrial();
    fetchUserPermissions();
  }, [activeTab, user?.school, user?.role, user?.username]);

  const quickActions = [
    {
      title: 'Gestion des Horaires',
      description: 'Voir et gérer les horaires des classes',
      icon: Calendar,
      color: 'text-blue-600',
      onClick: () => setActiveTab('timetable')
    },
    {
      title: 'Dossiers des Étudiants',
      description: 'Accéder aux informations et notes des étudiants',
      icon: GraduationCap,
      color: 'text-green-600',
      onClick: () => setActiveTab('students')
    },
    {
      title: 'Rapports et Analyses',
      description: 'Générer des rapports de performance',
      icon: BarChart3,
      color: 'text-purple-600',
      onClick: () => setActiveTab('reports')
    },
    {
      title: 'Paramètres du Système',
      description: 'Configurer les paramètres de l\'école',
      icon: Settings,
      color: 'text-gray-600',
      onClick: () => setActiveTab('catalog')
    },
  ];

  const notifications = [
    { message: 'Fonctionnalité de notifications bientôt disponible !', time: 'Restez à l\'écoute', type: 'info' },
  ];

  const navigationItems = [
    { id: 'overview', name: 'Aperçu' },
    { id: 'classes', name: 'Classes' },
    { id: 'attendance', name: 'Présence' },
    { id: 'students', name: 'Étudiants' },
    { id: 'teachers', name: 'Enseignants' },
    { id: 'employees', name: 'Personnel' },
    { id: 'timetable', name: 'Emploi du Temps' },
    { id: 'rooms', name: 'Salles' },
    { id: 'equipment', name: 'Équipement' },
    { id: 'catalog', name: 'Catalogue' },
    { id: 'ads', name: 'Publicités' },
    { id: 'reports', name: 'Rapports' },
    { id: 'finance', name: 'Finance' } // ✅ added to navigation
  ];

  const renderTabContent = () => {
    if (activeTab === 'overview') {
      return (
        <>
          <div className="mb-6">
            <div className={
              schoolTrial?.status === 'trial'
                ? "bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between"
                : schoolTrial?.status === 'active'
                ? "bg-green-50 border border-green-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between"
                : "bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between"
            }>
              <div>
                <div className={
                  schoolTrial?.status === 'trial' ? "font-semibold text-yellow-700" :
                  schoolTrial?.status === 'active' ? "font-semibold text-green-700" :
                  "font-semibold text-gray-700"
                }>School Status</div>
                {loadingTrial ? (
                  <div className="text-gray-500">Loading trial info...</div>
                ) : schoolTrial ? (
                  <div className="text-gray-800 mt-1">
                    Status: <span className="font-bold">{schoolTrial.status}</span><br />
                    {schoolTrial.status === 'trial' && (
                      <>
                        Trial ends: <span className="font-bold">{schoolTrial.trialExpiresAt ? new Date(schoolTrial.trialExpiresAt).toLocaleDateString() : 'N/A'}</span><br />
                        Days left: <span className="font-bold">{schoolTrial.daysLeft !== null ? schoolTrial.daysLeft : 'N/A'}</span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-red-500">Trial info not available.</div>
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
      case 'log':
        return <LogTab schoolId={user?.school?._id || user?.school} />;
      case 'finance': // ✅ added finance support
        window.location.href = '/manager/finance';
        return null;
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

  console.log('ManagerDashboard rendering for user:', user);
  console.log('User role:', user?.role, 'permissions:', userPermissions);

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
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
    </div>
  );
};

export default ManagerDashboard;
