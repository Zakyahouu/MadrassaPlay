import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, Edit, Trash2, Eye, Calendar, Clock, Users, 
  BookOpen, Building2, User, AlertTriangle, Loader, Download,
  CheckCircle, XCircle, ArrowRight, ChevronDown, ChevronRight
} from 'lucide-react';
import axios from 'axios';
import formatDZ from '../../utils/currency';
import ClassCreationModal from './class/ClassCreationModal';
import ClassEditModal from './class/ClassEditModal';
import AttendanceRoster from './AttendanceRoster';

const API_BASE_URL = '/api/classes';

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

const ClassesTab = ({ onNavigateToAttendance }) => {
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [editClassId, setEditClassId] = useState('');
  // Enrollment selection now managed inside PaymentsPanel via roster
  const [rosterDate, setRosterDate] = useState(() => new Date().toISOString().slice(0,10));

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
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
      setClasses(data);
      } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch classes.";
        setError(message);
      console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

  const handleDelete = async (classId) => {
    if (!window.confirm('Are you sure you want to delete this class?')) {
      return;
    }

    const token = getAuthToken();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    
    try {
      await axios.delete(`${API_BASE_URL}/${classId}`, config);
      setClasses(classes.filter(c => c._id !== classId));
      alert('Class deleted successfully.');
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete class.";
      alert(`Error: ${message}`);
    }
  };

  const filteredClasses = useMemo(() => {
    let filtered = classes;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(classItem => {
        const name = classItem.name?.toLowerCase() || '';
        const teacher = `${classItem.teacherId?.firstName || ''} ${classItem.teacherId?.lastName || ''}`.toLowerCase();
        const room = classItem.roomId?.name?.toLowerCase() || '';
        
        return name.includes(term) || teacher.includes(term) || room.includes(term);
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(classItem => classItem.status === statusFilter);
    }

    return filtered;
  }, [classes, searchTerm, statusFilter]);

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getDayDisplay = (day) => {
    const days = {
      monday: 'Mon',
      tuesday: 'Tue', 
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
      sunday: 'Sun'
    };
    return days[day] || day;
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const exportToCSV = () => {
  const headers = ['Class Name', 'Teacher', 'Room', 'Schedule', 'Capacity', 'Enrolled', 'Status', 'Price (DZ)'];
    const csvData = filteredClasses.map(classItem => [
      classItem.name,
      `${classItem.teacherId?.firstName || ''} ${classItem.teacherId?.lastName || ''}`,
      classItem.roomId?.name || '',
      `${getDayDisplay(classItem.schedule.dayOfWeek)} ${formatTime(classItem.schedule.startTime)}-${formatTime(classItem.schedule.endTime)}`,
      classItem.capacity,
      classItem.currentEnrollmentCount || 0,
      classItem.status,
      `${classItem.price} DZD`
    ]);
    
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `classes_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
                  placeholder="Search by class name, teacher, or room..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors w-full sm:w-80"
              />
            </div>
            
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
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
                onClick={() => {
                  setEditingClass(null);
                  setIsCreateModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
                Create Class
            </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex justify-center items-center bg-white rounded-lg p-8 shadow-sm border">
            <Loader className="animate-spin text-blue-500 mr-3" />
            <span className="text-gray-600">Loading classes...</span>
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
            {filteredClasses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Class Details
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Schedule
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Capacity & Enrollment
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredClasses.map((classItem) => (
                      <tr key={classItem._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-semibold">
                              <BookOpen className="w-5 h-5" />
                            </div>
                      <div className="flex-1">
                              <div className="font-medium text-gray-900">{classItem.name}</div>
                              <div className="text-sm text-gray-500 mt-1">
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {classItem.teacherId?.firstName} {classItem.teacherId?.lastName}
                      </div>
                                <div className="flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  {classItem.roomId?.name}
                    </div>
                  </div>
                              <div className="text-sm font-medium text-gray-900 mt-1">

                                ${classItem.price} DZD per {classItem.paymentCycle} session{classItem.paymentCycle > 1 ? 's' : ''}
                      </div>
                    </div>
                      </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-2">
                            {classItem.schedules?.map((schedule, index) => (
                              <div key={index}>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-blue-500" />
                                  <span className="text-sm font-medium text-gray-900">
                                    {getDayDisplay(schedule.dayOfWeek)}
                      </span>
                    </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Clock className="w-4 h-4 text-green-500" />
                                  <span className="text-sm text-gray-600">
                                    {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                        </span>
                      </div>
                    </div>
                            ))}
                      </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-purple-500" />
                            <span className="text-sm text-gray-900">
                              {classItem.currentEnrollmentCount || 0} / {classItem.capacity}
                      </span>
                    </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${classItem.enrollmentPercentage || 0}%` }}
                            ></div>
                    </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {classItem.enrollmentPercentage || 0}% full
                  </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border ${getStatusBadge(classItem.status)}`}>
                            {classItem.status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {classItem.status === 'cancelled' && <XCircle className="w-3 h-3 mr-1" />}
                            {classItem.status.charAt(0).toUpperCase() + classItem.status.slice(1)}
                      </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                    <button
                              onClick={() => {
                                if (typeof onNavigateToAttendance === 'function') {
                                  onNavigateToAttendance(classItem._id);
                                } else {
                                  setSelectedClass(classItem);
                                }
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors border border-transparent hover:border-blue-200"
                              title="Open Attendance Roster"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">Attendance</span>
                    </button>
                    <button
                              onClick={() => setEditClassId(classItem._id)}
                              className="p-1.5 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                              title="Edit Class"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                              onClick={() => handleDelete(classItem._id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete Class"
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
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No classes found
                </h3>
                <p className="text-gray-600 max-w-sm mx-auto">
                  {searchTerm 
                    ? 'Try adjusting your search criteria.' 
                    : 'Get started by creating your first class.'
                  }
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => {
                      setEditingClass(null);
                      setIsCreateModalOpen(true);
                    }}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Create First Class
                  </button>
                )}
              </div>
            )}
                  </div>
                )}

        {/* Class Creation/Edit Modal */}
        {isCreateModalOpen && (
          <ClassCreationModal
            isOpen={isCreateModalOpen}
            editMode={!!editingClass}
            classData={editingClass}
            onClose={() => {
              setIsCreateModalOpen(false);
              setEditingClass(null);
            }}
            onSuccess={(updatedClass) => {
              if (editingClass) {
                // Update existing class in list
                setClasses(classes.map(c => c._id === updatedClass._id ? updatedClass : c));
              } else {
                // Add new class to list
                setClasses([updatedClass, ...classes]);
              }
              setIsCreateModalOpen(false);
              setEditingClass(null);
            }}
          />
        )}

        {/* Simple side panel for class actions */}
        {selectedClass && (
          <div className="fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedClass(null)} />
            <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-lg font-semibold">{selectedClass.name}</div>
                  <div className="text-sm text-gray-500">Manage attendance and payments</div>
                </div>
                <button onClick={() => setSelectedClass(null)} className="text-gray-600 hover:text-gray-800">Close</button>
              </div>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Attendance Roster</h3>
                    <input type="date" value={rosterDate} onChange={e=>setRosterDate(e.target.value)} className="border rounded px-2 py-1" />
                  </div>
                  <AttendanceRoster classId={selectedClass._id} date={rosterDate} />
                </div>
                {/* Payments panel removed per product decision; payments inline via roster and profile */}
              </div>
            </div>
          </div>
        )}

        {/* Edit Class Modal */}
        {editClassId && (
          <ClassEditModal
            isOpen={!!editClassId}
            classId={editClassId}
            onClose={() => setEditClassId('')}
            onSuccess={(updated)=>{
              setClasses(prev=>prev.map(c=>c._id===updated._id? updated : c));
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ClassesTab;