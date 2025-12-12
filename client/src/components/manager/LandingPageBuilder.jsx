// client/src/components/manager/LandingPageBuilder.jsx

import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { 
  Save, Eye, Upload, Palette, Layout, BarChart3, ArrowLeft,
  FileText, Settings, RefreshCw, CheckCircle, AlertCircle, Search, Clock
} from 'lucide-react';

// Import tab components
import ContentTab from './builder/ContentTab';
import MediaTab from './builder/MediaTab';
import DesignTab from './builder/DesignTab';
import AnalyticsTab from './builder/AnalyticsTab';
import SEOTab from './builder/SEOTab';
import RevisionsTab from './builder/RevisionsTab';

const LandingPageBuilder = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('content');
  const [config, setConfig] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [restoringDefaults, setRestoringDefaults] = useState(false);

  const tabs = [
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'media', label: 'Media', icon: Upload },
    { id: 'design', label: 'Design', icon: Palette },
    { id: 'seo', label: 'SEO', icon: Search },
    { id: 'revisions', label: 'Revisions', icon: Clock },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await axios.get('/api/schools/my-school/landing-page/config');
      setConfig(response.data.config);
      setStatus(response.data.status);
    } catch (error) {
      console.error('Error fetching config:', error);
      // Initialize with default if doesn't exist
      if (error.response?.status === 404) {
        await initializeDefault();
      }
    } finally {
      setLoading(false);
    }
  };

  const initializeDefault = async () => {
    try {
      const response = await axios.post('/api/schools/my-school/landing-page/initialize');
      setConfig(response.data.config);
      setStatus({ isDraft: true, isEnabled: false });
      showMessage('Landing page initialized with default template', 'success');
    } catch (error) {
      showMessage('Failed to initialize landing page', 'error');
    }
  };

  const handleRestoreDefaults = async () => {
    setRestoringDefaults(true);
    try {
      await initializeDefault();
    } finally {
      setRestoringDefaults(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!config) {
      showMessage('Landing page configuration has not loaded yet', 'error');
      return;
    }
    setSaving(true);
    try {
      await axios.put('/api/schools/my-school/landing-page/config', { config });
      showMessage('Draft saved successfully', 'success');
      await fetchConfig(); // Refresh to get updated status
    } catch (error) {
      showMessage('Failed to save draft', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!window.confirm('Are you sure you want to publish this landing page? It will be visible to the public.')) {
      return;
    }

    if (!config) {
      showMessage('Landing page configuration has not loaded yet', 'error');
      return;
    }

    setSaving(true);
    try {
      // Save first
      await axios.put('/api/schools/my-school/landing-page/config', { config });
      // Then publish
      await axios.post('/api/schools/my-school/landing-page/publish');
      showMessage('Landing page published successfully!', 'success');
      await fetchConfig();
    } catch (error) {
      showMessage('Failed to publish landing page', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    const schoolId = user?.school?._id || user?.school;
    if (schoolId) {
      window.open(`/school/${schoolId}`, '_blank');
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const updateConfig = (updates) => {
    setConfig((prev) => ({
      ...(prev || {}),
      ...updates
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading landing page builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page-builder min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/manager/dashboard')}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:border-gray-300 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to dashboard
              </button>
              <div className="flex items-center gap-4">
                <Layout className="w-6 h-6 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Landing Page Builder</h1>
                  {status && (
                    <p className="text-xs text-gray-500">
                      {status.isEnabled ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Published
                        </span>
                      ) : (
                        <span className="text-gray-500">Draft</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePreview}
                disabled={!user?.school}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={handlePublish}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                Publish
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-6 py-3 font-medium transition-colors flex items-center gap-2
                    ${activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`
          px-4 py-3 text-center font-medium
          ${message.type === 'success' ? 'bg-green-50 text-green-800 border-b border-green-200' : ''}
          ${message.type === 'error' ? 'bg-red-50 text-red-800 border-b border-red-200' : ''}
        `}>
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {message.text}
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'content' && (
          <ContentTab
            config={config}
            updateConfig={updateConfig}
            showMessage={showMessage}
            onRestoreDefaults={handleRestoreDefaults}
            restoringDefaults={restoringDefaults}
          />
        )}
        {activeTab === 'media' && (
          <MediaTab
            config={config}
            updateConfig={updateConfig}
            showMessage={showMessage}
          />
        )}
        {activeTab === 'design' && (
          <DesignTab
            config={config}
            updateConfig={updateConfig}
            showMessage={showMessage}
          />
        )}
        {activeTab === 'seo' && (
          <SEOTab
            config={config}
            setConfig={setConfig}
          />
        )}
        {activeTab === 'revisions' && (
          <RevisionsTab
            showMessage={showMessage}
          />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsTab
            showMessage={showMessage}
          />
        )}
      </div>
    </div>
  );
};

export default LandingPageBuilder;
