import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, BookOpen, GraduationCap, Calendar, BarChart3, Settings, Bell, 
  UserCheck, Building2, FileText, Search, Plus, Edit, Trash2, Eye,
  Clock, Star, Award, TrendingUp, Filter, Download, Mail, Phone, X,
  User, MapPin, Shield, AlertTriangle, Loader
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = '/api/teachers';

const getAuthToken = () => {
  const userInfoString = localStorage.getItem('user');
  if (!userInfoString) {
    return null;
  }
  
  try {
    const userInfo = JSON.parse(userInfoString);
    return userInfo && userInfo.token ? userInfo.token : null;
  } catch (error) {
    console.error("Failed to parse userInfo from localStorage", error);
    return null;
  }
};

const getCurrentUser = () => {
  try {
    const userInfoString = localStorage.getItem('user');
    if (!userInfoString) return null;
    return JSON.parse(userInfoString);
  } catch (e) {
    return null;
  }
};

const TeachersTab = () => {
  const [teachers, setTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ type: '', data: null });
  const [formData, setFormData] = useState({});
  const [catalog, setCatalog] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState('supportLessons');
  const [pickerSearch, setPickerSearch] = useState('');

  // Build activities from selection
  const activityTypeLabel = (t) => ({
    supportLessons: 'Support Lessons',
    reviewCourses: 'Review Courses',
    vocationalTrainings: 'Vocational Trainings',
    languages: 'Languages',
    otherActivities: 'Other Activities',
  }[t] || t);

  const itemLabel = (type, item) => {
    if (!item) return '';
    if (type === 'supportLessons' || type === 'reviewCourses') {
      const hs = item.level === 'high_school' ? ` / ${item.stream}` : '';
      return `${item.level} / grade ${item.grade}${hs} / ${item.subject}`;
    }
    if (type === 'vocationalTrainings') return `${item.field} / ${item.specialty} / ${item.certificateType}`;
    if (type === 'languages') return `${item.language}${Array.isArray(item.levels) && item.levels.length ? ` (${item.levels.join(',')})` : ''}`;
    if (type === 'otherActivities') return `${item.activityType} / ${item.activityName}`;
    return JSON.stringify(item);
  };

  // Build activities array for API from selection state
  const buildActivitiesPayload = () => {
    if (!formData.activitiesSelection) return [];
    const out = [];
    Object.entries(formData.activitiesSelection).forEach(([type, items]) => {
      if (items && items.length) out.push({ type, items });
    });
    return out;
  };

  const jsonEq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  const toggleActivityItem = (type, item) => {
    const current = formData.activitiesSelection?.[type] || [];
    const exists = current.some((x) => jsonEq(x, item));
    const next = exists ? current.filter((x) => !jsonEq(x, item)) : [...current, item];
    setFormData({
      ...formData,
      activitiesSelection: {
        ...(formData.activitiesSelection || {}),
        [type]: next,
      },
    });
  };

  const loadCatalogIfNeeded = async () => {
    if (catalog) return;
    const token = getAuthToken();
    const user = getCurrentUser();
    const schoolId = user?.school;
    if (!token || !schoolId) return;
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get(`/api/catalog/${schoolId}`, config);
      setCatalog(data);
    } catch (e) {
      console.error('Failed to load catalog', e);
    }
  };

  useEffect(() => {
    const fetchTeachers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = getAuthToken();
        if (!token) {
          setError('Authentication token not found. Please log in.');
          setIsLoading(false);
          return;
        }
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const params = {};
        if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
        const { data } = await axios.get(API_BASE_URL, { ...config, params });
        setTeachers(data);
      } catch (err) {
        const message = err.response?.data?.message ||
          'Failed to fetch teachers. Please ensure the server is running and you are logged in.';
        setError(message);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeachers();
  }, [statusFilter]);

  const handleSave = async () => {
    const token = getAuthToken();
    if (!token) {
      alert('Authentication token not found. Please log in.');
      return;
    }
    const config = { headers: { Authorization: `Bearer ${token}` } };
    // Client-side required validation
    const required = ['firstName','lastName','email','username','phone1'];
    const missing = required.filter((k) => !formData[k] || !String(formData[k]).trim());
    if (modalContent.type === 'add' && (!formData.password || !String(formData.password).trim())) {
      missing.push('password');
    }
    if (missing.length) {
      alert(`Please fill the required fields: ${missing.join(', ')}`);
      return;
    }
    const payload = {
      firstName: formData.firstName?.trim(),
      lastName: formData.lastName?.trim(),
      email: formData.email?.trim().toLowerCase(),
      username: formData.username?.trim(),
      phone1: formData.phone1?.trim(),
      phone2: formData.phone2?.trim() || undefined,
      address: formData.address?.trim() || undefined,
      yearsExperience: Number(formData.yearsExperience) || 0,
      status: formData.status || 'employed',
      banking: {
        ccp: formData.ccp?.trim() || undefined,
        bankAccount: formData.bankAccount?.trim() || undefined,
      },
      activities: buildActivitiesPayload(),
    };

    try {
      if (modalContent.type === 'edit' && modalContent.data?._id) {
        const { data } = await axios.put(`${API_BASE_URL}/${modalContent.data._id}`, payload, config);
        setTeachers(teachers.map((t) => (t._id === data.teacher._id ? data.teacher : t)));
        alert('Teacher updated successfully!');
      } else {
        const { data } = await axios.post(API_BASE_URL, { ...payload, password: formData.password }, config);
        setTeachers([...teachers, data.teacher]);
        alert('Teacher created successfully!');
      }
      closeModal();
    } catch (err) {
      let message = err.response?.data?.message || 'An error occurred while saving the teacher.';
      // Improve common error hints
      if (/email/i.test(message) && /exists/i.test(message)) {
        message = 'Email already exists. Please use a different email.';
      } else if (/username/i.test(message) && /exists/i.test(message)) {
        message = 'Username already exists. Please choose another.';
      } else if (/Activity item not allowed/i.test(message)) {
        message = 'One or more selected activities are no longer in the catalog. Refresh the catalog and try again.';
      }
      alert(`Error: ${message}`);
      console.error(err);
    }
  };

  const handleDelete = async () => {
    const token = getAuthToken();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
      await axios.delete(`${API_BASE_URL}/${modalContent.data._id}`, config);
      setTeachers(teachers.filter(t => t._id !== modalContent.data._id));
      alert('Teacher deleted successfully.');
      closeModal();
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data || {};
      let message = data.message || 'An error occurred while deleting the teacher.';
      if (status === 409) {
        const names = Array.isArray(data.blockingClasses) ? data.blockingClasses.map(c => c.name).join(', ') : '';
        message += names ? `\nAssigned classes: ${names}` : '';
      }
      alert(`Error: ${message}`);
      console.error(err);
    }
  };

  const openModal = (type, teacher = null) => {
    setModalContent({ type, data: teacher });
    setFormData(teacher ? {
      firstName: teacher.firstName || (teacher.name ? teacher.name.split(' ')[0] : ''),
      lastName: teacher.lastName || (teacher.name ? teacher.name.split(' ').slice(1).join(' ') : ''),
      email: teacher.email || '',
      username: teacher.username || '',
      yearsExperience: teacher.experience || 0,
      phone1: teacher.contact?.phone1 || teacher.phone || '',
      phone2: teacher.contact?.phone2 || '',
      address: teacher.contact?.address || '',
      ccp: teacher.banking?.ccp || '',
      bankAccount: teacher.banking?.bankAccount || '',
      status: teacher.status || 'employed',
      activitiesSelection: (teacher.activities || []).reduce((acc, act) => {
        acc[act.type] = act.items || [];
        return acc;
      }, {}),
    } : {
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      password: '',
      yearsExperience: 0,
      phone1: '',
      phone2: '',
      address: '',
      ccp: '',
      bankAccount: '',
      status: 'employed',
      activitiesSelection: {},
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent({ type: '', data: null });
  };

  const filteredTeachers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return teachers.filter(teacher => {
      const fullName = `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || teacher.name || '';
      const phone1 = teacher.contact?.phone1 || teacher.phone || '';
      const phone2 = teacher.contact?.phone2 || '';
      const matchesSearch = !term || 
        fullName.toLowerCase().includes(term) ||
        phone1.toLowerCase().includes(term) ||
        phone2.toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'all' || teacher.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [teachers, searchTerm, statusFilter]);

  const getStatusPill = (status) => {
    const styles = {
      employed: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      freelance: 'bg-amber-100 text-amber-800 border border-amber-200',
      retired: 'bg-slate-100 text-slate-800 border border-slate-200',
    };
    return (
      <span className={`
        px-3 py-1 text-xs font-semibold rounded-full transition-all
        ${styles[status] || 'bg-slate-100 text-slate-800 border border-slate-200'}
      `}>
        {status ? status.replace('_', ' ').toUpperCase() : 'N/A'}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search teachers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors w-full sm:w-64"
                />
              </div>
              
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="all">All Statuses</option>
                  <option value="employed">Employed</option>
                  <option value="freelance">Freelance</option>
                  <option value="retired">Retired</option>
                </select>
            </div>
            
            <button 
              onClick={() => openModal('add')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Teacher
            </button>
          </div>
        </div>

        {/* Main Content */}
        {isLoading ? (
          <div className="flex justify-center items-center bg-white rounded-lg p-8 shadow-sm border">
            <Loader className="animate-spin text-blue-500 mr-3" />
            <span className="text-gray-600">Loading teachers...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="text-red-500 w-5 h-5" />
            <div>
              <h3 className="font-medium text-red-800">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Teacher Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTeachers.map((teacher) => (
                <div 
                  key={teacher._id} 
                  className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-semibold">
                        {(teacher.firstName?.[0] || teacher.name?.[0] || '?').toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {`${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || teacher.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                          {Array.isArray(teacher.activities) && teacher.activities.length
                              ? `${teacher.activities.length} activities`
                            : 'No activities'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {getStatusPill(teacher.status)}
                  </div>

                  {/* Card Content - Grouped Information */}
                  <div className="space-y-3 mb-4">
                    {/* Personal Info Group */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Personal Info</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Award className="w-3 h-3 text-amber-500" />
                          <span>{teacher.experience || 0} years experience</span>
                    </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-3 h-3 text-blue-500" />
                          <span className="truncate">{teacher.email}</span>
                      </div>
                    </div>
                        </div>

                    {/* Contact Info Group */}
                    {(teacher.contact?.phone1 || teacher.phone || teacher.contact?.phone2) && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Contact</span>
                        </div>
                        <div className="space-y-2">
                          {(teacher.contact?.phone1 || teacher.phone) && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-3 h-3 text-green-500" />
                              <span>{teacher.contact?.phone1 || teacher.phone}</span>
                      </div>
                    )}
                    {teacher.contact?.phone2 && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-3 h-3 text-green-500" />
                              <span>{teacher.contact?.phone2}</span>
                        </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Activities Group */}
                    {Array.isArray(teacher.activities) && teacher.activities.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="w-4 h-4 text-gray-500" />
                          <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Activities</span>
                        </div>
                        <div className="space-y-1">
                          {teacher.activities.slice(0, 2).map((activity, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                              <span className="truncate">{activityTypeLabel(activity.type)}</span>
                            </div>
                          ))}
                          {teacher.activities.length > 2 && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              <span>+{teacher.activities.length - 2} more</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button 
                      onClick={() => openModal('view', teacher)} 
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded text-sm hover:bg-blue-100 transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </button>
                    <button 
                      onClick={() => openModal('delete', teacher)} 
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredTeachers.length === 0 && (
              <div className="text-center bg-white rounded-lg p-8 shadow-sm border">
                <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No teachers found
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'Get started by adding your first teacher.'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <button 
                    onClick={() => openModal('add')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Add First Teacher
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Enhanced Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="
              bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] 
              overflow-hidden shadow-2xl border border-white/20
            ">
              {/* Modal Header */}
              <div className="
                flex items-center justify-between p-6 
                bg-gradient-to-r from-slate-50 to-blue-50 
                border-b border-slate-200
              ">
                <h2 className="text-2xl font-bold text-slate-900 capitalize">
                  {modalContent.type} Teacher
                </h2>
                <button 
                  onClick={closeModal} 
                  className="
                    p-2 text-slate-400 hover:text-slate-600 
                    hover:bg-white rounded-xl transition-all
                  "
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {modalContent.type === 'view' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Name</label>
                        <p className="text-lg font-medium text-slate-900">{`${modalContent.data.firstName || ''} ${modalContent.data.lastName || ''}`.trim() || modalContent.data.name}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Email</label>
                        <p className="text-lg font-medium text-slate-900">{modalContent.data.email}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Experience</label>
                        <p className="text-lg font-medium text-slate-900">{modalContent.data.experience} years</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Status</label>
                        <div className="pt-1">{getStatusPill(modalContent.data.status)}</div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Phone 1</label>
                        <p className="text-lg font-medium text-slate-900">{modalContent.data.contact?.phone1 || modalContent.data.phone || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Phone 2</label>
                        <p className="text-lg font-medium text-slate-900">{modalContent.data.contact?.phone2 || 'N/A'}</p>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Address</label>
                        <p className="text-lg font-medium text-slate-900">{modalContent.data.contact?.address || 'N/A'}</p>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Banking</label>
                        <p className="text-sm text-slate-900">CCP: {modalContent.data.banking?.ccp || '—'}</p>
                        <p className="text-sm text-slate-900">Bank Account: {modalContent.data.banking?.bankAccount || '—'}</p>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Activities</label>
                        <div className="text-slate-800 text-sm space-y-2">
                          {Array.isArray(modalContent.data.activities) && modalContent.data.activities.length ? (
                            modalContent.data.activities.map((act, idx) => (
                              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="font-semibold mb-2">{activityTypeLabel(act.type)}</div>
                                <ul className="list-disc ml-5 space-y-1">
                                  {(act.items || []).map((it, i) => (
                                    <li key={i} className="text-slate-700">
                                      {itemLabel(act.type, it)}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))
                          ) : (
                            <p className="text-slate-500">No activities</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-6 border-t border-slate-200">
                      <button
                        onClick={() => openModal('edit', modalContent.data)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={closeModal} 
                        className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}

                {(modalContent.type === 'add' || modalContent.type === 'edit') && (
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSave(); }} 
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">First Name *</label>
                        <input 
                          required 
                          value={formData.firstName || ''} 
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} 
                          placeholder="Enter first name"
                          className="w-full p-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name *</label>
                        <input 
                          required 
                          value={formData.lastName || ''} 
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} 
                          placeholder="Enter last name"
                          className="w-full p-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address *</label>
                        <input 
                          required 
                          type="email" 
                          value={formData.email || ''} 
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                          placeholder="Enter email address"
                          className="w-full p-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Username *</label>
                        <input 
                          required
                          value={formData.username || ''} 
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })} 
                          placeholder="Enter username"
                          className="w-full p-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        />
                      </div>
                      
                      {modalContent.type === 'add' && (
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Password *</label>
                          <input 
                            required 
                            type="password" 
                            value={formData.password || ''} 
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                            placeholder="Enter password"
                            className="w-full p-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                          />
                        </div>
                      )}
                      
                      {/* Activities (compact, last step) */}
                      <div className="md:col-span-2">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-semibold text-slate-700">Activities (last step)</label>
                          <button
                            type="button"
                            onClick={async () => { await loadCatalogIfNeeded(); setPickerOpen(true); }}
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Choose activities
                          </button>
                        </div>
                        {/* Summary chips */}
                        <div className="flex flex-wrap gap-2">
                          {['supportLessons','reviewCourses','vocationalTrainings','languages','otherActivities']
                            .map((t) => ({ t, items: formData.activitiesSelection?.[t] || [] }))
                            .filter(({ items }) => items.length)
                            .map(({ t, items }) => (
                              <span key={t} className="px-2.5 py-1 text-xs rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                                {activityTypeLabel(t)}: {items.length}
                              </span>
                            ))}
                          {(!formData.activitiesSelection || Object.values(formData.activitiesSelection).every(arr => !arr || arr.length === 0)) && (
                            <span className="text-sm text-slate-500">No activities selected yet.</span>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Experience (years) *</label>
                        <input 
                          required 
                          type="number" 
                          min="0"
                          value={formData.yearsExperience ?? formData.experience ?? 0} 
                          onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })} 
                          placeholder="Years of experience"
                          className="w-full p-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Phone 1 *</label>
                        <input 
                          required
                          value={formData.phone1 || ''} 
                          onChange={(e) => setFormData({ ...formData, phone1: e.target.value })} 
                          placeholder="Primary phone number"
                          className="w-full p-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Phone 2 (optional)</label>
                        <input 
                          value={formData.phone2 || ''} 
                          onChange={(e) => setFormData({ ...formData, phone2: e.target.value })} 
                          placeholder="Secondary phone number"
                          className="w-full p-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Address (optional)</label>
                        <input 
                          value={formData.address || ''} 
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                          placeholder="Enter address"
                          className="w-full p-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                        <select 
                          value={formData.status || 'employed'} 
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })} 
                          className="w-full p-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        >
                          <option value="employed">Employed</option>
                          <option value="freelance">Freelance</option>
                          <option value="retired">Retired</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">CCP (optional)</label>
                        <input 
                          value={formData.ccp || ''} 
                          onChange={(e) => setFormData({ ...formData, ccp: e.target.value })} 
                          placeholder="CCP number"
                          className="w-full p-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Bank Account (optional)</label>
                        <input 
                          value={formData.bankAccount || ''} 
                          onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })} 
                          placeholder="Bank account"
                          className="w-full p-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                      <button 
                        type="button" 
                        onClick={closeModal} 
                        className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                )}

                {modalContent.type === 'delete' && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Teacher</h3>
                      <p className="text-slate-600">
                        Are you sure you want to delete{' '}
                        <span className="font-semibold text-slate-900">{modalContent.data.name}</span>?{' '}
                        This action cannot be undone.
                      </p>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                      <button 
                        onClick={closeModal} 
                        className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleDelete} 
                        className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                      >
                        Delete Teacher
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Activity Picker Modal */}
        {pickerOpen && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <h3 className="text-lg font-semibold">Choose activities</h3>
                <button onClick={() => setPickerOpen(false)} className="p-2 rounded-lg hover:bg-slate-100">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="p-5">
                {!catalog ? (
                  <div className="text-slate-500 text-sm">Loading catalog...</div>
                ) : (
                  <>
                    <div className="flex gap-2 flex-wrap mb-4">
                      {['supportLessons','reviewCourses','vocationalTrainings','languages','otherActivities'].map((t) => (
                        <button
                          key={t}
                          onClick={() => setPickerTab(t)}
                          type="button"
                          className={`px-3 py-1.5 text-sm rounded-lg border ${pickerTab === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                        >
                          {activityTypeLabel(t)}
                        </button>
                      ))}
                    </div>
                    <div className="mb-3">
                      <input
                        value={pickerSearch}
                        onChange={(e) => setPickerSearch(e.target.value)}
                        placeholder="Search in this tab..."
                        className="w-full p-2.5 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                    <div className="max-h-[50vh] overflow-auto border rounded-xl p-2">
                      {Array.isArray(catalog[pickerTab]) && catalog[pickerTab].length ? (
                        catalog[pickerTab]
                          .filter((it) => itemLabel(pickerTab, it).toLowerCase().includes(pickerSearch.toLowerCase()))
                          .map((item, idx) => {
                            const selected = (formData.activitiesSelection?.[pickerTab] || []).some((x) => jsonEq(x, item));
                            return (
                              <label key={idx} className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer ${selected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                                <input
                                  type="checkbox"
                                  checked={!!selected}
                                  onChange={() => toggleActivityItem(pickerTab, item)}
                                  className="mt-1"
                                />
                                <span className="text-sm text-slate-700">{itemLabel(pickerTab, item)}</span>
                              </label>
                            );
                          })
                      ) : (
                        <div className="text-sm text-slate-500 p-3">No items in this category.</div>
                      )}
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <button type="button" onClick={() => setPickerOpen(false)} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200">Done</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeachersTab;