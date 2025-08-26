import React, { useState, useEffect } from 'react';
import { X, Activity } from 'lucide-react';

const OtherActivityForm = ({ isOpen, onClose, onSubmit, data }) => {
  const [formData, setFormData] = useState({
    activityType: '',
    activityName: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Initialize form data if editing
  useEffect(() => {
    if (data) {
      setFormData({
        activityType: data.activityType || '',
        activityName: data.activityName || ''
      });
    }
  }, [data]);

  // Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.activityType.trim()) {
      newErrors.activityType = 'Activity type is required';
    }
    if (!formData.activityName.trim()) {
      newErrors.activityName = 'Activity name is required';
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
      alert('Failed to save activity. Please try again.');
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
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {data ? 'Edit Other Activity' : 'Add Other Activity'}
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
              Activity Type *
            </label>
            <input
              type="text"
              value={formData.activityType}
              onChange={(e) => handleInputChange('activityType', e.target.value)}
              placeholder="e.g., Club, Workshop, Seminar, Event"
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none ${
                errors.activityType ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.activityType && (
              <p className="mt-1 text-sm text-red-600">{errors.activityType}</p>
            )}
          </div>

          {/* Activity Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Activity Name *
            </label>
            <input
              type="text"
              value={formData.activityName}
              onChange={(e) => handleInputChange('activityName', e.target.value)}
              placeholder="e.g., Chess Club, Art Workshop, Science Fair"
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none ${
                errors.activityName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.activityName && (
              <p className="mt-1 text-sm text-red-600">{errors.activityName}</p>
            )}
          </div>

          {/* Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Activity Type:</strong> {formData.activityType || 'Not specified'}</p>
              <p><strong>Activity Name:</strong> {formData.activityName || 'Not specified'}</p>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : (data ? 'Update' : 'Create') + ' Activity'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OtherActivityForm;
