// client/src/components/manager/builder/editors/HeroEditor.jsx

import React from 'react';
import { useLanguage } from '../../../../context/LanguageContext';

const HeroEditor = ({ data, onChange }) => {
  const { t } = useLanguage();
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const handleButtonChange = (index, field, value) => {
    const buttons = [...(data.ctaButtons || [])];
    buttons[index] = { ...buttons[index], [field]: value };
    onChange({ ...data, ctaButtons: buttons });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.heroTitle}
        </label>
        <input
          type="text"
          value={data.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={t.heroTitlePlaceholder}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.subtitle}
        </label>
        <textarea
          value={data.subtitle || ''}
          onChange={(e) => handleChange('subtitle', e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={t.heroSubtitlePlaceholder}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.bgImageUrl}
        </label>
        <input
          type="text"
          value={data.backgroundImage || ''}
          onChange={(e) => handleChange('backgroundImage', e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="https://..."
        />
      </div>

      {/* CTA Buttons */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.ctaButtons}
        </label>
        {(data.ctaButtons || []).map((button, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={button.text}
              onChange={(e) => handleButtonChange(index, 'text', e.target.value)}
              placeholder={t.buttonText}
              className="flex-1 px-3 py-2 border rounded-lg"
            />
            <input
              type="text"
              value={button.link}
              onChange={(e) => handleButtonChange(index, 'link', e.target.value)}
              placeholder="#section"
              className="flex-1 px-3 py-2 border rounded-lg"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeroEditor;
