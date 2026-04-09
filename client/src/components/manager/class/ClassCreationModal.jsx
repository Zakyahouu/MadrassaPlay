import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X, BookOpen, User, Building2, Calendar, Clock, Users,
  CreditCard, DollarSign, AlertTriangle, CheckCircle, Loader,
  ChevronDown, ChevronRight
} from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../../../context/LanguageContext';

const API_BASE_URL = '/api/classes';
const LEVEL_FILTER_TYPES = new Set(['supportLessons', 'reviewCourses']);

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

const ClassCreationModal = ({
  isOpen,
  onClose,
  onSuccess,
  editMode = false,
  classData = null,
  existingClasses = []
}) => {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [activeSection, setActiveSection] = useState('catalog'); // For edit mode sections
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conflictError, setConflictError] = useState(null);
  const editingClassId = classData?._id || null;

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
    schedules: [{
      dayOfWeek: 'monday',
      startTime: '09:00',
      endTime: '10:00'
    }],
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

  const existingNameSet = useMemo(() => {
    const set = new Set();
    (existingClasses || []).forEach((cls) => {
      if (!cls?.name) return;
      if (editingClassId && cls._id === editingClassId) return;
      set.add(cls.name.trim().toLowerCase());
    });
    return set;
  }, [existingClasses, editingClassId]);

  const generateUniqueName = useCallback((baseName = '') => {
    const trimmed = baseName.trim();
    if (!trimmed) return '';

    if (!existingNameSet.has(trimmed.toLowerCase())) {
      return trimmed;
    }

    let counter = 2;
    let candidate = `${trimmed} (${counter})`;
    while (existingNameSet.has(candidate.toLowerCase())) {
      counter += 1;
      candidate = `${trimmed} (${counter})`;
    }
    return candidate;
  }, [existingNameSet]);

  // Edit mode sections configuration
  const editSections = [
    { id: 'catalog', label: t.catalog, icon: '📚' },
    { id: 'teacher', label: t.teacher, icon: '👨‍🏫' },
    { id: 'room', label: t.room, icon: '🏢' },
    { id: 'schedule', label: t.schedule, icon: '📅' },
    { id: 'details', label: t.details, icon: '📝' },
    { id: 'pricing', label: t.pricing, icon: '💰' }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();

      if (editMode && classData) {
        // Populate form with existing class data
        setFormData({
          name: classData.name || '',
          catalogItem: classData.catalogItem || null,
          teacherId: classData.teacherId?._id || classData.teacherId || '',
          roomId: classData.roomId?._id || classData.roomId || '',
          schedules: classData.schedules && classData.schedules.length > 0 ? classData.schedules : [{
            dayOfWeek: 'monday',
            startTime: '09:00',
            endTime: '10:00'
          }],
          capacity: classData.capacity || '',
          enrollmentPeriod: {
            startDate: classData.enrollmentPeriod?.startDate?.split('T')[0] || '',
            endDate: classData.enrollmentPeriod?.endDate?.split('T')[0] || ''
          },
          paymentCycle: classData.paymentCycle || 4,
          price: classData.price || '',
          teacherCut: classData.teacherCut || {
            mode: 'percentage',
            value: 20
          },
          absenceRule: classData.absenceRule || false,
          description: classData.description || ''
        });
      } else {
        // Set default dates for new class
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
    }
  }, [isOpen, editMode, classData]);

  // In edit mode, once catalog items are fetched, resolve the class's catalogItem to a full item object
  useEffect(() => {
    if (!editMode || !classData?.catalogItem || catalogItems.length === 0) return;
    // If current formData.catalogItem is not a full item (missing _id or name), try to resolve
    const current = formData.catalogItem;
    const needsResolution = !current || !current._id || !current.name;
    if (!needsResolution) return;
    const match = catalogItems.find(
      (it) => it.type === classData.catalogItem.type && it._id === classData.catalogItem.itemId
    );
    if (match) {
      setFormData((prev) => ({
        ...prev,
        catalogItem: match,
        // If name is empty, default it to the catalog item name; otherwise preserve user's existing name
        name: prev.name || match.name,
      }));
    }
  }, [editMode, classData, catalogItems]);

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
      if (!formData.schedules || formData.schedules.length === 0) {
        errors.schedules = 'At least one schedule is required';
      } else {
        formData.schedules.forEach((schedule, index) => {
          if (!schedule.startTime) {
            errors[`schedule${index}StartTime`] = 'Start time is required';
          }
          if (!schedule.endTime) {
            errors[`schedule${index}EndTime`] = 'End time is required';
          }
          if (schedule.startTime && schedule.endTime && schedule.startTime >= schedule.endTime) {
            errors[`schedule${index}EndTime`] = 'End time must be after start time';
          }
        });
      }
    }

    if (currentStep === 4) {
      const trimmedName = (formData.name || '').trim();
      if (!trimmedName) {
        errors.name = 'Class name is required';
      } else if (existingNameSet.has(trimmedName.toLowerCase())) {
        errors.name = 'A class with this name already exists';
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
    if (!formData.teacherId || !formData.roomId || formData.schedules.length === 0) {
      return;
    }

    const token = getAuthToken();
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      const response = await axios.post(`${API_BASE_URL}/check-conflicts`, {
        schedules: formData.schedules,
        teacherId: formData.teacherId,
        roomId: formData.roomId,
        // exclude current class in edit mode to avoid self-conflict
        excludeClassId: editMode && classData?._id ? classData._id : undefined
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
    if (formData.teacherId && formData.roomId && formData.schedules.length > 0) {
      checkConflicts();
    }
  }, [formData.teacherId, formData.roomId, formData.schedules]);

  const handleCatalogItemSelect = (item) => {
    setFormData(prev => {
      const trimmedPrevName = (prev.name || '').trim();
      const previousAutoName = prev.catalogItem ? generateUniqueName(prev.catalogItem?.name || '') : '';
      const hasCustomName = !!trimmedPrevName && (!prev.catalogItem || trimmedPrevName !== previousAutoName);
      const shouldAutoName = !editMode && (!trimmedPrevName || !hasCustomName);
      const nextName = shouldAutoName ? generateUniqueName(item?.name || '') : prev.name;

      return {
        ...prev,
        catalogItem: item,
        name: shouldAutoName ? nextName : prev.name
      };
    });
    setValidationErrors(prev => ({ ...prev, catalogItem: null, name: null }));
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

  const addSchedule = () => {
    setFormData(prev => ({
      ...prev,
      schedules: [...prev.schedules, {
        dayOfWeek: 'monday',
        startTime: '09:00',
        endTime: '10:00'
      }]
    }));
  };

  const removeSchedule = (index) => {
    if (formData.schedules.length > 1) {
      setFormData(prev => ({
        ...prev,
        schedules: prev.schedules.filter((_, i) => i !== index)
      }));
    }
  };

  const updateSchedule = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      schedules: prev.schedules.map((schedule, i) =>
        i === index ? { ...schedule, [field]: value } : schedule
      )
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      return;
    }

    if (conflictError) {
      setError('Please resolve scheduling conflicts before ' + (editMode ? 'updating' : 'creating') + ' the class.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const token = getAuthToken();
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const trimmedName = (formData.name || '').trim();

    const payload = {
      ...formData,
      name: trimmedName.substring(0, 100), // Limit name to 100 characters
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
      let response;
      if (editMode) {
        // Update existing class
        response = await axios.put(`${API_BASE_URL}/${classData._id}`, payload, config);
      } else {
        // Create new class
        response = await axios.post(API_BASE_URL, payload, config);
      }
      onSuccess(response.data.class);
    } catch (err) {
      const message = err.response?.data?.message || `Failed to ${editMode ? 'update' : 'create'} class.`;
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Save individual section (for edit mode)
  const saveSection = async (sectionId) => {
    setIsLoading(true);
    setError(null);

    const token = getAuthToken();
    const config = { headers: { Authorization: `Bearer ${token}` } };

    // Prepare section-specific payload
    let sectionPayload = {};

    switch (sectionId) {
      case 'catalog':
        if (!formData.catalogItem) {
          setError('Please select a catalog item');
          setIsLoading(false);
          return;
        }
        sectionPayload = {
          catalogItem: {
            type: formData.catalogItem.type,
            itemId: formData.catalogItem._id
          }
        };
        break;
      case 'teacher':
        if (!formData.teacherId) {
          setError('Please select a teacher');
          setIsLoading(false);
          return;
        }
        sectionPayload = { teacherId: formData.teacherId };
        break;
      case 'room':
        if (!formData.roomId) {
          setError('Please select a room');
          setIsLoading(false);
          return;
        }
        sectionPayload = { roomId: formData.roomId };
        break;
      case 'schedule':
        if (!formData.schedules || formData.schedules.length === 0) {
          setError('Please add at least one schedule');
          setIsLoading(false);
          return;
        }
        sectionPayload = { schedules: formData.schedules };
        break;
      case 'details': {
        const trimmedName = (formData.name || '').trim();
        if (!trimmedName) {
          setError('Class name is required');
          setIsLoading(false);
          return;
        }
        if (existingNameSet.has(trimmedName.toLowerCase())) {
          setError('A class with this name already exists');
          setIsLoading(false);
          return;
        }

        sectionPayload = {
          name: trimmedName.substring(0, 100),
          capacity: parseInt(formData.capacity) || 0,
          enrollmentPeriod: formData.enrollmentPeriod,
          description: formData.description,
          absenceRule: formData.absenceRule
        };
        break;
      }
      case 'pricing':
        sectionPayload = {
          paymentCycle: formData.paymentCycle,
          price: parseFloat(formData.price) || 0,
          teacherCut: {
            ...formData.teacherCut,
            value: parseFloat(formData.teacherCut.value) || 0
          }
        };
        break;
      default:
        setError('Invalid section');
        setIsLoading(false);
        return;
    }

    try {
      const response = await axios.put(`${API_BASE_URL}/${classData._id}`, sectionPayload, config);

      // Update local class data
      const updatedClass = response.data.class;
      onSuccess(updatedClass);

      // Show success message or visual feedback
      setError(null);

    } catch (err) {
      const message = err.response?.data?.message || `Failed to update ${sectionId}`;
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

  // Step 1 UI state: filters and paging for catalog items
  const [catalogType, setCatalogType] = useState('all'); // all | supportLessons | reviewCourses | vocationalTrainings | languages | otherActivities
  const [levelFilter, setLevelFilter] = useState('all'); // all | primary | middle | high_school
  const [searchCatalog, setSearchCatalog] = useState('');
  const [showCount, setShowCount] = useState(18);
  const levelFilterDisabled = catalogType !== 'all' && !LEVEL_FILTER_TYPES.has(catalogType);

  useEffect(() => {
    if (levelFilterDisabled && levelFilter !== 'all') {
      setLevelFilter('all');
    }
  }, [levelFilterDisabled, levelFilter]);

  const filteredCatalogItems = useMemo(() => {
    const q = (searchCatalog || '').toLowerCase();
    const normalizedLevelFilter = levelFilter.toLowerCase();

    return (catalogItems || [])
      .filter((it) => (catalogType === 'all' ? true : it.type === catalogType))
      .filter((it) => {
        if (levelFilter === 'all') return true;

        const itemLevel = (it.level || '').toLowerCase();

        if (catalogType === 'all') {
          if (!LEVEL_FILTER_TYPES.has(it.type)) {
            return true;
          }
          return itemLevel === normalizedLevelFilter;
        }

        if (!LEVEL_FILTER_TYPES.has(catalogType)) {
          return true;
        }

        return itemLevel === normalizedLevelFilter;
      })
      .filter((it) => {
        if (!q) return true;
        const hay = [
          it.name,
          it.subject,
          it.field,
          it.specialty,
          it.language,
          it.activityType,
          it.activityName,
          it.grade,
          it.level,
          it.stream
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
  }, [catalogItems, catalogType, levelFilter, searchCatalog]);

  const getStepTitle = (stepNumber) => {
    switch (stepNumber) {
      case 1: return t.selectCatalogItem;
      case 2: return t.assignTeacherRoom;
      case 3: return t.setSchedule;
      case 4: return t.classDetailsPricing;
      default: return '';
    }
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

  // Render section content for edit mode
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'catalog':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">{t.catalogInformation}</h3>

            {/* Current Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.currentSelection}</label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium">{formData.catalogItem?.name || t.noCatalogItemSelected}</div>
                <div className="text-sm text-gray-600">{formData.catalogItem?.type || classData?.catalogItem?.type || ''}</div>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <select
                  value={catalogType}
                  onChange={(e) => setCatalogType(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">{t.allTypes}</option>
                  <option value="supportLessons">{t.supportLessons}</option>
                  <option value="reviewCourses">{t.reviewCourses}</option>
                  <option value="vocationalTrainings">{t.vocationalTrainings}</option>
                  <option value="languages">{t.languages || 'Languages'}</option>
                  <option value="otherActivities">{t.otherActivities}</option>
                </select>
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  disabled={levelFilterDisabled}
                  title={levelFilterDisabled ? t.levelFilterHint : undefined}
                  className="p-2 border border-gray-300 rounded-md text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="all">{t.allLevels}</option>
                  <option value="primary">{t.primary}</option>
                  <option value="middle">{t.middle}</option>
                  <option value="high_school">{t.highSchool}</option>
                </select>
                <input
                  value={searchCatalog}
                  onChange={(e) => setSearchCatalog(e.target.value)}
                  placeholder={t.searchCatalog}
                  className="p-2 border border-gray-300 rounded-md text-sm md:col-span-2"
                />
              </div>
              {levelFilterDisabled && (
                <p className="mt-2 text-xs text-gray-500">
                  {t.levelFilterHint}
                </p>
              )}
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCatalogItems.slice(0, showCount).map((item) => (
                <div
                  key={`${item.type}-${item._id}`}
                  onClick={() => handleCatalogItemSelect(item)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.catalogItem?._id === item._id
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
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    {item.level && (
                      <div>
                        <span className="font-medium text-gray-700">Level:</span> {item.level} {item.grade && `• Grade ${item.grade}`}
                      </div>
                    )}
                    {item.stream && (
                      <div>
                        <span className="font-medium text-gray-700">Stream:</span> <span className="inline-block bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full text-xs">{item.stream}</span>
                      </div>
                    )}
                    {item.subject && (
                      <div>
                        <span className="font-medium text-gray-700">Subject:</span> {item.subject}
                      </div>
                    )}
                    {item.field && (
                      <div>
                        <span className="font-medium text-gray-700">Field:</span> {item.field} {item.specialty && `• ${item.specialty}`}
                      </div>
                    )}
                    {item.language && (
                      <div>
                        <span className="font-medium text-gray-700">Language:</span> {item.language}
                      </div>
                    )}
                    {item.activityType && (
                      <div>
                        <span className="font-medium text-gray-700">Activity:</span> {item.activityType}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Load more */}
            {filteredCatalogItems.length > showCount && (
              <div className="flex justify-center mt-2">
                <button
                  onClick={() => setShowCount(c => c + 18)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                >
                  Show more ({filteredCatalogItems.length - showCount} more)
                </button>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => saveSection('catalog')}
                disabled={isLoading || !formData.catalogItem}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Catalog'}
              </button>
            </div>
          </div>
        );

      case 'teacher':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">{t.teacherAssignment}</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.selectTeacher}
              </label>
              <select
                value={formData.teacherId}
                onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t.chooseTeacher}</option>
                {teachers.map(teacher => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.firstName} {teacher.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => saveSection('teacher')}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? t.saving : t.saveChanges}
              </button>
            </div>
          </div>
        );

      case 'room':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">{t.roomAssignment}</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.selectRoom}
              </label>
              <select
                value={formData.roomId}
                onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t.chooseRoom}</option>
                {rooms.map(room => (
                  <option key={room._id} value={room._id}>
                    {room.name} ({t.capacity || 'Capacity'}: {room.capacity ?? '-'})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => saveSection('room')}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? t.saving : t.saveChanges}
              </button>
            </div>
          </div>
        );

      case 'schedule':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">{t.schedule}</h3>
            <div className="space-y-3">
              {formData.schedules.map((schedule, index) => (
                <div key={index} className="grid grid-cols-4 gap-3 p-3 border border-gray-200 rounded-lg">
                  <select
                    value={schedule.dayOfWeek}
                    onChange={(e) => updateSchedule(index, 'dayOfWeek', e.target.value)}
                    className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="monday">{t.mon}</option>
                    <option value="tuesday">{t.tue}</option>
                    <option value="wednesday">{t.wed}</option>
                    <option value="thursday">{t.thu}</option>
                    <option value="friday">{t.fri}</option>
                    <option value="saturday">{t.sat}</option>
                    <option value="sunday">{t.sun}</option>
                  </select>
                  <input
                    type="time"
                    value={schedule.startTime}
                    onChange={(e) => updateSchedule(index, 'startTime', e.target.value)}
                    className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="time"
                    value={schedule.endTime}
                    onChange={(e) => updateSchedule(index, 'endTime', e.target.value)}
                    className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeSchedule(index)}
                    disabled={formData.schedules.length === 1}
                    className="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t.remove}
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addSchedule}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              + Add Another Schedule
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => saveSection('schedule')}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Schedule'}
              </button>
            </div>
          </div>
        );

      case 'details':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">{t.classDetails}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.className}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    const { value } = e.target;
                    setFormData(prev => ({ ...prev, name: value }));
                    setValidationErrors(prev => ({ ...prev, name: null }));
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.capacity}</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.description}</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => saveSection('details')}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? t.saving : t.saveChanges}
              </button>
            </div>
          </div>
        );

      case 'pricing':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">{t.pricing || 'Pricing & Payment'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.priceDz}</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.cycleSize}</label>
                <input
                  type="number"
                  value={formData.paymentCycle}
                  onChange={(e) => setFormData({ ...formData, paymentCycle: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.teacherCut || 'Teacher Cut (%)'}</label>
                <input
                  type="number"
                  value={formData.teacherCut.value}
                  onChange={(e) => setFormData({
                    ...formData,
                    teacherCut: { ...formData.teacherCut, value: e.target.value }
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => saveSection('pricing')}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? t.saving : t.saveChanges}
              </button>
            </div>
          </div>
        );

      default:
        return <div>{t.selectSectionToEdit || 'Select a section to edit'}</div>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gray-50 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {editMode ? t.editClass : t.createClass}
            </h2>
            {editMode ? (
              <p className="text-sm text-gray-600 mt-1">
                {classData?.name || t.unnamedClass || 'Unnamed Class'}
              </p>
            ) : (
              <p className="text-sm text-gray-600 mt-1">{t.step || 'Step'} {step} {t.of || 'of'} 4: {getStepTitle(step)}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {editMode ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Section Tabs for Edit Mode */}
            <div className="bg-white border-b border-gray-200">
              <div className="flex overflow-x-auto px-6">
                {editSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${activeSection === section.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <span>{section.icon}</span>
                    {section.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Section Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 mb-6">
                  <AlertTriangle className="text-red-500 w-5 h-5" />
                  <div>
                    <h3 className="font-medium text-red-800">Error</h3>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {renderSectionContent()}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Progress Steps for Create Mode */}
            <div className="bg-white border-b border-gray-200">
              <div className="flex justify-between px-6 py-4">
                {[1, 2, 3, 4].map((stepNumber) => {
                  const Icon = getStepIcon(stepNumber);
                  const isActive = step === stepNumber;
                  const isCompleted = step > stepNumber;

                  return (
                    <div key={stepNumber} className="flex items-center">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${isActive ? 'border-blue-500 bg-blue-500 text-white' :
                        isCompleted ? 'border-green-500 bg-green-500 text-white' :
                          'border-gray-300 bg-gray-100 text-gray-400'
                        }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <span className="text-sm font-medium">{stepNumber}</span>
                        )}
                      </div>
                      <span className={`ml-2 text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'
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

            {/* Wizard Content for Create Mode */}
            <div className="flex-1 p-6 overflow-y-auto">
              {isLoading && step === 1 ? (
                <div className="flex justify-center items-center py-12">
                  <Loader className="animate-spin text-blue-500 mr-3" />
                  <span className="text-gray-600">{t.loadingData || 'Loading data...'}</span>
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

              {/* Wizard Steps Content */}
              {/* Step 1: Catalog Item Selection */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {t.selectCatalogItem}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {t.selectCatalogItemDescription || 'Choose an offering from your school catalog to create a class based on it.'}
                    </p>
                  </div>

                  {/* Filters & Search */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <select
                        value={catalogType}
                        onChange={(e) => setCatalogType(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="all">{t.allTypes}</option>
                        <option value="supportLessons">{t.supportLessons}</option>
                        <option value="reviewCourses">{t.reviewCourses}</option>
                        <option value="vocationalTrainings">{t.vocationalTrainings}</option>
                        <option value="languages">{t.languages || 'Languages'}</option>
                        <option value="otherActivities">{t.otherActivities}</option>
                      </select>
                      <select
                        value={levelFilter}
                        onChange={(e) => setLevelFilter(e.target.value)}
                        disabled={levelFilterDisabled}
                        title={levelFilterDisabled ? t.levelFilterHint : undefined}
                        className="p-2 border border-gray-300 rounded-md text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <option value="all">{t.allLevels}</option>
                        <option value="primary">{t.primary}</option>
                        <option value="middle">{t.middle}</option>
                        <option value="high_school">{t.highSchool}</option>
                      </select>
                      <input
                        value={searchCatalog}
                        onChange={(e) => setSearchCatalog(e.target.value)}
                        placeholder={t.searchCatalog}
                        className="p-2 border border-gray-300 rounded-md text-sm md:col-span-2"
                      />
                    </div>
                    {levelFilterDisabled && (
                      <p className="mt-2 text-xs text-gray-500">
                        {t.levelFilterHint}
                      </p>
                    )}
                  </div>

                  {/* Catalog Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCatalogItems.slice(0, showCount).map((item) => (
                      <div
                        key={`${item.type}-${item._id}`}
                        onClick={() => handleCatalogItemSelect(item)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.catalogItem?._id === item._id
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
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          {item.level && (
                            <div>
                              <span className="font-medium text-gray-700">Level:</span> {item.level} {item.grade && `• Grade ${item.grade}`}
                            </div>
                          )}
                          {item.stream && (
                            <div>
                              <span className="font-medium text-gray-700">Stream:</span> <span className="inline-block bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full text-xs">{item.stream}</span>
                            </div>
                          )}
                          {item.subject && (
                            <div>
                              <span className="font-medium text-gray-700">Subject:</span> {item.subject}
                            </div>
                          )}
                          {item.field && (
                            <div>
                              <span className="font-medium text-gray-700">Field:</span> {item.field} {item.specialty && `• ${item.specialty}`}
                            </div>
                          )}
                          {item.language && (
                            <div>
                              <span className="font-medium text-gray-700">Language:</span> {item.language}
                            </div>
                          )}
                          {item.activityType && (
                            <div>
                              <span className="font-medium text-gray-700">Activity:</span> {item.activityType}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Load more */}
                  {filteredCatalogItems.length > showCount && (
                    <div className="flex justify-center mt-4">
                      <button
                        onClick={() => setShowCount(c => c + 18)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                      >
                        {t.showMore || 'Show more'} ({filteredCatalogItems.length - showCount} {t.more || 'more'})
                      </button>
                    </div>
                  )}

                  {validationErrors.catalogItem && (
                    <p className="text-red-600 text-sm">{validationErrors.catalogItem}</p>
                  )}
                </div>
              )}

              {/* Step 2: Teacher & Room Assignment */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.selectTeacher || 'SELECT TEACHER'} *</label>
                      <select
                        value={formData.teacherId}
                        onChange={(e) => handleTeacherSelect(e.target.value)}
                        className="w-full py-2 border-b border-gray-200 focus:border-primary focus:outline-none bg-transparent transition-colors"
                      >
                        <option value="">{t.chooseTeacher}</option>
                        {teachers.map((teacher) => (
                          <option key={teacher._id} value={teacher._id}>
                            {teacher.firstName} {teacher.lastName}
                          </option>
                        ))}
                      </select>
                      {validationErrors.teacherId && (
                        <p className="text-red-600 text-[10px] mt-1">{validationErrors.teacherId}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.selectRoom || 'SELECT ROOM'} *</label>
                      <select
                        value={formData.roomId}
                        onChange={(e) => handleRoomSelect(e.target.value)}
                        className="w-full py-2 border-b border-gray-200 focus:border-primary focus:outline-none bg-transparent transition-colors"
                      >
                        <option value="">{t.chooseRoom}</option>
                        {rooms.map((room) => (
                          <option key={room._id} value={room._id}>
                            {room.name} (Cap: {room.capacity})
                          </option>
                        ))}
                      </select>
                      {validationErrors.roomId && (
                        <p className="text-red-600 text-[10px] mt-1">{validationErrors.roomId}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.capacity || 'CAPACITY'} *</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.capacity}
                        onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                        placeholder="Enter capacity"
                        className="w-full py-2 border-b border-gray-200 focus:border-primary focus:outline-none transition-colors placeholder:text-gray-300"
                      />
                      {validationErrors.capacity && (
                        <p className="text-red-600 text-[10px] mt-1">{validationErrors.capacity}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Schedule */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.setClassSchedules || 'CLASS SCHEDULES'}</h4>
                    <button
                      type="button"
                      onClick={addSchedule}
                      className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      {t.addSchedule || 'Add Schedule'}
                    </button>
                  </div>

                  {validationErrors.schedules && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-700 text-xs">{validationErrors.schedules}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {formData.schedules.map((schedule, index) => (
                      <div key={index} className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Day</label>
                            <select
                              value={schedule.dayOfWeek}
                              onChange={(e) => updateSchedule(index, 'dayOfWeek', e.target.value)}
                              className="w-full py-2 border-b border-gray-200 focus:border-primary focus:outline-none bg-transparent"
                            >
                              <option value="monday">{t.mon}</option>
                              <option value="tuesday">{t.tue}</option>
                              <option value="wednesday">{t.wed}</option>
                              <option value="thursday">{t.thu}</option>
                              <option value="friday">{t.fri}</option>
                              <option value="saturday">{t.sat}</option>
                              <option value="sunday">{t.sun}</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Start</label>
                            <input
                              type="time"
                              value={schedule.startTime}
                              onChange={(e) => updateSchedule(index, 'startTime', e.target.value)}
                              className="w-full py-2 border-b border-gray-200 focus:border-primary focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1 relative">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">End</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="time"
                                value={schedule.endTime}
                                onChange={(e) => updateSchedule(index, 'endTime', e.target.value)}
                                className="w-full py-2 border-b border-gray-200 focus:border-primary focus:outline-none"
                              />
                              {formData.schedules.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeSchedule(index)}
                                  className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {conflictError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3">
                      <AlertTriangle className="text-red-500 w-4 h-4" />
                      <p className="text-red-700 text-xs">{conflictError}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Class Details & Pricing */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.className || 'CLASS NAME'} *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => {
                          const { value } = e.target;
                          setFormData(prev => ({ ...prev, name: value }));
                          setValidationErrors(prev => ({ ...prev, name: null }));
                        }}
                        placeholder="Enter class name"
                        className="w-full py-2 border-b border-gray-200 focus:border-primary focus:outline-none transition-colors placeholder:text-gray-300"
                      />
                      {validationErrors.name && (
                        <p className="text-red-600 text-[10px] mt-1">{validationErrors.name}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.cyclePrice || 'PRICE PER CYCLE'} *</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                          placeholder="0.00"
                          className="w-full py-2 border-b border-gray-200 focus:border-primary focus:outline-none transition-colors placeholder:text-gray-300"
                        />
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">{t.dz || 'DZ'}</span>
                      </div>
                      {validationErrors.price && (
                        <p className="text-red-600 text-[10px] mt-1">{validationErrors.price}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.cycleSize || 'CYCLE SIZE'} *</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.paymentCycle}
                        onChange={(e) => setFormData(prev => ({ ...prev, paymentCycle: parseInt(e.target.value) }))}
                        className="w-full py-2 border-b border-gray-200 focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.teacherCutMode || 'TEACHER CUT MODE'} *</label>
                      <select
                        value={formData.teacherCut.mode}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          teacherCut: { ...prev.teacherCut, mode: e.target.value }
                        }))}
                        className="w-full py-2 border-b border-gray-200 focus:border-primary focus:outline-none bg-transparent"
                      >
                        <option value="percentage">{t.percentage || 'Percentage'}</option>
                        <option value="fixed">{t.fixedAmount || 'Fixed Amount'}</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.teacherCutValue || 'TEACHER CUT VALUE'} *</label>
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
                          className="w-full py-2 border-b border-gray-200 focus:border-primary focus:outline-none"
                        />
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">
                          {formData.teacherCut.mode === 'percentage' ? '%' : (t.dz || 'DZ')}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.enrollmentStart || 'ENROLLMENT START'} *</label>
                      <input
                        type="date"
                        value={formData.enrollmentPeriod.startDate}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          enrollmentPeriod: { ...prev.enrollmentPeriod, startDate: e.target.value }
                        }))}
                        className="w-full py-2 border-b border-gray-200 focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.enrollmentEnd || 'ENROLLMENT END'} *</label>
                      <input
                        type="date"
                        value={formData.enrollmentPeriod.endDate}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          enrollmentPeriod: { ...prev.enrollmentPeriod, endDate: e.target.value }
                        }))}
                        className="w-full py-2 border-b border-gray-200 focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div className="md:col-span-2 pt-2">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={formData.absenceRule}
                            onChange={(e) => setFormData(prev => ({ ...prev, absenceRule: e.target.checked }))}
                            className="sr-only"
                          />
                          <div className={`w-10 h-5 rounded-full transition-colors ${formData.absenceRule ? 'bg-primary' : 'bg-gray-200'}`}></div>
                          <div className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform ${formData.absenceRule ? 'translate-x-5' : ''}`}></div>
                        </div>
                        <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                          {t.absenceRule || 'Absence affects payment (student pays even if absent)'}
                        </span>
                      </label>
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.description || 'DESCRIPTION'}</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={2}
                        placeholder="Enter additional details..."
                        className="w-full py-2 border-b border-gray-200 focus:border-primary focus:outline-none transition-colors placeholder:text-gray-300 resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer - only show for create mode */}
        {!editMode && (
          <div className="flex justify-between items-center p-6 bg-gray-50 border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.previous}
            </button>

            {step < 4 ? (
              <button
                onClick={nextStep}
                className="btn-primary px-6 py-2"
              >
                {t.nextStep || 'Next Step'}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isLoading || conflictError}
                className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader className="animate-spin text-white mr-2" />
                    {editMode ? t.updating : t.creating}
                  </>
                ) : (
                  editMode ? t.updateClass : t.createClass
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassCreationModal;
