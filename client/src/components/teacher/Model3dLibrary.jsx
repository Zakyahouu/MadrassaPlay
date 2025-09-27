// client/src/components/teacher/Model3dLibrary.jsx
import React, { useState, useEffect } from 'react';
import { AlertCircle, Box } from 'lucide-react';
import { teacherApi } from '../../services/model3dService';
import ModelCard from '../shared/ModelCard';
import FilterDropdowns from '../shared/FilterDropdowns';
import Model3dViewerModal from '../shared/Model3dViewerModal';

const Model3dLibrary = () => {
  const [models, setModels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [showViewerModal, setShowViewerModal] = useState(false);
  const [viewingModel, setViewingModel] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchModels();
  }, [selectedCategory, selectedTag]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const modelsRes = await teacherApi.getModels();
      // The 3D server returns { success: true, data: models, count: models.length }
      setModels(modelsRes.data.data || []);
      setCategories([]); // Categories will be populated from models
      setTags([]); // Tags will be populated from models
      setError('');
    } catch (err) {
      if (err.response?.status === 401) {
        // Token expired - redirect to login
        window.location.href = '/login';
      } else {
        setError('Failed to fetch 3D models');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchModels = async () => {
    try {
      const params = {};
      if (selectedCategory) params.category = selectedCategory;
      if (selectedTag) params.tag = selectedTag;
      
      const response = await teacherApi.getModels(params);
      // The 3D server returns { success: true, data: models, count: models.length }
      setModels(response.data.data || []);
    } catch (err) {
      setError('Failed to fetch models');
    }
  };

  const handleInspect = (model) => {
    setViewingModel(model);
    setShowViewerModal(true);
  };

  const handleShare = (model) => {
    // TODO: Implement share functionality later
    console.log('Share model:', model);
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const handleTagChange = (tagId) => {
    setSelectedTag(tagId);
  };

  const handleClearFilters = () => {
    setSelectedCategory(null);
    setSelectedTag(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* External Service Banner */}
      <div className="bg-white border-b-2 border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Box className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">3D Model Library</h1>
                <p className="text-sm text-gray-500">Browse and explore 3D assets</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-xs font-medium text-gray-600">EXTERNAL SERVICE</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-lg">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Library Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Content Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Available 3D Models</h3>
                  <p className="text-sm text-gray-500">Browse and explore 3D assets from the library</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-gray-500">
                    {models.length} models available
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="px-6 py-4 border-b border-gray-200">
              <FilterDropdowns
                categories={categories}
                tags={tags}
                selectedCategory={selectedCategory}
                selectedTag={selectedTag}
                onCategoryChange={handleCategoryChange}
                onTagChange={handleTagChange}
                onClearFilters={handleClearFilters}
              />
            </div>

            {/* Models Grid */}
            <div className="p-6">
              {!Array.isArray(models) || models.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Box className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No 3D models available</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {selectedCategory || selectedTag 
                      ? 'No models match your current filters. Try adjusting your search criteria.' 
                      : 'There are no 3D models available in the library yet. Check back later for new content.'
                    }
                  </p>
                  {(selectedCategory || selectedTag) && (
                    <button
                      onClick={handleClearFilters}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                    >
                      <span>Clear Filters</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {models.map((model) => (
                    <ModelCard
                      key={model._id}
                      model={model}
                      onInspect={handleInspect}
                      onShare={handleShare}
                      showTeacherActions={true}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3D Model Viewer Modal */}
          <Model3dViewerModal
            model={viewingModel}
            isOpen={showViewerModal}
            onClose={() => {
              setShowViewerModal(false);
              setViewingModel(null);
            }}
            showShareButton={true}
          />
        </div>
      </div>
    </div>
  );
};

export default Model3dLibrary;