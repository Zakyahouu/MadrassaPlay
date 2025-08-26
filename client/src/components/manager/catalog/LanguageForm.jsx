import React, { useState, useEffect } from 'react';
import { X, Languages, Plus, X as XIcon } from 'lucide-react';

const LanguageForm = ({ isOpen, onClose, onSubmit, data }) => {
  const [formData, setFormData] = useState({
    language: '',
    levels: ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [customLanguage, setCustomLanguage] = useState('');
  const [newLevel, setNewLevel] = useState('');

  // Predefined languages
  const predefinedLanguages = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian',
    'Chinese (Mandarin)', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Bengali',
    'Turkish', 'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Tamazight'
  ];

  // Initialize form data if editing
  useEffect(() => {
    if (data) {
      setFormData({
        language: data.language || '',
        levels: data.levels || ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']
      });
    }
  }, [data]);

  // Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.language.trim()) {
      newErrors.language = 'Language is required';
    }

    if (formData.levels.length === 0) {
      newErrors.levels = 'At least one level is required';
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
      alert('Failed to save language. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle language selection
  const handleLanguageChange = (language) => {
    setFormData(prev => ({
      ...prev,
      language: language
    }));
    setCustomLanguage('');
    
    if (errors.language) {
      setErrors(prev => ({ ...prev, language: '' }));
    }
  };

  // Handle custom language
  const handleCustomLanguage = () => {
    if (customLanguage.trim()) {
      handleLanguageChange(customLanguage.trim());
    }
  };

  // Handle level management
  const addLevel = () => {
    if (newLevel.trim() && !formData.levels.includes(newLevel.trim())) {
      setFormData(prev => ({
        ...prev,
        levels: [...prev.levels, newLevel.trim()]
      }));
      setNewLevel('');
      
      if (errors.levels) {
        setErrors(prev => ({ ...prev, levels: '' }));
      }
    }
  };

  const removeLevel = (levelToRemove) => {
    setFormData(prev => ({
      ...prev,
      levels: prev.levels.filter(level => level !== levelToRemove)
    }));
  };

  const addPredefinedLevel = (level) => {
    if (!formData.levels.includes(level)) {
      setFormData(prev => ({
        ...prev,
        levels: [...prev.levels, level]
      }));
      
      if (errors.levels) {
        setErrors(prev => ({ ...prev, levels: '' }));
      }
    }
  };

  if (!isOpen) return null;

  const predefinedLevels = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Languages className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {data ? 'Edit Language' : 'Add Language'}
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
          {/* Language Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language *
            </label>
            
            {/* Predefined Languages */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-2">Select from common languages:</label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {predefinedLanguages.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleLanguageChange(lang)}
                    className={`p-2 text-sm rounded border text-left transition-colors ${
                      formData.language === lang
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Language */}
            <div>
              <label className="block text-xs text-gray-600 mb-2">Or enter a custom language:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customLanguage}
                  onChange={(e) => setCustomLanguage(e.target.value)}
                  placeholder="Enter custom language name"
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCustomLanguage}
                  className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Selected Language Display */}
            {formData.language && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Selected:</strong> {formData.language}
                </p>
              </div>
            )}

            {errors.language && (
              <p className="mt-1 text-sm text-red-600">{errors.language}</p>
            )}
          </div>

          {/* Levels Management */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Levels *
            </label>
            
            {/* Predefined CEFR Levels */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-2">Add CEFR levels:</label>
              <div className="flex flex-wrap gap-2">
                {predefinedLevels.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => addPredefinedLevel(level)}
                    disabled={formData.levels.includes(level)}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      formData.levels.includes(level)
                        ? 'bg-green-100 border-green-300 text-green-800 cursor-not-allowed'
                        : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Level */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-2">Add custom level:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value)}
                  placeholder="e.g., Beginner, Intermediate, Advanced"
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addLevel}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Current Levels */}
            <div>
              <label className="block text-xs text-gray-600 mb-2">Current levels:</label>
              <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border border-gray-300 rounded-lg">
                {formData.levels.length > 0 ? (
                  formData.levels.map((level) => (
                    <div
                      key={level}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      <span>{level}</span>
                      <button
                        type="button"
                        onClick={() => removeLevel(level)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <XIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No levels added yet</p>
                )}
              </div>
            </div>

            {errors.levels && (
              <p className="mt-1 text-sm text-red-600">{errors.levels}</p>
            )}
          </div>

          {/* Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Language:</strong> {formData.language || 'Not specified'}</p>
              <p><strong>Levels:</strong> {formData.levels.length > 0 ? formData.levels.join(', ') : 'None'}</p>
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
            {loading ? 'Saving...' : (data ? 'Update' : 'Create') + ' Language'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageForm;
