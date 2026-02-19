import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, BookOpen, GraduationCap, Calendar, BarChart3, Settings, Bell,
  UserCheck, Building2, FileText, Search, Plus, Edit, Trash2, Eye,
  Clock, Star, Award, TrendingUp, Filter, Download, Mail, Phone, X,
  User, MapPin, Shield, AlertTriangle, Loader, ChevronDown
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
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
  const { t } = useLanguage();
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
    const required = ['firstName', 'lastName', 'email', 'username', 'phone1'];
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
        <div className="card-base p-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted-light w-4 h-4" />
                <input
                  type="text"
                  placeholder={t.searchTeachers}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors w-full sm:w-64"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              >
                <option value="all">{t.allStatuses}</option>
                <option value="employed">{t.employed}</option>
                <option value="freelance">{t.freelance}</option>
                <option value="retired">{t.retired}</option>
              </select>
            </div>

            <button
              onClick={() => openModal('add')}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t.addTeacher}
            </button>
          </div>
        </div>

        {/* Main Content */}
        {isLoading ? (
          <div className="flex justify-center items-center bg-white rounded-lg p-8 shadow-sm border">
            <Loader className="animate-spin text-blue-500 mr-3" />
            <span className="text-gray-600">{t.loadingTeachers}</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="text-red-500 w-5 h-5" />
            <div>
              <h3 className="font-medium text-red-800">{t.error}</h3>
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
                  className="card-base p-4 hover:shadow-md transition-shadow"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-semibold">
                        {(teacher.firstName?.[0] || teacher.name?.[0] || '?').toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-text-main-light">
                          {`${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || teacher.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-text-muted-light">
                            {Array.isArray(teacher.activities) && teacher.activities.length
                              ? `${teacher.activities.length} ${t.nActivities}`
                              : t.noActivities}
                          </span>
                        </div>
                      </div>
                    </div>
                    {getStatusPill(teacher.status)}
                  </div>

                  {/* Card Content - Compact Information */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5" title={t.yearsExperience}>
                        <Award className="w-4 h-4 text-amber-500" />
                        <span>{teacher.experience || 0} {t.years}</span>
                      </div>
                      <div className="flex items-center gap-1.5" title={t.activities}>
                        <BookOpen className="w-4 h-4 text-blue-500" />
                        <span>{Array.isArray(teacher.activities) ? teacher.activities.length : 0} {t.activities}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{teacher.email}</span>
                    </div>
                    {(teacher.contact?.phone1 || teacher.phone) && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{teacher.contact?.phone1 || teacher.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3 border-t border-border-light">
                    <button
                      onClick={() => openModal('view', teacher)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded text-sm hover:bg-primary/20 transition-colors"
                    >
                      <Eye className="w-3 h-3" />{t.view}</button>
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
              <div className="text-center card-base p-8">
                <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t.noTeachersFound}
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {searchTerm || statusFilter !== 'all'
                    ? t.tryAdjustingSearchFilter
                    : t.getStartedAddFirstTeacher
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <button
                    onClick={() => openModal('add')}
                    className="btn-primary mt-4"
                  >
                    {t.addFirstTeacher}
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Enhanced Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[50] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>

              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-md ${modalContent.type === 'delete' ? 'bg-red-50 text-red-600' : 'bg-primary/10 text-primary'}`}>
                    {modalContent.type === 'add' && <Plus className="w-5 h-5" />}
                    {modalContent.type === 'edit' && <Edit className="w-5 h-5" />}
                    {modalContent.type === 'view' && <Eye className="w-5 h-5" />}
                    {modalContent.type === 'delete' && <Trash2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {modalContent.type === 'add' && t.addNewTeacher}
                      {modalContent.type === 'edit' && t.editTeacher}
                      {modalContent.type === 'view' && t.teacherDetails}
                      {modalContent.type === 'delete' && t.deleteTeacher}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {modalContent.type === 'add' && t.enterTeacherDetails}
                      {modalContent.type === 'edit' && t.updateTeacherDetails}
                      {modalContent.type === 'view' && t.viewTeacherInfo}
                      {modalContent.type === 'delete' && t.confirmDeleteAction}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {modalContent.type === 'view' && (
                  <div className="space-y-8">
                    {/* Basic Info Section */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2 mb-4">
                        {t.basicInfo}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-gray-500 uppercase">{t.fullName}</span>
                          <div className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            {`${modalContent.data.firstName || ''} ${modalContent.data.lastName || ''}`.trim() || modalContent.data.name}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-gray-500 uppercase">{t.status}</span>
                          <div>{getStatusPill(modalContent.data.status)}</div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-gray-500 uppercase">{t.experience}</span>
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            <Award className="w-4 h-4 text-amber-500" />
                            {modalContent.data.experience || 0} {t.years}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-gray-500 uppercase">{t.email}</span>
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            {modalContent.data.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact Info Section */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2 mb-4">
                        {t.contactInfo}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-gray-500 uppercase">{t.primaryPhone}</span>
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            {modalContent.data.contact?.phone1 || modalContent.data.phone || 'N/A'}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-gray-500 uppercase">{t.secondaryPhone}</span>
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            {modalContent.data.contact?.phone2 || 'N/A'}
                          </div>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <span className="text-xs font-medium text-gray-500 uppercase">{t.address}</span>
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            {modalContent.data.contact?.address || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Banking Section */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2 mb-4">
                        {t.banking}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">CCP</span>
                          <span className="font-mono font-medium text-gray-900">{modalContent.data.banking?.ccp || '—'}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">{t.bankAccountPlaceholder || 'RIB'}</span>
                          <span className="font-mono font-medium text-gray-900">{modalContent.data.banking?.bankAccount || '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Activities Section */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2 mb-4 flex items-center justify-between">
                        <span>{t.activities}</span>
                        <span className="text-xs normal-case font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {Array.isArray(modalContent.data.activities) ? modalContent.data.activities.length : 0} items
                        </span>
                      </h3>
                      <div className="space-y-3">
                        {Array.isArray(modalContent.data.activities) && modalContent.data.activities.length > 0 ? (
                          modalContent.data.activities.map((act, idx) => (
                            <div key={idx} className="p-4 bg-white border border-gray-200 rounded-lg hover:border-primary/30 transition-colors">
                              <div className="font-semibold text-primary mb-2 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                {activityTypeLabel(act.type)}
                              </div>
                              <ul className="space-y-1.5">
                                {(act.items || []).map((it, i) => (
                                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2 pl-4 border-l-2 border-gray-100">
                                    <span>{itemLabel(act.type, it)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <p className="text-gray-500">{t.noActivities}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {(modalContent.type === 'add' || modalContent.type === 'edit') && (
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleSave(); }}
                    className="space-y-8"
                  >
                    {/* Basic Info Group */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
                        {t.basicInfo}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700">{t.firstName} <span className="text-red-500">*</span></label>
                          <input
                            required
                            value={formData.firstName || ''}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            placeholder="e.g. John"
                            className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700">{t.lastName} <span className="text-red-500">*</span></label>
                          <input
                            required
                            value={formData.lastName || ''}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            placeholder="e.g. Doe"
                            className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700">{t.email} <span className="text-red-500">*</span></label>
                          <input
                            required
                            type="email"
                            value={formData.email || ''}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="john.doe@example.com"
                            className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700">{t.username} <span className="text-red-500">*</span></label>
                          <input
                            required
                            value={formData.username || ''}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            placeholder="johndoe"
                            className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700">
                            {modalContent.type === 'add' ? (t.password || 'Password') : (t.newPassword || 'New Password')}
                            {modalContent.type === 'add' && <span className="text-red-500"> *</span>}
                          </label>
                          <input
                            required={modalContent.type === 'add'}
                            type="password"
                            value={formData.password || ''}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder={modalContent.type === 'add' ? "••••••••••••" : "Leave blank to keep current"}
                            className="w-full py-2 border-b border-gray-200 focus:border-primary focus:outline-none transition-colors placeholder:text-gray-300"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.phone || 'PRIMARY PHONE'} *</label>
                          <input
                            required
                            value={formData.phone1 || ''}
                            onChange={(e) => setFormData({ ...formData, phone1: e.target.value })}
                            placeholder="+1 (555) 000-0000"
                            className="w-full py-2 border-b border-gray-200 focus:border-primary focus:outline-none transition-colors placeholder:text-gray-300"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.yearsExperience || 'EXPERIENCE'} *</label>
                          <div className="relative">
                            <select
                              required
                              value={formData.yearsExperience ?? formData.experience ?? 0}
                              onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                              className="w-full py-2 border-b border-gray-200 focus:border-primary focus:outline-none bg-transparent appearance-none"
                            >
                              <option value="0">0 Years</option>
                              <option value="1">1 Year</option>
                              <option value="2">2 Years</option>
                              <option value="5">5+ Years</option>
                              <option value="10">10+ Years</option>
                            </select>
                            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          </div>
                        </div>

                        <div className="md:col-span-2 py-4 border-b border-gray-100 mb-2">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900">Activities (last step)</h4>
                              <p className="text-xs text-gray-400 italic">
                                {buildActivitiesPayload().length} activities selected.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={async () => { await loadCatalogIfNeeded(); setPickerOpen(true); }}
                              className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5 text-primary" />
                              Choose activities
                            </button>
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.address || 'ADDRESS'}</label>
                          <input
                            value={formData.address || ''}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Enter physical address"
                            className="w-full py-2 border-b border-gray-200 focus:border-primary focus:outline-none transition-colors placeholder:text-gray-300"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end items-center gap-6 pt-8 mt-4">
                        <button
                          type="button"
                          onClick={closeModal}
                          className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {t.cancel || 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold text-sm shadow-md hover:shadow-lg active:scale-95"
                        >
                          {modalContent.type === 'edit' ? (t.update || 'Update Teacher') : (t.createTeacher || 'Create Teacher')}
                        </button>
                      </div>
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
                      >{t.cancel}</button>
                      <button
                        onClick={handleDelete}
                        className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                      >
                        {t.deleteTeacher}
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
                      {['supportLessons', 'reviewCourses', 'vocationalTrainings', 'languages', 'otherActivities'].map((t) => (
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