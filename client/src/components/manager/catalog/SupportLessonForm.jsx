import React, { useState, useEffect, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, BookOpen, Plus, Check } from 'lucide-react';

const SupportLessonForm = ({ isOpen, onClose, onSubmit, data, catalog }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    level: '',
    stream: '',
    selectedGrades: [],
    gradeSubjects: {} // Object to store selected subjects for each grade
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Initialize form data if editing
  useEffect(() => {
    if (data) {
      setFormData({
        level: data.level || '',
        stream: data.stream || '',
        selectedGrades: data.grade ? [data.grade] : [],
        gradeSubjects: data.grade ? { [data.grade]: data.subject ? data.subject.split(',').map(s => s.trim()) : [] } : {}
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

  // Subject options based on level and grade
  const getSubjectOptions = (level, grade, stream) => {
    if (level === 'primary') {
      return [
        'اللغة العربية',
        'اللغة الإنجليزية',
        'الرياضيات',
        'العلوم',
        'التاريخ والجغرافيا',
        'التربية الإسلامية'
      ];
    }
    
    if (level === 'middle') {
      return [
        'اللغة العربية',
        'اللغة الأمازيغية',
        'الرياضيات',
        'العلوم الطبيعية (علوم الطبيعة والحياة)',
        'العلوم الفيزيائية والتكنولوجيا',
        'الاجتماعيات (تاريخ + جغرافيا + تربية مدنية)',
        'التربية الإسلامية',
        'اللغة الفرنسية',
        'اللغة الإنجليزية'
      ];
    }
    
    if (level === 'high_school') {
      if (grade === 1) {
        return [
          'رياضيات',
          'لغة عربية',
          'لغة فرنسية',
          'لغة إنجليزية',
          'علوم طبيعية',
          'فيزياء',
          'تاريخ و جغرافيا',
          'فلسفة',
          'تربية إسلامية'
        ];
      } else if (grade === 2 || grade === 3) {
        switch (stream) {
          case 'experimental sciences':
            return [
              'رياضيات',
              'علوم طبيعية',
              'فيزياء',
              'لغة عربية',
              'لغة فرنسية',
              'لغة إنجليزية',
              'فلسفة',
              'تاريخ وجغرافيا',
              'تربية إسلامية'
            ];
          case 'mathematics':
            return [
              'رياضيات',
              'فيزياء',
              'لغة عربية',
              'لغة فرنسية',
              'لغة إنجليزية',
              'فلسفة',
              'تاريخ وجغرافيا',
              'تربية إسلامية'
            ];
          case 'technical math':
            return [
              'رياضيات',
              'فيزياء',
              'مادة تقنية (هندسة)',
              'لغة عربية',
              'لغة فرنسية',
              'لغة إنجليزية',
              'فلسفة',
              'تاريخ وجغرافيا',
              'تربية إسلامية'
            ];
          case 'management & economics':
            return [
              'رياضيات',
              'اقتصاد ومحاسبة',
              'قانون',
              'لغة عربية',
              'لغة فرنسية',
              'لغة إنجليزية',
              'فلسفة',
              'تاريخ وجغرافيا',
              'تربية إسلامية'
            ];
          case 'literature & philosophy':
            return [
              'لغة عربية',
              'فلسفة',
              'تاريخ و جغرافيا',
              'لغة فرنسية',
              'لغة إنجليزية',
              'تربية إسلامية'
            ];
          case 'foreign languages':
            return [
              'لغة عربية',
              'فلسفة',
              'لغة فرنسية',
              'لغة إنجليزية',
              'لغة أجنبية ثانية (ألمانية/إسبانية)',
              'تاريخ وجغرافيا',
              'تربية إسلامية'
            ];
          default:
            return [];
        }
      }
    }
    
    return [];
  };

  // Stream options for high school
  const getStreamOptions = () => {
    return [
      { 
        value: 'common core science and technology', 
        label: 'Common Core Science and Technology (جذع مشترك علوم وتكنولوجيا)',
        years: [1]
      },
      { 
        value: 'common core literature and languages', 
        label: 'Common Core Arts (جذع مشترك اداب)',
        years: [1]
      },
      { 
        value: 'experimental sciences', 
        label: 'Experimental Sciences',
        years: [2, 3]
      },
      { 
        value: 'technical math', 
        label: 'Technical Math',
        years: [2, 3]
      },
      { 
        value: 'mathematics', 
        label: 'Mathematics',
        years: [2, 3]
      },
      { 
        value: 'management & economics', 
        label: 'Management & Economics',
        years: [2, 3]
      },
      { 
        value: 'foreign languages', 
        label: 'Foreign Languages',
        years: [2, 3]
      },
      { 
        value: 'literature & philosophy', 
        label: 'Literature & Philosophy',
        years: [2, 3]
      }
    ];
  };

  // Get next step based on current step and level
  const getNextStep = (currentStep, level) => {
    if (currentStep === 1) {
      // If primary or middle, skip step 2 (stream selection)
      if (level === 'primary' || level === 'middle') {
        return 3; // Go directly to final step
      } else {
        return 2; // High school goes to stream selection
      }
    }
    return currentStep + 1;
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
        if (formData.level === 'high_school' && !formData.stream) {
          newErrors.stream = 'Please select a stream';
        }
        break;
      case 3:
        if (formData.selectedGrades.length === 0) {
          newErrors.selectedGrades = 'Please select at least one grade';
        }
        // Validate that each selected grade has at least one subject
        const missingSubjects = formData.selectedGrades.filter(grade => 
          !formData.gradeSubjects[grade] || formData.gradeSubjects[grade].length === 0
        );
        if (missingSubjects.length > 0) {
          newErrors.gradeSubjects = 'Please select at least one subject for each selected grade';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 3) {
        handleSubmit();
      } else {
        const nextStep = getNextStep(currentStep, formData.level);
        setCurrentStep(nextStep);
      }
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep === 3 && (formData.level === 'primary' || formData.level === 'middle')) {
      setCurrentStep(1); // Go back to step 1 for primary/middle
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  // Build an array of items to create for add mode
  const buildSubmitItems = () => {
    const items = [];
    for (const grade of formData.selectedGrades) {
      const subjects = formData.gradeSubjects[grade] || [];
      for (let i = 0; i < subjects.length; i++) {
        const submitData = {
          level: formData.level,
          grade,
          subject: subjects[i]
        };
        if (formData.level === 'high_school' && formData.stream) {
          submitData.stream = formData.stream;
        }
        items.push(submitData);
      }
    }
    return items;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    try {
      if (data) {
        // Edit single item: update current item with joined subjects
        const grade = formData.selectedGrades[0];
        const subjects = formData.gradeSubjects[grade] || [];
        const submitData = {
          level: formData.level,
          grade,
          subject: subjects.join(', '),
        };
        if (formData.level === 'high_school' && formData.stream) {
          submitData.stream = formData.stream;
        }
        await onSubmit(submitData);
      } else {
        // Add: send an array and let parent batch-insert and refetch
        const items = buildSubmitItems();
        await onSubmit(items);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to save lesson. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ----- De-duplication against existing catalog -----
  const existingSupportKeys = useMemo(() => {
    const set = new Set();
    if (!catalog || !Array.isArray(catalog.supportLessons)) return set;
    catalog.supportLessons.forEach((item) => {
      const level = (item.level || '').trim();
      const grade = item.grade;
      const stream = (item.stream || '').trim();
      const subjects = (item.subject || '').split(',').map(s => s.trim()).filter(Boolean);
      subjects.forEach((subj) => {
        const key = `${level}|${grade}|${stream}|${subj}`.toLowerCase();
        // If editing, ignore the current item to allow keeping same subject
        if (data && item._id && data._id && item._id.toString() === data._id.toString()) return;
        set.add(key);
      });
    });
    return set;
  }, [catalog, data]);

  const isSubjectAlreadyExists = (grade, subject) => {
    const level = formData.level;
    const stream = formData.level === 'high_school' ? (formData.stream || '') : '';
    const key = `${level}|${grade}|${stream}|${subject}`.toLowerCase();
    return existingSupportKeys.has(key);
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Reset dependent fields when level or stream changes
      if (field === 'level') {
        newData.stream = '';
        newData.selectedGrades = [];
        newData.gradeSubjects = {};
      } else if (field === 'stream') {
        newData.selectedGrades = [];
        newData.gradeSubjects = {};
      }
      
      return newData;
    });

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle grade selection
  const handleGradeToggle = (grade) => {
    setFormData(prev => ({
      ...prev,
      selectedGrades: prev.selectedGrades.includes(grade)
        ? prev.selectedGrades.filter(g => g !== grade)
        : [...prev.selectedGrades, grade]
    }));

    // Clear error for selectedGrades
    if (errors.selectedGrades) {
      setErrors(prev => ({ ...prev, selectedGrades: '' }));
    }
  };

  // Handle subject selection for specific grade
  const handleSubjectToggle = (grade, subject) => {
    setFormData(prev => ({
      ...prev,
      gradeSubjects: {
        ...prev.gradeSubjects,
        [grade]: prev.gradeSubjects[grade]?.includes(subject)
          ? prev.gradeSubjects[grade].filter(s => s !== subject)
          : [...(prev.gradeSubjects[grade] || []), subject]
      }
    }));

    // Clear error for gradeSubjects
    if (errors.gradeSubjects) {
      setErrors(prev => ({ ...prev, gradeSubjects: '' }));
    }
  };

  // Handle select all subjects for a grade
  const handleSelectAllSubjects = (grade) => {
    const subjectOptions = getSubjectOptions(formData.level, grade, formData.stream);
    setFormData(prev => ({
      ...prev,
      gradeSubjects: {
        ...prev.gradeSubjects,
        [grade]: subjectOptions
      }
    }));

    // Clear error for gradeSubjects
    if (errors.gradeSubjects) {
      setErrors(prev => ({ ...prev, gradeSubjects: '' }));
    }
  };

  // Handle deselect all subjects for a grade
  const handleDeselectAllSubjects = (grade) => {
    setFormData(prev => ({
      ...prev,
      gradeSubjects: {
        ...prev.gradeSubjects,
        [grade]: []
      }
    }));

    // Clear error for gradeSubjects
    if (errors.gradeSubjects) {
      setErrors(prev => ({ ...prev, gradeSubjects: '' }));
    }
  };

  // Get available grades for selected stream
  const getAvailableGrades = () => {
    if (formData.level !== 'high_school') {
      return getGradeOptions(formData.level);
    }
    
    if (!formData.stream) return [];
    
    const stream = getStreamOptions().find(s => s.value === formData.stream);
    if (!stream) return [];
    
    return getGradeOptions('high_school').filter(grade => 
      stream.years.includes(grade.value)
    );
  };

  if (!isOpen) return null;

  const gradeOptions = getGradeOptions(formData.level);
  const streamOptions = getStreamOptions();
  const availableGrades = getAvailableGrades();
  const isHighSchool = formData.level === 'high_school';
  const skipStreamStep = formData.level === 'primary' || formData.level === 'middle';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => {
              const isActive = step === currentStep;
              const isCompleted = step < currentStep;
              const isHidden = step === 2 && skipStreamStep;
              
              if (isHidden) return null;
              
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
                    {isCompleted ? <Check className="w-4 h-4" /> : step}
                  </div>
                  {step < 3 && !isHidden && (
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
            Step {currentStep} of {skipStreamStep ? 2 : 3}
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {/* Step 1: Select Level */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Select Level
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => handleInputChange('level', 'primary')}
                    className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                      formData.level === 'primary'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">Primary School</div>
                    <div className="text-sm text-gray-500 mt-1">Grades 1-5</div>
                  </button>
                  
                  <button
                    onClick={() => handleInputChange('level', 'middle')}
                    className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                      formData.level === 'middle'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">Middle School</div>
                    <div className="text-sm text-gray-500 mt-1">Grades 1-4</div>
                  </button>
                  
                  <button
                    onClick={() => handleInputChange('level', 'high_school')}
                    className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                      formData.level === 'high_school'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">High School</div>
                    <div className="text-sm text-gray-500 mt-1">Years 1-3</div>
                  </button>
                </div>
                {errors.level && (
                  <p className="mt-2 text-sm text-red-600">{errors.level}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Select Stream (High School Only) */}
          {currentStep === 2 && isHighSchool && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Select Stream
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {streamOptions.map((stream) => (
                    <button
                      key={stream.value}
                      onClick={() => handleInputChange('stream', stream.value)}
                      className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                        formData.stream === stream.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium">{stream.label}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Available for: {stream.years.map(year => `${year}${year === 1 ? 'st' : year === 2 ? 'nd' : 'rd'} Year`).join(', ')}
                      </div>
                    </button>
                  ))}
                </div>
                {errors.stream && (
                  <p className="mt-2 text-sm text-red-600">{errors.stream}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Grade Selection and Subject Selection */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Grade Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Select Grades to Add Support Lessons
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableGrades.map((grade) => (
                    <div
                      key={grade.value}
                      className={`p-3 border-2 rounded-lg transition-all duration-200 ${
                        formData.selectedGrades.includes(grade.value)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={formData.selectedGrades.includes(grade.value)}
                            onChange={() => handleGradeToggle(grade.value)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="font-medium text-gray-900">{grade.label}</span>
                        </div>
                        {formData.selectedGrades.includes(grade.value) && (
                          <Plus className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {errors.selectedGrades && (
                  <p className="mt-2 text-sm text-red-600">{errors.selectedGrades}</p>
                )}
              </div>

              {/* Subject Selection for Selected Grades */}
              {formData.selectedGrades.length > 0 && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Subjects for Each Grade
                  </label>
                  {formData.selectedGrades.map((grade) => {
                    const gradeOption = availableGrades.find(g => g.value === grade);
                    const subjectOptions = getSubjectOptions(formData.level, grade, formData.stream);
                    const selectedSubjects = formData.gradeSubjects[grade] || [];
                    
                    return (
                      <div key={grade} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-sm font-medium text-gray-700">
                            {gradeOption?.label} Subjects
                          </label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleSelectAllSubjects(grade)}
                              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              Select All
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeselectAllSubjects(grade)}
                              className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                            >
                              Clear All
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {subjectOptions.map((subject) => {
                            const disabled = !data && isSubjectAlreadyExists(grade, subject);
                            return (
                            <div key={subject} className={`flex items-center gap-2 ${disabled ? 'opacity-50' : ''}`}>
                              <input
                                type="checkbox"
                                checked={selectedSubjects.includes(subject)}
                                onChange={() => !disabled && handleSubjectToggle(grade, subject)}
                                disabled={disabled}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">{subject}</span>
                            </div>
                          );})}
                        </div>
                        {selectedSubjects.length > 0 && (
                          <p className="mt-2 text-xs text-blue-600">
                            Selected: {selectedSubjects.join(', ')}
                          </p>
                        )}
                      </div>
                    );
                  })}
                  {errors.gradeSubjects && (
                    <p className="text-sm text-red-600">{errors.gradeSubjects}</p>
                  )}
                </div>
              )}

              {/* Summary */}
              {formData.selectedGrades.length > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Summary</h4>
                  <div className="space-y-1 text-sm text-blue-800">
                    <p><strong>Level:</strong> {formData.level === 'primary' ? 'Primary School' : formData.level === 'middle' ? 'Middle School' : 'High School'}</p>
                    {formData.stream && <p><strong>Stream:</strong> {streamOptions.find(s => s.value === formData.stream)?.label}</p>}
                    <p><strong>Grades & Subjects:</strong></p>
                    <ul className="ml-4 space-y-1">
                      {formData.selectedGrades.map(grade => {
                        const gradeOption = availableGrades.find(g => g.value === grade);
                        const subjects = formData.gradeSubjects[grade] || [];
                        return (
                          <li key={grade}>
                            • <strong>{gradeOption?.label}:</strong> {subjects.length > 0 ? subjects.join(', ') : 'No subjects selected'}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              )}
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
            ) : currentStep === 3 ? (
              <>
                {data ? 'Update' : 'Create'} Lesson{formData.selectedGrades.length > 1 ? 's' : ''}
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
