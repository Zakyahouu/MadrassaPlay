// client/src/components/manager/builder/SEOTab.jsx

import React from 'react';
import { Search, Globe, Share2 } from 'lucide-react';

const defaultSeo = {
  metaTitle: '',
  metaDescription: '',
  keywords: [],
  ogImage: '',
  ogTitle: '',
  ogDescription: ''
};

const normalizeKeywords = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean);
  }
  return [];
};

const asInputString = (value) => {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'string') return value;
  return '';
};

const sanitizeText = (value) => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return String(value);
};

const SEOTab = ({ config, setConfig }) => {
  const rawSeo = config?.seo || {};
  const seo = {
    ...defaultSeo,
    ...rawSeo,
    metaTitle: sanitizeText(rawSeo.metaTitle ?? defaultSeo.metaTitle),
    metaDescription: sanitizeText(rawSeo.metaDescription ?? defaultSeo.metaDescription),
    ogImage: sanitizeText(rawSeo.ogImage ?? defaultSeo.ogImage),
    ogTitle: sanitizeText(rawSeo.ogTitle ?? defaultSeo.ogTitle),
    ogDescription: sanitizeText(rawSeo.ogDescription ?? defaultSeo.ogDescription),
    keywords: normalizeKeywords(rawSeo.keywords)
  };

  const keywordInputValue = asInputString(seo.keywords);

  const handleChange = (field, value) => {
    if (typeof setConfig !== 'function') return;

    setConfig((prev) => {
      const previousSeo = {
        ...defaultSeo,
        ...(prev?.seo || {})
      };

      let nextValue = value;
      if (field === 'keywords') {
        nextValue = normalizeKeywords(value);
      }

      return {
        ...(prev || {}),
        seo: {
          ...previousSeo,
          [field]: field === 'keywords' ? nextValue : sanitizeText(nextValue)
        }
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Search className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">SEO Settings</h2>
            <p className="text-gray-600">Optimize your landing page for search engines</p>
          </div>
        </div>

        {/* Basic SEO */}
        <div className="space-y-4 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meta Title
            </label>
            <input
              type="text"
              value={seo.metaTitle}
              onChange={(e) => handleChange('metaTitle', e.target.value)}
              placeholder="Your School Name - Online Tutoring Platform"
              maxLength={60}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {seo.metaTitle.length}/60 characters (aim for 50-60)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meta Description
            </label>
            <textarea
              value={seo.metaDescription}
              onChange={(e) => handleChange('metaDescription', e.target.value)}
              placeholder="Brief description of your school and courses..."
              maxLength={160}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {seo.metaDescription.length}/160 characters (aim for 150-160)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keywords
            </label>
            <input
              type="text"
              value={keywordInputValue}
              onChange={(e) => handleChange('keywords', e.target.value)}
              placeholder="online tutoring, math courses, learning platform"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate keywords with commas
            </p>
          </div>
        </div>
      </div>

      {/* Open Graph / Social Media */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Share2 className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-bold text-gray-900">Social Media Preview</h3>
            <p className="text-sm text-gray-600">How your page appears when shared on social media</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              OG Title (Facebook/LinkedIn)
            </label>
            <input
              type="text"
              value={seo.ogTitle}
              onChange={(e) => handleChange('ogTitle', e.target.value)}
              placeholder="Leave blank to use Meta Title"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              OG Description
            </label>
            <textarea
              value={seo.ogDescription}
              onChange={(e) => handleChange('ogDescription', e.target.value)}
              placeholder="Leave blank to use Meta Description"
              rows={2}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              OG Image URL
            </label>
            <input
              type="text"
              value={seo.ogImage}
              onChange={(e) => handleChange('ogImage', e.target.value)}
              placeholder="https://example.com/share-image.jpg"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Recommended size: 1200x630px. Use the Media tab to upload images.
            </p>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">Google Search Preview</h3>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed">
          <div className="text-blue-700 text-xl mb-1">
            {seo.metaTitle || 'Your Page Title'}
          </div>
          <div className="text-green-700 text-sm mb-2">
            {typeof window !== 'undefined' ? window.location.origin : 'https://yourschool.com'} › landing
          </div>
          <div className="text-gray-700 text-sm">
            {seo.metaDescription || 'Your meta description will appear here. Write a compelling description that encourages users to click.'}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-3">SEO Best Practices</h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>Keep your meta title under 60 characters to avoid truncation in search results</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>Write unique, descriptive meta descriptions that include your primary keywords</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>Include your school name and main value proposition in the title</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>Use high-quality images (1200x630px) for social media sharing</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>Test your page with Google's Rich Results Test tool</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SEOTab;
