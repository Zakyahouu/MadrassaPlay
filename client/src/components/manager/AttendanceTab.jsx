import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { Calendar, Users, AlertTriangle, Search, Filter, UserCheck, QrCode } from 'lucide-react';
import AttendanceRoster from './AttendanceRoster';
import AttendanceStudentPopup from './AttendanceStudentPopup';

const AttendanceTab = ({ initialClassId = '' }) => {
  const { t } = useLanguage();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClassId, setSelectedClassId] = useState(initialClassId);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [scanCode, setScanCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupStudent, setPopupStudent] = useState(null);
  const [popupEnrollments, setPopupEnrollments] = useState([]);
  const [todayOnly, setTodayOnly] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await axios.get('/api/classes');
        setClasses(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e?.response?.data?.message || t('failed-load-classes'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Listen for navigation from Classes tab to set selected class
  useEffect(() => {
    const handler = (e) => {
      const { classId } = e.detail || {};
      if (classId) setSelectedClassId(classId);
    };
    window.addEventListener('attendance:setSelectedClass', handler);
    return () => window.removeEventListener('attendance:setSelectedClass', handler);
  }, []);

  const openPopupFromScan = async () => {
    if (!scanCode.trim()) return;
    try {
      const { data } = await axios.get(`/api/students/scan/${encodeURIComponent(scanCode.trim())}`);
      setPopupStudent(data.student);
      setPopupEnrollments(Array.isArray(data.enrollments) ? data.enrollments : []);
      setPopupOpen(true);
    } catch (e) {
      alert(e?.response?.data?.message || t('student-not-found'));
    } finally {
      setScanCode('');
    }
  };

  const searchStudents = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    try {
      setSearchLoading(true);
      console.log('Searching for:', searchQuery.trim());
      const { data } = await axios.get('/api/students/search', { params: { q: searchQuery.trim() } });
      console.log('Search API response:', data);
      setSearchResults(Array.isArray(data) ? data : []);
      setShowSearchResults(true);
    } catch (e) {
      console.error('Search error:', e);
      setSearchResults([]);
      setShowSearchResults(false);
      alert(e?.response?.data?.message || t('search-failed'));
    } finally {
      setSearchLoading(false);
    }
  };

  const openStudentPopup = async (student) => {
    try {
      console.log('Opening popup for student:', student);
      const enr = await axios.get(`/api/enrollments/student/${student._id}`);
      console.log('Student enrollments:', enr.data);
      setPopupStudent(student);
      setPopupEnrollments(Array.isArray(enr.data) ? enr.data : []);
      setPopupOpen(true);
      setShowSearchResults(false);
    } catch (e) {
      console.error('Error loading student data:', e);
      alert(t('failed-load-student-data'));
    }
  };

  // Allow roster to request opening the popup by dispatching a window event
  useEffect(() => {
    const handler = async (e) => {
      try {
        const { student } = e.detail || {};
        if (!student?._id) return;
        const enr = await axios.get(`/api/enrollments/student/${student._id}`);
        setPopupStudent(student);
        setPopupEnrollments(Array.isArray(enr.data) ? enr.data.filter(x=>x.status==='active') : []);
        setPopupOpen(true);
      } catch (_) {}
    };
    window.addEventListener('attendance:openStudentPopup', handler);
    return () => window.removeEventListener('attendance:openStudentPopup', handler);
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <UserCheck className="w-6 h-6 text-gray-700" />
        <div>
          <h1 className="text-2xl font-medium text-gray-900">{t('attendance-management')}</h1>
          <p className="text-sm text-gray-500">{t('track-manage-student-attendance')}</p>
        </div>
      </div>

      {/* Controls Panel */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Class and Date Selection */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('select-class')}</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Choose a class…</option>
                  {classes
                    .filter((c) => {
                      if (!todayOnly) return true;
                      const schedules = Array.isArray(c.schedules) ? c.schedules : [];
                      const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
                      const today = days[new Date().getDay()];
                      return schedules.some(s => s.dayOfWeek === today);
                    })
                    .map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <input 
                  id="todayOnly" 
                  type="checkbox" 
                  className="h-4 w-4 rounded border-gray-300 focus:ring-1 focus:ring-gray-400" 
                  checked={todayOnly} 
                  onChange={(e)=>setTodayOnly(e.target.checked)} 
                />
                <label htmlFor="todayOnly" className="text-sm text-gray-700">
                  Show only classes with sessions today
                </label>
              </div>
            </div>

            {/* Student Lookup Section */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Scan Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <QrCode className="w-4 h-4" />
                  {t('scan-student-code')}
                </label>
                <div className="flex gap-2">
                  <input
                    placeholder={t('scan-type-student-code')}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    value={scanCode}
                    onChange={(e)=>setScanCode(e.target.value)}
                    onKeyDown={(e)=>{ if (e.key==='Enter') openPopupFromScan(); }}
                  />
                  <button 
                    onClick={openPopupFromScan} 
                    className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400"
                  >
                    Open
                  </button>
                </div>
              </div>

              {/* Search Student */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  {t('search-student')}
                </label>
                <div className="flex gap-2">
                  <input
                    placeholder="Name, email, or code…"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    value={searchQuery}
                    onChange={(e)=>{
                      setSearchQuery(e.target.value);
                      if (!e.target.value.trim()) {
                        setSearchResults([]);
                        setShowSearchResults(false);
                      }
                    }}
                    onKeyDown={(e)=>{ if (e.key==='Enter') searchStudents(); }}
                  />
                  <button 
                    onClick={searchStudents}
                    disabled={searchLoading}
                    className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {searchLoading ? t('searching') : t('search')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {showSearchResults && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-medium text-gray-900">{t('search-results')}</h2>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                {t('found', { count: searchResults.length })}
              </span>
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
                setShowSearchResults(false);
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
          <div className="p-6">
            {searchLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-gray-700"></div>
                <span className="ml-2 text-sm text-gray-600">{t('searching')}</span>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">{t('no-students-found')}</h3>
                <p className="text-gray-500">{t('no-students-match-search')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((student) => (
                  <div
                    key={student._id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                    onClick={() => openStudentPopup(student)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {`${student.firstName || ''} ${student.lastName || ''}`.trim() || student.name}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          {student.studentCode && (
                            <span className="flex items-center gap-1">
                              <QrCode className="w-3 h-3" />
                              {student.studentCode}
                            </span>
                          )}
                          {student.email && <span>{student.email}</span>}
                        </div>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <div className="flex items-center justify-center gap-3 text-gray-600">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-gray-700"></div>
            <span className="text-sm">Loading classes…</span>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white border border-red-200 rounded-lg p-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="font-medium text-red-800">{t('error-loading-classes')}</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      ) : !selectedClassId ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12">
          <div className="text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('no-class-selected')}</h3>
            <p className="text-gray-500">{t('please-select-class-dropdown')}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Attendance Roster
            </h2>
          </div>
          <div className="p-6">
            <AttendanceRoster classId={selectedClassId} date={date} />
          </div>
        </div>
      )}

      {/* Student Popup */}
      {popupOpen && (
        <AttendanceStudentPopup
          isOpen={popupOpen}
          onClose={() => setPopupOpen(false)}
          student={popupStudent}
          initialEnrollments={popupEnrollments}
        />
      )}
    </div>
  );
};

export default AttendanceTab;