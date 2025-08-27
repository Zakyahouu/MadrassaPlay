import React, { useState, useEffect } from 'react';
import { 
  X, BookOpen, User, Building2, Calendar, Clock, Users, 
  CreditCard, DollarSign, AlertTriangle, CheckCircle, Loader,
  ChevronDown, ChevronRight
} from 'lucide-react';
import axios from 'axios';

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

const ClassCreationModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conflictError, setConflictError] = useState(null);
  
  // Data fetching states
  const [catalogItems, setCatalogItems] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    catalogItem: null,
    teacherId: '',
    roomId: '',
    schedule: {
      dayOfWeek: 'monday',
      startTime: '09:00',
      endTime: '10:00'
    },
    capacity: '',
    enrollmentPeriod: {
      startDate: '',
      endDate: ''
    },
    paymentCycle: 4,
    price: '',
    teacherCut: {
      mode: 'percentage',
      value: 20
    },
    absenceRule: false,
    description: ''
  });

  // Validation states
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
      // Set default dates
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
      setFormData(prev => ({
        ...prev,
        enrollmentPeriod: {
          startDate: today.toISOString().split('T')[0],
          endDate: nextMonth.toISOString().split('T')[0]
        }
      }));
    }
  }, [isOpen]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    const token = getAuthToken();
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      const [catalogRes, teachersRes, roomsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/catalog-items`, config),
        axios.get(`${API_BASE_URL}/available-teachers`, config),
        axios.get(`${API_BASE_URL}/available-rooms`, config)
      ]);

      setCatalogItems(catalogRes.data);
      setTeachers(teachersRes.data);
      setRooms(roomsRes.data);
    } catch (err) {
      setError('Failed to load required data. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const validateStep = (currentStep) => {
    const errors = {};

    if (currentStep === 1) {
      if (!formData.catalogItem) {
        errors.catalogItem = 'Please select a catalog item';
      }
    }

    if (currentStep === 2) {
      if (!formData.teacherId) {
        errors.teacherId = 'Please select a teacher';
      }
      if (!formData.roomId) {
        errors.roomId = 'Please select a room';
      }
      if (!formData.capacity || formData.capacity < 1) {
        errors.capacity = 'Capacity must be at least 1';
      }
    }

    if (currentStep === 3) {
      if (!formData.schedule.startTime) {
        errors.startTime = 'Start time is required';
      }
      if (!formData.schedule.endTime) {
        errors.endTime = 'End time is required';
      }
      if (formData.schedule.startTime >= formData.schedule.endTime) {
        errors.endTime = 'End time must be after start time';
      }
    }

    if (currentStep === 4) {
      if (!formData.name) {
        errors.name = 'Class name is required';
      }
      if (!formData.price || formData.price < 0) {
        errors.price = 'Price must be greater than 0';
      }
      if (!formData.enrollmentPeriod.startDate) {
        errors.startDate = 'Enrollment start date is required';
      }
      if (!formData.enrollmentPeriod.endDate) {
        errors.endDate = 'Enrollment end date is required';
      }
      if (new Date(formData.enrollmentPeriod.startDate) >= new Date(formData.enrollmentPeriod.endDate)) {
        errors.endDate = 'Enrollment end date must be after start date';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkConflicts = async () => {
    if (!formData.teacherId || !formData.roomId || !formData.schedule.dayOfWeek) {
      return;
    }

    const token = getAuthToken();
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      const response = await axios.post(`${API_BASE_URL}/check-conflicts`, {
        schedule: formData.schedule,
        teacherId: formData.teacherId,
        roomId: formData.roomId
      }, config);

      if (response.data.hasConflict) {
        setConflictError(response.data.message);
      } else {
        setConflictError(null);
      }
    } catch (err) {
      console.error('Error checking conflicts:', err);
    }
  };

  useEffect(() => {
    if (formData.teacherId && formData.roomId && formData.schedule.dayOfWeek) {
      checkConflicts();
    }
  }, [formData.teacherId, formData.roomId, formData.schedule]);

  const handleCatalogItemSelect = (item) => {
    setFormData(prev => ({
      ...prev,
      catalogItem: item,
      name: item.name // Auto-populate class name
    }));
    setValidationErrors(prev => ({ ...prev, catalogItem: null }));
  };

  const handleTeacherSelect = (teacherId) => {
    setFormData(prev => ({ ...prev, teacherId }));
    setValidationErrors(prev => ({ ...prev, teacherId: null }));
  };

  const handleRoomSelect = (roomId) => {
    const selectedRoom = rooms.find(room => room._id === roomId);
    setFormData(prev => ({ 
      ...prev, 
      roomId,
      capacity: selectedRoom ? selectedRoom.capacity.toString() : ''
    }));
    setValidationErrors(prev => ({ ...prev, roomId: null }));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      return;
    }

    if (conflictError) {
      setError('Please resolve scheduling conflicts before creating the class.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const token = getAuthToken();
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const payload = {
      ...formData,
      name: formData.name.substring(0, 100), // Limit name to 100 characters
      catalogItem: {
        type: formData.catalogItem.type,
        itemId: formData.catalogItem._id
      },
      capacity: parseInt(formData.capacity),
      price: parseFloat(formData.price),
      teacherCut: {
        ...formData.teacherCut,
        value: parseFloat(formData.teacherCut.value)
      }
    };

    try {
      const response = await axios.post(API_BASE_URL, payload, config);
      onSuccess(response.data.class);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create class.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
      setValidationErrors({});
    }
  };

  const prevStep = () => {
    setStep(step - 1);
    setValidationErrors({});
  };

  const getStepTitle = (stepNumber) => {
    const titles = {
      1: 'Select Catalog Item',
      2: 'Assign Teacher & Room',
      3: 'Set Schedule',
      4: 'Class Details & Pricing'
    };
    return titles[stepNumber] || '';
  };

  const getStepIcon = (stepNumber) => {
    const icons = {
      1: BookOpen,
      2: Users,
      3: Calendar,
      4: CreditCard
    };
    return icons[stepNumber] || null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gray-50 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Create New Class</h2>
            <p className="text-sm text-gray-600 mt-1">Step {step} of 4: {getStepTitle(step)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex justify-between px-6 py-4">
            {[1, 2, 3, 4].map((stepNumber) => {
              const Icon = getStepIcon(stepNumber);
              const isActive = step === stepNumber;
              const isCompleted = step > stepNumber;
              
              return (
                <div key={stepNumber} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    isActive ? 'border-blue-500 bg-blue-500 text-white' :
                    isCompleted ? 'border-green-500 bg-green-500 text-white' :
                    'border-gray-300 bg-gray-100 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <span className="text-sm font-medium">{stepNumber}</span>
                    )}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {getStepTitle(stepNumber)}
                  </span>
                  {stepNumber < 4 && (
                    <div className="w-16 h-px bg-gray-300 mx-4"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {isLoading && step === 1 ? (
            <div className="flex justify-center items-center py-12">
              <Loader className="animate-spin text-blue-500 mr-3" />
              <span className="text-gray-600">Loading data...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 mb-6">
              <AlertTriangle className="text-red-500 w-5 h-5" />
              <div>
                <h3 className="font-medium text-red-800">Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          ) : null}

          {/* Step 1: Catalog Item Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Select from School Catalog
                </h3>
                <p className="text-gray-600 mb-6">
                  Choose an offering from your school catalog to create a class based on it.
                </p>
              </div>

              {/* Search and Filter */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {catalogItems.map((item) => (
                  <div
                    key={`${item.type}-${item._id}`}
                    onClick={() => handleCatalogItemSelect(item)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.catalogItem?._id === item._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        {item.type.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      {formData.catalogItem?._id === item._id && (
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {item.level && `${item.level} - ${item.grade}`}
                      {item.field && `${item.field} - ${item.specialty}`}
                      {item.language && `${item.language}`}
                      {item.activityType && `${item.activityType}`}
                    </p>
                  </div>
                ))}
              </div>

              {validationErrors.catalogItem && (
                <p className="text-red-600 text-sm">{validationErrors.catalogItem}</p>
              )}
            </div>
          )}

          {/* Step 2: Teacher & Room Assignment */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Assign Teacher & Room
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Teacher Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Teacher *
                  </label>
                  <select
                    value={formData.teacherId}
                    onChange={(e) => handleTeacherSelect(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="">Choose a teacher...</option>
                    {teachers.map((teacher) => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.firstName} {teacher.lastName} 
                        {teacher.experience && ` (${teacher.experience} years exp.)`}
                      </option>
                    ))}
                  </select>
                  {validationErrors.teacherId && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.teacherId}</p>
                  )}
                </div>

                {/* Room Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Room *
                  </label>
                  <select
                    value={formData.roomId}
                    onChange={(e) => handleRoomSelect(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="">Choose a room...</option>
                    {rooms.map((room) => (
                      <option key={room._id} value={room._id}>
                        {room.name} (Capacity: {room.capacity})
                      </option>
                    ))}
                  </select>
                  {validationErrors.roomId && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.roomId}</p>
                  )}
                </div>

                {/* Capacity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class Capacity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={rooms.find(r => r._id === formData.roomId)?.capacity || 100}
                    value={formData.capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Enter class capacity"
                  />
                  {validationErrors.capacity && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.capacity}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Schedule */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Set Class Schedule
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Day of Week */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Day of Week *
                  </label>
                  <select
                    value={formData.schedule.dayOfWeek}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      schedule: { ...prev.schedule, dayOfWeek: e.target.value }
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="monday">Monday</option>
                    <option value="tuesday">Tuesday</option>
                    <option value="wednesday">Wednesday</option>
                    <option value="thursday">Thursday</option>
                    <option value="friday">Friday</option>
                    <option value="saturday">Saturday</option>
                    <option value="sunday">Sunday</option>
                  </select>
                </div>

                {/* Start Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={formData.schedule.startTime}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      schedule: { ...prev.schedule, startTime: e.target.value }
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  {validationErrors.startTime && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.startTime}</p>
                  )}
                </div>

                {/* End Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={formData.schedule.endTime}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      schedule: { ...prev.schedule, endTime: e.target.value }
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  {validationErrors.endTime && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.endTime}</p>
                  )}
                </div>
              </div>

              {/* Conflict Warning */}
              {conflictError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                  <AlertTriangle className="text-red-500 w-5 h-5" />
                  <div>
                    <h3 className="font-medium text-red-800">Scheduling Conflict</h3>
                    <p className="text-red-700 text-sm">{conflictError}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Class Details & Pricing */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Class Details & Pricing
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Class Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Enter class name"
                  />
                  {validationErrors.name && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.name}</p>
                  )}
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price per Session *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full p-3 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  {validationErrors.price && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.price}</p>
                  )}
                </div>

                {/* Payment Cycle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Cycle (Sessions) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.paymentCycle}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentCycle: parseInt(e.target.value) }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="4"
                  />
                </div>

                {/* Teacher Cut Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teacher Cut Mode *
                  </label>
                  <select
                    value={formData.teacherCut.mode}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      teacherCut: { ...prev.teacherCut, mode: e.target.value }
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>

                {/* Teacher Cut Value */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teacher Cut Value *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step={formData.teacherCut.mode === 'percentage' ? '1' : '0.01'}
                      value={formData.teacherCut.value}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        teacherCut: { ...prev.teacherCut, value: parseFloat(e.target.value) }
                      }))}
                      className="w-full p-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder={formData.teacherCut.mode === 'percentage' ? '20' : '0.00'}
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      {formData.teacherCut.mode === 'percentage' ? '%' : '$'}
                    </span>
                  </div>
                </div>

                {/* Enrollment Period */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enrollment Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.enrollmentPeriod.startDate}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      enrollmentPeriod: { ...prev.enrollmentPeriod, startDate: e.target.value }
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  {validationErrors.startDate && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.startDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enrollment End Date *
                  </label>
                  <input
                    type="date"
                    value={formData.enrollmentPeriod.endDate}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      enrollmentPeriod: { ...prev.enrollmentPeriod, endDate: e.target.value }
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  {validationErrors.endDate && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.endDate}</p>
                  )}
                </div>
              </div>

              {/* Absence Rule */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="absenceRule"
                  checked={formData.absenceRule}
                  onChange={(e) => setFormData(prev => ({ ...prev, absenceRule: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="absenceRule" className="ml-2 text-sm text-gray-700">
                  Absence affects payment (student pays even if absent)
                </label>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Enter class description..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          
          <div className="flex gap-3">
            {step > 1 && (
              <button
                onClick={prevStep}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Previous
              </button>
            )}
            
            {step < 4 ? (
              <button
                onClick={nextStep}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isLoading || conflictError}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader className="animate-spin text-white mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Class'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassCreationModal;
