import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

const SupportLessonForm = ({ isOpen, onClose, onSubmit, data }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    level: '',
    grade: '',
    stream: '',
    subject: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Initialize form data if editing
  useEffect(() => {
    if (data) {
      setFormData({
        level: data.level || '',
        grade: data.grade || '',
        stream: data.stream || '',
        subject: data.subject || ''
      });
    }
  }, [data]);

  // Grade options based on level
  const getGradeOptions = (level) => {
    switch (level) {
      case 'primary':
        return [
          { value: 1, label: '1st Grade' },
          { value: 2, label: '2nd Grade' },
          { value: 3, label: '3rd Grade' },
          { value: 4, label: '4th Grade' },
          { value: 5, label: '5th Grade' }
        ];
      case 'middle':
        return [
          { value: 1, label: '1st Grade' },
          { value: 2, label: '2nd Grade' },
          { value: 3, label: '3rd Grade' },
          { value: 4, label: '4th Grade' }
        ];
      case 'high_school':
        return [
          { value: 1, label: '1st Year' },
          { value: 2, label: '2nd Year' },
          { value: 3, label: '3rd Year' }
        ];
      default:
        return [];
    }
  };

  // Stream options based on level and grade
  const getStreamOptions = (level, grade) => {
    if (level !== 'high_school') return [];
    
    if (grade === 1) {
      return [
        { value: 'common core science and technology', label: 'Common Core Science and Technology (جذع مشترك علوم وتكنولوجيا)' },
        { value: 'common core arts', label: 'Common Core Arts (جذع مشترك اداب)' }
      ];
    } else if (grade === 2 || grade === 3) {
      return [
        { value: 'experimental sciences', label: 'Experimental Sciences' },
        { value: 'technical math', label: 'Technical Math' },
        { value: 'mathematics', label: 'Mathematics' },
        { value: 'management & economics', label: 'Management & Economics' },
        { value: 'foreign languages', label: 'Foreign Languages' },
        { value: 'literature & philosophy', label: 'Literature & Philosophy' }
      ];
    }
    return [];
  };

  // Validation
  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.level) {
          newErrors.level = 'Please select a level';
        }
        break;
      case 2:
        if (!formData.grade) {
          newErrors.grade = 'Please select a grade/year';
        }
        break;
      case 3:
        if (formData.level === 'high_school' && !formData.stream) {
          newErrors.stream = 'Please select a stream';
        }
        break;
      case 4:
        if (!formData.subject.trim()) {
          newErrors.subject = 'Please enter a subject name';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 4) {
        handleSubmit();
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    try {
      const submitData = { ...formData };
      
      // Remove stream if not high school
      if (submitData.level !== 'high_school') {
        delete submitData.stream;
      }

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to save lesson. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Reset dependent fields when level or grade changes
      if (field === 'level') {
        newData.grade = '';
        newData.stream = '';
      } else if (field === 'grade') {
        newData.stream = '';
      }
      
      return newData;
    });

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  const gradeOptions = getGradeOptions(formData.level);
  const streamOptions = getStreamOptions(formData.level, formData.grade);
  const isHighSchool = formData.level === 'high_school';
  const showStreamStep = isHighSchool && formData.grade;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {data ? 'Edit Support Lesson' : 'Add Support Lesson'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => {
              const isActive = step === currentStep;
              const isCompleted = step < currentStep;
              const isStreamStep = step === 3 && !showStreamStep;
              
              return (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {isCompleted ? '✓' : step}
                  </div>
                  {step < 4 && (
                    <div
                      className={`w-12 h-1 mx-2 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Step {currentStep} of 4
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {/* Step 1: Select Level */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Level
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => handleInputChange('level', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none ${
                    errors.level ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Choose a level...</option>
                  <option value="primary">Primary School</option>
                  <option value="middle">Middle School</option>
                  <option value="high_school">High School</option>
                </select>
                {errors.level && (
                  <p className="mt-1 text-sm text-red-600">{errors.level}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Select Grade/Year */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select {formData.level === 'high_school' ? 'Year' : 'Grade'}
                </label>
                <select
                  value={formData.grade}
                  onChange={(e) => handleInputChange('grade', parseInt(e.target.value))}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none ${
                    errors.grade ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Choose a {formData.level === 'high_school' ? 'year' : 'grade'}...</option>
                  {gradeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.grade && (
                  <p className="mt-1 text-sm text-red-600">{errors.grade}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Select Stream (High School Only) */}
          {currentStep === 3 && showStreamStep && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Stream
                </label>
                <select
                  value={formData.stream}
                  onChange={(e) => handleInputChange('stream', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none ${
                    errors.stream ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Choose a stream...</option>
                  {streamOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.stream && (
                  <p className="mt-1 text-sm text-red-600">{errors.stream}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Enter Subject */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  placeholder="Enter subject name (e.g., Mathematics, Physics, English)"
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none ${
                    errors.subject ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                )}
              </div>
            </div>
          )}

          {/* Summary for final step */}
          {currentStep === 4 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Level:</strong> {formData.level === 'primary' ? 'Primary School' : formData.level === 'middle' ? 'Middle School' : 'High School'}</p>
                <p><strong>Grade/Year:</strong> {formData.grade && gradeOptions.find(g => g.value === formData.grade)?.label}</p>
                {formData.stream && <p><strong>Stream:</strong> {streamOptions.find(s => s.value === formData.stream)?.label}</p>}
                <p><strong>Subject:</strong> {formData.subject}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={currentStep === 1 ? onClose : handlePrevious}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            disabled={loading}
          >
            <ChevronLeft className="w-4 h-4" />
            {currentStep === 1 ? 'Cancel' : 'Previous'}
          </button>
          
          <button
            onClick={handleNext}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              'Saving...'
            ) : currentStep === 4 ? (
              <>
                {data ? 'Update' : 'Create'} Lesson
                <ChevronRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupportLessonForm;
