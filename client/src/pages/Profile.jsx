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
    contact: {
      phone1: user?.contact?.phone1 || '',
      phone2: user?.contact?.phone2 || '',
      address: user?.contact?.address || '',
    },
    experience: user?.experience || 0,
    status: user?.status || 'active'
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
      contact: {
        phone1: user?.contact?.phone1 || '',
        phone2: user?.contact?.phone2 || '',
        address: user?.contact?.address || '',
      },
      experience: user?.experience || 0,
      status: user?.status || 'active'
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
      const response = await axios.put('/api/users/profile', formData, { headers: authHeaders() });
      
      // Update the user data in context
      const updatedUserData = response.data;
      updateUser(updatedUserData);
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile. Please try again.');
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
        alert('Please enter a valid amount.');
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
      alert(err?.response?.data?.message || 'Failed to create payment');
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
      'admin': 'Admin',
      'manager': 'Manager',
      'teacher': 'Teacher',
      'student': 'Student',
      'principal': 'Principal',
      'staff pedagogique': 'Pedagogical Staff',
      'staff': 'Staff'
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
        <h3 className="text-lg font-medium text-gray-900">Teaching Information</h3>
        
        {(hasExperience || isEditing) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
              {isEditing ? (
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-gray-900">{user?.experience} years</p>
              )}
            </div>
            
            {(hasStatus || isEditing) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employment Status</label>
                {isEditing ? (
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="employed">Employed</option>
                    <option value="freelance">Freelance</option>
                    <option value="retired">Retired</option>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Activities</label>
            {Array.isArray(user?.activities) && user.activities.length ? (
              <div className="space-y-2">
                {user.activities.map((act, idx) => (
                  <div key={idx} className="text-sm text-gray-800">
                    <span className="font-semibold mr-1">{(act.type || '').replace(/([A-Z])/g,' $1').replace(/^\w/, c=>c.toUpperCase())}:</span>
                    <span>{(act.items||[]).length} item{(act.items||[]).length!==1?'s':''}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No activities configured.</p>
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
            <h3 className="text-lg font-semibold text-blue-900">Administrative Access</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-blue-800">Full System Access</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-blue-800">User Management</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-blue-800">System Configuration</span>
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
        <h3 className="text-lg font-medium text-gray-900">Work Information</h3>
        
        {/* Management Access card for manager */}
        {isManager && (
          <div className="bg-indigo-50 border-indigo-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Users className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-indigo-900">Management Access</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2"><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-indigo-800">Staff Management</span></div>
              <div className="flex items-center space-x-2"><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-indigo-800">Class Management</span></div>
              <div className="flex items-center space-x-2"><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-indigo-800">Reports Access</span></div>
            </div>
          </div>
        )}
        
        {(isStaff && (hasStatus || isEditing)) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Work Status</label>
            {isEditing ? (
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="on_vacation">On Vacation</option>
                <option value="stopped">Stopped</option>
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
            { label: 'Total Users', value: String(u.data?.count ?? 0), icon: Users, color: 'text-blue-600' },
            { label: 'Schools', value: String(s.data?.count ?? 0), icon: MapPin, color: 'text-green-600' },
            { label: 'Game Templates', value: String(t.data?.count ?? 0), icon: BookOpen, color: 'text-purple-600' },
            { label: 'Last Updated', value: new Date(user?.updatedAt||Date.now()).toLocaleDateString(), icon: Clock, color: 'text-orange-600' },
          ]);
        } else if (user?.role === 'manager') {
          const staffCount = await axios.get('/api/users/count', { params: { role: 'staff' }, headers });
          if (!mounted) return;
          setStatsData([
            { label: 'Total Staff', value: String(staffCount.data?.count ?? 0), icon: Users, color: 'text-blue-600' },
            { label: 'School', value: user?.school?.name || '-', icon: MapPin, color: 'text-green-600' },
            { label: 'Last Updated', value: new Date(user?.updatedAt||Date.now()).toLocaleDateString(), icon: Clock, color: 'text-orange-600' },
          ]);
        } else if (user?.role === 'teacher') {
          setStatsData([
            { label: 'Experience', value: `${user?.experience||0} yrs`, icon: Activity, color: 'text-blue-600' },
            { label: 'Status', value: user?.status || 'employed', icon: Star, color: 'text-yellow-600' },
            { label: 'Last Updated', value: new Date(user?.updatedAt||Date.now()).toLocaleDateString(), icon: Clock, color: 'text-orange-600' },
          ]);
        } else {
          setStatsData([]);
        }
      } catch (_) {
        setStatsData([]);
      }
    })();
    return () => { mounted = false; };
  }, [user?.role, user?.updatedAt]);

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
        <p className="mt-4 text-gray-600">Loading profile...</p>
      </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => {
              const role = user?.role;
              if (role === 'admin') navigate('/admin/dashboard');
              else if (role === 'manager' || role === 'staff') navigate('/manager/dashboard');
              else if (role === 'teacher') navigate('/teacher/dashboard');
              else navigate('/');
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
{t('back-to-dashboard')}
          </button>
        </div>

        {/* Header */}
        <UnifiedCard className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
                {isEditing && (
                  <button className="absolute -bottom-1 -right-1 bg-white border border-gray-300 rounded-full p-1 hover:bg-gray-50 transition-colors">
                    <Camera className="w-4 h-4 text-gray-600" />
                  </button>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="border-b-2 border-blue-500 focus:outline-none bg-transparent"
                    />
                  ) : (
                    user.name
                  )}
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                    {getRoleDisplayName(user.role)}
                  </span>
                  {user?.school?.name && (
                    <span className="text-sm text-gray-600">• {user.school.name}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                                     <button
                     onClick={handleSave}
                     className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                   >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </button>
                                       <button
                       onClick={handleCancel}
                       className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                     >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                </>
              ) : (
                                 <button
                   onClick={() => setIsEditing(true)}
                   className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                 >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          {statsData && statsData.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              {renderStats()}
            </div>
          )}
        </UnifiedCard>

        {/* Profile Details */}
        <UnifiedCard>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email Address
                  </label>
                  {isEditing ? (
                                         <input
                       type="email"
                       name="email"
                       value={formData.email}
                       onChange={handleInputChange}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     />
                  ) : (
                    <p className="text-gray-900">{user.email}</p>
                  )}
                </div>
                
                {(user?.contact?.phone1 || user?.phone || isEditing) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="contact.phone1"
                        value={formData.contact?.phone1 || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{user?.contact?.phone1 || user?.phone}</p>
                    )}
                  </div>
                )}

                {(user?.contact?.phone2 || isEditing) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Secondary Phone
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="contact.phone2"
                        value={formData.contact?.phone2 || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{user?.contact?.phone2}</p>
                    )}
                  </div>
                )}

                {(user?.contact?.address || isEditing) && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Address
                    </label>
                    {isEditing ? (
                      <textarea
                        name="contact.address"
                        value={formData.contact?.address || ''}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{user?.contact?.address}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Role-specific Information */}
            {renderTeacherSpecificFields()}
            {renderAdminSpecificFields()}
            {renderManagerSpecificFields()}

            {/* Account Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Member Since
                  </label>
                  <p className="text-gray-900">
                    {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Activity className="w-4 h-4 inline mr-2" />
                    Last Updated
                  </label>
                  <p className="text-gray-900">
                    {new Date(user.updatedAt || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Enrollments & Balances (visible for students themselves, and managers/staff) */}
            {(['student','manager','staff'].includes(user?.role)) && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Enrollments & Balances</h3>
                {loadingFinance ? (
                  <p className="text-gray-500">Loading...</p>
                ) : enrollments.length > 0 ? (
                  <div className="space-y-3">
                    {enrollments.map((enr) => {
                      const remaining = deriveRemainingSessions(enr);
                      const overdue = remaining <= 0;
                      const lastPay = payments.find(p => (p.enrollmentId === enr._id) || (p.enrollmentId?._id === enr._id));
                      const snap = enr.pricingSnapshot || {};
                      const cycleInfo = snap.paymentModel === 'per_cycle' && snap.cycleSize ? ` (~${Math.floor(remaining / (snap.cycleSize || 1))} cycles)` : '';
                      return (
                        <div key={enr._id} className="p-3 border rounded-md bg-white">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900">{enr.classId?.name || enr.className || 'Class'}</p>
                            <div className="text-sm text-gray-600 flex flex-wrap gap-3 mt-1">
                              <span>Remaining: <span className="font-semibold text-gray-900">{remaining}</span>{cycleInfo}</span>
                              <span>
                                Status: <span className={`font-semibold ${enr.status === 'active' ? 'text-green-700' : 'text-gray-700'}`}>{enr.status || 'active'}</span>
                              </span>
                              {/* credit removed */}
                              {lastPay && (
                                <span>Last payment: <span className="font-semibold text-gray-900">{fmtDZ(lastPay.amount)}</span> on {new Date(lastPay.createdAt || lastPay.created_at || Date.now()).toLocaleDateString()}</span>
                              )}
                              {overdue && <span className="text-red-600 font-semibold">Overdue</span>}
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <button onClick={async ()=>{ const open = historyOpenId===enr._id ? null : enr._id; setHistoryOpenId(open); if (open) await loadEnrollmentHistory(enr._id); }} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50">
                              {historyOpenId===enr._id ? 'Hide' : 'Show'} Attendance History
                            </button>
                            {canManageFinance && (
                              <div className="flex items-center gap-2">
                                <button onClick={() => onOpenAddPayment(enr)} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50">Add Payment</button>
                              </div>
                            )}
                          </div>
                          {historyOpenId===enr._id && (
                            <div className="mt-3 border-t pt-3">
                              {historyLoading ? (
                                <p className="text-sm text-gray-500">Loading history…</p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {(historyMap[enr._id] || []).map(h => (
                                        <tr key={h._id}>
                                          <td className="px-3 py-2 text-sm text-gray-900">{new Date(h.date).toLocaleDateString()}</td>
                                          <td className="px-3 py-2 text-sm">
                                            <span className={`px-2 py-0.5 rounded-full border text-xs ${h.status==='present' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{h.status}</span>
                                          </td>
                                        </tr>
                                      ))}
                                      {!(historyMap[enr._id]||[]).length && (
                                        <tr><td className="px-3 py-2 text-sm text-gray-500" colSpan={2}>No attendance yet.</td></tr>
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
                  <p className="text-gray-500">No enrollments found.</p>
                )}
              </div>
            )}

    {/* Payments History (manager/staff only; server RBAC restricts /api/payments) */}
    {(['manager','staff'].includes(user?.role)) && (payments.length > 0 || canManageFinance) && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Payments</h3>
      {canManageFinance && enrollments.length > 0 && (
                    <button onClick={() => onOpenAddPayment(enrollments[0])} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50">Add Payment</button>
                  )}
                </div>
                {loadingFinance ? (
                  <p className="text-gray-500">Loading...</p>
                ) : payments.length === 0 ? (
                  <p className="text-gray-500">No payments yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kind</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {payments.map((p) => (
                          <tr key={p._id}>
                            <td className="px-3 py-2 text-sm text-gray-900">{new Date(p.createdAt || p.created_at || Date.now()).toLocaleDateString()}</td>
                            <td className="px-3 py-2 text-sm text-gray-700">{p.classId?.name || '-'}</td>
                            <td className="px-3 py-2 text-sm text-gray-700">{p.kind}</td>
                            <td className="px-3 py-2 text-sm text-gray-900 text-right">{fmtDZ(p.amount)}</td>
                            <td className="px-3 py-2 text-sm text-gray-700">{p.method || 'cash'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </UnifiedCard>
      </div>

      {/* Add Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 p-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900">Add Payment</h4>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePayment} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment</label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={paymentForm.enrollmentId}
                  onChange={(e) => setPaymentForm(f => ({ ...f, enrollmentId: e.target.value }))}
                  required
                >
                  <option value="">Select enrollment…</option>
                  {enrollments.map(e => (
                    <option key={e._id} value={e._id}>{e.classId?.name || e.className || 'Class'} ({e.status})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kind</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={paymentForm.kind}
                    onChange={(e) => setPaymentForm(f => ({ ...f, kind: e.target.value }))}
                  >
                    <option value="pay_sessions">Pay Sessions</option>
                    <option value="pay_cycles">Pay Cycles</option>
                    {/* only sessions or cycles */}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Units</label>
                  <input type="number" min="1" className="w-full px-3 py-2 border rounded-md" value={paymentForm.units}
                    onChange={(e) => setPaymentForm(f => ({ ...f, units: Math.max(1, parseInt(e.target.value || '1', 10)) }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (DZ)</label>
                <input type="number" min="0" className="w-full px-3 py-2 border rounded-md" value={computeSuggestedAmount(paymentForm) || ''} readOnly />
                {computeSuggestedAmount(paymentForm) && (
                  <p className="text-xs text-gray-500 mt-1">Suggested: {fmtDZ(computeSuggestedAmount(paymentForm))}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <input type="text" className="w-full px-3 py-2 border rounded-md" value={paymentForm.note}
                  onChange={(e) => setPaymentForm(f => ({ ...f, note: e.target.value }))} />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="px-3 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={savingPayment} className="px-3 py-2 text-sm rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">{savingPayment ? 'Saving…' : 'Save Payment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

  {/* credit UI removed */}
    </div>
  );
};

export default Profile;
