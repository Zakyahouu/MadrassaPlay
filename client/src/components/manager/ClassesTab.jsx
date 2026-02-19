import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, Edit, Trash2, Eye, Calendar, Clock, Users,
  BookOpen, Building2, User, Info, AlertTriangle, Loader, Download,
  CheckCircle, XCircle, ArrowRight, ChevronDown, ChevronRight, X
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
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
  const { t } = useLanguage();
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
  const [rosterDate, setRosterDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setIsLoading(true);
    setError(null);

    const token = getAuthToken();
    if (!token) {
      setError(t.authTokenNotFound);
      setIsLoading(false);
      return;
    }

    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      const { data } = await axios.get(API_BASE_URL, config);
      setClasses(data);
    } catch (err) {
      const message = err.response?.data?.message || t.failedFetchClasses;
      setError(message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (classId) => {
    if (!window.confirm(t.confirmDeleteClass)) {
      return;
    }

    const token = getAuthToken();
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      await axios.delete(`${API_BASE_URL}/${classId}`, config);
      setClasses(prev => prev.filter(c => c._id !== classId));
      alert(t.classDeletedSuccessfully);
    } catch (err) {
      const message = err.response?.data?.message || t.failedDeleteClass;
      alert(`${t.error}: ${message}`);
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
      monday: t.mon || 'Mon',
      tuesday: t.tue || 'Tue',
      wednesday: t.wed || 'Wed',
      thursday: t.thu || 'Thu',
      friday: t.fri || 'Fri',
      saturday: t.sat || 'Sat',
      sunday: t.sun || 'Sun'
    };
    return days[day] || day;
  };

  const formatTime = (time) => {
    if (!time || typeof time !== 'string') {
      return '';
    }
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const exportToCSV = () => {
    if (!filteredClasses.length) {
      alert(t.noClassesToExport);
      return;
    }

    const escapeCsvValue = (value) => {
      if (value === undefined || value === null) return '""';
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    };

    const formatSchedulesForCsv = (classItem) => {
      const schedulesArray = Array.isArray(classItem.schedules) && classItem.schedules.length
        ? classItem.schedules
        : classItem.schedule
          ? [classItem.schedule]
          : [];

      if (!schedulesArray.length) return '';

      return schedulesArray.map((schedule) => {
        if (!schedule) return '';
        const day = schedule.dayOfWeek ? getDayDisplay(schedule.dayOfWeek) : '';
        const start = schedule.startTime ? formatTime(schedule.startTime) : '';
        const end = schedule.endTime ? formatTime(schedule.endTime) : '';
        return `${day} ${start && end ? `${start} - ${end}` : ''}`.trim();
      }).filter(Boolean).join(' | ');
    };

    const formatDate = (value) => {
      if (!value) return '';
      try {
        return new Date(value).toLocaleDateString();
      } catch (err) {
        return value;
      }
    };

    const headers = [
      t.className,
      t.catalogItem || 'Catalog Item',
      t.type,
      t.level,
      t.teacher,
      t.email,
      t.room,
      t.schedules,
      t.capacity,
      t.enrolled,
      t.status,
      t.priceDz,
      t.cycleSessions || 'Cycle (sessions)',
      t.createdAt || 'Created At'
    ];

    const csvRows = filteredClasses.map((classItem) => {
      const teacherFullName = `${classItem.teacherId?.firstName || ''} ${classItem.teacherId?.lastName || ''}`.trim();
      const catalogName = classItem.catalogItem?.name || '';
      const catalogType = classItem.catalogItem?.type || '';
      const level = classItem.catalogItem?.level || classItem.level || '';

      return [
        classItem.name || '',
        catalogName,
        catalogType,
        level,
        teacherFullName,
        classItem.teacherId?.email || '',
        classItem.roomId?.name || '',
        formatSchedulesForCsv(classItem),
        classItem.capacity ?? '',
        classItem.currentEnrollmentCount ?? '',
        classItem.status || '',
        typeof classItem.price === 'number' ? formatDZ(classItem.price) : (classItem.price ?? ''),
        classItem.paymentCycle ?? '',
        formatDate(classItem.createdAt)
      ].map(escapeCsvValue).join(',');
    });

    const csvContent = [headers.map(escapeCsvValue).join(','), ...csvRows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
        <div className="card-base p-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={t.searchClassTeacherRoom}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors w-full sm:w-80"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              >
                <option value="all">{t.allStatus}</option>
                <option value="active">{t.active}</option>
                <option value="inactive">{t.inactive}</option>
                <option value="cancelled">{t.cancelled}</option>
                <option value="completed">{t.completed}</option>
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
                onClick={() => {
                  setEditingClass(null);
                  setIsCreateModalOpen(true);
                }}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {t.createClass}
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex justify-center items-center bg-white rounded-lg p-8 shadow-sm border">
            <Loader className="animate-spin text-blue-500 mr-3" />
            <span className="text-gray-600">{t.loadingClasses}</span>
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
            {filteredClasses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50 border-b border-border-light">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted-light uppercase tracking-wider">
                        {t.classDetails}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted-light uppercase tracking-wider">
                        {t.room}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted-light uppercase tracking-wider">
                        {t.enrollment}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted-light uppercase tracking-wider">
                        {t.status}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-text-muted-light uppercase tracking-wider">
                        {t.actions}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {filteredClasses.map((classItem) => (
                      <tr
                        key={classItem._id}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => setSelectedClass(classItem)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-semibold">
                              <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-medium text-text-main-light">{classItem.name}</div>
                              <div className="text-sm text-text-muted-light mt-1">
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {classItem.teacherId?.firstName} {classItem.teacherId?.lastName}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-sm text-text-main-light">
                            <Building2 className="w-3 h-3 text-gray-400" />
                            {classItem.roomId?.name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-slate-200 rounded-full h-1.5">
                              <div
                                className="bg-primary h-1.5 rounded-full transition-all"
                                style={{ width: `${classItem.enrollmentPercentage || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-text-muted-light">
                              {classItem.currentEnrollmentCount || 0}/{classItem.capacity}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border ${getStatusBadge(classItem.status)}`}>
                            {classItem.status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {classItem.status === 'cancelled' && <XCircle className="w-3 h-3 mr-1" />}
                            {t[classItem.status] || classItem.status.charAt(0).toUpperCase() + classItem.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (typeof onNavigateToAttendance === 'function') {
                                  onNavigateToAttendance(classItem._id);
                                } else {
                                  setSelectedClass(classItem);
                                }
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 text-primary hover:bg-primary/10 rounded transition-colors border border-transparent hover:border-primary/20"
                              title={t.openAttendanceRoster}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditClassId(classItem._id);
                              }}
                              className="p-1.5 text-text-muted-light hover:bg-slate-50 rounded transition-colors"
                              title={t.editClass}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(classItem._id);
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title={t.deleteClass}
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
                  {t.noClassesFound}
                </h3>
                <p className="text-gray-600 max-w-sm mx-auto">
                  {searchTerm
                    ? t.tryAdjustingSearch
                    : t.getStartedCreateFirstClass
                  }
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => {
                      setEditingClass(null);
                      setIsCreateModalOpen(true);
                    }}
                    className="btn-primary mt-4"
                  >
                    {t.createFirstClass}
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
            existingClasses={classes}
            onClose={() => {
              setIsCreateModalOpen(false);
              setEditingClass(null);
            }}
            onSuccess={(updatedClass) => {
              const isEditing = !!editingClass;
              setClasses(prev => {
                if (isEditing) {
                  return prev.map(c => (c._id === updatedClass._id ? updatedClass : c));
                }
                return [updatedClass, ...prev];
              });
              setIsCreateModalOpen(false);
              setEditingClass(null);
            }}
          />
        )}

        {/* Class Details Modal */}
        {selectedClass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedClass(null)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
              className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-white z-10">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedClass.name}</h2>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(selectedClass.status)}`}>
                          {selectedClass.status}
                        </span>
                        <span>•</span>
                        <span>{selectedClass.catalogItem?.name || 'No Course'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedClass(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8">

                {/* 1. Quick Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex flex-col">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">{t.price}</span>
                    <span className="text-xl font-bold text-blue-900">{formatDZ(selectedClass.price)}</span>
                    <span className="text-xs text-blue-500 mt-1">per {selectedClass.paymentCycle} sessions</span>
                  </div>

                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-col">
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">{t.capacity}</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-emerald-900">{selectedClass.currentEnrollmentCount}</span>
                      <span className="text-sm text-emerald-600 font-medium">/ {selectedClass.capacity}</span>
                    </div>
                    <div className="w-full bg-emerald-200 rounded-full h-1.5 mt-2">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${selectedClass.enrollmentPercentage || 0}%` }}></div>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 flex flex-col">
                    <span className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">{t.teacher}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-xs font-bold text-purple-700">
                        {selectedClass.teacherId?.firstName?.[0] || 'T'}
                      </div>
                      <span className="text-sm font-bold text-purple-900 truncate">
                        {selectedClass.teacherId?.firstName} {selectedClass.teacherId?.lastName}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex flex-col">
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">{t.room}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Building2 className="w-5 h-5 text-amber-600" />
                      <span className="text-lg font-bold text-amber-900 truncate">
                        {selectedClass.roomId?.name || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Schedule & Info Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left: Schedule */}
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2 pb-2 border-b border-gray-100">
                      <Calendar className="w-4 h-4 text-primary" /> {t.schedule}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedClass.schedules?.map((schedule, index) => (
                        <div key={index} className="flex items-center p-3 border border-gray-200 rounded-lg bg-gray-50/50">
                          <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center mr-3 shadow-sm">
                            <Calendar className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{getDayDisplay(schedule.dayOfWeek)}</div>
                            <div className="text-sm text-gray-500 font-medium">
                              {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!selectedClass.schedules || selectedClass.schedules.length === 0) && (
                        <div className="col-span-full p-8 text-center border-2 border-dashed border-gray-200 rounded-xl">
                          <p className="text-gray-500">No schedule defined for this class.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Dates & Notes */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2 pb-2 border-b border-gray-100">
                      <Info className="w-4 h-4 text-primary" /> {t.details}
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-gray-500 block mb-1">Start Date</span>
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {selectedClass.startDate ? new Date(selectedClass.startDate).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block mb-1">End Date</span>
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {selectedClass.endDate ? new Date(selectedClass.endDate).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Student List (Simplified) */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" /> {t.enrolledStudents} ({selectedClass.currentEnrollmentCount})
                    </h3>
                  </div>

                  {/* We are reusing AttendanceRoster but passing a flag/prop could simplify it, 
                      or ideally we fetch a simple list here. For now, let's keep it simple 
                      and just show links or a basic list if possible. 
                      Given the requirement: "Replace Attendance Roster with simple Student List"
                      I will implement a simple fetch here inline or use a new component.
                      For speed, I'll inline a simple list fetcher component.
                   */}
                  <ClassStudentList classId={selectedClass._id} />
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-xl z-10">
                <button
                  onClick={() => {
                    const id = selectedClass._id;
                    setSelectedClass(null);
                    setEditClassId(id);
                  }}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                >
                  {t.editClass}
                </button>
                <button
                  onClick={() => setSelectedClass(null)}
                  className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors shadow-sm"
                >
                  {t.close}
                </button>
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
            onSuccess={(updated) => {
              setClasses(prev => prev.map(c => c._id === updated._id ? updated : c));
            }}
          />
        )}
      </div>
    </div>
  );
};

// Simple internal component for the student list
const ClassStudentList = ({ classId }) => {
  const [students, setStudents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];
        const res = await axios.get(`/api/enrollments/class/${classId}/summaries`, { params: { date: today } });
        setStudents(res.data?.items || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    if (classId) fetchStudents();
  }, [classId]);

  if (loading) return <div className="py-8 text-center text-gray-500">Loading students...</div>;

  if (students.length === 0) return (
    <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
      <p className="text-gray-500">No students enrolled yet.</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
      {students.map((item) => (
        <div key={item.enrollmentId} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-primary/30 hover:shadow-sm transition-all bg-white">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold border border-gray-200">
            {item.student?.firstName?.[0]}{item.student?.lastName?.[0]}
          </div>
          <div className="overflow-hidden">
            <div className="font-medium text-gray-900 truncate" title={`${item.student?.firstName} ${item.student?.lastName}`}>
              {item.student?.firstName} {item.student?.lastName}
            </div>
            <div className="text-xs text-gray-500 truncate">
              Status: <span className={item.balance < 0 ? 'text-red-500 font-medium' : 'text-green-600'}>
                {item.balance < 0 ? 'Overdue' : 'Active'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ClassesTab;
