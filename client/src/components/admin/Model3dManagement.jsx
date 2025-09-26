// client/src/components/admin/Model3dManagement.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Upload, Edit, Trash2, AlertCircle, X } from 'lucide-react';
import { adminApi, model3dHelpers } from '../../services/model3dService';
import ModelCard from '../shared/ModelCard';
import FilterDropdowns from '../shared/FilterDropdowns';
import Model3dViewerModal from '../shared/Model3dViewerModal';

const Model3dManagement = () => {
  const [models, setModels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [activeTab, setActiveTab] = useState('models'); // 'models', 'categories', 'tags'
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', color: '#3B82F6' });
  const [uploadFile, setUploadFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [showModelEditModal, setShowModelEditModal] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [showViewerModal, setShowViewerModal] = useState(false);
  const [viewingModel, setViewingModel] = useState(null);

  useEffect(() => {
    if (model3dHelpers.isAuthenticated()) {
      fetchData();
    } else {
      setError('Please log in to access 3D management');
    }
  }, []);

  useEffect(() => {
    if (model3dHelpers.isAuthenticated()) {
      fetchModels();
    }
  }, [selectedCategory, selectedTag]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [modelsRes, categoriesRes, tagsRes] = await Promise.all([
        adminApi.getModels(),
        adminApi.getCategories(),
        adminApi.getTags()
      ]);
      // The 3D server returns { success: true, data: models, count: models.length }
      setModels(modelsRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
      setTags(tagsRes.data.data || []);
      setError('');
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError('Failed to fetch data');
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
      
      const response = await adminApi.getModels(params);
      // The 3D server returns { success: true, data: models, count: models.length }
      setModels(response.data.data || []);
    } catch (err) {
      setError('Failed to fetch models');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setSubmitting(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('modelFile', uploadFile);
      uploadFormData.append('name', formData.name || uploadFile.name.replace('.glb', ''));
      uploadFormData.append('description', formData.description || '');
      if (selectedCategoryId) {
        uploadFormData.append('categoryId', selectedCategoryId);
      }
      if (selectedTagIds.length > 0) {
        uploadFormData.append('tagIds', selectedTagIds.join(','));
      }

      const response = await adminApi.createModel(uploadFormData);
      setModels([...models, response.data.data]);
      setShowUploadModal(false);
      setUploadFile(null);
      setFormData({ name: '', description: '', color: '#3B82F6' });
      setSelectedCategoryId('');
      setSelectedTagIds([]);
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err.response?.data?.error || 'Failed to upload model';
      const errorDetails = err.response?.data?.details;
      setError(errorDetails ? `${errorMessage}: ${errorDetails.join(', ')}` : errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingItem) {
        await adminApi.updateCategory(editingItem._id, formData);
        setCategories(categories.map(c => 
          c._id === editingItem._id ? { ...c, ...formData } : c
        ));
      } else {
      const response = await adminApi.createCategory(formData);
      setCategories([...categories, response.data.data]);
      }
      setShowCategoryModal(false);
      setFormData({ name: '', description: '', color: '#3B82F6' });
      setEditingItem(null);
    } catch (err) {
      setError(editingItem ? 'Failed to update category' : 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTagSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingItem) {
        await adminApi.updateTag(editingItem._id, formData);
        setTags(tags.map(t => 
          t._id === editingItem._id ? { ...t, ...formData } : t
        ));
      } else {
      const response = await adminApi.createTag(formData);
      setTags([...tags, response.data.data]);
      }
      setShowTagModal(false);
      setFormData({ name: '', description: '', color: '#3B82F6' });
      setEditingItem(null);
    } catch (err) {
      setError(editingItem ? 'Failed to update tag' : 'Failed to create tag');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item, type) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      if (type === 'model') {
        await adminApi.deleteModel(item._id);
        setModels(models.filter(m => m._id !== item._id));
      } else if (type === 'category') {
        await adminApi.deleteCategory(item._id);
        setCategories(categories.filter(c => c._id !== item._id));
      } else if (type === 'tag') {
        await adminApi.deleteTag(item._id);
        setTags(tags.filter(t => t._id !== item._id));
      }
    } catch (err) {
      setError(`Failed to delete ${type}`);
    }
  };

  const handleEdit = (item, type) => {
    setEditingItem(item);
    setFormData({ 
      name: item.name, 
      description: item.description || '', 
      color: item.color || '#3B82F6' 
    });
    if (type === 'category') {
      setShowCategoryModal(true);
    } else if (type === 'tag') {
      setShowTagModal(true);
    } else if (type === 'model') {
      setEditingModel(item);
      setSelectedCategoryId(item.category?._id || '');
      setSelectedTagIds(item.tags?.map(tag => tag._id) || []);
      setShowModelEditModal(true);
    }
  };

  const handleModelUpdate = async (e) => {
    e.preventDefault();
    if (!editingModel) return;

    setSubmitting(true);
    try {
      const updateData = {
        name: formData.name,
        description: formData.description,
        categoryId: selectedCategoryId || null,
        tagIds: selectedTagIds.join(',')
      };

      const response = await adminApi.updateModel(editingModel._id, updateData);
      setModels(models.map(m => m._id === editingModel._id ? response.data.data : m));
      setShowModelEditModal(false);
      setEditingModel(null);
      setFormData({ name: '', description: '', color: '#3B82F6' });
      setSelectedCategoryId('');
      setSelectedTagIds([]);
    } catch (err) {
      console.error('Update error:', err);
      const errorMessage = err.response?.data?.error || 'Failed to update model';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTagToggle = (tagId) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleInspect = (model) => {
    setViewingModel(model);
    setShowViewerModal(true);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check both MIME type and file extension (matching server validation)
      const allowedTypes = ['model/gltf-binary'];
      const allowedExtensions = ['.glb'];
      const isValidType = allowedTypes.includes(file.type) || 
                         allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
      
      if (isValidType) {
        setUploadFile(file);
        setFormData({ ...formData, name: file.name.replace('.glb', '') });
        setError(''); // Clear any previous errors
      } else {
        setError('Please select a valid GLB file');
      }
    } else {
      setError('Please select a file');
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">3D Management</h1>
          <p className="text-gray-600">Manage 3D models, categories, and tags</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Upload className="w-5 h-5" />
            <span>Upload Model</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'models', name: 'Models', count: models.length },
            { id: 'categories', name: 'Categories', count: categories.length },
            { id: 'tags', name: 'Tags', count: tags.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'models' && (
        <div className="space-y-6">
          {/* Filters */}
          <FilterDropdowns
            categories={categories}
            tags={tags}
            selectedCategory={selectedCategory}
            selectedTag={selectedTag}
            onCategoryChange={setSelectedCategory}
            onTagChange={setSelectedTag}
            onClearFilters={() => {
              setSelectedCategory(null);
              setSelectedTag(null);
            }}
          />

          {/* Models Grid */}
          {models.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No models found</h3>
              <p className="text-gray-600 mb-4">Upload your first 3D model to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {models.map((model) => (
                <ModelCard
                  key={model._id}
                  model={model}
                  onInspect={handleInspect}
                  onEdit={(model) => handleEdit(model, 'model')}
                  onDelete={(model) => handleDelete(model, 'model')}
                  showAdminActions={true}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Categories</h2>
            <button
              onClick={() => {
                setEditingItem(null);
                setFormData({ name: '', description: '', color: '#3B82F6' });
                setShowCategoryModal(true);
              }}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div key={category._id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEdit(category, 'category')}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category, 'category')}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'tags' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Tags</h2>
            <button
              onClick={() => {
                setEditingItem(null);
                setFormData({ name: '', description: '', color: '#3B82F6' });
                setShowTagModal(true);
              }}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              <span>Add Tag</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tags.map((tag) => (
              <div key={tag._id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: tag.color || '#3B82F6' }}
                    ></div>
                    <div>
                      <h3 className="font-medium text-gray-900">{tag.name}</h3>
                      {tag.description && (
                        <p className="text-sm text-gray-600 mt-1">{tag.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEdit(tag, 'tag')}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tag, 'tag')}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Upload 3D Model</h2>
              
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GLB File *
                  </label>
                  <input
                    type="file"
                    accept=".glb"
                    onChange={handleFileChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a category (optional)</option>
                    {categories.map(category => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                    {tags.map(tag => (
                      <label key={tag._id} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          checked={selectedTagIds.includes(tag._id)}
                          onChange={() => handleTagToggle(tag._id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{tag.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !uploadFile}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingItem ? 'Edit Category' : 'Create Category'}
              </h2>
              
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tag Modal */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingItem ? 'Edit Tag' : 'Create Tag'}
              </h2>
              
              <form onSubmit={handleTagSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      name="color"
                      value={formData.color}
                      onChange={handleChange}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={handleChange}
                      name="color"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowTagModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Model Edit Modal */}
      {showModelEditModal && editingModel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Model</h2>
              
              <form onSubmit={handleModelUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a category (optional)</option>
                    {categories.map(category => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                    {tags.map(tag => (
                      <label key={tag._id} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          checked={selectedTagIds.includes(tag._id)}
                          onChange={() => handleTagToggle(tag._id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{tag.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModelEditModal(false);
                      setEditingModel(null);
                      setFormData({ name: '', description: '', color: '#3B82F6' });
                      setSelectedCategoryId('');
                      setSelectedTagIds([]);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? 'Updating...' : 'Update Model'}
                  </button>
                </div>
              </form>
            </div>
          </div>
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
        showShareButton={false}
      />
    </div>
  );
};

export default Model3dManagement;
