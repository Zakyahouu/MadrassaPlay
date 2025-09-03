import React, { useState, useEffect } from 'react';
import { Megaphone, X, Calendar, Target, MapPin, Clock } from 'lucide-react';
import axios from 'axios';

const AdsPanel = ({ userRole, schoolId, isOpen, onClose, position = 'right' }) => {
  const [ads, setAds] = useState([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && schoolId) {
      fetchAds();
    }
  }, [isOpen, schoolId]);

  const fetchAds = async () => {
    try {
      setIsLoading(true);
      const token = getAuthToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Fetch ads based on user role and school
      const response = await axios.get(`/api/advertisements/user/${userRole}`, config);
      const filteredAds = response.data.filter(ad => {
        // Filter by target audience
        if (ad.targetAudience === 'both') return true;
        if (ad.targetAudience === userRole) return true;
        if (ad.targetAudience === 'custom') return true; // Could add more logic here
        
        return false;
      });
      
      setAds(filteredAds);
      setCurrentAdIndex(0);
    } catch (error) {
      console.error('Error fetching ads:', error);
      // Use mock data for demo
      setAds([
        {
          _id: '1',
          title: 'Welcome to New Semester',
          description: 'Important information about the upcoming semester schedule and new courses.',
          dateTime: new Date().toISOString(),
          targetAudience: 'both',
          location: 'dashboard',
          createdAt: new Date().toISOString()
        },
        {
          _id: '2',
          title: 'Teacher Training Workshop',
          description: 'Join us for a professional development workshop this Friday.',
          dateTime: new Date(Date.now() + 86400000).toISOString(),
          targetAudience: 'teachers',
          location: 'banner',
          createdAt: new Date().toISOString()
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

  const nextAd = () => {
    setCurrentAdIndex((prev) => (prev + 1) % ads.length);
  };

  const previousAd = () => {
    setCurrentAdIndex((prev) => (prev - 1 + ads.length) % ads.length);
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  if (!isOpen || ads.length === 0) return null;

  const currentAd = ads[currentAdIndex];

  return (
    <div className={`fixed ${position === 'right' ? 'right-0' : 'left-0'} top-0 h-full w-80 bg-white shadow-2xl border-l border-gray-200 z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : position === 'right' ? 'translate-x-full' : '-translate-x-full'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5" />
          <h3 className="font-semibold">Announcements</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="p-4">
            {/* Current Ad */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 flex-shrink-0">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-sm mb-2">
                    {currentAd.title}
                  </h4>
                  <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                    {currentAd.description}
                  </p>
                  
                  {/* Ad Metadata */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDateTime(currentAd.dateTime)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getTargetAudienceBadge(currentAd.targetAudience)}`}>
                        <Target className="w-3 h-3 mr-1" />
                        {currentAd.targetAudience.charAt(0).toUpperCase() + currentAd.targetAudience.slice(1)}
                      </span>
                      
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border bg-gray-100 text-gray-800 border-gray-200">
                        <MapPin className="w-3 h-3 mr-1" />
                        {currentAd.location.charAt(0).toUpperCase() + currentAd.location.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Controls */}
            {ads.length > 1 && (
              <div className="flex items-center justify-between mt-4 px-2">
                <button
                  onClick={previousAd}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Previous"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <div className="flex items-center gap-1">
                  {ads.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentAdIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentAdIndex ? 'bg-indigo-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                
                <button
                  onClick={nextAd}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Next"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

            {/* All Ads List */}
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 text-sm mb-3">All Announcements</h4>
              <div className="space-y-3">
                {ads.map((ad, index) => (
                  <div
                    key={ad._id}
                    onClick={() => setCurrentAdIndex(index)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      index === currentAdIndex
                        ? 'border-indigo-300 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-gray-900 text-sm mb-1 truncate">
                          {ad.title}
                        </h5>
                        <p className="text-gray-600 text-xs line-clamp-2">
                          {ad.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">
                            {formatDateTime(ad.dateTime)}
                          </span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-full border ${getTargetAudienceBadge(ad.targetAudience)}`}>
                            {ad.targetAudience.charAt(0).toUpperCase() + ad.targetAudience.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-center text-xs text-gray-500">
          <p>Showing {ads.length} announcement{ads.length !== 1 ? 's' : ''}</p>
          <p className="mt-1">Click on any announcement to view details</p>
        </div>
      </div>
    </div>
  );
};

export default AdsPanel;
