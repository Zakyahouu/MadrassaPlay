import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { 
  BookOpen, GraduationCap, Languages, Briefcase, Activity, 
  Plus, Edit, Trash2, Eye, Search, Filter, Download, 
  ChevronDown, ChevronUp, Check, X, AlertCircle
} from 'lucide-react';
import UnifiedCard from '../shared/UnifiedCard';

// Import form components
import SupportLessonForm from './catalog/SupportLessonForm';
import ReviewCourseForm from './catalog/ReviewCourseForm';
import VocationalTrainingForm from './catalog/VocationalTrainingForm';
import LanguageForm from './catalog/LanguageForm';
import OtherActivityForm from './catalog/OtherActivityForm';

const CatalogTab = () => {
  const { user } = useContext(AuthContext);
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('support-lessons');
  const [modal, setModal] = useState({ type: null, data: null, isOpen: false });
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch catalog data
  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
      if (!token || !user?.school) return;

      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`/api/catalog/${user.school}`, config);
      setCatalog(response.data);
    } catch (error) {
      console.error('Error fetching catalog:', error);
      setError('Failed to load catalog data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submissions
  const handleAddItem = async (type, data) => {
    try {
      const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Support bulk adds: if data is an array, post sequentially then refetch once
      if (Array.isArray(data)) {
        for (const d of data) {
          await axios.post(`/api/catalog/${user.school}/${type}`, d, config);
        }
        const refreshed = await axios.get(`/api/catalog/${user.school}`, config);
        setCatalog(refreshed.data);
        setModal({ type: null, data: null, isOpen: false });
        return;
      }

      const response = await axios.post(`/api/catalog/${user.school}/${type}`, data, config);
      setCatalog(response.data);
      setModal({ type: null, data: null, isOpen: false });
    } catch (error) {
      console.error(`Error adding ${type}:`, error);
      throw error;
    }
  };

  const handleUpdateItem = async (type, itemId, data) => {
    try {
      const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const response = await axios.put(`/api/catalog/${user.school}/${type}/${itemId}`, data, config);
      setCatalog(response.data);
      setModal({ type: null, data: null, isOpen: false });
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
      throw error;
    }
  };

  const handleDeleteItem = async (type, itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const response = await axios.delete(`/api/catalog/${user.school}/${type}/${itemId}`, config);
      setCatalog(response.data);
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      alert('Failed to delete item. Please try again.');
    }
  };

  // Filter items based on search term
  const filterItems = (items) => {
    if (!searchTerm) return items;
    return items.filter(item => {
      const searchableText = JSON.stringify(item).toLowerCase();
      return searchableText.includes(searchTerm.toLowerCase());
    });
  };

  // Convert item.subject to array for chip UI
  const subjectArray = (subject) => (subject ? subject.split(',').map(s => s.trim()).filter(Boolean) : []);

  // Helper function to get level display
  const getLevelDisplay = (level) => {
    switch (level) {
      case 'primary': return 'Primary';
      case 'middle': return 'Middle';
      case 'high_school': return 'High School';
      default: return level;
    }
  };

  // Helper function to get grade display
  const getGradeDisplay = (grade, level) => {
    if (level === 'high_school') {
      return `Year ${grade}`;
    }
    return `Grade ${grade}`;
  };

  // Helper function to group items by level
  const groupItemsByLevel = (items) => {
    const grouped = {
      primary: [],
      middle: [],
      high_school: []
    };

    items.forEach(item => {
      if (item.level && grouped[item.level]) {
        grouped[item.level].push(item);
      }
    });

    return grouped;
  };

  // Render section content
  const renderSectionContent = () => {
    if (!catalog) return null;

    switch (activeSection) {
      case 'support-lessons':
  const supportLessons = filterItems(catalog.supportLessons || []);
  const groupedSupportLessons = groupItemsByLevel(supportLessons);
        
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Support Lessons</h3>
              <button
                onClick={() => setModal({ type: 'support-lessons', data: null, isOpen: true })}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Lesson
              </button>
            </div>
            <div className="space-y-6">
              {Object.entries(groupedSupportLessons).map(([level, levelItems]) => {
                if (levelItems.length === 0) return null;
                
                const levelNames = {
                  primary: 'Primary School',
                  middle: 'Middle School', 
                  high_school: 'High School'
                };

                return (
                  <div key={level} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        {levelNames[level]}
                      </h4>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {levelItems.length} {levelItems.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                    {/* Group by grade + stream for dense display */}
                    {Object.entries(
                      levelItems.reduce((acc, item) => {
                        const key = `${item.grade}|${item.stream||''}`;
                        acc[key] = acc[key] || { grade: item.grade, stream: item.stream, items: [] };
                        acc[key].items.push(item);
                        return acc;
                      }, {})
                    ).sort((a,b) => a[1].grade - b[1].grade).map(([key, group]) => (
                      <div key={key} className="ml-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            {getGradeDisplay(group.grade, level)}
                          </span>
                          {group.stream && (
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">{group.stream}</span>
                          )}
                          <span className="text-xs text-gray-500">{group.items.length} items</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {group.items.map((it) => (
                            <div key={it._id} className="flex items-center gap-1 px-2 py-1 bg-white border rounded-full shadow-sm">
                              <span className="text-xs text-gray-800">{subjectArray(it.subject)[0] || it.subject}</span>
                              <button
                                onClick={() => setModal({ type: 'support-lessons', data: it, isOpen: true })}
                                className="p-0.5 text-gray-400 hover:text-blue-600"
                                title="Edit"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem('support-lessons', it._id)}
                                className="p-0.5 text-gray-400 hover:text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'review-courses':
  const reviewCourses = filterItems(catalog.reviewCourses || []);
  const groupedReviewCourses = groupItemsByLevel(reviewCourses);
        
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Review Courses</h3>
              <button
                onClick={() => setModal({ type: 'review-courses', data: null, isOpen: true })}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Course
              </button>
            </div>
            <div className="space-y-6">
              {Object.entries(groupedReviewCourses).map(([level, levelItems]) => {
                if (levelItems.length === 0) return null;
                
                const levelNames = {
                  primary: 'Primary School',
                  middle: 'Middle School', 
                  high_school: 'High School'
                };

                return (
                  <div key={level} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        {levelNames[level]}
                      </h4>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {levelItems.length} {levelItems.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                    {Object.entries(
                      levelItems.reduce((acc, item) => {
                        const key = `${item.grade}|${item.stream||''}`;
                        acc[key] = acc[key] || { grade: item.grade, stream: item.stream, items: [] };
                        acc[key].items.push(item);
                        return acc;
                      }, {})
                    ).sort((a,b) => a[1].grade - b[1].grade).map(([key, group]) => (
                      <div key={key} className="ml-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                            {getGradeDisplay(group.grade, level)}
                          </span>
                          {group.stream && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">{group.stream}</span>
                          )}
                          <span className="text-xs text-gray-500">{group.items.length} items</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {group.items.map((it) => (
                            <div key={it._id} className="flex items-center gap-1 px-2 py-1 bg-white border rounded-full shadow-sm">
                              <span className="text-xs text-gray-800">{subjectArray(it.subject)[0] || it.subject}</span>
                              <button
                                onClick={() => setModal({ type: 'review-courses', data: it, isOpen: true })}
                                className="p-0.5 text-gray-400 hover:text-purple-600"
                                title="Edit"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem('review-courses', it._id)}
                                className="p-0.5 text-gray-400 hover:text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'vocational-trainings':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Vocational Trainings</h3>
              <button
                onClick={() => setModal({ type: 'vocational-trainings', data: null, isOpen: true })}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Training
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filterItems(catalog.vocationalTrainings || []).map((training, index) => (
                <UnifiedCard key={training._id || index} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{training.field}</h4>
                      <p className="text-sm text-gray-600">{training.specialty}</p>
                      <p className="text-sm text-gray-500">Certificate: {training.certificateType}</p>
                      <p className="text-sm text-gray-500">Gender: {training.gender}</p>
                      {training.ageRange && (
                        <p className="text-sm text-gray-500">
                          Age: {training.ageRange.min}-{training.ageRange.max}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setModal({ type: 'vocational-trainings', data: training, isOpen: true })}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem('vocational-trainings', training._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </UnifiedCard>
              ))}
            </div>
          </div>
        );

      case 'languages':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Languages</h3>
              <button
                onClick={() => setModal({ type: 'languages', data: null, isOpen: true })}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Language
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filterItems(catalog.languages || []).map((language, index) => (
                <UnifiedCard key={language._id || index} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{language.language}</h4>
                      <p className="text-sm text-gray-600">
                        Levels: {language.levels?.join(', ') || 'A0, A1, A2, B1, B2, C1, C2'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setModal({ type: 'languages', data: language, isOpen: true })}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem('languages', language._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </UnifiedCard>
              ))}
            </div>
          </div>
        );

      case 'other-activities':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Other Activities</h3>
              <button
                onClick={() => setModal({ type: 'other-activities', data: null, isOpen: true })}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Activity
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filterItems(catalog.otherActivities || []).map((activity, index) => (
                <UnifiedCard key={activity._id || index} className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                        <h4 className="font-semibold text-gray-900 truncate">{activity.activityName}</h4>
                      </div>
                      <div className="space-y-1">
                        <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">
                          {activity.activityType}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => setModal({ type: 'other-activities', data: activity, isOpen: true })}
                        className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem('other-activities', activity._id)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </UnifiedCard>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Render modal content
  const renderModal = () => {
    if (!modal.isOpen) return null;

    const modalProps = {
      isOpen: modal.isOpen,
      onClose: () => setModal({ type: null, data: null, isOpen: false }),
      onSubmit: modal.data 
        ? (data) => handleUpdateItem(modal.type, modal.data._id, data)
        : (data) => handleAddItem(modal.type, data),
      data: modal.data
    };

    switch (modal.type) {
      case 'support-lessons':
        return <SupportLessonForm {...modalProps} catalog={catalog} />;
      case 'review-courses':
        return <ReviewCourseForm {...modalProps} catalog={catalog} />;
      case 'vocational-trainings':
        return <VocationalTrainingForm {...modalProps} />;
      case 'languages':
        return <LanguageForm {...modalProps} />;
      case 'other-activities':
        return <OtherActivityForm {...modalProps} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'support-lessons', name: 'Support Lessons', icon: BookOpen, count: catalog?.supportLessons?.length || 0 },
    { id: 'review-courses', name: 'Review Courses', icon: GraduationCap, count: catalog?.reviewCourses?.length || 0 },
    { id: 'vocational-trainings', name: 'Vocational Trainings', icon: Briefcase, count: catalog?.vocationalTrainings?.length || 0 },
    { id: 'languages', name: 'Languages', icon: Languages, count: catalog?.languages?.length || 0 },
    { id: 'other-activities', name: 'Other Activities', icon: Activity, count: catalog?.otherActivities?.length || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Skill Snap Catalog Management</h2>
          <p className="text-gray-600">Manage all services and offerings for your school</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search offerings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeSection === section.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <section.icon className="w-4 h-4" />
              {section.name}
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                {section.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-96">
        {renderSectionContent()}
      </div>

      {/* Modal */}
      {renderModal()}
    </div>
  );
};

export default CatalogTab;
