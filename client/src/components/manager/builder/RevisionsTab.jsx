// client/src/components/manager/builder/RevisionsTab.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, RotateCcw, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

const RevisionsTab = ({ showMessage }) => {
  const { t } = useLanguage();
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRevision, setSelectedRevision] = useState(null);

  useEffect(() => {
    fetchRevisions();
  }, []);

  const fetchRevisions = async () => {
    try {
      const response = await axios.get('/api/schools/my-school/landing-page/revisions');
      setRevisions(response.data.revisions || []);
    } catch (error) {
      console.error('Error fetching revisions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevert = async (revisionIndex) => {
    if (!window.confirm(t.confirmRevertRevision)) {
      return;
    }

    try {
      await axios.post(`/api/schools/my-school/landing-page/revert/${revisionIndex}`);
      showMessage(t.revisionRestoredSuccess, 'success');
      // Reload the page after 2 seconds to refresh the builder
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error reverting to revision:', error);
      showMessage(t.failRestoreRevision, 'error');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString(t.locale || 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t.revisionHistory}</h2>
            <p className="text-gray-600">{t.revisionHistoryDesc}</p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">{t.howRevisionsWork}</p>
            <ul className="list-disc list-inside space-y-1">
              <li>{t.revisionWorkStep1}</li>
              <li>{t.revisionWorkStep2}</li>
              <li>{t.revisionWorkStep3}</li>
              <li>{t.revisionWorkStep4}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Revisions List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : revisions.length > 0 ? (
        <div className="space-y-4">
          {revisions.map((revision, index) => (
            <div
              key={index}
              className="bg-white rounded-lg border p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span className="font-semibold text-gray-900">
                      {t.versionLabel} {revisions.length - index}
                    </span>
                    {index === 0 && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full border border-green-200">
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                        {t.latestLabel}
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-gray-600 mb-3">
                    {t.savedOn} {formatDate(revision.createdAt)}
                    {revision.createdBy && (
                      <span className="ml-2">
                        {t.byAuthor} {revision.createdBy.firstName} {revision.createdBy.lastName}
                      </span>
                    )}
                  </div>

                  {/* Configuration Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">{t.themeLabel}</div>
                        <div className="font-medium text-gray-900">
                          {revision.config?.theme?.primaryColor || t.defaultLabel}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">{t.sectionsLabel}</div>
                        <div className="font-medium text-gray-900">
                          {revision.config?.sections?.filter(s => s.enabled).length || 0} {t.enabledCount}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">{t.seoTitleLabel}</div>
                        <div className="font-medium text-gray-900 truncate">
                          {revision.config?.seo?.metaTitle || t.notSet}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">{t.fontLabel}</div>
                        <div className="font-medium text-gray-900">
                          {revision.config?.theme?.fontFamily || 'Inter'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ml-4 flex flex-col gap-2">
                  <button
                    onClick={() => setSelectedRevision(revision)}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    <Eye className="w-4 h-4" />
                    {t.previewLabel}
                  </button>
                  {index !== 0 && (
                    <button
                      onClick={() => handleRevert(index)}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <RotateCcw className="w-4 h-4" />
                      {t.restoreLabel}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border p-12 text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">{t.noRevisionsYet}</p>
          <p className="text-sm text-gray-400 mt-2">
            {t.revisionsAutoCreatedNote}
          </p>
        </div>
      )}

      {/* Preview Modal */}
      {selectedRevision && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{t.revisionPreview}</h2>
              <button
                onClick={() => setSelectedRevision(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Theme Preview */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">{t.themeColors}</h3>
                <div className="flex gap-4">
                  <div>
                    <div
                      className="w-16 h-16 rounded-lg border shadow-sm mb-2"
                      style={{ backgroundColor: selectedRevision.config?.theme?.primaryColor }}
                    ></div>
                    <div className="text-xs text-gray-600">{t.primaryLabel}</div>
                  </div>
                  <div>
                    <div
                      className="w-16 h-16 rounded-lg border shadow-sm mb-2"
                      style={{ backgroundColor: selectedRevision.config?.theme?.secondaryColor }}
                    ></div>
                    <div className="text-xs text-gray-600">{t.secondaryLabel}</div>
                  </div>
                  <div>
                    <div
                      className="w-16 h-16 rounded-lg border shadow-sm mb-2"
                      style={{ backgroundColor: selectedRevision.config?.theme?.accentColor }}
                    ></div>
                    <div className="text-xs text-gray-600">{t.accentLabel}</div>
                  </div>
                </div>
              </div>

              {/* Sections */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">{t.sectionsLabel}</h3>
                <div className="space-y-2">
                  {selectedRevision.config?.sections?.map((section, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{section.type}</span>
                      <span className={`px-2 py-1 rounded text-xs ${section.enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                        }`}>
                        {section.enabled ? t.enabledLabel : t.disabledLabel}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SEO */}
              {selectedRevision.config?.seo && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">{t.seoSettings}</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">{t.metaTitle}:</span>
                      <span className="ml-2 text-gray-900">{selectedRevision.config.seo.metaTitle || t.notSet}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">{t.metaDescription}:</span>
                      <span className="ml-2 text-gray-900">{selectedRevision.config.seo.metaDescription || t.notSet}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevisionsTab;
