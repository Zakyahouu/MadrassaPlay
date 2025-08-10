import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, Search, Plus, Edit, Trash2, Eye, Clock, User, Users,
  X, Loader, GraduationCap, BarChart3, DollarSign, MinusCircle, 
  Calendar, AlertTriangle
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = '/api/classes';

const getUserInfo = () => {
  const userInfoString = localStorage.getItem('user');
  if (!userInfoString) return null;
  try {
    return JSON.parse(userInfoString);
  } catch (error) {
    console.error("Failed to parse userInfo", error);
    return null;
  }
};

const getAuthToken = () => {
  const userInfo = getUserInfo();
  return userInfo ? userInfo.token : null;
};

const ClassesTab = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ type: '', data: null });
  const [formData, setFormData] = useState({});
  const [selectedStudents, setSelectedStudents] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      const userInfo = getUserInfo();
      if (!userInfo || !userInfo.token || !userInfo.school) {
        setError("User data not found. Please log in.");
        setIsLoading(false);
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };

      try {
        const [classesRes, teachersRes, studentsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}?school=${userInfo.school}`, config),
          axios.get('/api/teachers', config),
          axios.get(`/api/students?school=${userInfo.school}`, config)
        ]);

        setClasses(classesRes.data);
        setTeachers(teachersRes.data);
        setStudents(studentsRes.data);

      } catch (err) {
        const message = err.response?.data?.message || "Failed to fetch required data.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    const token = getAuthToken();
    const userInfo = getUserInfo();
    const config = { 
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: `Bearer ${token}` 
      } 
    };
    const finalFormData = { 
      ...formData, 
      students: selectedStudents, 
      school: userInfo.school 
    };

    try {
      if (modalContent.type === 'edit') {
        const { data } = await axios.put(
          `${API_BASE_URL}/${modalContent.data._id}`, 
          finalFormData, 
          config
        );
        const populatedData = { 
          ...data, 
          teacher: teachers.find(t => t._id === data.teacher), 
          students: students.filter(s => data.students.includes(s._id)) 
        };
        setClasses(classes.map(c => c._id === data._id ? populatedData : c));
        alert('Class updated successfully!');
      } else {
        const { data } = await axios.post(API_BASE_URL, finalFormData, config);
        const populatedData = { 
          ...data, 
          teacher: teachers.find(t => t._id === data.teacher), 
          students: students.filter(s => data.students.includes(s._id)) 
        };
        setClasses([...classes, populatedData]);
        alert('Class created successfully!');
      }
      closeModal();
    } catch (err) {
      const message = err.response?.data?.message || 
        "An error occurred while saving the class.";
      alert(`Error: ${message}`);
    }
  };

  const handleDelete = async () => {
    const token = getAuthToken();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
      await axios.delete(`${API_BASE_URL}/${modalContent.data._id}`, config);
      setClasses(classes.filter(c => c._id !== modalContent.data._id));
      alert('Class deleted successfully.');
      closeModal();
    } catch (err) {
      alert(err.response?.data?.message || "An error occurred.");
    }
  };

  const openModal = (type, cls = null) => {
    setModalContent({ type, data: cls });
    setFormData(cls ? {
      name: cls.name,
      teacher: cls.teacher?._id || '',
      schedule: cls.schedule || [{ day: 'Monday', time: '19:00' }],
      subject: cls.subject || '',
      level: cls.level || '',
      paymentRule: cls.paymentRule || 4,
    } : {
      name: '',
      teacher: '',
      schedule: [{ day: 'Monday', time: '19:00' }],
      subject: '',
      level: '',
      paymentRule: 4,
    });
    setSelectedStudents(cls ? cls.students.map(s => s._id) : []);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);
  
  const handleStudentSelect = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId) 
        : [...prev, studentId]
    );
  };

  const handleScheduleChange = (index, field, value) => {
    const newSchedule = [...formData.schedule];
    newSchedule[index][field] = value;
    setFormData({ ...formData, schedule: newSchedule });
  };

  const addScheduleSlot = () => {
    setFormData({ 
      ...formData, 
      schedule: [...formData.schedule, { day: 'Monday', time: '19:00' }] 
    });
  };

  const removeScheduleSlot = (index) => {
    const newSchedule = formData.schedule.filter((_, i) => i !== index);
    setFormData({ ...formData, schedule: newSchedule });
  };

  const filteredClasses = useMemo(() => {
    if (!searchTerm) return classes;
    return classes.filter(cls =>
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cls.teacher?.name && cls.teacher.name.toLowerCase()
        .includes(searchTerm.toLowerCase()))
    );
  }, [classes, searchTerm]);

  const formatSchedule = (scheduleArray) => {
    if (!scheduleArray || scheduleArray.length === 0) return 'No schedule set';
    return scheduleArray.map(s => `${s.day} at ${s.time}`).join(', ');
  };

  const getLevelColor = (level) => {
    const colors = {
      'A1': 'bg-green-50 text-green-700 border-green-200',
      'A2': 'bg-blue-50 text-blue-700 border-blue-200',
      'B1': 'bg-purple-50 text-purple-700 border-purple-200',
      'B2': 'bg-orange-50 text-orange-700 border-orange-200',
      'C1': 'bg-red-50 text-red-700 border-red-200',
      'C2': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };
    return colors[level] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Clean Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="
                absolute left-3 top-1/2 transform -translate-y-1/2 
                text-gray-400 w-5 h-5
              " />
              <input
                type="text"
                placeholder="Search classes or teachers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="
                  pl-10 pr-4 py-3 w-full
                  bg-gray-50 border-0 rounded-lg
                  focus:bg-white focus:ring-2 focus:ring-blue-500/20
                  transition-all duration-200
                  placeholder:text-gray-400
                "
              />
            </div>
            
            <button
              onClick={() => openModal('add')}
              className="
                flex items-center gap-2 px-5 py-3
                bg-blue-600 text-white rounded-lg
                hover:bg-blue-700 hover:shadow-lg
                transition-all duration-200 font-medium
              "
            >
              <Plus className="w-4 h-4" />
              Add Class
            </button>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="
            flex flex-col justify-center items-center 
            bg-white rounded-xl p-16 shadow-sm
          ">
            <Loader className="animate-spin text-blue-500 mb-4" size={40} />
            <p className="text-gray-600">Loading classes...</p>
          </div>
        ) : error ? (
          <div className="
            bg-red-50 border border-red-100 rounded-xl p-6
            flex items-center gap-4
          ">
            <AlertTriangle className="text-red-500 w-6 h-6 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-red-800 mb-1">Error</h3>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Class Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredClasses.map((cls) => (
                <div
                  key={cls._id}
                  className="
                    group bg-white rounded-xl p-6 shadow-sm border border-gray-100
                    hover:shadow-md hover:border-gray-200
                    transition-all duration-200
                  "
                >
                  {/* Card Header */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="
                          text-lg font-semibold text-gray-900 mb-1
                          group-hover:text-blue-600 transition-colors
                        ">
                          {cls.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {cls.subject}
                        </p>
                      </div>
                      <span className={`
                        px-2 py-1 text-xs font-medium rounded-md border
                        ${getLevelColor(cls.level)}
                      `}>
                        {cls.level}
                      </span>
                    </div>
                  </div>

                  {/* Class Details */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-medium">
                        {cls.teacher?.name || 'No teacher assigned'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-green-600" />
                      </div>
                      <span>
                        {cls.students?.length || 0} student{cls.students?.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <div className="flex items-start gap-3 text-sm text-gray-600">
                      <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center mt-0.5">
                        <Clock className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <span className="line-clamp-2">
                          {formatSchedule(cls.schedule)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-amber-600" />
                      </div>
                      <span>
                        Payment rule: {cls.paymentRule} sessions
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => openModal('view', cls)}
                      className="
                        flex-1 flex items-center justify-center gap-2 px-3 py-2
                        bg-blue-50 text-blue-700 rounded-lg text-sm font-medium
                        hover:bg-blue-100 transition-colors
                      "
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => openModal('edit', cls)}
                      className="
                        p-2 text-gray-500 hover:bg-gray-50 rounded-lg
                        transition-colors
                      "
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openModal('delete', cls)}
                      className="
                        p-2 text-red-500 hover:bg-red-50 rounded-lg
                        transition-colors
                      "
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredClasses.length === 0 && (
              <div className="
                text-center py-16 bg-white rounded-xl shadow-sm
              ">
                <div className="
                  w-16 h-16 bg-gray-100 rounded-xl mx-auto mb-4
                  flex items-center justify-center
                ">
                  <BookOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No classes found
                </h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  {searchTerm 
                    ? 'Try adjusting your search criteria to find classes.' 
                    : 'Get started by creating your first class.'
                  }
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => openModal('add')}
                    className="
                      mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg
                      hover:bg-blue-700 transition-colors font-medium
                    "
                  >
                    Create First Class
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Enhanced Modal */}
        {isModalOpen && (
          <div className="
            fixed inset-0 bg-black/40 backdrop-blur-sm 
            flex items-center justify-center z-50 p-4
          ">
            <div className="
              bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] 
              overflow-hidden shadow-xl
            ">
              {/* Modal Header */}
              <div className="
                flex items-center justify-between p-6 
                bg-gray-50 border-b border-gray-200
              ">
                <h2 className="text-xl font-semibold text-gray-900 capitalize">
                  {modalContent.type} Class
                </h2>
                <button
                  onClick={closeModal}
                  className="
                    p-2 text-gray-400 hover:text-gray-600 
                    hover:bg-white rounded-lg transition-all
                  "
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {modalContent.type === 'view' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="
                          text-sm font-medium text-gray-600 
                          uppercase tracking-wide mb-1 block
                        ">
                          Class Name
                        </label>
                        <p className="text-lg font-semibold text-gray-900">
                          {modalContent.data.name}
                        </p>
                      </div>
                      
                      <div>
                        <label className="
                          text-sm font-medium text-gray-600 
                          uppercase tracking-wide mb-1 block
                        ">
                          Subject
                        </label>
                        <p className="text-lg font-semibold text-gray-900">
                          {modalContent.data.subject}
                        </p>
                      </div>
                      
                      <div>
                        <label className="
                          text-sm font-medium text-gray-600 
                          uppercase tracking-wide mb-1 block
                        ">
                          Teacher
                        </label>
                        <p className="text-lg font-semibold text-gray-900">
                          {modalContent.data.teacher?.name || 'Not assigned'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="
                          text-sm font-medium text-gray-600 
                          uppercase tracking-wide mb-1 block
                        ">
                          Level
                        </label>
                        <span className={`
                          inline-block px-3 py-1 text-sm font-medium rounded-md border
                          ${getLevelColor(modalContent.data.level)}
                        `}>
                          {modalContent.data.level}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="
                        text-sm font-medium text-gray-600 
                        uppercase tracking-wide mb-2 block
                      ">
                        Schedule
                      </label>
                      <p className="text-gray-900">
                        {formatSchedule(modalContent.data.schedule)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="
                        text-sm font-medium text-gray-600 
                        uppercase tracking-wide mb-2 block
                      ">
                        Enrolled Students ({modalContent.data.students?.length || 0})
                      </label>
                      <div className="
                        max-h-32 overflow-y-auto bg-gray-50 rounded-lg p-4
                        border border-gray-200
                      ">
                        {modalContent.data.students?.length > 0 ? (
                          <ul className="space-y-1">
                            {modalContent.data.students.map(s => (
                              <li key={s._id} className="text-gray-700">
                                {s.name}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500 italic">No students enrolled</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-end pt-4 border-t border-gray-200">
                      <button
                        onClick={closeModal}
                        className="
                          px-6 py-2 bg-gray-100 text-gray-700 rounded-lg 
                          hover:bg-gray-200 transition-colors font-medium
                        "
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
                        <label className="
                          block text-sm font-medium text-gray-700 mb-2
                        ">
                          Class Name *
                        </label>
                        <input
                          required
                          value={formData.name || ''}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Enter class name"
                          className="
                            w-full p-3 border border-gray-300 rounded-lg
                            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                            transition-all
                          "
                        />
                      </div>
                      
                      <div>
                        <label className="
                          block text-sm font-medium text-gray-700 mb-2
                        ">
                          Subject *
                        </label>
                        <input
                          required
                          value={formData.subject || ''}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          placeholder="Enter subject"
                          className="
                            w-full p-3 border border-gray-300 rounded-lg
                            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                            transition-all
                          "
                        />
                      </div>
                      
                      <div>
                        <label className="
                          block text-sm font-medium text-gray-700 mb-2
                        ">
                          Level *
                        </label>
                        <input
                          required
                          value={formData.level || ''}
                          onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                          placeholder="e.g., A1, Grade 9"
                          className="
                            w-full p-3 border border-gray-300 rounded-lg
                            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                            transition-all
                          "
                        />
                      </div>
                      
                      <div>
                        <label className="
                          block text-sm font-medium text-gray-700 mb-2
                        ">
                          Teacher *
                        </label>
                        <select
                          required
                          value={formData.teacher || ''}
                          onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                          className="
                            w-full p-3 border border-gray-300 rounded-lg
                            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                            transition-all
                          "
                        >
                          <option value="">Select a teacher</option>
                          {teachers.map(t => (
                            <option key={t._id} value={t._id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="
                          block text-sm font-medium text-gray-700 mb-2
                        ">
                          Payment Rule *
                        </label>
                        <input
                          required
                          type="number"
                          min="1"
                          value={formData.paymentRule || 4}
                          onChange={(e) => setFormData({ ...formData, paymentRule: e.target.value })}
                          placeholder="Sessions per payment"
                          className="
                            w-full p-3 border border-gray-300 rounded-lg
                            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                            transition-all
                          "
                        />
                      </div>
                    </div>

                    {/* Schedule Section */}
                    <div className="
                      bg-gray-50 rounded-lg p-4 border border-gray-200
                    ">
                      <div className="flex items-center justify-between mb-4">
                        <label className="
                          text-sm font-medium text-gray-700
                        ">
                          Schedule *
                        </label>
                        <button
                          type="button"
                          onClick={addScheduleSlot}
                          className="
                            text-sm text-blue-600 hover:text-blue-700
                            font-medium transition-colors
                          "
                        >
                          + Add Day
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {formData.schedule?.map((slot, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <select
                              value={slot.day}
                              onChange={(e) => handleScheduleChange(index, 'day', e.target.value)}
                              className="
                                p-2 border border-gray-300 rounded-lg flex-1
                                focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                              "
                            >
                              <option>Monday</option>
                              <option>Tuesday</option>
                              <option>Wednesday</option>
                              <option>Thursday</option>
                              <option>Friday</option>
                              <option>Saturday</option>
                              <option>Sunday</option>
                            </select>
                            <input
                              type="time"
                              value={slot.time}
                              onChange={(e) => handleScheduleChange(index, 'time', e.target.value)}
                              className="
                                p-2 border border-gray-300 rounded-lg flex-1
                                focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                              "
                            />
                            {formData.schedule.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeScheduleSlot(index)}
                                className="
                                  p-2 text-red-500 hover:bg-red-50 rounded-lg
                                  transition-colors
                                "
                              >
                                <MinusCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Students Section */}
                    <div>
                      <label className="
                        block text-sm font-medium text-gray-700 mb-3
                      ">
                        Assign Students
                      </label>
                      <div className="
                        max-h-48 overflow-y-auto bg-gray-50 rounded-lg p-4
                        border border-gray-200
                      ">
                        {students.length > 0 ? (
                          <div className="space-y-2">
                            {students.map(s => (
                              <label key={s._id} className="
                                flex items-center gap-3 p-2 hover:bg-white
                                rounded-md transition-colors cursor-pointer
                              ">
                                <input
                                  type="checkbox"
                                  checked={selectedStudents.includes(s._id)}
                                  onChange={() => handleStudentSelect(s._id)}
                                  className="
                                    w-4 h-4 text-blue-600 rounded
                                    focus:ring-blue-500/20
                                  "
                                />
                                <span className="text-gray-700">{s.name}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 italic text-center py-4">
                            No students available
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="
                          px-6 py-2 bg-gray-100 text-gray-700 rounded-lg
                          hover:bg-gray-200 transition-colors font-medium
                        "
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="
                          px-6 py-2 bg-blue-600 text-white rounded-lg
                          hover:bg-blue-700 transition-colors font-medium
                        "
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                )}

                {modalContent.type === 'delete' && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="
                        w-16 h-16 bg-red-100 rounded-xl mx-auto mb-4
                        flex items-center justify-center
                      ">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Delete Class
                      </h3>
                      <p className="text-gray-600 max-w-sm mx-auto">
                        Are you sure you want to delete{' '}
                        <span className="font-semibold text-gray-900">
                          {modalContent.data.name}
                        </span>
                        ? This action cannot be undone.
                      </p>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={closeModal}
                        className="
                          px-6 py-2 bg-gray-100 text-gray-700 rounded-lg
                          hover:bg-gray-200 transition-colors font-medium
                        "
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDelete}
                        className="
                          px-6 py-2 bg-red-600 text-white rounded-lg
                          hover:bg-red-700 transition-colors font-medium
                        "
                      >
                        Delete Class
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

export default ClassesTab;