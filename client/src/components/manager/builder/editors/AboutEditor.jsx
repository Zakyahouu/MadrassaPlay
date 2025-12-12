// client/src/components/manager/builder/editors/AboutEditor.jsx

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const AboutEditor = ({ data, onChange, showMessage }) => {
  const aboutData = data || {
    title: '',
    description: '',
    image: '',
    stats: []
  };

  const handleChange = (field, value) => {
    onChange({ ...aboutData, [field]: value });
  };

  const handleStatChange = (index, field, value) => {
    const updated = [...aboutData.stats];
    updated[index] = { ...updated[index], [field]: value };
    handleChange('stats', updated);
  };

  const addStat = () => {
    handleChange('stats', [
      ...aboutData.stats,
      { value: '100+', label: 'New Stat' }
    ]);
    showMessage?.('Stat added', 'success');
  };

  const removeStat = (index) => {
    handleChange('stats', aboutData.stats.filter((_, i) => i !== index));
    showMessage?.('Stat removed', 'success');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">About Section</h3>
        <p className="text-sm text-gray-600">Tell visitors about your school</p>
      </div>

      <div className="bg-white border rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Section Title
          </label>
          <input
            type="text"
            value={aboutData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="About Us"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={aboutData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Tell your story..."
            rows={5}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Image URL
          </label>
          <input
            type="text"
            value={aboutData.image}
            onChange={(e) => handleChange('image', e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Use the Media tab to upload images</p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900">Statistics</h4>
          <button
            onClick={addStat}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Stat
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {aboutData.stats?.map((stat, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input
                type="text"
                value={stat.value}
                onChange={(e) => handleStatChange(index, 'value', e.target.value)}
                placeholder="100+"
                className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={stat.label}
                onChange={(e) => handleStatChange(index, 'label', e.target.value)}
                placeholder="Label"
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => removeStat(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {aboutData.stats?.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            No stats added yet. Stats help showcase your achievements.
          </p>
        )}
      </div>
    </div>
  );
};

export default AboutEditor;
