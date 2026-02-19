// client/src/components/shared/Model3dViewerModal.jsx
import React from 'react';
import { X } from 'lucide-react';
import ThreeJSViewer from './ThreeJSViewer';
import ShareButton from './ShareButton';
import { useLanguage } from '../../context/LanguageContext';

const Model3dViewerModal = ({ model, isOpen, onClose, showShareButton = false }) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{model.name}</h2>
            <p className="text-sm text-gray-600 mt-1">{model.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="h-full">
            {/* 3D Viewer */}
            <div className="w-full h-96 bg-gray-100 rounded-lg mb-4">
              {model?.fileUrl ? (
                <>
                  <div className="text-xs text-gray-500 p-2 bg-gray-200">
                    Loading model from: {model.fileUrl}
                  </div>
                  <ThreeJSViewer 
                    modelUrl={model.fileUrl} 
                    className="w-full h-full rounded-lg" 
                  />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <p>3D Model Viewer</p>
                    <p className="text-sm text-gray-400 mt-2">No model file available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Model Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Model Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Name:</span>
                    <span className="ml-2 text-sm text-gray-900">{model.name}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Description:</span>
                    <p className="ml-2 text-sm text-gray-900">{model.description}</p>
                  </div>
                  {model.category && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Category:</span>
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {model.category.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Tags</h3>
                {model.tags && model.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {model.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No tags assigned</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            {showShareButton && model && (
              <ShareButton 
                modelId={model._id} 
                modelName={model.name}
                className="text-sm"
              />
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Model3dViewerModal;
