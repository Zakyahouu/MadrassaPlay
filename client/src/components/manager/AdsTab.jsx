import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Plus, Edit, Trash2, Eye, Calendar, Users, 
  Target, MapPin, AlertTriangle, Loader, CheckCircle, XCircle,
  X, Save, Clock
} from 'lucide-react';
import axios from 'axios';

const AdsTab = () => {
  useEffect(() => {
    fetchAds();
  }, []);
  const [ads, setAds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    targetAudience: 'both',
    location: 'dashboard'
  });
  const [bannerFile, setBannerFile] = useState(null);


  const fetchAds = async () => {
    try {
      setIsLoading(true);
      const token = getAuthToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get('/api/advertisements', config);
      setAds(response.data || []);
    } catch (err) {
      console.error('Error fetching ads:', err);
      setError('Failed to fetch advertisements');
      // Use mock data for demo
      setAds([
        {
          _id: '1',
          title: 'Welcome to New Semester',
          description: 'Important information about the upcoming semester schedule and new courses.',
          dateTime: new Date().toISOString(),
          targetAudience: 'both',
          location: 'dashboard',
          createdAt: new Date().toISOString(),
          status: 'active'
        },
        {
          _id: '2',
          title: 'Teacher Training Workshop',
          description: 'Join us for a professional development workshop this Friday.',
          dateTime: new Date(Date.now() + 86400000).toISOString(),
          targetAudience: 'teachers',
          location: 'banner',
          createdAt: new Date().toISOString(),
          status: 'active'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getAuthToken = () => {
    const userInfoString = localStorage.getItem('user');
    if (!userInfoString) return null;
    try {
      const userInfo = JSON.parse(userInfoString);
      return userInfo?.token || null;
    } catch (error) {
      console.error("Failed to parse userInfo", error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = getAuthToken();
      const config = { 
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        } 
      };

      if (editingAd) {
        // Update existing ad
        const response = await axios.put(`/api/advertisements/${editingAd._id}`, formData, config);
        setAds(ads.map(ad => ad._id === editingAd._id ? response.data : ad));
        // Upload banner if selected
        if (bannerFile) {
          const fd = new FormData();
          fd.append('banner', bannerFile);
          await axios.post(`/api/advertisements/${editingAd._id}/banner`, fd, { headers: { Authorization: `Bearer ${token}` } });
        }
        await fetchAds();
        alert('Advertisement updated successfully!');
      } else {
        // Create new ad
        const response = await axios.post('/api/advertisements', formData, config);
        const created = response.data;
        // Upload banner if selected
        if (bannerFile) {
          const fd = new FormData();
          fd.append('banner', bannerFile);
          await axios.post(`/api/advertisements/${created._id}/banner`, fd, { headers: { Authorization: `Bearer ${token}` } });
        }
        await fetchAds();
        alert('Advertisement created successfully!');
      }
      
      closeModal();
    } catch (err) {
      const message = err.response?.data?.message || 'An error occurred while saving.';
      alert(`Error: ${message}`);
    }
  };

  const handleDelete = async (adId) => {
    if (!window.confirm('Are you sure you want to delete this advertisement?')) {
      return;
    }

    try {
      const token = getAuthToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`/api/advertisements/${adId}`, config);
      setAds(ads.filter(ad => ad._id !== adId));
      alert('Advertisement deleted successfully!');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete advertisement.';
      alert(`Error: ${message}`);
    }
  };

  const openModal = (ad = null) => {
    if (ad) {
      setEditingAd(ad);
      setFormData({
        title: ad.title,
        description: ad.description,
        startDate: ad.startDate ? new Date(ad.startDate).toISOString().slice(0, 16) : '',
        endDate: ad.endDate ? new Date(ad.endDate).toISOString().slice(0, 16) : '',
        targetAudience: ad.targetAudience,
        location: ad.location
      });
      setBannerFile(null);
    } else {
      setEditingAd(null);
      setFormData({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        targetAudience: 'both',
        location: 'dashboard'
      });
      setBannerFile(null);
    }
    setIsCreateModalOpen(true);
  };

  const closeModal = () => {
    setIsCreateModalOpen(false);
    setEditingAd(null);
    setFormData({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      targetAudience: 'both',
      location: 'dashboard'
    });
  };

  const getTargetAudienceBadge = (audience) => {
    const colors = {
      students: 'bg-blue-100 text-blue-800 border-blue-200',
      teachers: 'bg-purple-100 text-purple-800 border-purple-200',
      both: 'bg-green-100 text-green-800 border-green-200',
      custom: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[audience] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getLocationBadge = (location) => {
    const colors = {
      dashboard: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      banner: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      notification: 'bg-orange-100 text-orange-800 border-orange-200',
      other: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[location] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center bg-white rounded-lg p-8 shadow-sm border">
        <Loader className="animate-spin text-indigo-500 mr-3" />
        <span className="text-gray-600">Loading advertisements...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Advertisements</h1>
                <p className="text-gray-600">Manage announcements and promotional content</p>
              </div>
            </div>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Create Advertisement
            </button>
          </div>
        </div>

        {/* Content Area */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="text-red-500 w-5 h-5" />
            <div>
              <h3 className="font-medium text-red-800">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {ads.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Advertisement</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Target Audience</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Start Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">End Date</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ads.map((ad) => (
                      <tr key={ad._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                              <Megaphone className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{ad.title}</div>
                              <div className="text-sm text-gray-500 mt-1">{ad.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border ${getTargetAudienceBadge(ad.targetAudience)}`}>
                            <Target className="w-3 h-3 mr-1" />
                            {ad.targetAudience.charAt(0).toUpperCase() + ad.targetAudience.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border ${getLocationBadge(ad.location)}`}>
                            <MapPin className="w-3 h-3 mr-1" />
                            {ad.location.charAt(0).toUpperCase() + ad.location.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">{ad.startDate ? formatDateTime(ad.startDate) : '-'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">{ad.endDate ? formatDateTime(ad.endDate) : '-'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openModal(ad)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                              title="Edit Advertisement"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(ad._id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete Advertisement"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <Megaphone className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No advertisements found
                </h3>
                <p className="text-gray-600 max-w-sm mx-auto">
                  Get started by creating your first advertisement to communicate with students and teachers.
                </p>
                <button
                  onClick={() => openModal()}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Create First Advertisement
                </button>
              </div>
            )}
          </div>
        )}

        {/* Create/Edit Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 bg-gray-50 border-b border-gray-200 flex-shrink-0">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingAd ? 'Edit Advertisement' : 'Create Advertisement'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="flex-1 overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title *
                      </label>
                      <input
                        required
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Enter advertisement title"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Enter advertisement description"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                        <input
                          required
                          type="datetime-local"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                        <input
                          required
                          type="datetime-local"
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience *</label>
                        <select
                          required
                          value={formData.targetAudience}
                          onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        >
                          <option value="both">Students & Teachers</option>
                          <option value="students">Students Only</option>
                          <option value="teachers">Teachers Only</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Display Location *</label>
                        <select
                          required
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        >
                          <option value="dashboard">Dashboard</option>
                          <option value="banner">Top Banner</option>
                          <option value="notification">Notification</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Banner Image (optional, for banner location) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Banner Image (JPG/PNG/WEBP)
                      </label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      />
                      <p className="text-xs text-gray-500 mt-1">Recommended: 1200x300px. Max 10MB.</p>
                    </div>
                  </div>
                </form>
              </div>

              {/* Modal Footer - Fixed at bottom */}
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingAd ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdsTab;
