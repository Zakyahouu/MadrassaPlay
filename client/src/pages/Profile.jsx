import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  BookOpen,
  Users,
  Settings,
  Edit3,
  Save,
  X,
  Camera,
  Shield,
  Star,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import UnifiedCard from '../components/shared/UnifiedCard';

const Profile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  // Payments/Profile extras
  const [enrollments, setEnrollments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loadingFinance, setLoadingFinance] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ enrollmentId: '', units: 1, amount: '', kind: 'pay_sessions', note: '' });
  // Credit removed entirely
  const [savingPayment, setSavingPayment] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    username: user?.username || '',
    contact: {
      phone1: user?.contact?.phone1 || '',
      phone2: user?.contact?.phone2 || '',
      address: user?.contact?.address || '',
    },
    experience: user?.experience || 0,
    status: user?.status || 'active',
    password: '',
    confirmPassword: ''
  });

  // helper to add auth header
  const authHeaders = () => {
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
      return {};
    }
  };

  // Update formData when user data changes
  useEffect(() => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      username: user?.username || '',
      contact: {
        phone1: user?.contact?.phone1 || '',
        phone2: user?.contact?.phone2 || '',
        address: user?.contact?.address || '',
      },
      experience: user?.experience || 0,
      status: user?.status || 'active',
      password: '',
      confirmPassword: ''
    });
  }, [user]);

  // Utility: DZ currency formatting (local, to avoid new imports)
  const fmtDZ = (n) => new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(Number(n || 0));

  // Load enrollments/payments only for student/manager/staff
  useEffect(() => {
    const load = async () => {
      if (!user?._id) return;
      const role = user?.role;
      const allowFinance = ['student', 'manager', 'staff'].includes(role);
      if (!allowFinance) return; // avoid 403 for admin/teacher
      setLoadingFinance(true);
      try {
        const enrPromise = axios.get(`/api/enrollments/student/${user._id}`, { headers: authHeaders() });
        const payPromise = ['manager', 'staff'].includes(role)
          ? axios.get('/api/payments', { params: { studentId: user._id, limit: 200 }, headers: authHeaders() })
          : Promise.resolve({ data: { items: [] } });
        const [enrRes, payRes] = await Promise.all([enrPromise, payPromise]);
        setEnrollments(Array.isArray(enrRes.data) ? enrRes.data : []);
        setPayments(Array.isArray(payRes.data?.items) ? payRes.data.items : []);
      } catch (e) {
        console.error('Failed loading enrollments/payments:', e);
      } finally {
        setLoadingFinance(false);
      }
    };
    load();
  }, [user?._id, user?.role]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Support nested fields using dot-notation, e.g. "contact.phone1"
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent] || {}),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSave = async () => {
    try {
      if (formData.password && formData.password !== formData.confirmPassword) {
        alert(t.passwordsDoNotMatch || "Passwords do not match");
        return;
      }

      const payload = { ...formData };
      delete payload.confirmPassword;
      if (!payload.password) delete payload.password;

      const response = await axios.put('/api/users/profile', payload, { headers: authHeaders() });

      // Update the user data in context
      const updatedUserData = response.data;
      updateUser(updatedUserData);

      // Reset password fields
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));

      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert(t.errorSavingProfile || 'Error saving profile. Please try again.');
    }
  };

  const canManageFinance = ['manager', 'staff'].includes(user?.role);

  const deriveRemainingSessions = (enr) => {
    const completed = typeof enr.sessionsCompleted === 'number' ? enr.sessionsCompleted : (typeof enr.totalSessions === 'number' ? enr.totalSessions : 0);
    const attended = typeof enr.sessionsAttended === 'number' ? enr.sessionsAttended : 0;
    const remaining = Math.max(0, completed - attended);
    return remaining;
  };

  const lastPaymentForEnrollment = (enrollmentId) => {
    const found = payments.find(p => p.enrollmentId === enrollmentId || p.enrollmentId?._id === enrollmentId || p.enrollmentId?.toString?.() === enrollmentId?.toString?.());
    return found || null;
  };

  const onOpenAddPayment = (enr) => {
    const model = enr?.pricingSnapshot?.paymentModel;
    const defaultKind = model === 'per_cycle' ? 'pay_cycles' : 'pay_sessions';
    setPaymentForm({
      enrollmentId: enr?._id || '',
      units: 1,
      amount: '',
      kind: defaultKind,
      note: ''
    });
    setShowPaymentModal(true);
  };

  const computeSuggestedAmount = (form) => {
    const enr = enrollments.find(e => (e._id === form.enrollmentId));
    if (!enr) return '';
    const snap = enr.pricingSnapshot || {};
    if (form.kind === 'pay_sessions' && typeof snap.sessionPrice === 'number') {
      return (Number(form.units || 0) * Number(snap.sessionPrice || 0)) || '';
    }
    if (form.kind === 'pay_cycles' && typeof snap.cyclePrice === 'number') {
      return (Number(form.units || 0) * Number(snap.cyclePrice || 0)) || '';
    }
    // If per-session price missing, derive from cycle
    if (form.kind === 'pay_sessions' && !(typeof snap.sessionPrice === 'number') && snap.cyclePrice > 0 && snap.cycleSize > 0) {
      const per = snap.cyclePrice / snap.cycleSize;
      return Math.round(Number(form.units || 0) * per) || '';
    }
    return '';
  };

  const handleCreatePayment = async (e) => {
    e?.preventDefault?.();
    if (!paymentForm.enrollmentId) return;
    try {
      setSavingPayment(true);
      const amt = Number(computeSuggestedAmount(paymentForm) || 0);
      if (!amt || amt <= 0) {
        alert(t.enterValidAmount || 'Please enter a valid amount.');
        setSavingPayment(false);
        return;
      }
      const idempotencyKey = (crypto?.randomUUID && crypto.randomUUID()) || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const body = {
        enrollmentId: paymentForm.enrollmentId,
        amount: Math.round(amt),
        kind: paymentForm.kind,
        note: paymentForm.note?.trim() || undefined,
        idempotencyKey
      };
      await axios.post('/api/payments', body, { headers: authHeaders() });
      setShowPaymentModal(false);
      // refresh payments
      const payRes = await axios.get('/api/payments', { params: { studentId: user._id, limit: 200 }, headers: authHeaders() });
      setPayments(Array.isArray(payRes.data?.items) ? payRes.data.items : []);
    } catch (err) {
      console.error('Create payment failed', err);
      alert(err?.response?.data?.message || t.failedToCreatePayment || 'Failed to create payment');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      contact: {
        phone1: user?.contact?.phone1 || '',
        phone2: user?.contact?.phone2 || '',
        address: user?.contact?.address || '',
      },
      experience: user?.experience || 0,
      status: user?.status || 'active'
    });
    setIsEditing(false);
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      'admin': t.admin || 'Admin',
      'manager': t.manager || 'Manager',
      'teacher': t.teacher || 'Teacher',
      'student': t.student || 'Student',
      'principal': t.principal || 'Principal',
      'staff pedagogique': t.pedagogicalStaff || 'Pedagogical Staff',
      'staff': t.staff || 'Staff'
    };
    return roleNames[role] || role;
  };

  // Attendance history per enrollment (on-demand)
  const [historyOpenId, setHistoryOpenId] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyMap, setHistoryMap] = useState({}); // enrollmentId -> list
  const loadEnrollmentHistory = async (enrollmentId) => {
    try {
      setHistoryLoading(true);
      const res = await axios.get(`/api/attendance/history`, { params: { enrollmentId }, headers: authHeaders() });
      setHistoryMap(m => ({ ...m, [enrollmentId]: res.data?.items || [] }));
    } catch (e) {
      console.error('Failed history', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      'admin': 'bg-red-50 text-red-700 border-red-200',
      'manager': 'bg-blue-50 text-blue-700 border-blue-200',
      'teacher': 'bg-purple-50 text-purple-700 border-purple-200',
      'student': 'bg-green-50 text-green-700 border-green-200',
      'principal': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'staff pedagogique': 'bg-orange-50 text-orange-700 border-orange-200',
      'staff': 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colors[role] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-50 text-green-700 border-green-200',
      on_vacation: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      stopped: 'bg-gray-50 text-gray-700 border-gray-200',
      employed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      freelance: 'bg-amber-50 text-amber-700 border-amber-200',
      retired: 'bg-gray-50 text-gray-700 border-gray-200',
    };
    return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const renderTeacherSpecificFields = () => {
    if (user?.role !== 'teacher') return null;

    // Only show if there's actual data or we're editing
    const hasExperience = (user?.experience && user.experience > 0) || isEditing;
    const hasStatus = user?.status || isEditing;
    const hasActivities = Array.isArray(user?.activities) && user.activities.length > 0;

    if (!hasExperience && !hasStatus && !hasActivities && !isEditing) return null;

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">{t.teachingInformation}</h3>

        {(hasExperience || isEditing) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.yearsOfExperience}</label>
              {isEditing ? (
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  min="0"
                  readOnly={!['admin', 'manager'].includes(user.role)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!['admin', 'manager'].includes(user.role) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
              ) : (
                <p className="text-gray-900">{user?.experience} {t.years || 'years'}</p>
              )}
            </div>

            {(hasStatus || isEditing) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.employmentStatus}</label>
                {isEditing ? (
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    disabled={!['admin', 'manager'].includes(user.role)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-100"
                  >
                    <option value="employed">{t.employed || 'Employed'}</option>
                    <option value="freelance">{t.freelance || 'Freelance'}</option>
                    <option value="retired">{t.retired || 'Retired'}</option>
                  </select>
                ) : (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(user?.status)}`}>
                    {user?.status}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {(hasActivities || isEditing) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.activities}</label>
            {Array.isArray(user?.activities) && user.activities.length ? (
              <div className="space-y-2">
                {user.activities.map((act, idx) => (
                  <div key={idx} className="text-sm text-gray-800">
                    <span className="font-semibold mr-1">{(act.type || '').replace(/([A-Z])/g, ' $1').replace(/^\w/, c => c.toUpperCase())}:</span>
                    <span>{(act.items || []).length} {(act.items || []).length !== 1 ? (t.items || 'items') : (t.item || 'item')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">{t.noActivitiesConfigured}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderAdminSpecificFields = () => {
    if (user?.role !== 'admin') return null;

    return (
      <div className="space-y-6">
        <UnifiedCard className="bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-2 mb-3">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">{t.administrativeAccess}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-blue-800">{t.fullSystemAccess}</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-blue-800">{t.userManagement}</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-blue-800">{t.systemConfiguration}</span>
            </div>
          </div>
        </UnifiedCard>
      </div>
    );
  };

  const renderManagerSpecificFields = () => {
    if (user?.role !== 'manager' && user?.role !== 'staff' && user?.role !== 'employee') return null;

    const hasStatus = user?.status || isEditing;
    const isManager = user?.role === 'manager';
    const isStaff = user?.role === 'staff' || user?.role === 'employee';

    if (!isManager && !hasStatus && !isEditing) return null;

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">{t.workInformation}</h3>

        {/* Management Access card for manager */}
        {isManager && (
          <div className="bg-indigo-50 border-indigo-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Users className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-indigo-900">{t.managementAccess}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2"><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-indigo-800">{t.staffManagement}</span></div>
              <div className="flex items-center space-x-2"><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-indigo-800">{t.classManagement}</span></div>
              <div className="flex items-center space-x-2"><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-indigo-800">{t.reportsAccess}</span></div>
            </div>
          </div>
        )}

        {(isStaff && (hasStatus || isEditing)) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.workStatus}</label>
            {isEditing ? (
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">{t.active || 'Active'}</option>
                <option value="on_vacation">{t.onVacation || 'On Vacation'}</option>
                <option value="stopped">{t.stopped || 'Stopped'}</option>
              </select>
            ) : (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(user?.status)}`}>
                {user?.status}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  const [statsData, setStatsData] = useState(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const headers = authHeaders();
        if (user?.role === 'admin') {
          const [u, s, t] = await Promise.all([
            axios.get('/api/users/count', { headers }),
            axios.get('/api/schools/count', { headers }),
            axios.get('/api/templates/count', { headers }),
          ]);
          if (!mounted) return;
          setStatsData([
            { label: t.totalUsers, value: String(u.data?.count ?? 0), icon: Users, color: 'text-blue-600' },
            { label: t.schools, value: String(s.data?.count ?? 0), icon: MapPin, color: 'text-green-600' },
            { label: t.templates, value: String(t.data?.count ?? 0), icon: BookOpen, color: 'text-purple-600' },
            { label: t.lastUpdated, value: new Date(user?.updatedAt || Date.now()).toLocaleDateString(), icon: Clock, color: 'text-orange-600' },
          ]);
        } else if (user?.role === 'manager') {
          const staffCount = await axios.get('/api/users/count', { params: { role: 'staff' }, headers });
          if (!mounted) return;
          setStatsData([
            { label: t.totalStaff, value: String(staffCount.data?.count ?? 0), icon: Users, color: 'text-blue-600' },
            { label: t.school || 'School', value: user?.school?.name || '-', icon: MapPin, color: 'text-green-600' },
            { label: t.lastUpdated, value: new Date(user?.updatedAt || Date.now()).toLocaleDateString(), icon: Clock, color: 'text-orange-600' },
          ]);
        } else if (user?.role === 'teacher') {
          setStatsData([
            { label: t.experience || 'Experience', value: `${user?.experience || 0} yrs`, icon: Activity, color: 'text-blue-600' },
            { label: t.status, value: user?.status || 'employed', icon: Star, color: 'text-yellow-600' },
            { label: t.lastUpdated, value: new Date(user?.updatedAt || Date.now()).toLocaleDateString(), icon: Clock, color: 'text-orange-600' },
          ]);
        } else {
          setStatsData([]);
        }
      } catch (_) {
        setStatsData([]);
      }
    })();
    return () => { mounted = false; };
  }, [user?.role, user?.updatedAt, t]);

  const renderStats = () => {
    if (!statsData || statsData.length === 0) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, index) => (
          <UnifiedCard key={index} padding="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          </UnifiedCard>
        ))}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t.loadingProfile || 'Loading profile...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7]" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Global Top Bar */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-40">
        <button
          onClick={() => {
            const role = user?.role;
            if (role === 'admin') navigate('/admin/dashboard');
            else if (role === 'manager' || role === 'staff') navigate('/manager/dashboard');
            else if (role === 'teacher') navigate('/teacher/dashboard');
            else navigate('/');
          }}
          className="flex items-center gap-2 text-slate-600 hover:text-primary font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.backToDashboard || 'Back to dashboard'}
        </button>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          V2.4.0 ACADEMICO
        </span>
      </div>

      <div className="max-w-[1280px] mx-auto py-10 px-8 space-y-8">
        {/* Main Header Card */}
        <UnifiedCard padding="p-8" className="relative group">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm overflow-hidden">
                  <User className="w-12 h-12 text-slate-300" />
                </div>
                {/* Only admins/managers can edit profile picture or name/details */}
                {isEditing && !['teacher', 'student'].includes(user.role) && (
                  <button className="absolute -bottom-1 -right-1 bg-primary text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform">
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                  {/* Name only editable for admins/managers */}
                  {isEditing && !['teacher', 'student'].includes(user.role) ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="border-b-2 border-primary focus:outline-none bg-transparent"
                    />
                  ) : (
                    user.name
                  )}
                </h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getRoleColor(user.role).replace('bg-blue-50', 'bg-blue-100/50')}`}>
                    {getRoleDisplayName(user.role)}
                  </span>
                  <span className="text-sm text-slate-400 flex items-center gap-1.5 focus:outline-none">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    {t.activeSince || 'Active since'} {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-lg shadow-indigo-100 shadow-lg hover:bg-indigo-700 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    {t.save || 'Save Changes'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-6 py-2.5 border border-slate-200 text-sm font-bold text-slate-600 rounded-lg hover:bg-slate-50 transition-all"
                  >
                    {t.cancel || 'Cancel'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-6 py-2.5 border border-slate-200 text-sm font-bold text-slate-600 rounded-lg hover:bg-slate-50 transition-all group-hover:border-primary/30"
                >
                  <Edit3 className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                  {t.editProfile || 'Edit Profile'}
                </button>
              )}
            </div>
          </div>

          {/* Stats Bar Integrated */}
          {statsData && statsData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
              {statsData.slice(0, 3).map((stat, idx) => (
                <div key={idx} className="bg-slate-50/50 rounded-xl p-5 border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900 leading-none">{stat.value}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                    <stat.icon className={`w-5 h-5 ${stat.color.replace('text-blue-600', 'text-primary')}`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </UnifiedCard>

        {/* 2-Column Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column - Core Info */}
          <div className="lg:col-span-5 space-y-8">
            <UnifiedCard className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-80"></div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                {t.basicInformation || 'BASIC INFORMATION'}
              </h3>

              <div className="space-y-6">

                {/* Username Field - Editable for everyone (if supported) */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    {t.username || 'USERNAME'}
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        name="username"
                        value={formData.username || ''}
                        onChange={handleInputChange}
                        className="flex-1 px-3 py-2 border-b border-slate-200 focus:border-primary focus:outline-none transition-colors"
                      />
                    ) : (
                      <p className="text-sm font-medium text-slate-900">{user.username || '-'}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    {t.emailAddress || 'EMAIL ADDRESS'}
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    {/* Read-only for teachers and students */}
                    {isEditing && !['teacher', 'student'].includes(user.role) ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="flex-1 px-3 py-2 border-b border-slate-200 focus:border-primary focus:outline-none transition-colors"
                      />
                    ) : (
                      <p className="text-sm font-medium text-slate-900">{user.email}</p>
                    )}
                  </div>
                </div>

                {(user?.contact?.phone1 || user?.phone || isEditing) && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      {t.phoneNumber || 'PHONE NUMBER'}
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      {/* Read-only for teachers and students */}
                      {isEditing && !['teacher', 'student'].includes(user.role) ? (
                        <input
                          type="tel"
                          name="contact.phone1"
                          value={formData.contact?.phone1 || ''}
                          onChange={handleInputChange}
                          className="flex-1 px-3 py-2 border-b border-slate-200 focus:border-primary focus:outline-none transition-colors"
                        />
                      ) : (
                        <p className="text-sm font-medium text-slate-900">{user?.contact?.phone1 || user?.phone}</p>
                      )}
                    </div>
                  </div>
                )}

                {(user?.contact?.address || isEditing) && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      {t.address || 'ADDRESS'}
                    </label>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      {/* Read-only for teachers and students */}
                      {isEditing && !['teacher', 'student'].includes(user.role) ? (
                        <textarea
                          name="contact.address"
                          value={formData.contact?.address || ''}
                          onChange={handleInputChange}
                          rows={3}
                          className="flex-1 px-3 py-2 border-b border-slate-200 focus:border-primary focus:outline-none transition-colors resize-none"
                        />
                      ) : (
                        <p className="text-sm font-medium text-slate-900 leading-relaxed">{user?.contact?.address}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </UnifiedCard>

            <UnifiedCard className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-80"></div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                {t.accountInformation || 'ACCOUNT INFORMATION'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    {t.memberSince || 'MEMBER SINCE'}
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    {t.lastUpdated || 'LAST UPDATED'}
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                      <TrendingUp className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(user.updatedAt || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </UnifiedCard>

            {isEditing && (
              <UnifiedCard className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500 opacity-80"></div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                  {t.security || 'SECURITY'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      {t.newPassword || 'NEW PASSWORD'}
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                        <Shield className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder={t.leaveBlankToKeep || "Leave blank to keep"}
                        className="flex-1 px-3 py-2 border-b border-slate-200 focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      {t.confirmPassword || 'CONFIRM PASSWORD'}
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                        <Shield className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder={t.confirmNewPassword || "Confirm new password"}
                        className="flex-1 px-3 py-2 border-b border-slate-200 focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </UnifiedCard>
            )}
          </div>

          {/* Right Column - Work & Academic */}
          <div className="lg:col-span-7 space-y-8">
            {renderTeacherSpecificFields()}
            {renderAdminSpecificFields()}
            {renderManagerSpecificFields()}

            {/* Enrollments List Redesigned */}
            {(['student', 'manager', 'staff'].includes(user?.role)) && (
              <UnifiedCard className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-80"></div>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    {t.enrollmentsBalances || 'ENROLLMENTS & BALANCES'}
                  </h3>
                </div>

                {loadingFinance ? (
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Clock className="w-4 h-4 animate-spin" />
                    {t.loading || 'Loading...'}
                  </div>
                ) : enrollments.length > 0 ? (
                  <div className="space-y-4">
                    {enrollments.map((enr) => {
                      const remaining = deriveRemainingSessions(enr);
                      const overdue = remaining <= 0;
                      const snap = enr.pricingSnapshot || {};
                      return (
                        <div key={enr._id} className="p-5 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-white transition-colors group">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                              <p className="font-bold text-slate-900 group-hover:text-primary transition-colors">
                                {enr.classId?.name || enr.className || t.class || 'Class'}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                <span className="text-xs text-slate-400">
                                  {t.remaining || 'Remaining'}: <span className="text-slate-900 font-bold">{remaining}</span>
                                </span>
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border ${enr.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                  {enr.status || 'active'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <button
                                onClick={async () => { const open = historyOpenId === enr._id ? null : enr._id; setHistoryOpenId(open); if (open) await loadEnrollmentHistory(enr._id); }}
                                className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-primary/30 transition-all flex items-center gap-2"
                              >
                                {historyOpenId === enr._id ? <X className="w-3 h-3" /> : <Activity className="w-3 h-3 text-primary" />}
                                {historyOpenId === enr._id ? (t.hide || 'Hide') : (t.show || 'Show')}
                              </button>
                              {canManageFinance && (
                                <button onClick={() => onOpenAddPayment(enr)} className="px-4 py-2 text-xs font-bold text-white bg-primary rounded-lg shadow-sm hover:bg-indigo-700 transition-all">
                                  {t.addPayment || 'Add Payment'}
                                </button>
                              )}
                            </div>
                          </div>

                          {overdue && (
                            <div className="mt-3 bg-rose-50 border border-rose-100 rounded-lg p-2.5 flex items-center gap-2 text-rose-700 text-[10px] font-bold uppercase tracking-widest">
                              <AlertCircle className="w-3 h-3" />
                              {t.overdue || 'Account Overdue'}
                            </div>
                          )}

                          {historyOpenId === enr._id && (
                            <div className="mt-6 border-t border-slate-200 pt-6 animate-in slide-in-from-top-2 duration-300">
                              {historyLoading ? (
                                <p className="text-sm text-slate-400 text-center py-4">{t.loadingHistory || 'Loading history...'}</p>
                              ) : (
                                <div className="rounded-lg border border-slate-100 overflow-hidden">
                                  <table className="min-w-full divide-y divide-slate-100">
                                    <thead className="bg-slate-50/80">
                                      <tr>
                                        <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.date}</th>
                                        <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.status || 'Status'}</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-50">
                                      {(historyMap[enr._id] || []).map(h => (
                                        <tr key={h._id} className="hover:bg-slate-50/50 transition-colors">
                                          <td className="px-5 py-3 text-sm font-medium text-slate-900">{new Date(h.date).toLocaleDateString()}</td>
                                          <td className="px-5 py-3 text-sm">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border ${h.status === 'present' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>{h.status}</span>
                                          </td>
                                        </tr>
                                      ))}
                                      {!(historyMap[enr._id] || []).length && (
                                        <tr><td className="px-5 py-6 text-sm text-slate-400 text-center" colSpan={2}>{t.noAttendanceYet || 'No attendance records found.'}</td></tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm italic">{t.noEnrollmentsFound || 'No enrollments found.'}</p>
                )}
              </UnifiedCard>
            )}

            {/* Payments History Redesigned */}
            {(['manager', 'staff'].includes(user?.role)) && (payments.length > 0 || canManageFinance) && (
              <UnifiedCard className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-80"></div>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{t.payments || 'PAYMENTS'}</h3>
                </div>

                {loadingFinance ? (
                  <p className="text-slate-400 text-sm">{t.loading || 'Loading...'}</p>
                ) : payments.length === 0 ? (
                  <p className="text-slate-400 text-sm italic">{t.noPaymentsYet || 'No payments recorded yet.'}</p>
                ) : (
                  <div className="rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                    <table className="min-w-full divide-y divide-slate-100">
                      <thead className="bg-slate-50/80">
                        <tr>
                          <th className="px-5 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.date}</th>
                          <th className="px-5 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.class || 'CLASS'}</th>
                          <th className="px-5 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.kind || 'KIND'}</th>
                          <th className="px-5 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.amount || 'AMOUNT'}</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-50">
                        {payments.map((p) => (
                          <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-4 text-sm font-medium text-slate-900">{new Date(p.createdAt || p.created_at || Date.now()).toLocaleDateString()}</td>
                            <td className="px-5 py-4 text-sm text-slate-600">{p.classId?.name || '-'}</td>
                            <td className="px-5 py-4 text-sm">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                {p.kind?.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-sm font-bold text-slate-900 text-right">{fmtDZ(p.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </UnifiedCard>
            )}
          </div>
        </div>

        <p className="text-center text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] pt-12 pb-6">
          © 2026 AcademiCo Learning Systems. All rights reserved.
        </p>
      </div >

      {/* Payment Modal Refined */}
      {
        showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                <h4 className="text-lg font-bold text-slate-900 uppercase tracking-tight">{t.addPayment || 'Add New Payment'}</h4>
                <button onClick={() => setShowPaymentModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleCreatePayment} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.enrollment || 'Select Enrollment'}</label>
                  <select
                    className="w-full px-1 py-2 border-b border-slate-200 focus:border-primary focus:outline-none bg-transparent transition-colors font-medium"
                    value={paymentForm.enrollmentId}
                    onChange={(e) => setPaymentForm(f => ({ ...f, enrollmentId: e.target.value }))}
                    required
                  >
                    <option value="">{t.selectEnrollment || 'Choose a class…'}</option>
                    {enrollments.map(e => (
                      <option key={e._id} value={e._id}>{e.classId?.name || e.className || t.class || 'Class'}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.kind || 'Payment Kind'}</label>
                    <select
                      className="w-full px-1 py-2 border-b border-slate-200 focus:border-primary focus:outline-none bg-transparent font-medium"
                      value={paymentForm.kind}
                      onChange={(e) => setPaymentForm(f => ({ ...f, kind: e.target.value }))}
                    >
                      <option value="pay_sessions">{t.paySessions || 'Per Session'}</option>
                      <option value="pay_cycles">{t.payCycles || 'Per Cycle'}</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.quantity || 'Units'}</label>
                    <input type="number" min="1" className="w-full px-1 py-2 border-b border-slate-200 focus:border-primary focus:outline-none font-medium" value={paymentForm.units}
                      onChange={(e) => setPaymentForm(f => ({ ...f, units: Math.max(1, parseInt(e.target.value || '1', 10)) }))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.amountDZ || 'Total Amount (DZ)'}</label>
                  <div className="relative">
                    <input type="number" min="0" className="w-full px-1 py-2 border-b border-slate-200 focus:border-primary focus:outline-none font-bold text-slate-900" value={computeSuggestedAmount(paymentForm) || ''} readOnly />
                    {computeSuggestedAmount(paymentForm) && (
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-primary font-bold">{fmtDZ(computeSuggestedAmount(paymentForm))}</span>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.notesOptional || 'Notes'}</label>
                  <input type="text" className="w-full px-1 py-2 border-b border-slate-200 focus:border-primary focus:outline-none placeholder:text-slate-300" value={paymentForm.note} placeholder="Add observation…"
                    onChange={(e) => setPaymentForm(f => ({ ...f, note: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-3 pt-4">
                  <button type="submit" disabled={savingPayment} className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50">
                    {savingPayment ? (t.saving || 'Processing…') : (t.savePayment || 'Confirm Payment')}
                  </button>
                  <button type="button" onClick={() => setShowPaymentModal(false)} className="w-full py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">
                    {t.cancel || 'Dismiss'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default Profile;
