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

const TeachersTab = () => {
  const [teachers, setTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ type: '', data: null });
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const fetchTeachers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = getAuthToken();
        if (!token) {
          setError("Authentication token not found. Please log in.");
          setIsLoading(false);
          return;
        }

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
        const { data } = await axios.get(API_BASE_URL, config);
        setTeachers(data);
      } catch (err) {
        const message = err.response?.data?.message || 
          "Failed to fetch teachers. Please ensure the server is running and you are logged in.";
        setError(message);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  const handleSave = async () => {
    const token = getAuthToken();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };

    try {
      if (modalContent.type === 'edit') {
        const { data } = await axios.put(
          `${API_BASE_URL}/${modalContent.data._id}`, 
          formData, 
          config
        );
        setTeachers(teachers.map(t => 
          t._id === data.teacher._id ? data.teacher : t
        ));
        alert('Teacher updated successfully!');
      } else {
        const { data } = await axios.post(API_BASE_URL, formData, config);
        setTeachers([...teachers, data.teacher]);
        alert('Teacher created successfully!');
      }
      closeModal();
    } catch (err) {
      const message = err.response?.data?.message || 
        "An error occurred while saving the teacher.";
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
      const message = err.response?.data?.message || 
        "An error occurred while deleting the teacher.";
      alert(`Error: ${message}`);
      console.error(err);
    }
  };

  const openModal = (type, teacher = null) => {
    setModalContent({ type, data: teacher });
    setFormData(teacher ? {
      name: teacher.name,
      email: teacher.email,
      subject: teacher.subject || '',
      department: teacher.department || '',
      experience: teacher.experience || 0,
      phone: teacher.phone || '',
      status: teacher.status || 'active',
    } : {
      name: '',
      email: '',
      password: '',
      subject: '',
      department: 'Science',
      experience: 0,
      phone: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent({ type: '', data: null });
  };

  const filteredTeachers = useMemo(() => {
    return teachers.filter(teacher => {
      const matchesSearch = teacher.name.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
        (teacher.subject && teacher.subject.toLowerCase()
          .includes(searchTerm.toLowerCase()));
      const matchesDepartment = selectedDepartment === 'all' || 
        teacher.department === selectedDepartment;
      return matchesSearch && matchesDepartment;
    });
  }, [teachers, searchTerm, selectedDepartment]);

  const getStatusPill = (status) => {
    const styles = {
      active: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      on_leave: 'bg-amber-100 text-amber-800 border border-amber-200',
      retired: 'bg-slate-100 text-slate-800 border border-slate-200',
    };
    return (
      <span className={`
        px-3 py-1 text-xs font-semibold rounded-full transition-all
        ${styles[status] || 'bg-red-100 text-red-800 border border-red-200'}
      `}>
        {status ? status.replace('_', ' ').toUpperCase() : 'N/A'}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
            <div className="flex-1 space-y-4 lg:space-y-0 lg:flex lg:gap-4 lg:items-center">
              <div className="relative group">
                <Search className="
                  absolute left-4 top-1/2 transform -translate-y-1/2 
                  text-slate-400 group-focus-within:text-blue-500 w-5 h-5 
                  transition-colors
                " />
                <input
                  type="text"
                  placeholder="Search teachers by name or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="
                    pl-12 pr-4 py-3 w-full lg:w-80 
                    bg-white border border-slate-200 rounded-xl 
                    focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 
                    transition-all duration-200 shadow-sm
                    placeholder:text-slate-400
                  "
                />
              </div>
              
              <div className="relative">
                <Filter className="
                  absolute left-3 top-1/2 transform -translate-y-1/2 
                  text-slate-400 w-4 h-4
                " />
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="
                    pl-10 pr-8 py-3 bg-white border border-slate-200 rounded-xl
                    focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400
                    transition-all duration-200 shadow-sm appearance-none
                    cursor-pointer min-w-48
                  "
                >
                  <option value="all">All Departments</option>
                  <option value="Science">Science</option>
                  <option value="Languages">Languages</option>
                  <option value="Social Studies">Social Studies</option>
                  <option value="Arts">Arts</option>
                </select>
              </div>
            </div>
            
            <button 
              onClick={() => openModal('add')}
              className="
                flex items-center gap-3 px-6 py-3 
                bg-gradient-to-r from-blue-600 to-indigo-600 
                text-white rounded-xl shadow-lg
                hover:from-blue-700 hover:to-indigo-700 
                hover:shadow-xl hover:scale-105
                transition-all duration-200 font-medium
              "
            >
              <Plus className="w-5 h-5" />
              Add New Teacher
            </button>
          </div>
        </div>

        {/* Enhanced Main Content */}
        {isLoading ? (
          <div className="
            flex flex-col justify-center items-center 
            bg-white/60 backdrop-blur-sm rounded-2xl p-16 shadow-lg
          ">
            <Loader className="animate-spin text-blue-500 mb-4" size={48} />
            <p className="text-slate-600 font-medium">Loading teachers...</p>
          </div>
        ) : error ? (
          <div className="
            bg-red-50 border border-red-200 rounded-2xl p-6 shadow-lg
            flex items-center gap-4
          ">
            <AlertTriangle className="text-red-500 w-6 h-6 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-800 mb-1">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Enhanced Teacher Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTeachers.map((teacher) => (
                <div 
                  key={teacher._id} 
                  className="
                    group bg-white/90 backdrop-blur-sm rounded-2xl p-6 
                    shadow-lg border border-white/20 
                    hover:shadow-2xl hover:scale-[1.02]
                    transition-all duration-300
                  "
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="
                        w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 
                        rounded-xl flex items-center justify-center text-white font-bold text-lg
                      ">
                        {teacher.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                          {teacher.name}
                        </h3>
                        <p className="text-slate-600 font-medium">
                          {teacher.subject || 'No subject'}
                        </p>
                        <p className="text-sm text-slate-500">
                          {teacher.department || 'No department'}
                        </p>
                      </div>
                    </div>
                    {getStatusPill(teacher.status)}
                  </div>

                  {/* Card Content */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Award className="w-4 h-4 text-amber-600" />
                      </div>
                      <span className="font-medium">
                        {teacher.experience || 0} years experience
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Mail className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm truncate">
                        {teacher.email}
                      </span>
                    </div>
                    {teacher.phone && (
                      <div className="flex items-center gap-3 text-slate-600">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Phone className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-sm">
                          {teacher.phone}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Enhanced Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t border-slate-100">
                    <button 
                      onClick={() => openModal('view', teacher)} 
                      className="
                        flex-1 flex items-center justify-center gap-2 px-4 py-2.5 
                        bg-blue-50 text-blue-700 rounded-lg font-medium
                        hover:bg-blue-100 hover:text-blue-800
                        transition-all duration-200
                      "
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button 
                      onClick={() => openModal('edit', teacher)} 
                      className="
                        flex items-center justify-center px-3 py-2.5 
                        text-slate-600 hover:bg-slate-50 rounded-lg
                        transition-all duration-200
                      "
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => openModal('delete', teacher)} 
                      className="
                        flex items-center justify-center px-3 py-2.5 
                        text-red-600 hover:bg-red-50 rounded-lg
                        transition-all duration-200
                      "
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Enhanced Empty State */}
            {filteredTeachers.length === 0 && (
              <div className="
                text-center py-16 bg-white/60 backdrop-blur-sm 
                rounded-2xl shadow-lg
              ">
                <div className="
                  w-20 h-20 bg-slate-100 rounded-2xl mx-auto mb-6
                  flex items-center justify-center
                ">
                  <Users className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  No teachers found
                </h3>
                <p className="text-slate-600 max-w-md mx-auto">
                  {searchTerm || selectedDepartment !== 'all' 
                    ? 'Try adjusting your search or filter criteria to find teachers.' 
                    : 'Get started by adding your first teacher to the system.'
                  }
                </p>
                {!searchTerm && selectedDepartment === 'all' && (
                  <button 
                    onClick={() => openModal('add')}
                    className="
                      mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl
                      hover:bg-blue-700 transition-colors font-medium
                    "
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
                        <p className="text-lg font-medium text-slate-900">{modalContent.data.name}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Email</label>
                        <p className="text-lg font-medium text-slate-900">{modalContent.data.email}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Subject</label>
                        <p className="text-lg font-medium text-slate-900">{modalContent.data.subject}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Department</label>
                        <p className="text-lg font-medium text-slate-900">{modalContent.data.department}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Experience</label>
                        <p className="text-lg font-medium text-slate-900">{modalContent.data.experience} years</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Status</label>
                        <div className="pt-1">{getStatusPill(modalContent.data.status)}</div>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Phone</label>
                        <p className="text-lg font-medium text-slate-900">{modalContent.data.phone || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex justify-end pt-6 border-t border-slate-200">
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
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name *</label>
                        <input 
                          required 
                          value={formData.name || ''} 
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                          placeholder="Enter full name"
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
                      
                      <div className={modalContent.type === 'edit' ? 'md:col-span-2' : ''}>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Subject *</label>
                        <input 
                          required 
                          value={formData.subject || ''} 
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })} 
                          placeholder="Enter subject"
                          className="w-full p-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Department *</label>
                        <select 
                          required 
                          value={formData.department || ''} 
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })} 
                          className="w-full p-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        >
                          <option value="">Select Department</option>
                          <option>Science</option>
                          <option>Languages</option>
                          <option>Social Studies</option>
                          <option>Arts</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Experience (years) *</label>
                        <input 
                          required 
                          type="number" 
                          min="0"
                          value={formData.experience || 0} 
                          onChange={(e) => setFormData({ ...formData, experience: e.target.value })} 
                          placeholder="Years of experience"
                          className="w-full p-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                        <input 
                          value={formData.phone || ''} 
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                          placeholder="Enter phone number"
                          className="w-full p-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                        <select 
                          value={formData.status || 'active'} 
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })} 
                          className="w-full p-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        >
                          <option value="active">Active</option>
                          <option value="on_leave">On Leave</option>
                          <option value="retired">Retired</option>
                        </select>
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
      </div>
    </div>
  );
};

export default TeachersTab;