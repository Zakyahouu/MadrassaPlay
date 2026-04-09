import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, Edit, Trash2, Eye, Mail, Phone, X, Loader, Download,
  User, Users, GraduationCap, BarChart3, Star, AlertTriangle, Filter,
  Award, TrendingUp, BookOpen, CreditCard, Calendar, MapPin, FileText,
  QrCode, Building2, UserCheck, ChevronDown
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import axios from 'axios';
import StudentProfilePopup from './StudentProfilePopup';
import PaymentModal from '../payments/PaymentModal';
import formatDZ from '../../utils/currency';

const API_BASE_URL = '/api/students';

const getAuthToken = () => {
  const userInfoString = localStorage.getItem('user');
  if (!userInfoString) return null;
  try {
    const userInfo = JSON.parse(userInfoString);
    return userInfo?.token || null;
  } catch (error) {
    console.error("Failed to parse userInfo", error);
    return null;
  }
};

const StudentsTab = () => {
  const { t } = useLanguage();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [educationLevelFilter, setEducationLevelFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ type: '', data: null });
  const [formData, setFormData] = useState({});
  const [showEnrollmentStep, setShowEnrollmentStep] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState({
    selectedStudent: null,
    selectedClasses: [],
  });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentProfile, setShowStudentProfile] = useState(false);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [postEnrollInfo, setPostEnrollInfo] = useState(null); // { enrollmentId, pricingSnapshot, className }
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  // Enrollment UI filters and dropdown state
  const [classSearchTerm, setClassSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [catalogItems, setCatalogItems] = useState([]);
  // Delete modal state
  const [deleteEnrollments, setDeleteEnrollments] = useState([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [unenrollingId, setUnenrollingId] = useState('');

  // Additional state for class selection in enrollment (already defined above)

  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        setError("Authentication token not found. Please log in.");
        setIsLoading(false);
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };

      try {
        const { data } = await axios.get(API_BASE_URL, config);
        setStudents(data);
      } catch (err) {
        const message = err.response?.data?.message || "Failed to fetch students.";
        setError(message);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, []);

  // Generate unique student code
  const generateStudentCode = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `STU${timestamp}${random}`;
  };

  const handleSave = async () => {
    const token = getAuthToken();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    };

    const contact = {};
    if (formData.phone?.trim()) contact.phone1 = formData.phone.trim();
    if (formData.phone2?.trim()) contact.phone2 = formData.phone2.trim();
    if (formData.address?.trim()) contact.address = formData.address.trim();

    const payload = {
      firstName: formData.firstName?.trim(),
      lastName: formData.lastName?.trim(),
      email: formData.email?.trim() || undefined,
      contact: Object.keys(contact).length > 0 ? contact : undefined,
      educationLevel: formData.educationLevel,
      username: formData.username?.trim(),
      password: formData.password,
      studentCode: formData.studentCode || generateStudentCode()
    };

    try {
      if (modalContent.type === 'edit') {
        const { data } = await axios.put(
          `${API_BASE_URL}/${modalContent.data._id}`,
          payload,
          config
        );
        setStudents(students.map(s =>
          s._id === data.student._id ? data.student : s
        ));
        alert(t.studentSavedSuccessfully);
        closeModal();
      } else {
        const { data } = await axios.post(API_BASE_URL, payload, config);
        setStudents([...students, data.student]);
        alert(t.studentSavedSuccessfully);

        // Show enrollment step
        setShowEnrollmentStep(true);
        setEnrollmentData(prev => ({ ...prev, selectedStudent: data.student }));
      }
    } catch (err) {
      const message = err.response?.data?.message ||
        t.failedSaveStudent;
      alert(`${t.error}: ${message}`);
    }
  };

  const handleEnrollment = async () => {
    if (!enrollmentData.selectedClasses || enrollmentData.selectedClasses.length === 0) {
      alert('Please select at least one class to enroll in.');
      return;
    }
    if (isEnrolling) return;

    const token = getAuthToken();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    };

    // First check if student is already enrolled in this class
    try {

      const { data: enrollments } = await axios.get(
        `/api/students/${enrollmentData.selectedStudent._id}/enrollments`,
        config
      );
      const enrolledIds = Array.isArray(enrollments)
        ? enrollments.map(e => e.classId?._id || e.classId)
        : [];

      // Determine which classes to enroll
      const toEnroll = (enrollmentData.selectedClasses || []).filter(c => !enrolledIds.includes(c._id));
      const skipped = (enrollmentData.selectedClasses || []).filter(c => enrolledIds.includes(c._id));
      if (toEnroll.length === 0) {
        alert('All selected classes are already enrolled.');
        return;
      }


      setIsEnrolling(true);
      const results = [];
      for (const klass of toEnroll) {
        try {
          const payload = { classId: klass._id };
          const { data } = await axios.post(`/api/students/${enrollmentData.selectedStudent._id}/enroll`, payload, config);
          results.push({ ok: true, data, klass });
        } catch (e) {
          results.push({ ok: false, error: e, klass });
        }
      }
      setIsEnrolling(false);

      const successes = results.filter(r => r.ok);
      const failures = results.filter(r => !r.ok);
      const msg = [
        successes.length ? `${successes.length} enrolled` : null,
        skipped.length ? `${skipped.length} already enrolled` : null,
        failures.length ? `${failures.length} failed` : null,
      ].filter(Boolean).join(' · ');
      alert(msg || 'No changes');

      // Offer checkout only if exactly one enrollment was created
      if (successes.length === 1) {
        const s = successes[0];
        setPostEnrollInfo({
          enrollmentId: s.data?.enrollmentId,
          pricingSnapshot: s.data?.pricingSnapshot,
          className: s.data?.className,
        });
      } else {
        setPostEnrollInfo(null);
      }

      // Update student list counters
      const inc = successes.length;
      if (inc > 0) {
        setStudents(prev => prev.map(s => s._id === enrollmentData.selectedStudent._id ? {
          ...s,
          enrollmentCount: (s.enrollmentCount || 0) + inc,
          enrollmentStatus: 'enrolled'
        } : s));
      }
    } catch (err) {

      const message = err.response?.data?.message || 'Failed to enroll student.';
      alert(`Error: ${message}`);
    }
  };

  const handleDelete = async () => {
    const token = getAuthToken();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
      await axios.delete(`${API_BASE_URL}/${modalContent.data._id}`, config);
      setStudents(students.filter(s => s._id !== modalContent.data._id));
      alert(t.studentDeletedSuccessfully);
      closeModal();
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data || {};
      if (status === 409) {
        const names = Array.isArray(data.blockingClasses) ? data.blockingClasses.map(c => c.name).join(', ') : '';
        alert((data.message || t.cannotDeleteStudentEnrolled) + (names ? `\n${t.blockingClasses}: ${names}` : ''));
      } else {
        alert(data.message || t.somethingWentWrong);
      }
    }
  };

  const openModal = (type, student = null) => {
    setModalContent({ type, data: student });
    setShowEnrollmentStep(false);
    // Reset delete modal state
    setDeleteEnrollments([]);
    setDeleteError('');
    setDeleteLoading(false);
    setUnenrollingId('');
    setFormData(student ? {
      firstName: student.firstName || student.name?.split(' ')[0] || '',
      lastName: student.lastName || student.name?.split(' ').slice(1).join(' ') || '',
      email: student.email || '',
      phone: student.contact?.phone1 || student.phone || '',
      phone2: student.contact?.phone2 || '',
      address: student.contact?.address || student.address || '',
      educationLevel: student.educationLevel || 'primary',
      username: student.username || '',
      studentCode: student.studentCode || '',
    } : {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      phone2: '',
      address: '',
      educationLevel: 'primary',
      username: '',
      password: '',
      studentCode: generateStudentCode()
    });
    setIsModalOpen(true);

    // If opening delete, load enrollments for guard-aware UI
    if (type === 'delete' && student?._id) {
      (async () => {
        try {
          setDeleteLoading(true);
          const token = getAuthToken();
          const config = { headers: { Authorization: `Bearer ${token}` } };
          const { data } = await axios.get(`/api/students/${student._id}/enrollments`, config);
          setDeleteEnrollments(Array.isArray(data) ? data : []);
        } catch (e) {
          setDeleteError(e.response?.data?.message || 'Failed to load enrollments');
          setDeleteEnrollments([]);
        } finally {
          setDeleteLoading(false);
        }
      })();
    }
  };

  // visibleClasses computation is defined later with enriched filters

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent({ type: '', data: null });
    setShowEnrollmentStep(false);
    setEnrollmentData({ selectedStudent: null, selectedClasses: [] });
    setPostEnrollInfo(null);
    setShowPaymentModal(false);
    setAvailableClasses([]);
    setShowClassDropdown(false);
    setClassSearchTerm('');
    setCategoryFilter('all');
    setLevelFilter('all');
  };

  useEffect(() => {
    const fetchClassesForEnrollment = async () => {
      if (!showEnrollmentStep || !enrollmentData.selectedStudent) return;
      try {
        const token = getAuthToken();
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // Fetch classes, existing enrollments, and catalog items in parallel
        const [classesResponse, enrollmentsResponse, catalogResponse] = await Promise.all([
          axios.get('/api/classes', config),
          axios.get(`/api/students/${enrollmentData.selectedStudent._id}/enrollments`, config),
          axios.get('/api/classes/catalog-items', config)
        ]);
        setCatalogItems(Array.isArray(catalogResponse.data) ? catalogResponse.data : []);

        // Get IDs of classes student is already enrolled in
        const enrolledClassIds = enrollmentsResponse.data.map(enrollment =>
          enrollment.classId._id || enrollment.classId
        );

        // Filter out classes student is already enrolled in
        const allClasses = Array.isArray(classesResponse.data) ? classesResponse.data : [];
        const catMap = new Map((Array.isArray(catalogResponse.data) ? catalogResponse.data : []).map(ci => [String(ci._id), ci]));
        let filtered = allClasses
          .filter(c => !enrolledClassIds.includes(c._id))
          .map(c => ({ ...c, _catalog: catMap.get(String(c.catalogItem?.itemId)) }));

        // Keep only not-enrolled; actual UI filters applied via memo below

        setAvailableClasses(filtered);
      } catch (e) {

        setAvailableClasses([]);
      }
    };
    fetchClassesForEnrollment();
  }, [showEnrollmentStep, enrollmentData.selectedStudent]);

  // Visible classes based on dropdown filters and search
  const visibleClasses = useMemo(() => {
    let list = Array.isArray(availableClasses) ? availableClasses : [];
    if (categoryFilter !== 'all') {
      list = list.filter(c => c.catalogItem?.type === categoryFilter);
    }
    if (categoryFilter === 'supportLessons' && levelFilter !== 'all') {
      list = list.filter(c => (c._catalog?.level || '').toLowerCase() === levelFilter.toLowerCase());
    }
    if (classSearchTerm.trim()) {
      const t = classSearchTerm.trim().toLowerCase();
      list = list.filter(c => {
        const teacherName = c.teacherId ? `${c.teacherId.firstName || ''} ${c.teacherId.lastName || ''}`.toLowerCase() : '';
        const schedule = Array.isArray(c.schedules) ? c.schedules.map(s => `${s.dayOfWeek} ${s.startTime}-${s.endTime}`).join(' ') : '';
        const priceTxt = c.paymentModel === 'per_session' && typeof c.sessionPrice === 'number'
          ? `${c.sessionPrice}`
          : (c.paymentModel === 'per_cycle' && typeof c.cyclePrice === 'number' ? `${c.cyclePrice}` : `${c.price || ''}`);
        const subject = c._catalog?.subject || c._catalog?.name || '';
        return (
          (c.name || '').toLowerCase().includes(t) ||
          teacherName.includes(t) ||
          schedule.toLowerCase().includes(t) ||
          subject.toLowerCase().includes(t) ||
          priceTxt.includes(t)
        );
      });
    }
    return list;
  }, [availableClasses, categoryFilter, levelFilter, classSearchTerm]);

  const filteredStudents = useMemo(() => {
    let filtered = students;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(student => {
        const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.name || '';
        const phone = student.contact?.phone1 || student.contact?.phone2 || student.phone || '';
        const studentCode = student.studentCode || '';

        return fullName.toLowerCase().includes(term) ||
          phone.toLowerCase().includes(term) ||
          studentCode.toLowerCase().includes(term);
      });
    }

    if (educationLevelFilter !== 'all') {
      filtered = filtered.filter(student => student.educationLevel === educationLevelFilter);
    }

    if (classFilter !== 'all') {
      if (classFilter === 'enrolled') {
        filtered = filtered.filter(student => (student.enrollmentStatus === 'enrolled') || (student.enrollmentCount > 0));
      } else if (classFilter === 'not_enrolled') {
        filtered = filtered.filter(student => (student.enrollmentStatus === 'not_enrolled') || (!student.enrollmentCount || student.enrollmentCount === 0));
      }
    }

    return filtered;
  }, [students, searchTerm, educationLevelFilter, classFilter]);

  const getEducationLevelBadge = (level) => {
    const colors = {
      before_education: 'bg-gray-100 text-gray-800 border-gray-200',
      primary: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      middle: 'bg-blue-100 text-blue-800 border-blue-200',
      high_school: 'bg-purple-100 text-purple-800 border-purple-200',
      university: 'bg-orange-100 text-orange-800 border-orange-200',
      other: 'bg-slate-100 text-slate-800 border-slate-200'
    };
    const labels = {
      before_education: t.before_education,
      primary: t.primary_school,
      middle: t.middle_school,
      high_school: t.high_school,
      university: t.university,
      other: t.other
    };
    return { color: colors[level] || 'bg-gray-100 text-gray-800 border-gray-200', label: labels[level] || level };
  };

  const exportToCSV = () => {
    const headers = ['Student Code', 'Name', 'Email', 'Phone', 'Education Level', 'Enrollment Status'];
    const csvData = filteredStudents.map(student => [
      student.studentCode,
      `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.name,
      student.email || '',
      student.contact?.phone1 || student.contact?.phone2 || student.phone || '',
      getEducationLevelBadge(student.educationLevel).label,
      student.enrollmentStatus || 'Not Enrolled'
    ]);

    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PaymentModal
          open={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          enrollmentId={postEnrollInfo?.enrollmentId}
          pricingSnapshot={postEnrollInfo?.pricingSnapshot}
          className={postEnrollInfo?.className}
          onSaved={() => {
            setShowPaymentModal(false);
            closeModal();
          }}
        />
        {/* Enhanced Header */}
        <div className="card-base p-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted-light w-4 h-4" />
                <input
                  type="text"
                  placeholder={t.searchByNamePhoneCode}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors w-full sm:w-80"
                />
              </div>

              <select
                value={educationLevelFilter}
                onChange={(e) => setEducationLevelFilter(e.target.value)}
                className="px-3 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              >
                <option value="all">{t.allEducationLevels}</option>
                <option value="before_education">{t.before_education}</option>
                <option value="primary">{t.primary_school}</option>
                <option value="middle">{t.middle_school}</option>
                <option value="high_school">{t.high_school}</option>
                <option value="university">{t.university}</option>
                <option value="other">{t.other}</option>
              </select>

              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="px-3 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              >
                <option value="all">{t.allClasses}</option>
                <option value="enrolled">{t.enrolled}</option>
                <option value="not_enrolled">{t.notEnrolled}</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Download className="w-4 h-4" />
                {t.exportCsv}
              </button>
              <button
                onClick={() => openModal('add')}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {t.addStudent}
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex justify-center items-center bg-white rounded-lg p-8 shadow-sm border">
            <Loader className="animate-spin text-blue-500 mr-3" />
            <span className="text-gray-600">{t.loading}</span>
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
          <div className="card-base overflow-hidden">
            {filteredStudents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50 border-b border-border-light">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted-light uppercase tracking-wider">
                        {t.student}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted-light uppercase tracking-wider">
                        {t.educationLevel}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted-light uppercase tracking-wider">
                        {t.enrollments}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-text-muted-light uppercase tracking-wider">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {filteredStudents.map((student) => {
                      const levelBadge = getEducationLevelBadge(student.educationLevel);
                      return (
                        <tr key={student._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-semibold text-sm">
                                {student.firstName?.[0] || student.name?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-text-main-light">
                                  {`${student.firstName || ''} ${student.lastName || ''}`.trim() || student.name}
                                </div>
                                <div className="text-sm text-text-muted-light">
                                  {student.studentCode}
                                </div>
                                <div className="text-xs text-text-muted-light">
                                  {student.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border ${levelBadge.color}`}>
                              <GraduationCap className="w-3 h-3 mr-1" />
                              {levelBadge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-primary" />
                              <span className="text-sm text-text-main-light">
                                {student.enrollmentCount || 0} {t.classes}
                              </span>
                              {/* Removed legacy credit badge */}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setShowStudentProfile(true);
                                }}
                                className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors"
                                title="View Profile"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openModal('edit', student)}
                                className="p-1.5 text-text-muted-light hover:bg-slate-50 rounded transition-colors"
                                title="Edit Student"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openModal('delete', student)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete Student"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-background-light rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-text-muted-light" />
                </div>
                <h3 className="text-lg font-medium text-text-main-light mb-2">
                  {t.noStudentsFound}
                </h3>
                <p className="text-text-muted-light max-w-sm mx-auto">
                  {searchTerm
                    ? t.tryAdjustingSearch
                    : t.getStartedAddFirstStudent
                  }
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => openModal('add')}
                    className="btn-primary mt-4"
                  >
                    {t.addFirstStudent}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Enhanced Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 bg-gray-50 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 capitalize">
                  {showEnrollmentStep ? t.enrollStudent : `${t[modalContent.type]} ${t.student}`}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {showEnrollmentStep ? (
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-medium text-blue-900 mb-2">
                        {t.enrollStudent}: {enrollmentData.selectedStudent?.firstName} {enrollmentData.selectedStudent?.lastName}
                      </h3>
                      <p className="text-blue-700 text-sm">
                        {t.studentSavedSuccessfully} {t.youCanNowEnrollInClasses}
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.selectClasses}</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {(enrollmentData.selectedClasses || []).map(sel => (
                            <span key={sel._id} className="inline-flex items-center gap-1 px-2 py-1 text-sm rounded-full bg-blue-100 text-blue-800">
                              {sel.name}
                              <button
                                type="button"
                                className="ml-1 rounded-full hover:bg-blue-200 px-1"
                                onClick={() => setEnrollmentData(prev => ({
                                  ...prev,
                                  selectedClasses: (prev.selectedClasses || []).filter(x => x._id !== sel._id)
                                }))}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      >
                        {t.skipForNow}
                      </button>
                      <button
                        onClick={handleEnrollment}
                        disabled={!enrollmentData.selectedClasses?.length}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t.completeEnrollment}
                      </button>
                    </div>
                  </div>
                ) : modalContent.type === 'delete' ? (
                  <div className="space-y-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="font-semibold text-red-800 mb-1">{t.deleteStudent}</h3>
                      <p className="text-red-700 text-sm">
                        {t.deleteStudentWarning} (code: {modalContent.data?.studentCode})
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-700">{t.enrollments}</h4>
                      {deleteLoading ? (
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Loader className="animate-spin w-4 h-4" /> {t.loadingEnrollments}
                        </div>
                      ) : deleteError ? (
                        <div className="text-sm text-red-600">{deleteError}</div>
                      ) : (
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          {deleteEnrollments.length === 0 ? (
                            <div className="p-4 text-sm text-green-700 bg-green-50">{t.noActiveEnrollments}</div>
                          ) : (
                            <div className="divide-y divide-gray-100">
                              {deleteEnrollments.map((enr) => (
                                <div key={enr._id} className="flex items-center justify-between p-3">
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">{enr.className}</div>
                                    <div className="text-xs text-gray-500 truncate">Teacher: {enr.teacher}</div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      disabled={unenrollingId === enr._id}
                                      onClick={async () => {
                                        try {
                                          setUnenrollingId(enr._id);
                                          const token = getAuthToken();
                                          const config = { headers: { Authorization: `Bearer ${token}` } };
                                          await axios.delete(`/api/enrollments/${enr._id}`, config);
                                          setDeleteEnrollments((prev) => prev.filter((e) => e._id !== enr._id));
                                          setStudents((prev) => prev.map((s) => s._id === modalContent.data?._id ? { ...s, enrollmentCount: Math.max(0, (s.enrollmentCount || 1) - 1) } : s));
                                        } catch (e) {
                                          alert(e.response?.data?.message || t.failedUnenroll);
                                        } finally {
                                          setUnenrollingId('');
                                        }
                                      }}
                                      className="px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded disabled:opacity-50"
                                    >
                                      {unenrollingId === enr._id ? t.unenrolling : t.unenroll}
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {deleteEnrollments.length > 1 && (
                                <div className="p-3">
                                  <button
                                    disabled={unenrollingId === 'ALL'}
                                    onClick={async () => {
                                      const token = getAuthToken();
                                      const config = { headers: { Authorization: `Bearer ${token}` } };
                                      try {
                                        setUnenrollingId('ALL');
                                        for (const enr of deleteEnrollments) {
                                          // eslint-disable-next-line no-await-in-loop
                                          await axios.delete(`/api/enrollments/${enr._id}`, config);
                                        }
                                        setDeleteEnrollments([]);
                                        setStudents((prev) => prev.map((s) => s._id === modalContent.data?._id ? { ...s, enrollmentCount: 0 } : s));
                                      } catch (e) {
                                        alert(e.response?.data?.message || 'Failed to unenroll all');
                                      } finally {
                                        setUnenrollingId('');
                                      }
                                    }}
                                    className="px-3 py-1.5 text-sm text-red-700 bg-red-100 hover:bg-red-200 rounded"
                                  >
                                    {unenrollingId === 'ALL' ? t.unenrollingAll : t.unenrollAll}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      >{t.cancel}</button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                      >{t.delete}</button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.firstName || 'FIRST NAME'} *</label>
                        <input
                          required
                          value={formData.firstName || ''}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          placeholder="Enter first name"
                          className="w-full py-2 border-b border-gray-200 focus:border-primary focus:outline-none transition-colors placeholder:text-gray-300"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.lastName || 'LAST NAME'} *</label>
                        <input
                          required
                          value={formData.lastName || ''}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          placeholder="Enter last name"
                          className="w-full py-2 border-b border-gray-200 focus:border-primary focus:outline-none transition-colors placeholder:text-gray-300"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.email || 'EMAIL'}</label>
                        <input
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="Enter email address"
                          className="w-full py-2 border-b border-gray-200 focus:border-primary focus:outline-none transition-colors placeholder:text-gray-300"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.phone || 'PRIMARY PHONE'}</label>
                        <input
                          value={formData.phone || ''}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+1 (555) 000-0000"
                          className="w-full py-2 border-b border-gray-200 focus:border-primary focus:outline-none transition-colors placeholder:text-gray-300"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.educationLevel || 'EDUCATION LEVEL'} *</label>
                        <div className="relative">
                          <select
                            required
                            value={formData.educationLevel || 'primary'}
                            onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}
                            className="w-full py-2 border-b border-gray-200 focus:border-primary focus:outline-none bg-transparent appearance-none"
                          >
                            <option value="before_education">{t.before_education}</option>
                            <option value="primary">{t.primary_school}</option>
                            <option value="middle">{t.middle_school}</option>
                            <option value="high_school">{t.high_school}</option>
                            <option value="university">{t.university}</option>
                            <option value="other">{t.other}</option>
                          </select>
                          <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.username || 'USERNAME'} *</label>
                        <input
                          required
                          value={formData.username || ''}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          placeholder="Choose a username"
                          className="w-full py-2 border-b border-gray-200 focus:border-primary focus:outline-none transition-colors placeholder:text-gray-300"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          {modalContent.type === 'add' ? (t.password || 'PASSWORD *') : (t.newPassword || 'NEW PASSWORD (OPTIONAL)')}
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
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.studentCode || 'STUDENT CODE'}</label>
                        <div className="flex items-center gap-2">
                          <input
                            value={formData.studentCode || ''}
                            onChange={(e) => setFormData({ ...formData, studentCode: e.target.value.toUpperCase() })}
                            placeholder="AUTO-GENERATED"
                            className="flex-1 py-2 border-b border-gray-200 focus:border-primary focus:outline-none transition-colors font-mono placeholder:text-gray-300"
                          />
                          <QrCode className="w-4 h-4 text-gray-300" />
                        </div>
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
                        {modalContent.type === 'edit' ? (t.update || 'Update Student') : (t.saveStudent || 'Create Student')}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Student Profile Popup */}
        <StudentProfilePopup
          student={selectedStudent}
          isOpen={showStudentProfile}
          onClose={() => {
            setShowStudentProfile(false);
            setSelectedStudent(null);
          }}
          onRefresh={() => {
            // Refresh student list when returning from profile
            window.location.reload();
          }}
          onEdit={(st) => {
            setShowStudentProfile(false);
            if (st) openModal('edit', st);
          }}
        />
      </div>
    </div>
  );
};

export default StudentsTab;

