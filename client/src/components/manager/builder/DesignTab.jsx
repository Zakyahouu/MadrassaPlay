// client/src/components/manager/builder/DesignTab.jsx

import React from 'react';
import { Palette } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

const DesignTab = ({ config, updateConfig }) => {
  const { t } = useLanguage();
  const theme = config?.theme || {};

  const handleThemeChange = (field, value) => {
    updateConfig({
      theme: { ...theme, [field]: value }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Palette className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t.designTheme}</h2>
            <p className="text-gray-600">{t.designThemeDescription}</p>
          </div>
        </div>

        {/* Color Scheme */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.colorScheme}</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.primaryColor}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={theme.primaryColor || '#3B82F6'}
                  onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                  className="w-16 h-10 border rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={theme.primaryColor || '#3B82F6'}
                  onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.secondaryColor}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={theme.secondaryColor || '#F97316'}
                  onChange={(e) => handleThemeChange('secondaryColor', e.target.value)}
                  className="w-16 h-10 border rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={theme.secondaryColor || '#F97316'}
                  onChange={(e) => handleThemeChange('secondaryColor', e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.accentColor}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={theme.accentColor || '#8B5CF6'}
                  onChange={(e) => handleThemeChange('accentColor', e.target.value)}
                  className="w-16 h-10 border rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={theme.accentColor || '#8B5CF6'}
                  onChange={(e) => handleThemeChange('accentColor', e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.textColor}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={theme.textColor || '#1F2937'}
                  onChange={(e) => handleThemeChange('textColor', e.target.value)}
                  className="w-16 h-10 border rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={theme.textColor || '#1F2937'}
                  onChange={(e) => handleThemeChange('textColor', e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Font Family */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.fontFamily}
            </label>
            <select
              value={theme.fontFamily || 'Inter'}
              onChange={(e) => handleThemeChange('fontFamily', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Lato">Lato</option>
              <option value="Poppins">Poppins</option>
              <option value="Montserrat">Montserrat</option>
            </select>
          </div>

          {/* Button Style */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.buttonStyle}
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => handleThemeChange('buttonStyle', 'rounded')}
                className={`px-6 py-2 rounded-lg font-medium border-2 transition-colors ${theme.buttonStyle === 'rounded'
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-300 text-gray-700'
                  }`}
              >
                {t.roundedStyle}
              </button>
              <button
                onClick={() => handleThemeChange('buttonStyle', 'square')}
                className={`px-6 py-2 font-medium border-2 transition-colors ${theme.buttonStyle === 'square'
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-300 text-gray-700'
                  }`}
              >
                {t.squareStyle}
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-4">{t.preview}</h4>
            <div className="flex gap-4">
              <button
                className="px-6 py-3 font-semibold text-white transition-all"
                style={{
                  backgroundColor: theme.primaryColor || '#3B82F6',
                  borderRadius: theme.buttonStyle === 'rounded' ? '0.5rem' : '0'
                }}
              >
                {t.primaryButton}
              </button>
              <button
                className="px-6 py-3 font-semibold text-white transition-all"
                style={{
                  backgroundColor: theme.secondaryColor || '#F97316',
                  borderRadius: theme.buttonStyle === 'rounded' ? '0.5rem' : '0'
                }}
              >
                {t.secondaryButton}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignTab;
