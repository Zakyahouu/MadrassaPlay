import React, { useState, useEffect } from 'react';
import { X, Trophy } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

const OtherActivityForm = ({ isOpen, onClose, onSubmit, data }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    type: '',
    name: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Initialize form data if editing
  useEffect(() => {
    if (data) {
      setFormData({
        type: data.type || '',
        name: data.name || ''
      });
    }
  }, [data]);

  // Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.type.trim()) {
      newErrors.type = t.activityTypeRequired || 'Activity type is required';
    }
    if (!formData.name.trim()) {
      newErrors.name = t.activityNameRequired || 'Activity name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(t.failedToSaveActivity || 'Failed to save activity');
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {data ? (t.editOtherActivity || 'Edit Activity') : (t.addOtherActivity || 'Add Activity')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Activity Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.activityType || 'Activity Type'} *
            </label>
            <input
              type="text"
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              placeholder={t.activityTypePlaceholder || 'e.g., Sport, Art, Music'}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none ${errors.type ? 'border-red-500' : 'border-gray-300'
                }`}
            />
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type}</p>
            )}
          </div>

          {/* Activity Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.activityName || 'Activity Name'} *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder={t.activityNamePlaceholder || 'e.g., Football Club, Piano Lesson'}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none ${errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Summary */}
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">{t.summary || 'Summary'}</h4>
            <div className="space-y-1 text-sm text-purple-800">
              <p><strong>{t.type || 'Type'}:</strong> {formData.type || (t.notSpecified || 'Not Specified')}</p>
              <p><strong>{t.name || 'Name'}:</strong> {formData.name || (t.notSpecified || 'Not Specified')}</p>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            disabled={loading}
          >{t.cancel || 'Cancel'}</button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (t.saving || 'Saving...') : (data ? (t.update || 'Update') : (t.create || 'Create')) + ' ' + (t.activity || 'Activity')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OtherActivityForm;
