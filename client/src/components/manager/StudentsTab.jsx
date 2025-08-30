import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, Edit, Trash2, Eye, Mail, Phone, X, Loader, Download,
  User, Users, GraduationCap, BarChart3, Star, AlertTriangle, Filter,
  Award, TrendingUp, BookOpen, CreditCard, Calendar, MapPin, FileText,
  QrCode, Building2, UserCheck
} from 'lucide-react';
import axios from 'axios';
import StudentProfilePopup from './StudentProfilePopup';

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
    selectedClass: null,
    paymentMethod: 'cash',
    sessionsCount: 1
  });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentProfile, setShowStudentProfile] = useState(false);
  const [availableClasses, setAvailableClasses] = useState([]);

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

    const payload = {
      firstName: formData.firstName?.trim(),
      lastName: formData.lastName?.trim(),
      email: formData.email?.trim() || undefined,
      phone: formData.phone?.trim(),
      phone2: formData.phone2?.trim(),
      address: formData.address?.trim() || undefined,
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
        alert('Student updated successfully!');
        closeModal();
      } else {
        const { data } = await axios.post(API_BASE_URL, payload, config);
        setStudents([...students, data.student]);
        alert('Student created successfully!');
        
        // Show enrollment step
  setShowEnrollmentStep(true);
  setEnrollmentData(prev => ({ ...prev, selectedStudent: data.student }));
      }
    } catch (err) {
      const message = err.response?.data?.message || 
        "An error occurred while saving.";
      alert(`Error: ${message}`);
    }
  };

  const handleEnrollment = async () => {
    if (!enrollmentData.selectedClass) {
      alert('Please select a class to enroll in.');
      return;
    }

    const token = getAuthToken();
    const config = { 
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: `Bearer ${token}` 
      } 
    };

    const payload = {
      classId: enrollmentData.selectedClass._id,
    };

    try {
  await axios.post(`/api/students/${enrollmentData.selectedStudent._id}/enroll`, payload, config);
      alert('Student enrolled successfully!');
      closeModal();
      setShowEnrollmentStep(false);
      setEnrollmentData({
        selectedClass: null,
        paymentMethod: 'cash',
        sessionsCount: 1
      });
      
      // Refresh student list
      window.location.reload();
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
      alert('Student deleted successfully.');
      closeModal();
    } catch (err) {
      alert(err.response?.data?.message || "An error occurred.");
    }
  };

  const openModal = (type, student = null) => {
    setModalContent({ type, data: student });
    setShowEnrollmentStep(false);
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

    // If opening add or edit and will show enrollment later, prefetch classes once when needed
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent({ type: '', data: null });
    setShowEnrollmentStep(false);
    setEnrollmentData({
      selectedClass: null,
      paymentMethod: 'cash',
      sessionsCount: 1,
    });
    setAvailableClasses([]);
  };

  useEffect(() => {
    const fetchClassesForEnrollment = async () => {
      if (!showEnrollmentStep || !enrollmentData.selectedStudent) return;
      try {
        const token = getAuthToken();
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const { data } = await axios.get('/api/classes', config);
        // Filter by education level if class has level metadata
        const studentLevel = enrollmentData.selectedStudent.educationLevel;
        const filtered = Array.isArray(data)
          ? data.filter(c => {
              // If class has catalogItem.type with level in metadata, enforce match for supportLessons/reviewCourses
              const item = c.catalogItem;
              if (!item) return true;
              if (['supportLessons', 'reviewCourses'].includes(item.type)) {
                // Prefer server validation; client just lightly filter if level present
                if (item.level && ['primary','middle','high_school'].includes(item.level)) {
                  return item.level === studentLevel;
                }
              }
              return true;
            })
          : [];
        setAvailableClasses(filtered);
      } catch (e) {
        console.error('Failed to fetch classes', e);
        setAvailableClasses([]);
      }
    };
    fetchClassesForEnrollment();
  }, [showEnrollmentStep, enrollmentData.selectedStudent]);

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
      filtered = filtered.filter(student => student.enrolledClass === classFilter);
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
      before_education: 'Before Education',
      primary: 'Primary',
      middle: 'Middle School',
      high_school: 'High School',
      university: 'University',
      other: 'Other'
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
        {/* Enhanced Header */}
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name, phone, or student code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors w-full sm:w-80"
                />
              </div>
              
              <select
                value={educationLevelFilter}
                onChange={(e) => setEducationLevelFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">All Education Levels</option>
                <option value="before_education">Before Education</option>
                <option value="primary">Primary</option>
                <option value="middle">Middle School</option>
                <option value="high_school">High School</option>
                <option value="university">University</option>
                <option value="other">Other</option>
              </select>

              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">All Classes</option>
                <option value="enrolled">Enrolled</option>
                <option value="not_enrolled">Not Enrolled</option>
              </select>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            <button
              onClick={() => openModal('add')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Student
            </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex justify-center items-center bg-white rounded-lg p-8 shadow-sm border">
            <Loader className="animate-spin text-blue-500 mr-3" />
            <span className="text-gray-600">Loading students...</span>
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
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {filteredStudents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Education Level
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Enrollments
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredStudents.map((student) => {
                      const levelBadge = getEducationLevelBadge(student.educationLevel);
                      return (
                        <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-semibold text-sm">
                                {student.firstName?.[0] || student.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <div className="font-medium text-gray-900">
                                  {`${student.firstName || ''} ${student.lastName || ''}`.trim() || student.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                  {student.studentCode}
                                </div>
                                <div className="text-xs text-gray-400">
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
                              <BookOpen className="w-4 h-4 text-blue-500" />
                              <span className="text-sm text-gray-900">
                                {student.enrollmentCount || 0} classes
                              </span>
                              {student.balance && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                  Credit: {student.balance} sessions
                                </span>
                              )}
                          </div>
                        </td>
                          <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setShowStudentProfile(true);
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="View Profile"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openModal('edit', student)}
                                className="p-1.5 text-gray-600 hover:bg-gray-50 rounded transition-colors"
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
                <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No students found
                </h3>
                <p className="text-gray-600 max-w-sm mx-auto">
                  {searchTerm 
                    ? 'Try adjusting your search criteria.' 
                    : 'Get started by adding your first student.'
                  }
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => openModal('add')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Add First Student
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
                  {showEnrollmentStep ? 'Enroll Student' : `${modalContent.type} Student`}
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
                        Enroll {enrollmentData.selectedStudent?.firstName} {enrollmentData.selectedStudent?.lastName}
                        </h3>
                      <p className="text-blue-700 text-sm">
                        Student created successfully! You can now enroll them in classes.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Class
                        </label>
                        <select
                          value={enrollmentData.selectedClass?._id || ''}
                          onChange={(e) => {
                            const chosen = availableClasses.find(c => c._id === e.target.value) || null;
                            setEnrollmentData(prev => ({ ...prev, selectedClass: chosen }));
                          }}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        >
                          <option value="">Choose a class...</option>
                          {availableClasses.map(c => (
                            <option key={c._id} value={c._id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Payment Method
                        </label>
                        <select
                          value={enrollmentData.paymentMethod}
                          onChange={(e) => setEnrollmentData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        >
                          <option value="cash">Cash</option>
                          <option value="card">Card</option>
                          <option value="bank_transfer">Bank Transfer</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Number of Sessions
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={enrollmentData.sessionsCount}
                          onChange={(e) => setEnrollmentData(prev => ({ ...prev, sessionsCount: parseInt(e.target.value) }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                        </div>
                      
                      {enrollmentData.selectedClass && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Enrollment Summary</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div>Class: {enrollmentData.selectedClass.name}</div>
                            <div>Schedule: {enrollmentData.selectedClass.schedules?.map(s => 
                            `${s.dayOfWeek.charAt(0).toUpperCase() + s.dayOfWeek.slice(1)} ${s.startTime}-${s.endTime}`
                          ).join(', ')}</div>
                            {typeof enrollmentData.selectedClass.price === 'number' && (
                              <>
                                <div>Price per session: ${enrollmentData.selectedClass.price}</div>
                                <div className="font-medium text-gray-900">
                                  Total: ${enrollmentData.selectedClass.price * enrollmentData.sessionsCount}
                          </div>
                              </>
                            )}
                        </div>
                      </div>
                      )}
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      >
                        Skip for Now
                      </button>
                      <button
                        onClick={handleEnrollment}
                        disabled={!enrollmentData.selectedClass}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Complete Enrollment
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name *
                        </label>
                        <input
                          required
                          value={formData.firstName || ''}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          placeholder="Enter first name"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name *
                        </label>
                        <input
                          required
                          value={formData.lastName || ''}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          placeholder="Enter last name"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address (optional)
                        </label>
                        <input
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="Enter email address"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number (optional)
                        </label>
                        <input
                          value={formData.phone || ''}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="Enter phone number"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number 2 (optional)
                        </label>
                        <input
                          value={formData.phone2 || ''}
                          onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                          placeholder="Enter second phone number"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Education Level *
                        </label>
                        <select
                          required
                          value={formData.educationLevel || 'primary'}
                          onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        >
                          <option value="before_education">Before Education</option>
                          <option value="primary">Primary School</option>
                          <option value="middle">Middle School</option>
                          <option value="high_school">High School</option>
                          <option value="university">University</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address
                        </label>
                        <input
                          value={formData.address || ''}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder="Enter address"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Username *
                        </label>
                        <input
                          required
                          value={formData.username || ''}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          placeholder="Choose username"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>
                      
                      {modalContent.type === 'add' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password *
                          </label>
                          <input
                            required
                            type="password"
                            value={formData.password || ''}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Enter password"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          />
                        </div>
                      )}
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Student Code
                          </label>
                        <div className="flex items-center gap-2">
                          <QrCode className="w-5 h-5 text-blue-500" />
                          <input
                            value={formData.studentCode || ''}
                            onChange={(e) => setFormData({ ...formData, studentCode: e.target.value.toUpperCase() })}
                            placeholder="Student code"
                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          This code will be auto-generated if left empty
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Save Student
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
        />
      </div>
    </div>
  );
};

export default StudentsTab;

