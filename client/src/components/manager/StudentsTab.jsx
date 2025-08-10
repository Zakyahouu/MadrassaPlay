import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, Edit, Trash2, Eye, Mail, Phone, X, Loader,
  User, Users, GraduationCap, BarChart3, Star, AlertTriangle,
  Award, TrendingUp
} from 'lucide-react';
import axios from 'axios';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ type: '', data: null });
  const [formData, setFormData] = useState({});

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

  const handleSave = async () => {
    const token = getAuthToken();
    const config = { 
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: `Bearer ${token}` 
      } 
    };

    try {
      if (modalContent.type === 'edit') {
        const { data } = await axios.put(
          `${API_BASE_URL}/${modalContent.data._id}`, 
          formData, 
          config
        );
        setStudents(students.map(s => 
          s._id === data.student._id ? data.student : s
        ));
        alert('Student updated successfully!');
      } else {
        const { data } = await axios.post(API_BASE_URL, formData, config);
        setStudents([...students, data.student]);
        alert('Student created successfully!');
      }
      closeModal();
    } catch (err) {
      const message = err.response?.data?.message || 
        "An error occurred while saving.";
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
    setFormData(student ? {
      name: student.name,
      email: student.email,
      level: student.level || 1,
      xp: student.xp || 0,
    } : {
      name: '',
      email: '',
      password: '',
      level: 1,
      xp: 0,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    return students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const getLevelBadge = (level) => {
    const colors = {
      1: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      2: 'bg-blue-50 text-blue-700 border-blue-200',
      3: 'bg-purple-50 text-purple-700 border-purple-200',
      4: 'bg-orange-50 text-orange-700 border-orange-200',
      5: 'bg-red-50 text-red-700 border-red-200',
    };
    const defaultColor = 'bg-gray-50 text-gray-700 border-gray-200';
    return colors[level] || defaultColor;
  };

  const getXPProgress = (xp) => {
    const maxXP = 1000; // Assuming max XP for progress bar
    const percentage = Math.min((xp / maxXP) * 100, 100);
    return percentage;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="
                  absolute left-4 top-1/2 transform -translate-y-1/2 
                  text-gray-400 w-5 h-5
                " />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="
                    pl-12 pr-4 py-3 w-full
                    bg-gray-50 border-0 rounded-lg
                    focus:bg-white focus:ring-2 focus:ring-blue-500/20
                    transition-all duration-200
                    placeholder:text-gray-400
                  "
                />
              </div>
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
              Add Student
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
            <p className="text-gray-600">Loading students...</p>
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {filteredStudents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="
                        px-6 py-4 text-left text-xs font-semibold 
                        text-gray-600 uppercase tracking-wider
                      ">
                        Student
                      </th>
                      <th className="
                        px-6 py-4 text-left text-xs font-semibold 
                        text-gray-600 uppercase tracking-wider
                      ">
                        Level
                      </th>
                      <th className="
                        px-6 py-4 text-left text-xs font-semibold 
                        text-gray-600 uppercase tracking-wider
                      ">
                        Experience Points
                      </th>
                      <th className="
                        px-6 py-4 text-right text-xs font-semibold 
                        text-gray-600 uppercase tracking-wider
                      ">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredStudents.map((student, index) => (
                      <tr 
                        key={student._id} 
                        className="
                          hover:bg-gray-50 transition-colors duration-150
                          group
                        "
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="
                              w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 
                              rounded-xl flex items-center justify-center 
                              text-white font-semibold
                            ">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="
                                font-medium text-gray-900 
                                group-hover:text-blue-600 transition-colors
                              ">
                                {student.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {student.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`
                            inline-flex items-center gap-1 px-3 py-1 
                            text-sm font-medium rounded-full border
                            ${getLevelBadge(student.level)}
                          `}>
                            <Award className="w-3 h-3" />
                            Level {student.level}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-900">
                                  {student.xp} XP
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="
                                    bg-gradient-to-r from-blue-500 to-indigo-600 
                                    h-2 rounded-full transition-all duration-300
                                  "
                                  style={{ width: `${getXPProgress(student.xp)}%` }}
                                ></div>
                              </div>
                            </div>
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openModal('view', student)}
                              className="
                                p-2 text-blue-600 hover:bg-blue-50 
                                rounded-lg transition-colors
                              "
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openModal('edit', student)}
                              className="
                                p-2 text-gray-600 hover:bg-gray-50 
                                rounded-lg transition-colors
                              "
                              title="Edit Student"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openModal('delete', student)}
                              className="
                                p-2 text-red-600 hover:bg-red-50 
                                rounded-lg transition-colors
                              "
                              title="Delete Student"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="
                  w-16 h-16 bg-gray-100 rounded-xl mx-auto mb-4
                  flex items-center justify-center
                ">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No students found
                </h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  {searchTerm 
                    ? 'Try adjusting your search criteria to find students.' 
                    : 'Get started by adding your first student to the system.'
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
                    Add First Student
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Enhanced Modal */}
        {isModalOpen && (
          <div className="
            fixed inset-0 bg-black/40 backdrop-blur-sm 
            flex items-center justify-center z-50 p-4
          ">
            <div className="
              bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] 
              overflow-hidden shadow-xl
            ">
              {/* Modal Header */}
              <div className="
                flex items-center justify-between p-6 
                bg-gray-50 border-b border-gray-200
              ">
                <h2 className="text-xl font-semibold text-gray-900 capitalize">
                  {modalContent.type} Student
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
                    <div className="flex items-center gap-4 mb-6">
                      <div className="
                        w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 
                        rounded-2xl flex items-center justify-center 
                        text-white font-bold text-xl
                      ">
                        {modalContent.data.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          {modalContent.data.name}
                        </h3>
                        <p className="text-gray-600">{modalContent.data.email}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="
                        bg-gradient-to-br from-blue-50 to-indigo-50 
                        rounded-xl p-4 border border-blue-100
                      ">
                        <div className="flex items-center gap-3 mb-2">
                          <Award className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">
                            Current Level
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-blue-900">
                          Level {modalContent.data.level}
                        </p>
                      </div>
                      
                      <div className="
                        bg-gradient-to-br from-green-50 to-emerald-50 
                        rounded-xl p-4 border border-green-100
                      ">
                        <div className="flex items-center gap-3 mb-2">
                          <Star className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            Experience Points
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-green-900">
                          {modalContent.data.xp} XP
                        </p>
                        <div className="mt-3">
                          <div className="w-full bg-green-200 rounded-full h-2">
                            <div 
                              className="
                                bg-gradient-to-r from-green-500 to-emerald-600 
                                h-2 rounded-full
                              "
                              style={{ width: `${getXPProgress(modalContent.data.xp)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end pt-6 border-t border-gray-200">
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
                    <div className="space-y-4">
                      <div>
                        <label className="
                          block text-sm font-medium text-gray-700 mb-2
                        ">
                          Full Name *
                        </label>
                        <input
                          required
                          value={formData.name || ''}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Enter full name"
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
                          Email Address *
                        </label>
                        <input
                          required
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="Enter email address"
                          className="
                            w-full p-3 border border-gray-300 rounded-lg
                            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                            transition-all
                          "
                        />
                      </div>
                      
                      {modalContent.type === 'add' && (
                        <div>
                          <label className="
                            block text-sm font-medium text-gray-700 mb-2
                          ">
                            Password *
                          </label>
                          <input
                            required
                            type="password"
                            value={formData.password || ''}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Enter password"
                            className="
                              w-full p-3 border border-gray-300 rounded-lg
                              focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                              transition-all
                            "
                          />
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="
                            block text-sm font-medium text-gray-700 mb-2
                          ">
                            Level
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={formData.level || 1}
                            onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
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
                            Experience Points
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.xp || 0}
                            onChange={(e) => setFormData({ ...formData, xp: parseInt(e.target.value) })}
                            className="
                              w-full p-3 border border-gray-300 rounded-lg
                              focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                              transition-all
                            "
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
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
                        Delete Student
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
                        Delete Student
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

export default StudentsTab;