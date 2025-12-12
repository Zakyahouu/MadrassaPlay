// client/src/components/manager/builder/RevisionsTab.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, RotateCcw, Eye, AlertCircle, CheckCircle } from 'lucide-react';

const RevisionsTab = ({ showMessage }) => {
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
    if (!window.confirm('Are you sure you want to restore this revision? Your current changes will be saved as a new revision.')) {
      return;
    }

    try {
      await axios.post(`/api/schools/my-school/landing-page/revert/${revisionIndex}`);
      showMessage('Revision restored successfully! Page is now in draft mode.', 'success');
      // Reload the page after 2 seconds to refresh the builder
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error reverting to revision:', error);
      showMessage('Failed to restore revision', 'error');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
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
            <h2 className="text-2xl font-bold text-gray-900">Revision History</h2>
            <p className="text-gray-600">View and restore previous versions of your landing page</p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">How Revision History Works</p>
            <ul className="list-disc list-inside space-y-1">
              <li>A revision is automatically saved each time you publish your landing page</li>
              <li>The system keeps the last 10 revisions</li>
              <li>Restoring a revision will save your current version before reverting</li>
              <li>After restoring, your page will be in draft mode (unpublished)</li>
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
                      Version {revisions.length - index}
                    </span>
                    {index === 0 && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full border border-green-200">
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                        Latest
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-gray-600 mb-3">
                    Saved on {formatDate(revision.createdAt)}
                    {revision.createdBy && (
                      <span className="ml-2">
                        by {revision.createdBy.firstName} {revision.createdBy.lastName}
                      </span>
                    )}
                  </div>

                  {/* Configuration Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Theme</div>
                        <div className="font-medium text-gray-900">
                          {revision.config?.theme?.primaryColor || 'Default'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Sections</div>
                        <div className="font-medium text-gray-900">
                          {revision.config?.sections?.filter(s => s.enabled).length || 0} enabled
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">SEO Title</div>
                        <div className="font-medium text-gray-900 truncate">
                          {revision.config?.seo?.metaTitle || 'Not set'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Font</div>
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
                    Preview
                  </button>
                  {index !== 0 && (
                    <button
                      onClick={() => handleRevert(index)}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restore
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
          <p className="text-gray-500">No revisions available yet</p>
          <p className="text-sm text-gray-400 mt-2">
            Revisions are created automatically when you publish your landing page
          </p>
        </div>
      )}

      {/* Preview Modal */}
      {selectedRevision && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Revision Preview</h2>
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
                <h3 className="font-semibold text-gray-900 mb-3">Theme Colors</h3>
                <div className="flex gap-4">
                  <div>
                    <div
                      className="w-16 h-16 rounded-lg border shadow-sm mb-2"
                      style={{ backgroundColor: selectedRevision.config?.theme?.primaryColor }}
                    ></div>
                    <div className="text-xs text-gray-600">Primary</div>
                  </div>
                  <div>
                    <div
                      className="w-16 h-16 rounded-lg border shadow-sm mb-2"
                      style={{ backgroundColor: selectedRevision.config?.theme?.secondaryColor }}
                    ></div>
                    <div className="text-xs text-gray-600">Secondary</div>
                  </div>
                  <div>
                    <div
                      className="w-16 h-16 rounded-lg border shadow-sm mb-2"
                      style={{ backgroundColor: selectedRevision.config?.theme?.accentColor }}
                    ></div>
                    <div className="text-xs text-gray-600">Accent</div>
                  </div>
                </div>
              </div>

              {/* Sections */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Sections</h3>
                <div className="space-y-2">
                  {selectedRevision.config?.sections?.map((section, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{section.type}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        section.enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {section.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SEO */}
              {selectedRevision.config?.seo && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">SEO Settings</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Meta Title:</span>
                      <span className="ml-2 text-gray-900">{selectedRevision.config.seo.metaTitle || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Meta Description:</span>
                      <span className="ml-2 text-gray-900">{selectedRevision.config.seo.metaDescription || 'Not set'}</span>
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
