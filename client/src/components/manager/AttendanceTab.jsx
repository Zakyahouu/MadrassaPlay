import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, Users, AlertTriangle, Search, Filter, UserCheck, QrCode } from 'lucide-react';
import AttendanceRoster from './AttendanceRoster';
import AttendanceStudentPopup from './AttendanceStudentPopup';

const AttendanceTab = ({ initialClassId = '' }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClassId, setSelectedClassId] = useState(initialClassId);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [scanCode, setScanCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
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
        setError(e?.response?.data?.message || 'Failed to load classes');
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
      alert(e?.response?.data?.message || 'Student not found');
    } finally {
      setScanCode('');
    }
  };

  const openPopupFromSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const { data } = await axios.get('/api/students/search', { params: { q: searchQuery.trim() } });
      const s = Array.isArray(data) ? data[0] : null;
      if (!s) return alert('No students found');
      const enr = await axios.get(`/api/enrollments/student/${s._id}`);
      setPopupStudent(s);
      setPopupEnrollments(Array.isArray(enr.data) ? enr.data.filter(e=>e.status==='active') : []);
      setPopupOpen(true);
    } catch (e) {
      alert(e?.response?.data?.message || 'Search failed');
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
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <UserCheck className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-sm text-gray-600">Track and manage student attendance</p>
        </div>
      </div>

      {/* Controls Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600" />
            Attendance Controls
          </h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Class and Date Selection */}
            <div className="lg:col-span-1 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Select Class</label>
                <div className="relative">
                  <select
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none cursor-pointer"
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
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <input 
                    id="todayOnly" 
                    type="checkbox" 
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                    checked={todayOnly} 
                    onChange={(e)=>setTodayOnly(e.target.checked)} 
                  />
                  <label htmlFor="todayOnly" className="text-sm font-medium text-gray-700">
                    Show only classes with sessions today
                  </label>
                </div>
              </div>
            </div>

            {/* Student Lookup Section */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Scan Code */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-blue-600" />
                    Scan Student Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      placeholder="Scan or type student code…"
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={scanCode}
                      onChange={(e)=>setScanCode(e.target.value)}
                      onKeyDown={(e)=>{ if (e.key==='Enter') openPopupFromScan(); }}
                    />
                    <button 
                      onClick={openPopupFromScan} 
                      className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
                    >
                      Open
                    </button>
                  </div>
                </div>

                {/* Search Student */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Search className="w-4 h-4 text-green-600" />
                    Search Student
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        placeholder="Name, email, or code…"
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        value={searchQuery}
                        onChange={(e)=>setSearchQuery(e.target.value)}
                        onKeyDown={(e)=>{ if (e.key==='Enter') openPopupFromSearch(); }}
                      />
                    </div>
                    <button 
                      onClick={openPopupFromSearch} 
                      className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-medium"
                    >
                      Search
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-center gap-3 text-gray-600">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <Users className="w-5 h-5" />
            <span className="font-medium">Loading classes…</span>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-800">Error Loading Classes</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      ) : !selectedClassId ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Class Selected</h3>
            <p className="text-gray-600">Please select a class from the dropdown above to view and manage attendance.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-green-600" />
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