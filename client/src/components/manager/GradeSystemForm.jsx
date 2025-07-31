import React, { useState } from 'react';
import axios from 'axios';

const GradeSystemForm = ({ schoolId, system, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: system?.name || '',
    type: system?.type || 'academic',
    levels: system?.levels || []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Predefined levels for quick setup
  const predefinedLevels = {
    language: [
      { name: 'Beginner 1', code: 'A1', order: 1, description: 'Basic introduction level' },
      { name: 'Beginner 2', code: 'A2', order: 2, description: 'Elementary level' },
      { name: 'Intermediate 1', code: 'B1', order: 3, description: 'Threshold level' },
      { name: 'Intermediate 2', code: 'B2', order: 4, description: 'Vantage level' },
      { name: 'Advanced 1', code: 'C1', order: 5, description: 'Effective operational proficiency' },
      { name: 'Advanced 2', code: 'C2', order: 6, description: 'Mastery level' }
    ],
    academic: {
      primary: [
        { name: 'Grade 1', code: 'G1', order: 1, description: 'First grade' },
        { name: 'Grade 2', code: 'G2', order: 2, description: 'Second grade' },
        { name: 'Grade 3', code: 'G3', order: 3, description: 'Third grade' },
        { name: 'Grade 4', code: 'G4', order: 4, description: 'Fourth grade' },
        { name: 'Grade 5', code: 'G5', order: 5, description: 'Fifth grade' },
      ],
      middle: [
        { name: 'Grade 6', code: 'G6', order: 6, description: 'Sixth grade' },
        { name: 'Grade 7', code: 'G7', order: 7, description: 'Seventh grade' },
        { name: 'Grade 8', code: 'G8', order: 8, description: 'Eighth grade' },
      ],
      high: [
        { name: 'Grade 9', code: 'G9', order: 9, description: 'Ninth grade' },
        { name: 'Grade 10', code: 'G10', order: 10, description: 'Tenth grade' },
        { name: 'Grade 11', code: 'G11', order: 11, description: 'Eleventh grade' },
        { name: 'Grade 12', code: 'G12', order: 12, description: 'Twelfth grade' },
      ]
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.levels.length === 0) {
      setError('Please add at least one level');
      return;
    }

    setLoading(true);
    try {
      if (system) {
        await axios.put(`/api/schools/${schoolId}/grades/${system._id}`, formData);
      } else {
        await axios.post(`/api/schools/${schoolId}/grades`, formData);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save grade system');
    } finally {
      setLoading(false);
    }
  };

  const addLevel = () => {
    setFormData({
      ...formData,
      levels: [
        ...formData.levels,
        {
          name: '',
          code: '',
          order: formData.levels.length + 1,
          description: ''
        }
      ]
    });
  };

  const removeLevel = (index) => {
    setFormData({
      ...formData,
      levels: formData.levels.filter((_, i) => i !== index)
    });
  };

  const addPredefinedLevels = (type, category = null) => {
    let levelsToAdd = [];
    
    if (type === 'language') {
      levelsToAdd = predefinedLevels.language;
    } else if (type === 'academic' && category) {
      levelsToAdd = predefinedLevels.academic[category];
    }

    setFormData({
      ...formData,
      levels: [...formData.levels, ...levelsToAdd]
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {system ? 'Edit Grade System' : 'Create Grade System'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-red-500">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">System Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="e.g., Language Proficiency Levels or Academic Grades"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">System Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full p-2 border rounded"
                disabled={!!system}
              >
                <option value="academic">Academic</option>
                <option value="language">Language</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Grade Levels</h3>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={addLevel}
                  className="px-2 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  + Add Custom Level
                </button>
                
                {formData.type === 'language' && (
                  <button
                    type="button"
                    onClick={() => addPredefinedLevels('language')}
                    className="px-2 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    + Add Language Levels (A1-C2)
                  </button>
                )}
                
                {formData.type === 'academic' && (
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => addPredefinedLevels('academic', 'primary')}
                      className="px-2 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      + Primary Grades
                    </button>
                    <button
                      type="button"
                      onClick={() => addPredefinedLevels('academic', 'middle')}
                      className="px-2 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
                    >
                      + Middle Grades
                    </button>
                    <button
                      type="button"
                      onClick={() => addPredefinedLevels('academic', 'high')}
                      className="px-2 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      + High School
                    </button>
                  </div>
                )}
              </div>
            </div>

            {formData.levels.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.levels.sort((a, b) => a.order - b.order).map((level, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            value={level.order}
                            onChange={(e) => {
                              const newLevels = [...formData.levels];
                              newLevels[index].order = parseInt(e.target.value) || 0;
                              setFormData({ ...formData, levels: newLevels });
                            }}
                            className="w-16 p-1 border rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={level.name}
                            onChange={(e) => {
                              const newLevels = [...formData.levels];
                              newLevels[index].name = e.target.value;
                              setFormData({ ...formData, levels: newLevels });
                            }}
                            className="w-full p-1 border rounded"
                            required
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={level.code}
                            onChange={(e) => {
                              const newLevels = [...formData.levels];
                              newLevels[index].code = e.target.value;
                              setFormData({ ...formData, levels: newLevels });
                            }}
                            className="w-24 p-1 border rounded"
                            required
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={level.description || ''}
                            onChange={(e) => {
                              const newLevels = [...formData.levels];
                              newLevels[index].description = e.target.value;
                              setFormData({ ...formData, levels: newLevels });
                            }}
                            className="w-full p-1 border rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => removeLevel(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p>No levels added yet. Add levels using the buttons above.</p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading ? 'Saving...' : 'Save Grade System'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GradeSystemForm;
