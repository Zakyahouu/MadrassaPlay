// client/src/components/manager/builder/MediaTab.jsx

import React, { useEffect, useMemo, useState } from 'react';
import { Upload, Image as ImageIcon, ListChecks, Link2, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../../../context/LanguageContext';

const IMAGE_FIELD_KEYS = ['image', 'photo', 'backgroundimage', 'ogimage', 'logo', 'bannerimage', 'thumbnail'];

const formatKeyLabel = (key = '') =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());

const setValueAtPath = (target, path, value) => {
  if (!path.length) return value;

  const [head, ...rest] = path;
  const key = head;
  const clone = Array.isArray(target) ? [...target] : { ...(target || {}) };

  clone[key] = rest.length
    ? setValueAtPath(clone[key], rest, value)
    : value;

  return clone;
};

const updateSectionsForField = (sections = [], sectionIndex, path, value) => {
  if (!Array.isArray(sections) || !sections[sectionIndex]) return sections;

  const updatedSections = [...sections];
  const targetSection = { ...updatedSections[sectionIndex] };
  targetSection.data = setValueAtPath(targetSection.data || {}, path, value);
  updatedSections[sectionIndex] = targetSection;

  return updatedSections;
};

const getStoredUploads = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('mp_recent_media_uploads');
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Failed to parse stored uploads', error);
    return [];
  }
};

const MediaTab = ({ config, updateConfig, showMessage }) => {
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [recentUploads, setRecentUploads] = useState(getStoredUploads);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState('');
  const [customUrl, setCustomUrl] = useState('');

  const sectionLabels = {
    hero: t.heroSection,
    about: t.aboutSection,
    programs: t.programsCourses,
    teachers: t.teachersSection,
    testimonials: t.testimonialsSection,
    features: t.featuresSection,
    pricing: t.pricingPlans,
    faq: t.faqSection,
    contact: t.contactSection,
    footer: t.footerSection
  };

  const formatArrayLabel = (parentKey = '', index = 0) => {
    if (!parentKey) return `${t.item} ${index + 1}`;
    const label = formatKeyLabel(parentKey) || t.item;
    const singular = label.endsWith('s') ? label.slice(0, -1) : label;
    return `${singular || t.item} ${index + 1}`;
  };

  const extractImageFields = (sections = []) => {
    const fields = [];

    sections.forEach((section, sectionIndex) => {
      const baseLabel = sectionLabels[section?.type] || `${t.section} ${sectionIndex + 1}`;

      const traverse = (value, path, labelParts, parentKey = '') => {
        if (Array.isArray(value)) {
          value.forEach((item, idx) => {
            traverse(item, [...path, idx], [...labelParts, formatArrayLabel(parentKey, idx)], parentKey);
          });
          return;
        }

        if (value && typeof value === 'object') {
          Object.entries(value).forEach(([key, nested]) => {
            const formattedKey = formatKeyLabel(key);
            if (typeof nested === 'string' && IMAGE_FIELD_KEYS.includes(key.toLowerCase())) {
              fields.push({
                sectionIndex,
                path: [...path, key],
                label: [...labelParts, formattedKey || key].filter(Boolean).join(' • '),
                value: nested
              });
              return;
            }
            traverse(nested, [...path, key], formattedKey ? [...labelParts, formattedKey] : labelParts, key);
          });
          return;
        }
      };

      traverse(section?.data || {}, [], [baseLabel]);
    });

    return fields;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('mp_recent_media_uploads', JSON.stringify(recentUploads));
  }, [recentUploads]);

  const sections = config?.sections || [];
  const imageFields = useMemo(() => extractImageFields(sections), [sections, t]);

  const persistUpload = (url) => {
    setRecentUploads((prev) => {
      const deduped = prev.filter((item) => item !== url);
      return [url, ...deduped].slice(0, 8);
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    try {
      const response = await axios.post(
        '/api/schools/my-school/landing-page/upload',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setUploadedUrl(response.data.url);
      persistUpload(response.data.url);
      showMessage(t.uploadSuccessNote, 'success');
    } catch (error) {
      showMessage(t.uploadFailed, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleCopy = async (value) => {
    if (!value) return;
    try {
      await navigator?.clipboard?.writeText(value);
      showMessage(t.urlCopied, 'success');
    } catch (error) {
      console.error('Clipboard error', error);
      showMessage(t.unableToCopy, 'error');
    }
  };

  const handleAssignImage = (url) => {
    if (!url) {
      showMessage(t.selectFieldWarning, 'error');
      return;
    }

    if (selectedFieldIndex === '') {
      showMessage(t.selectFieldWarning, 'error');
      return;
    }

    const fieldIndex = Number(selectedFieldIndex);
    if (Number.isNaN(fieldIndex) || !imageFields[fieldIndex]) {
      showMessage(t.selectFieldWarning, 'error');
      return;
    }

    if (typeof updateConfig !== 'function') {
      showMessage(t.errorSaving, 'error');
      return;
    }

    const field = imageFields[fieldIndex];
    const updatedSections = updateSectionsForField(sections, field.sectionIndex, field.path, url);
    updateConfig({ sections: updatedSections });
    showMessage(`${t.imageAppliedTo} ${field.label}`, 'success');
    setCustomUrl('');
  };

  const removeRecentUpload = (url) => {
    setRecentUploads((prev) => prev.filter((item) => item !== url));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <ImageIcon className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t.mediaLibrary}</h2>
            <p className="text-gray-600">{t.uploadImagesDescription}</p>
          </div>
        </div>

        {/* Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t.uploadImage}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {t.uploadLimitNote}
          </p>
          <label className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold cursor-pointer hover:bg-blue-700 transition-colors">
            {uploading ? t.uploading : t.chooseFile}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        {/* Uploaded URL */}
        {uploadedUrl && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-green-800">
                  {t.latestUploadReady}
                </p>
                <p className="text-xs text-green-700">{t.copyUrlApplyNote}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy(uploadedUrl)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {t.copyUrl}
                </button>
                <button
                  onClick={() => handleAssignImage(uploadedUrl)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={!imageFields.length}
                >
                  {t.applyToSelection}
                </button>
              </div>
            </div>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-green-800 mb-2">
                  {t.imageUrl}
                </label>
                <input
                  type="text"
                  value={uploadedUrl}
                  readOnly
                  className="w-full px-4 py-2 border border-green-300 rounded-lg bg-white"
                />
              </div>
              <div className="w-full lg:w-48 h-32 rounded-lg border border-green-200 overflow-hidden bg-white flex items-center justify-center">
                {uploadedUrl ? (
                  <img src={uploadedUrl} alt="Uploaded preview" className="object-cover w-full h-full" />
                ) : (
                  <span className="text-sm text-gray-400">{t.preview}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {imageFields.length > 0 && (
          <div className="mt-6 space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              {t.chooseWherePlaceImage}
            </label>
            <select
              value={selectedFieldIndex}
              onChange={(e) => setSelectedFieldIndex(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t.selectSectionField}</option>
              {imageFields.map((field, index) => (
                <option key={`${field.sectionIndex}-${field.path.join('.')}`} value={index}>
                  {field.label}
                </option>
              ))}
            </select>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">
                  {t.pasteCustomUrl}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://cdn.yourschool.com/banner.png"
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                  <button
                    onClick={() => handleAssignImage(customUrl)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t.applyUrl}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">{t.howToUse}</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>{t.step1Upload}</li>
            <li>{t.step2Select}</li>
            <li>{t.step3Apply}</li>
            <li>{t.step4Save}</li>
          </ol>
        </div>
      </div>

      {recentUploads.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Link2 className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{t.recentUploads}</h3>
              <p className="text-sm text-gray-600">{t.reuseAssetsDescription}</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentUploads.map((url) => (
              <div key={url} className="border rounded-lg p-3 space-y-2">
                <div className="h-32 rounded-md bg-gray-50 border overflow-hidden flex items-center justify-center">
                  <img src={url} alt="Recent upload" className="object-cover w-full h-full" />
                </div>
                <div className="text-xs text-gray-500 break-all max-h-16 overflow-auto">
                  {url}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(url)}
                    className="flex-1 px-2 py-1 text-sm border rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    {t.copy}
                  </button>
                  <button
                    onClick={() => handleAssignImage(url)}
                    className="flex-1 px-2 py-1 text-sm border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    {t.apply}
                  </button>
                  <button
                    onClick={() => removeRecentUpload(url)}
                    className="p-1 text-gray-400 hover:text-red-500"
                    title={t.removeFromHistory}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {imageFields.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <ListChecks className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{t.imageUsageOverview}</h3>
              <p className="text-sm text-gray-600">{t.imageUsageDescription}</p>
            </div>
          </div>
          <div className="divide-y">
            {imageFields.map((field, index) => (
              <div key={`${field.sectionIndex}-${field.path.join('.')}`} className="py-3 flex flex-col gap-2 md:flex-row md:items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{field.label}</p>
                  <p className="text-xs text-gray-500">Path: {field.path.join(' › ')}</p>
                </div>
                <div className="flex-1 flex gap-2 items-center">
                  <input
                    type="text"
                    readOnly
                    value={field.value || ''}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                    placeholder={t.noImageYet}
                  />
                  <button
                    onClick={() => handleCopy(field.value)}
                    className="px-3 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50"
                    disabled={!field.value}
                  >
                    {t.copy}
                  </button>
                  <button
                    onClick={() => setSelectedFieldIndex(String(index))}
                    className="px-3 py-2 text-sm border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    {t.useField}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaTab;
