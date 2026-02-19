// client/src/components/manager/builder/editors/FeaturesEditor.jsx

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '../../../../context/LanguageContext';

const FeaturesEditor = ({ data, onChange, showMessage }) => {
  const { t } = useLanguage();
  const features = data?.features || [];

  const handleFeatureChange = (index, field, value) => {
    const updatedFeatures = [...features];
    updatedFeatures[index] = { ...updatedFeatures[index], [field]: value };
    onChange({ ...data, features: updatedFeatures });
  };

  const addFeature = () => {
    onChange({
      ...data,
      features: [
        ...features,
        {
          icon: 'BookOpen',
          title: t.newFeatureTitle || 'New Feature',
          description: t.newFeatureDesc || 'Feature description goes here'
        }
      ]
    });
    showMessage(t.featureAdded, 'success');
  };

  const removeFeature = (index) => {
    const updatedFeatures = features.filter((_, i) => i !== index);
    onChange({ ...data, features: updatedFeatures });
    showMessage(t.featureRemoved, 'success');
  };

  const iconOptions = [
    'BookOpen', 'Users', 'Video', 'Award', 'Clock',
    'Globe', 'Shield', 'Zap', 'Target', 'TrendingUp',
    'CheckCircle', 'Star', 'Heart', 'MessageCircle', 'Headphones'
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t.featuresHeader}</h3>
          <p className="text-sm text-gray-600">{t.featuresHeaderDesc}</p>
        </div>
        <button
          onClick={addFeature}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          {t.addFeature}
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <div key={index} className="border rounded-lg p-6 space-y-4 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">{t.feature || 'Feature'} {index + 1}</h4>
              <button
                onClick={() => removeFeature(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.iconLabel}
              </label>
              <select
                value={feature.icon}
                onChange={(e) => handleFeatureChange(index, 'icon', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {iconOptions.map((icon) => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.name}
              </label>
              <input
                type="text"
                value={feature.title}
                onChange={(e) => handleFeatureChange(index, 'title', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.description}</label>
              <textarea
                value={feature.description}
                onChange={(e) => handleFeatureChange(index, 'description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        ))}
      </div>

      {features.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <p className="text-gray-500">{t.noFeaturesYet}</p>
        </div>
      )}
    </div>
  );
};

export default FeaturesEditor;
