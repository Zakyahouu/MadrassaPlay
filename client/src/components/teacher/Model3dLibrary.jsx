// client/src/components/teacher/Model3dLibrary.jsx
import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">3D Model Library</h1>
        <p className="text-gray-600">Browse available 3D models</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <FilterDropdowns
        categories={categories}
        tags={tags}
        selectedCategory={selectedCategory}
        selectedTag={selectedTag}
        onCategoryChange={handleCategoryChange}
        onTagChange={handleTagChange}
        onClearFilters={handleClearFilters}
      />

      {/* Models Grid */}
      {!Array.isArray(models) || models.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No models available</h3>
          <p className="text-gray-600">
            {selectedCategory || selectedTag 
              ? 'No models match your current filters.' 
              : 'There are no 3D models available in the library yet.'
            }
          </p>
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
  );
};

export default Model3dLibrary;