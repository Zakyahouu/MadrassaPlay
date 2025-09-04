import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Users, 
  MapPin, 
  BookOpen, 
  Calendar,
  X,
  Info,
  Filter,
  Search,
  Eye,
  Edit3
} from 'lucide-react';
import axios from 'axios';

const ManagerTimetable = () => {
  const [classes, setClasses] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterTeacher, setFilterTeacher] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [teachers, setTeachers] = useState([]);

  // Generate time slots from 8 AM to 8 PM in 2-hour intervals
  const timeSlots = [
    { start: '08:00', end: '10:00', label: '8:00 AM - 10:00 AM', period: 'Morning' },
    { start: '10:00', end: '12:00', label: '10:00 AM - 12:00 PM', period: 'Morning' },
    { start: '12:00', end: '14:00', label: '12:00 PM - 2:00 PM', period: 'Afternoon' },
    { start: '14:00', end: '16:00', label: '2:00 PM - 4:00 PM', period: 'Afternoon' },
    { start: '16:00', end: '18:00', label: '4:00 PM - 6:00 PM', period: 'Evening' },
    { start: '18:00', end: '20:00', label: '6:00 PM - 8:00 PM', period: 'Evening' }
  ];

  // Days of the week (Saturday to Friday as per your requirement)
  const daysOfWeek = [
    { key: 'saturday', name: 'Saturday', short: 'Sat', color: 'bg-blue-50 border-blue-200' },
    { key: 'sunday', name: 'Sunday', short: 'Sun', color: 'bg-green-50 border-green-200' },
    { key: 'monday', name: 'Monday', short: 'Mon', color: 'bg-purple-50 border-purple-200' },
    { key: 'tuesday', name: 'Tuesday', short: 'Tue', color: 'bg-orange-50 border-orange-200' },
    { key: 'wednesday', name: 'Wednesday', short: 'Wed', color: 'bg-red-50 border-red-200' },
    { key: 'thursday', name: 'Thursday', short: 'Thu', color: 'bg-indigo-50 border-indigo-200' },
    { key: 'friday', name: 'Friday', short: 'Fri', color: 'bg-pink-50 border-pink-200' }
  ];

  // Class type colors
  const getClassTypeColor = (type) => {
    const colors = {
      'supportLessons': 'bg-blue-100 border-blue-300 text-blue-800',
      'reviewCourses': 'bg-green-100 border-green-300 text-green-800',
      'vocationalTrainings': 'bg-purple-100 border-purple-300 text-purple-800',
      'languages': 'bg-orange-100 border-orange-300 text-orange-800',
      'otherActivities': 'bg-gray-100 border-gray-300 text-gray-800'
    };
    return colors[type] || colors['otherActivities'];
  };

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      // Fetch all classes for the school
      const response = await axios.get('/api/classes');
      setClasses(response.data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      // For demo purposes, use mock data
      setClasses(mockClasses);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await axios.get('/api/classes/available-teachers');
      setTeachers(response.data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setTeachers([]);
    }
  };

  // Mock data for demonstration
  const mockClasses = [
    {
      _id: '1',
      name: 'Advanced Mathematics',
      catalogItem: { type: 'reviewCourses' },
      teacherId: { _id: 'teacher1', firstName: 'Ahmed', lastName: 'Hassan' },
      roomId: { name: 'Room 101', capacity: 25 },
      capacity: 25,
      status: 'active',
      schedules: [
        { dayOfWeek: 'saturday', startTime: '08:00', endTime: '10:00' },
        { dayOfWeek: 'monday', startTime: '08:00', endTime: '10:00' },
        { dayOfWeek: 'wednesday', startTime: '08:00', endTime: '10:00' }
      ]
    },
    {
      _id: '2',
      name: 'English Literature',
      catalogItem: { type: 'languages' },
      teacherId: { _id: 'teacher2', firstName: 'Fatima', lastName: 'Ali' },
      roomId: { name: 'Room 102', capacity: 20 },
      capacity: 20,
      status: 'active',
      schedules: [
        { dayOfWeek: 'saturday', startTime: '10:00', endTime: '12:00' },
        { dayOfWeek: 'tuesday', startTime: '10:00', endTime: '12:00' },
        { dayOfWeek: 'thursday', startTime: '10:00', endTime: '12:00' }
      ]
    },
    {
      _id: '3',
      name: 'Science Lab',
      catalogItem: { type: 'supportLessons' },
      teacherId: { _id: 'teacher3', firstName: 'Omar', lastName: 'Khalil' },
      roomId: { name: 'Lab 201', capacity: 15 },
      capacity: 15,
      status: 'active',
      schedules: [
        { dayOfWeek: 'sunday', startTime: '14:00', endTime: '16:00' },
        { dayOfWeek: 'tuesday', startTime: '14:00', endTime: '16:00' }
      ]
    },
    {
      _id: '4',
      name: 'Computer Programming',
      catalogItem: { type: 'vocationalTrainings' },
      teacherId: { _id: 'teacher4', firstName: 'Layla', lastName: 'Mohammed' },
      roomId: { name: 'Computer Lab', capacity: 18 },
      capacity: 18,
      status: 'active',
      schedules: [
        { dayOfWeek: 'monday', startTime: '16:00', endTime: '18:00' },
        { dayOfWeek: 'wednesday', startTime: '16:00', endTime: '18:00' }
      ]
    },
    {
      _id: '5',
      name: 'Art & Creativity',
      catalogItem: { type: 'otherActivities' },
      teacherId: { _id: 'teacher5', firstName: 'Youssef', lastName: 'Ibrahim' },
      roomId: { name: 'Art Studio', capacity: 12 },
      capacity: 12,
      status: 'active',
      schedules: [
        { dayOfWeek: 'friday', startTime: '18:00', endTime: '20:00' }
      ]
    },
    {
      _id: '6',
      name: 'Physics Fundamentals',
      catalogItem: { type: 'reviewCourses' },
      teacherId: { _id: 'teacher6', firstName: 'Nour', lastName: 'El-Din' },
      roomId: { name: 'Room 103', capacity: 22 },
      capacity: 22,
      status: 'active',
      schedules: [
        { dayOfWeek: 'saturday', startTime: '14:00', endTime: '16:00' },
        { dayOfWeek: 'thursday', startTime: '14:00', endTime: '16:00' }
      ]
    }
  ];

  const getClassesForTimeSlot = (day, timeSlot) => {
    return classes.filter(cls => {
      return cls.schedules.some(schedule => {
        const scheduleStart = schedule.startTime;
        const scheduleEnd = schedule.endTime;
        const slotStart = timeSlot.start;
        const slotEnd = timeSlot.end;
        
        return schedule.dayOfWeek === day.key && 
               scheduleStart === slotStart && 
               scheduleEnd === slotEnd;
      });
    });
  };

  const handleSessionClick = (day, timeSlot, classesInSlot) => {
    if (classesInSlot.length > 0) {
      setSelectedSession({ day, timeSlot, classes: classesInSlot });
    }
  };

  const closeSessionModal = () => {
    setSelectedSession(null);
  };

  // Filter classes based on search and filters
  const filteredClasses = classes.filter(cls => {
    const matchesType = filterType === 'all' || cls.catalogItem?.type === filterType;
    const matchesTeacher = filterTeacher === 'all' || cls.teacherId?._id === filterTeacher;
    const matchesSearch = !searchTerm || 
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${cls.teacherId?.firstName} ${cls.teacherId?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.roomId?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesTeacher && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Loading timetable...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Timetable</h1>
          <p className="text-gray-600">View and manage all class schedules across the school</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search classes, teachers, rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class Type:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="supportLessons">Support Lessons</option>
                <option value="reviewCourses">Review Courses</option>
                <option value="vocationalTrainings">Vocational Training</option>
                <option value="languages">Languages</option>
                <option value="otherActivities">Other Activities</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teacher:</label>
              <select
                value={filterTeacher}
                onChange={(e) => setFilterTeacher(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Teachers</option>
                {teachers.map(teacher => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.firstName} {teacher.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Timetable Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header Row */}
        <div className="grid grid-cols-8 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-200">
          <div className="p-4 border-r border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Time</h3>
          </div>
          {daysOfWeek.map((day) => (
            <div key={day.key} className={`p-4 border-r border-gray-200 last:border-r-0 ${day.color}`}>
              <h3 className="text-sm font-medium text-gray-900">{day.short}</h3>
              <p className="text-xs text-gray-500">{day.name}</p>
            </div>
          ))}
        </div>

        {/* Time Slots */}
        {timeSlots.map((timeSlot) => (
          <div key={timeSlot.start} className="grid grid-cols-8 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
            {/* Time Column */}
            <div className="p-4 border-r border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{timeSlot.start}</p>
                  <p className="text-xs text-gray-500">{timeSlot.end}</p>
                  <p className="text-xs text-gray-400">{timeSlot.period}</p>
                </div>
              </div>
            </div>

            {/* Day Columns */}
            {daysOfWeek.map((day) => {
              const classesInSlot = getClassesForTimeSlot(day, timeSlot);
              const hasClasses = classesInSlot.length > 0;
              
              return (
                <div key={day.key} className="p-2 border-r border-gray-200 last:border-r-0">
                  {hasClasses ? (
                    <button
                      onClick={() => handleSessionClick(day, timeSlot, classesInSlot)}
                      className="w-full p-3 bg-white border-2 border-indigo-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 hover:shadow-md transition-all duration-200 text-left group cursor-pointer"
                    >
                      {classesInSlot.map((cls, index) => (
                        <div key={cls._id} className="space-y-2 mb-3 last:mb-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-indigo-900 truncate font-semibold">
                              {cls.name}
                            </h4>
                            <Info className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-xs text-indigo-600">
                              <Users className="w-3 h-3" />
                              <span className="truncate">{cls.teacherId?.firstName} {cls.teacherId?.lastName}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2 text-xs text-indigo-500">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{cls.roomId?.name || 'Room TBD'}</span>
                            </div>
                            
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${getClassTypeColor(cls.catalogItem?.type)}`}>
                              {cls.catalogItem?.type?.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </button>
                  ) : (
                    <div className="w-full h-full min-h-[100px] flex items-center justify-center">
                      <span className="text-xs text-gray-400">No classes</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Session Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedSession.day.name} - {selectedSession.timeSlot.label}
                </h2>
                <p className="text-sm text-gray-600">
                  Class Details and Information
                </p>
              </div>
              <button
                onClick={closeSessionModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {selectedSession.classes.map((cls) => (
                <div key={cls._id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{cls.name}</h3>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getClassTypeColor(cls.catalogItem?.type)}`}>
                      {cls.catalogItem?.type?.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {cls.teacherId?.firstName} {cls.teacherId?.lastName}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {cls.roomId?.name || 'Room TBD'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {selectedSession.timeSlot.start} - {selectedSession.timeSlot.end}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {cls.schedules?.length || 0} sessions/week
                      </span>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Weekly Schedule</h4>
                    <div className="flex flex-wrap gap-2">
                      {cls.schedules?.map((schedule, index) => (
                        <span
                          key={index}
                          className={`px-3 py-2 text-xs rounded-md font-medium ${
                            schedule.dayOfWeek === selectedSession.day.key
                              ? 'bg-indigo-100 text-indigo-800 border-2 border-indigo-300'
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}
                        >
                          {daysOfWeek.find(d => d.key === schedule.dayOfWeek)?.short} {schedule.startTime}-{schedule.endTime}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-200 space-x-3 bg-gray-50">
              <button
                onClick={closeSessionModal}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>View Details</span>
              </button>
              <button className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors flex items-center space-x-2">
                <Edit3 className="w-4 h-4" />
                <span>Edit Schedule</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerTimetable;
