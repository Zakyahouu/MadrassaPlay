import React, { useState, useEffect } from 'react';
import { X, Briefcase } from 'lucide-react';

const VocationalTrainingForm = ({ isOpen, onClose, onSubmit, data }) => {
  const [formData, setFormData] = useState({
    field: '',
    specialty: '',
    certificateType: '',
    gender: '',
    ageRange: {
      min: '',
      max: ''
    }
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Initialize form data if editing
  useEffect(() => {
    if (data) {
      setFormData({
        field: data.field || '',
        specialty: data.specialty || '',
        certificateType: data.certificateType || '',
        gender: data.gender || '',
        ageRange: {
          min: data.ageRange?.min || '',
          max: data.ageRange?.max || ''
        }
      });
    }
  }, [data]);

  // Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.field.trim()) {
      newErrors.field = 'Field is required';
    }
    if (!formData.specialty.trim()) {
      newErrors.specialty = 'Specialty is required';
    }
    if (!formData.certificateType.trim()) {
      newErrors.certificateType = 'Certificate type is required';
    }
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    // Validate age range if provided
    if (formData.ageRange.min || formData.ageRange.max) {
      const min = parseInt(formData.ageRange.min);
      const max = parseInt(formData.ageRange.max);
      
      if (formData.ageRange.min && (isNaN(min) || min < 0)) {
        newErrors.ageMin = 'Minimum age must be a positive number';
      }
      if (formData.ageRange.max && (isNaN(max) || max < 0)) {
        newErrors.ageMax = 'Maximum age must be a positive number';
      }
      if (formData.ageRange.min && formData.ageRange.max && min > max) {
        newErrors.ageRange = 'Minimum age cannot be greater than maximum age';
      }
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
      const submitData = { ...formData };
      
      // Convert age range to numbers if provided
      if (submitData.ageRange.min) {
        submitData.ageRange.min = parseInt(submitData.ageRange.min);
      }
      if (submitData.ageRange.max) {
        submitData.ageRange.max = parseInt(submitData.ageRange.max);
      }

      // Remove age range if both min and max are empty
      if (!submitData.ageRange.min && !submitData.ageRange.max) {
        delete submitData.ageRange;
      }

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to save training. Please try again.');
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

  // Handle age range changes
  const handleAgeRangeChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      ageRange: {
        ...prev.ageRange,
        [field]: value
      }
    }));

    // Clear age-related errors
    if (errors[`age${field.charAt(0).toUpperCase() + field.slice(1)}`] || errors.ageRange) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`age${field.charAt(0).toUpperCase() + field.slice(1)}`];
        delete newErrors.ageRange;
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Briefcase className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {data ? 'Edit Vocational Training' : 'Add Vocational Training'}
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
          {/* Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Field *
            </label>
            <input
              type="text"
              value={formData.field}
              onChange={(e) => handleInputChange('field', e.target.value)}
              placeholder="e.g., Information Technology, Healthcare, Business"
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none ${
                errors.field ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.field && (
              <p className="mt-1 text-sm text-red-600">{errors.field}</p>
            )}
          </div>

          {/* Specialty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specialty *
            </label>
            <input
              type="text"
              value={formData.specialty}
              onChange={(e) => handleInputChange('specialty', e.target.value)}
              placeholder="e.g., Web Development, Nursing, Marketing"
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none ${
                errors.specialty ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.specialty && (
              <p className="mt-1 text-sm text-red-600">{errors.specialty}</p>
            )}
          </div>

          {/* Certificate Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Certificate Type *
            </label>
            <input
              type="text"
              value={formData.certificateType}
              onChange={(e) => handleInputChange('certificateType', e.target.value)}
              placeholder="e.g., Diploma, Certificate, Professional License"
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none ${
                errors.certificateType ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.certificateType && (
              <p className="mt-1 text-sm text-red-600">{errors.certificateType}</p>
            )}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender *
            </label>
            <select
              value={formData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none ${
                errors.gender ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select gender...</option>
              <option value="men">Men only</option>
              <option value="women">Women only</option>
              <option value="mixed">Mixed</option>
            </select>
            {errors.gender && (
              <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
            )}
          </div>

          {/* Age Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age Requirement (Optional)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Minimum Age</label>
                <input
                  type="number"
                  value={formData.ageRange.min}
                  onChange={(e) => handleAgeRangeChange('min', e.target.value)}
                  placeholder="Min age"
                  min="0"
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none ${
                    errors.ageMin ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.ageMin && (
                  <p className="mt-1 text-sm text-red-600">{errors.ageMin}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Maximum Age</label>
                <input
                  type="number"
                  value={formData.ageRange.max}
                  onChange={(e) => handleAgeRangeChange('max', e.target.value)}
                  placeholder="Max age"
                  min="0"
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none ${
                    errors.ageMax ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.ageMax && (
                  <p className="mt-1 text-sm text-red-600">{errors.ageMax}</p>
                )}
              </div>
            </div>
            {errors.ageRange && (
              <p className="mt-1 text-sm text-red-600">{errors.ageRange}</p>
            )}
          </div>

          {/* Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Field:</strong> {formData.field || 'Not specified'}</p>
              <p><strong>Specialty:</strong> {formData.specialty || 'Not specified'}</p>
              <p><strong>Certificate:</strong> {formData.certificateType || 'Not specified'}</p>
              <p><strong>Gender:</strong> {formData.gender ? formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1) : 'Not specified'}</p>
              {(formData.ageRange.min || formData.ageRange.max) && (
                <p><strong>Age Range:</strong> {formData.ageRange.min || 'Any'} - {formData.ageRange.max || 'Any'}</p>
              )}
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
            {loading ? 'Saving...' : (data ? 'Update' : 'Create') + ' Training'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VocationalTrainingForm;
