// client/src/components/manager/builder/editors/FooterEditor.jsx

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const FooterEditor = ({ data, onChange, showMessage }) => {
  const footerData = data || {
    text: '',
    socialLinks: [],
    quickLinks: []
  };

  const handleChange = (field, value) => {
    onChange({ ...footerData, [field]: value });
  };

  const handleSocialLinkChange = (index, field, value) => {
    const updated = [...footerData.socialLinks];
    updated[index] = { ...updated[index], [field]: value };
    handleChange('socialLinks', updated);
  };

  const addSocialLink = () => {
    handleChange('socialLinks', [
      ...footerData.socialLinks,
      { platform: 'Facebook', url: 'https://facebook.com' }
    ]);
    showMessage('Social link added', 'success');
  };

  const removeSocialLink = (index) => {
    handleChange('socialLinks', footerData.socialLinks.filter((_, i) => i !== index));
    showMessage('Social link removed', 'success');
  };

  const handleQuickLinkChange = (index, field, value) => {
    const updated = [...footerData.quickLinks];
    updated[index] = { ...updated[index], [field]: value };
    handleChange('quickLinks', updated);
  };

  const addQuickLink = () => {
    handleChange('quickLinks', [
      ...footerData.quickLinks,
      { text: 'New Link', url: '#' }
    ]);
    showMessage('Quick link added', 'success');
  };

  const removeQuickLink = (index) => {
    handleChange('quickLinks', footerData.quickLinks.filter((_, i) => i !== index));
    showMessage('Quick link removed', 'success');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Footer</h3>
        <p className="text-sm text-gray-600">Customize your footer content</p>
      </div>

      {/* Copyright Text */}
      <div className="bg-white border rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Copyright Text
        </label>
        <input
          type="text"
          value={footerData.text}
          onChange={(e) => handleChange('text', e.target.value)}
          placeholder="© 2024 Your School. All rights reserved."
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Social Links */}
      <div className="bg-white border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900">Social Media Links</h4>
          <button
            onClick={addSocialLink}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Link
          </button>
        </div>

        {footerData.socialLinks?.map((link, index) => (
          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <select
              value={link.platform}
              onChange={(e) => handleSocialLinkChange(index, 'platform', e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option>Facebook</option>
              <option>Twitter</option>
              <option>Instagram</option>
              <option>LinkedIn</option>
              <option>YouTube</option>
            </select>
            <input
              type="url"
              value={link.url}
              onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
              placeholder="https://..."
              className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => removeSocialLink(index)}
              className="p-2 text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="bg-white border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900">Quick Links</h4>
          <button
            onClick={addQuickLink}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Link
          </button>
        </div>

        {footerData.quickLinks?.map((link, index) => (
          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <input
              type="text"
              value={link.text}
              onChange={(e) => handleQuickLinkChange(index, 'text', e.target.value)}
              placeholder="Link Text"
              className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={link.url}
              onChange={(e) => handleQuickLinkChange(index, 'url', e.target.value)}
              placeholder="#section or URL"
              className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => removeQuickLink(index)}
              className="p-2 text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FooterEditor;
