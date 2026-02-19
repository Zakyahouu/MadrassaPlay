// client/src/components/manager/builder/SEOTab.jsx

import React from 'react';
import { Search, Globe, Share2 } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

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
  const { t } = useLanguage();
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
            <h2 className="text-2xl font-bold text-gray-900">{t.seoSettings}</h2>
            <p className="text-gray-600">{t.seoDescription}</p>
          </div>
        </div>

        {/* Basic SEO */}
        <div className="space-y-4 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.metaTitle}
            </label>
            <input
              type="text"
              value={seo.metaTitle}
              onChange={(e) => handleChange('metaTitle', e.target.value)}
              placeholder={t.metaTitlePlaceholder}
              maxLength={60}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {seo.metaTitle.length}/60 {t.metaTitleNote}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.metaDescription}
            </label>
            <textarea
              value={seo.metaDescription}
              onChange={(e) => handleChange('metaDescription', e.target.value)}
              placeholder={t.metaDescriptionPlaceholder}
              maxLength={160}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {seo.metaDescription.length}/160 {t.metaDescriptionNote}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.keywords}
            </label>
            <input
              type="text"
              value={keywordInputValue}
              onChange={(e) => handleChange('keywords', e.target.value)}
              placeholder={t.keywordsPlaceholder}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t.keywordsNote}
            </p>
          </div>
        </div>
      </div>

      {/* Open Graph / Social Media */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Share2 className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-bold text-gray-900">{t.socialMediaPreview}</h3>
            <p className="text-sm text-gray-600">{t.socialMediaPreviewDesc}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.ogTitle}
            </label>
            <input
              type="text"
              value={seo.ogTitle}
              onChange={(e) => handleChange('ogTitle', e.target.value)}
              placeholder={t.ogTitlePlaceholder}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.ogDescription}
            </label>
            <textarea
              value={seo.ogDescription}
              onChange={(e) => handleChange('ogDescription', e.target.value)}
              placeholder={t.ogDescriptionPlaceholder}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.ogImageUrl}
            </label>
            <input
              type="text"
              value={seo.ogImage}
              onChange={(e) => handleChange('ogImage', e.target.value)}
              placeholder="https://example.com/share-image.jpg"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t.ogImageNote}
            </p>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">{t.googleSearchPreview}</h3>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed">
          <div className="text-blue-700 text-xl mb-1">
            {seo.metaTitle || t.defaultMetaTitle}
          </div>
          <div className="text-green-700 text-sm mb-2">
            {typeof window !== 'undefined' ? window.location.origin : 'https://yourschool.com'} › landing
          </div>
          <div className="text-gray-700 text-sm">
            {seo.metaDescription || t.defaultMetaDescription}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-3">{t.seoBestPractices}</h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>{t.seoTip1}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>{t.seoTip2}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>{t.seoTip3}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>{t.seoTip4}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>{t.seoTip5}</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SEOTab;
