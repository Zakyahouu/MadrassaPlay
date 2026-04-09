import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  GraduationCap,
  Briefcase,
  Languages,
  Trophy,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import SupportLessonForm from './catalog/SupportLessonForm';
import ReviewCourseForm from './catalog/ReviewCourseForm';
import VocationalTrainingForm from './catalog/VocationalTrainingForm';
import LanguageForm from './catalog/LanguageForm';
import OtherActivityForm from './catalog/OtherActivityForm';

const CatalogTab = ({ catalog, onUpdate }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('support_lessons');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  const tabs = [
    { id: 'support_lessons', label: t.supportLessons, icon: BookOpen },
    { id: 'review_courses', label: t.reviewCourses, icon: GraduationCap },
    { id: 'vocational_training', label: t.vocationalTrainings, icon: Briefcase },
    { id: 'languages', label: t.languages, icon: Languages },
    { id: 'other_activities', label: t.otherActivities, icon: Trophy }
  ];

  // Helper to get items for current tab
  const getCurrentItems = () => {
    switch (activeTab) {
      case 'support_lessons':
        return catalog?.supportLessons || [];
      case 'review_courses':
        return catalog?.reviewCourses || [];
      case 'vocational_training':
        return catalog?.vocationalTrainings || [];
      case 'languages':
        return catalog?.languages || [];
      case 'other_activities':
        return catalog?.otherActivities || [];
      default:
        return [];
    }
  };

  const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  const sanitizeCatalogForBackend = (catalogData) => {
    const cleanData = { ...catalogData };
    const categories = ['supportLessons', 'reviewCourses', 'vocationalTrainings', 'languages', 'otherActivities'];

    categories.forEach(category => {
      if (cleanData[category]) {
        cleanData[category] = cleanData[category].map(item => {
          const cleanItem = { ...item };

          if (category === 'otherActivities') {
            if (cleanItem.activityType === undefined && cleanItem.type !== undefined) {
              cleanItem.activityType = cleanItem.type;
            }
            if (cleanItem.activityName === undefined && cleanItem.name !== undefined) {
              cleanItem.activityName = cleanItem.name;
            }
            delete cleanItem.type;
            delete cleanItem.name;
          }

          // Remove temporary IDs
          if (cleanItem._id && !isValidObjectId(cleanItem._id)) {
            delete cleanItem._id;
          }
          return cleanItem;
        });
      }
    });

    return cleanData;
  };

  const handleDelete = async (itemId) => {
    try {
      const updatedCatalog = { ...catalog };

      switch (activeTab) {
        case 'support_lessons':
          updatedCatalog.supportLessons = updatedCatalog.supportLessons.filter(item => item._id !== itemId);
          break;
        case 'review_courses':
          updatedCatalog.reviewCourses = updatedCatalog.reviewCourses.filter(item => item._id !== itemId);
          break;
        case 'vocational_training':
          updatedCatalog.vocationalTrainings = updatedCatalog.vocationalTrainings.filter(item => item._id !== itemId);
          break;
        case 'languages':
          updatedCatalog.languages = updatedCatalog.languages.filter(item => item._id !== itemId);
          break;
        case 'other_activities':
          updatedCatalog.otherActivities = updatedCatalog.otherActivities.filter(item => item._id !== itemId);
          break;
      }

      await onUpdate(sanitizeCatalogForBackend(updatedCatalog));
      setDeleteConfirmation(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      alert(t.failedDeleteItem);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      const updatedCatalog = { ...catalog };

      // Initialize arrays if they don't exist
      if (!updatedCatalog.supportLessons) updatedCatalog.supportLessons = [];
      if (!updatedCatalog.reviewCourses) updatedCatalog.reviewCourses = [];
      if (!updatedCatalog.vocationalTrainings) updatedCatalog.vocationalTrainings = [];
      if (!updatedCatalog.languages) updatedCatalog.languages = [];
      if (!updatedCatalog.otherActivities) updatedCatalog.otherActivities = [];

      if (editingItem) {
        // Update existing item
        switch (activeTab) {
          case 'support_lessons':
            updatedCatalog.supportLessons = updatedCatalog.supportLessons.map(item =>
              item._id === editingItem._id ? { ...item, ...formData } : item
            );
            break;
          case 'review_courses':
            updatedCatalog.reviewCourses = updatedCatalog.reviewCourses.map(item =>
              item._id === editingItem._id ? { ...item, ...formData } : item
            );
            break;
          case 'vocational_training':
            updatedCatalog.vocationalTrainings = updatedCatalog.vocationalTrainings.map(item =>
              item._id === editingItem._id ? { ...item, ...formData } : item
            );
            break;
          case 'languages':
            updatedCatalog.languages = updatedCatalog.languages.map(item =>
              item._id === editingItem._id ? { ...item, ...formData } : item
            );
            break;
          case 'other_activities':
            updatedCatalog.otherActivities = updatedCatalog.otherActivities.map(item =>
              item._id === editingItem._id ? { ...item, ...formData } : item
            );
            break;
        }
      } else {
        // Add new item(s)
        const newItem = { ...formData, _id: Date.now().toString() }; // Temporary ID for UI

        switch (activeTab) {
          case 'support_lessons':
          case 'review_courses':
            // These forms might return an array of items
            if (Array.isArray(formData)) {
              const newItems = formData.map(item => ({ ...item, _id: Date.now().toString() + Math.random() }));
              if (activeTab === 'support_lessons') {
                updatedCatalog.supportLessons = [...updatedCatalog.supportLessons, ...newItems];
              } else {
                updatedCatalog.reviewCourses = [...updatedCatalog.reviewCourses, ...newItems];
              }
            } else {
              if (activeTab === 'support_lessons') {
                updatedCatalog.supportLessons.push(newItem);
              } else {
                updatedCatalog.reviewCourses.push(newItem);
              }
            }
            break;
          case 'vocational_training':
            updatedCatalog.vocationalTrainings.push(newItem);
            break;
          case 'languages':
            updatedCatalog.languages.push(newItem);
            break;
          case 'other_activities':
            updatedCatalog.otherActivities.push(newItem);
            break;
        }
      }

      await onUpdate(sanitizeCatalogForBackend(updatedCatalog));
      setIsFormOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving item:', error);
      alert(t.failedToSaveCatalogItem || t.failedToSaveLesson || t.failedToSaveCourse || t.failedToSaveActivity || t.failedToSaveTraining || 'Failed to save item. Please try again.');
    }
  };

  // Group items by Level -> Grade -> Stream
  const groupCatalogItems = (items) => {
    const grouped = {};

    items.forEach(item => {
      const level = item.level || 'other';
      const grade = item.grade || 0;
      // Use 'General' if no stream is specified
      const stream = item.stream || 'General';

      if (!grouped[level]) grouped[level] = {};
      if (!grouped[level][grade]) grouped[level][grade] = {};
      if (!grouped[level][grade][stream]) grouped[level][grade][stream] = [];

      grouped[level][grade][stream].push(item);
    });

    return grouped;
  };

  const renderGroupedItems = (items) => {
    const grouped = groupCatalogItems(items);
    const levels = ['primary', 'middle', 'high_school']; // Ordered levels

    if (!items || items.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <p className="text-gray-500">{t.noItemsFound || 'No items found'}</p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            {t.addNew}
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {levels.map(level => {
          if (!grouped[level]) return null;

          const grades = Object.keys(grouped[level]).sort((a, b) => a - b);

          return (
            <div key={level} className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 border-b pb-2 capitalize">
                {t[level] || level.replace('_', ' ')}
              </h3>

              <div className="grid grid-cols-1 gap-6">
                {grades.map(grade => (
                  <div key={`${level}-${grade}`} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                    <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <span className="w-2 h-8 bg-blue-50 rounded-full"></span>
                      {level === 'high_school' ? (t[`year${grade}`] || `Year ${grade}`) : (t[`grade${grade}`] || `Grade ${grade}`)}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {Object.entries(grouped[level][grade]).map(([stream, streamItems]) => (
                        <div key={stream} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                          <h5 className="font-medium text-gray-900 mb-3 pb-2 border-b border-gray-100 flex justify-between items-center">
                            <span className="capitalize truncate" title={stream}>{stream === 'General' ? (t.general || 'General') : stream}</span>
                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">{streamItems.length}</span>
                          </h5>

                          <div className="flex flex-wrap gap-2">
                            {streamItems.map(item => (
                              <div key={item._id} className="group flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                                <span className="text-sm text-gray-700 font-medium">{item.subject}</span>
                                <div className="hidden group-hover:flex items-center gap-1 ml-1 pl-2 border-l border-gray-300">
                                  <button
                                    onClick={() => {
                                      setEditingItem(item);
                                      setIsFormOpen(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmation(item._id)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderForm = () => {
    const commonProps = {
      isOpen: isFormOpen,
      onClose: () => {
        setIsFormOpen(false);
        setEditingItem(null);
      },
      onSubmit: handleSubmit,
      data: editingItem,
      catalog: catalog
    };

    switch (activeTab) {
      case 'support_lessons':
        return <SupportLessonForm {...commonProps} />;
      case 'review_courses':
        return <ReviewCourseForm {...commonProps} />;
      case 'vocational_training':
        return <VocationalTrainingForm {...commonProps} />;
      case 'languages':
        return <LanguageForm {...commonProps} />;
      case 'other_activities':
        return <OtherActivityForm {...commonProps} />;
      default:
        return null;
    }
  };

  const renderTable = () => {
    const items = getCurrentItems().filter(item => {
      // Basic search filtering
      if (!searchQuery) return true;
      const searchLower = searchQuery.toLowerCase();
      // Safe check for string conversion
      return Object.values(item).some(val =>
        val && String(val).toLowerCase().includes(searchLower)
      );
    });

    // Use grouped view for support lessons and review courses
    if (activeTab === 'support_lessons' || activeTab === 'review_courses') {
      return renderGroupedItems(items);
    }

    if (items.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">{t.noItemsFound}</h3>
          <p className="text-gray-500 mt-1">{t.tryAdjustingSearch}</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {activeTab === 'support_lessons' && (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.level}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.grade}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.subject}</th>
                </>
              )}
              {activeTab === 'review_courses' && (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.level}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.stream}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.grade}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.subject}</th>
                </>
              )}
              {activeTab === 'vocational_training' && (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.field}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.specialty}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.certificateType || t.certificate || 'Certificate Type'}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.gender}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.ageRange}</th>
                </>
              )}
              {activeTab === 'languages' && (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.language}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.levels}</th>
                </>
              )}
              {activeTab === 'other_activities' && (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.activityType || t.type || 'Type'}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.activityName || t.name || 'Name'}</th>
                </>
              )}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                {activeTab === 'support_lessons' && (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t[item.level] || item.level}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t[`grade${item.grade}`] || `Grade ${item.grade}`}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.subject}</td>
                  </>
                )}
                {activeTab === 'review_courses' && (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t[item.level] || item.level}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.stream || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.level === 'high_school' ? (t[`year${item.grade}`] || `Year ${item.grade}`) : (t[`grade${item.grade}`] || `Grade ${item.grade}`)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.subject}</td>
                  </>
                )}
                {activeTab === 'vocational_training' && (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.field}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.specialty}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.certificateType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{t[item.gender] || item.gender}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.ageRange?.min || '0'} - {item.ageRange?.max || '∞'}
                    </td>
                  </>
                )}
                {activeTab === 'languages' && (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.language}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-wrap gap-1">
                        {item.levels?.map(level => (
                          <span key={level} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {level}
                          </span>
                        ))}
                      </div>
                    </td>
                  </>
                )}
                {activeTab === 'other_activities' && (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.activityType || item.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.activityName || item.name}</td>
                  </>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setIsFormOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmation(item._id)}
                      className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
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
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            setEditingItem(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          {t.addNew}
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder={t.search + "..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
        />
      </div>

      {/* Content Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {renderTable()}
      </div>

      {/* Forms Modal */}
      {renderForm()}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-semibold">{t.confirmDeleteItem}</h3>
            </div>
            <p className="text-gray-600 mb-6">
              {t.confirmDelete || t.confirmDeleteItem || 'Are you sure you want to delete this item?'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmation)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogTab;
