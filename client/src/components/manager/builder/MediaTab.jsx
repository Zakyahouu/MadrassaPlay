// client/src/components/manager/builder/MediaTab.jsx

import React, { useEffect, useMemo, useState } from 'react';
import { Upload, Image as ImageIcon, ListChecks, Link2, Trash2 } from 'lucide-react';
import axios from 'axios';

const IMAGE_FIELD_KEYS = ['image', 'photo', 'backgroundimage', 'ogimage', 'logo', 'bannerimage', 'thumbnail'];

const sectionLabels = {
  hero: 'Hero Section',
  about: 'About Section',
  programs: 'Programs/Courses',
  teachers: 'Teachers',
  testimonials: 'Testimonials',
  features: 'Features',
  pricing: 'Pricing Plans',
  faq: 'FAQ',
  contact: 'Contact',
  footer: 'Footer'
};

const formatKeyLabel = (key = '') =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());

const formatArrayLabel = (parentKey = '', index = 0) => {
  if (!parentKey) return `Item ${index + 1}`;
  const label = formatKeyLabel(parentKey) || 'Item';
  const singular = label.endsWith('s') ? label.slice(0, -1) : label;
  return `${singular || 'Item'} ${index + 1}`;
};

const extractImageFields = (sections = []) => {
  const fields = [];

  sections.forEach((section, sectionIndex) => {
    const baseLabel = sectionLabels[section?.type] || `Section ${sectionIndex + 1}`;

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
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [recentUploads, setRecentUploads] = useState(getStoredUploads);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState('');
  const [customUrl, setCustomUrl] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('mp_recent_media_uploads', JSON.stringify(recentUploads));
  }, [recentUploads]);

  const sections = config?.sections || [];
  const imageFields = useMemo(() => extractImageFields(sections), [sections]);

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
      showMessage('Image uploaded successfully! Copy the URL below.', 'success');
    } catch (error) {
      showMessage('Failed to upload image', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleCopy = async (value) => {
    if (!value) return;
    try {
      await navigator?.clipboard?.writeText(value);
      showMessage('URL copied to clipboard!', 'success');
    } catch (error) {
      console.error('Clipboard error', error);
      showMessage('Unable to copy URL', 'error');
    }
  };

  const handleAssignImage = (url) => {
    if (!url) {
      showMessage('Please upload or paste an image URL first', 'error');
      return;
    }

    if (selectedFieldIndex === '') {
      showMessage('Select a destination field to continue', 'error');
      return;
    }

    const fieldIndex = Number(selectedFieldIndex);
    if (Number.isNaN(fieldIndex) || !imageFields[fieldIndex]) {
      showMessage('Select a valid destination field to continue', 'error');
      return;
    }

    if (typeof updateConfig !== 'function') {
      showMessage('Config updater is unavailable', 'error');
      return;
    }

    const field = imageFields[fieldIndex];
    const updatedSections = updateSectionsForField(sections, field.sectionIndex, field.path, url);
    updateConfig({ sections: updatedSections });
    showMessage(`Image applied to ${field.label}`, 'success');
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
            <h2 className="text-2xl font-bold text-gray-900">Media Library</h2>
            <p className="text-gray-600">Upload images for your landing page</p>
          </div>
        </div>

        {/* Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Upload Image
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            PNG, JPG up to 5MB
          </p>
          <label className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold cursor-pointer hover:bg-blue-700 transition-colors">
            {uploading ? 'Uploading...' : 'Choose File'}
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
                  Latest Upload Ready
                </p>
                <p className="text-xs text-green-700">Copy the URL or apply it to a section directly.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy(uploadedUrl)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Copy URL
                </button>
                <button
                  onClick={() => handleAssignImage(uploadedUrl)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={!imageFields.length}
                >
                  Apply to selection
                </button>
              </div>
            </div>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-green-800 mb-2">
                  Image URL
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
                  <span className="text-sm text-gray-400">Preview</span>
                )}
              </div>
            </div>
          </div>
        )}

        {imageFields.length > 0 && (
          <div className="mt-6 space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Choose where to place your next image
            </label>
            <select
              value={selectedFieldIndex}
              onChange={(e) => setSelectedFieldIndex(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select section + field</option>
              {imageFields.map((field, index) => (
                <option key={`${field.sectionIndex}-${field.path.join('.')}`} value={index}>
                  {field.label}
                </option>
              ))}
            </select>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">
                  Or paste a custom image URL
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
                    Apply URL
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">How to use</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Upload your image using the button above</li>
            <li>Select the section field you want to update</li>
            <li>Apply the uploaded URL directly or copy it for later</li>
            <li>Save your changes</li>
          </ol>
        </div>
      </div>

      {recentUploads.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Link2 className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recent Uploads</h3>
              <p className="text-sm text-gray-600">Reuse any of your latest assets</p>
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
                    Copy
                  </button>
                  <button
                    onClick={() => handleAssignImage(url)}
                    className="flex-1 px-2 py-1 text-sm border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => removeRecentUpload(url)}
                    className="p-1 text-gray-400 hover:text-red-500"
                    title="Remove from history"
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
              <h3 className="text-lg font-semibold text-gray-900">Image Usage Overview</h3>
              <p className="text-sm text-gray-600">See every spot that references an image</p>
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
                    placeholder="No image yet"
                  />
                  <button
                    onClick={() => handleCopy(field.value)}
                    className="px-3 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50"
                    disabled={!field.value}
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => setSelectedFieldIndex(String(index))}
                    className="px-3 py-2 text-sm border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    Use Field
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
