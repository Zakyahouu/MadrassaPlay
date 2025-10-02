import React, { useState, useEffect } from 'react';
import { Share2, Copy, Check, X, ExternalLink } from 'lucide-react';
import shareService from '../../services/shareService';

const ShareButton = ({ modelId, modelName, className = '' }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [shareStatus, setShareStatus] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (modelId) {
      loadShareStatus();
    }
  }, [modelId]);

  const loadShareStatus = async () => {
    try {
      setIsLoading(true);
      const response = await shareService.getShareStatus(modelId);
      setShareStatus(response.data);
    } catch (err) {
      console.error('Error loading share status:', err);
      setError('Failed to load share status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateShare = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await shareService.generateShareLink(modelId);
      setShareStatus(response.data);
      // Don't automatically show modal, let user click Share button to see it
    } catch (err) {
      console.error('Error generating share link:', err);
      setError(err.response?.data?.error || 'Failed to generate share link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableShare = async () => {
    try {
      setIsLoading(true);
      setError('');
      await shareService.disableShareLink(modelId);
      setShareStatus(prev => ({ ...prev, isActive: false }));
      setShowShareModal(false);
    } catch (err) {
      console.error('Error disabling share link:', err);
      setError(err.response?.data?.error || 'Failed to disable share link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      // Check if clipboard API is available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareStatus.shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback for older browsers or non-HTTPS contexts
        const textArea = document.createElement('textarea');
        textArea.value = shareStatus.shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (fallbackErr) {
          console.error('Fallback copy failed:', fallbackErr);
          setError('Failed to copy link. Please copy manually.');
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      console.error('Error copying link:', err);
      setError('Failed to copy link. Please copy manually.');
    }
  };

  const handleOpenLink = () => {
    window.open(shareStatus.shareUrl, '_blank');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = shareStatus?.expiresAt && new Date(shareStatus.expiresAt) < new Date();
  

  const handleOpenModal = () => {
    setShowShareModal(true);
    // Refresh share status when opening modal
    if (modelId) {
      loadShareStatus();
    }
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        disabled={isLoading}
        className={`inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <Share2 className="w-4 h-4 mr-2" />
        {isLoading ? 'Loading...' : 'Share'}
      </button>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Share Model</h2>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{modelName}</h3>
                {error && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                  </div>
                )}
              </div>

              {shareStatus?.isShared && shareStatus?.isActive && !isExpired ? (
                <div className="space-y-4">
                  {/* Active Share */}
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm font-medium text-green-800">Share Link Active</span>
                    </div>
                    <p className="text-sm text-green-700">
                      This model is currently shared and accessible via the link below.
                    </p>
                  </div>

                  {/* Share URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Share Link
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={shareStatus.shareUrl}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Share Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Access Count:</span>
                      <span className="ml-2 font-medium">{shareStatus.accessCount || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Expires:</span>
                      <span className="ml-2 font-medium">{formatDate(shareStatus.expiresAt)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Last Accessed:</span>
                      <span className="ml-2 font-medium">{formatDate(shareStatus.lastAccessedAt)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className="ml-2 font-medium text-green-600">Active</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={handleOpenLink}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Link
                    </button>
                    <button
                      onClick={handleDisableShare}
                      disabled={isLoading}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      {isLoading ? 'Disabling...' : 'Disable Share'}
                    </button>
                  </div>
                </div>
              ) : shareStatus?.isShared && (isExpired || !shareStatus?.isActive) ? (
                <div className="space-y-4">
                  {/* Expired/Disabled Share */}
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-sm font-medium text-red-800">
                        {isExpired ? 'Share Link Expired' : 'Share Link Disabled'}
                      </span>
                    </div>
                    <p className="text-sm text-red-700">
                      {isExpired 
                        ? 'This share link has expired and is no longer accessible.'
                        : 'This share link has been disabled and is no longer accessible.'
                      }
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleGenerateShare}
                      disabled={isLoading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isLoading ? 'Generating...' : 'Generate New Share Link'}
                    </button>
                    <button
                      onClick={() => setShowShareModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* No Share */}
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                      <span className="text-sm font-medium text-gray-800">Not Shared</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      This model is not currently shared. Generate a share link to make it accessible to others.
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleGenerateShare}
                      disabled={isLoading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isLoading ? 'Generating...' : 'Generate Share Link'}
                    </button>
                    <button
                      onClick={() => setShowShareModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShareButton;
