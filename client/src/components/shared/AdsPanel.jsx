import React, { useState, useEffect } from 'react';
import { Megaphone, X, Calendar, Target, MapPin } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';

const AdsPanel = ({ userRole, schoolId, isOpen, onClose, position = 'right' }) => {
  const { t } = useLanguage();
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

  const getTargetAudienceLabel = (audience) => {
    switch (audience) {
      case 'both': return t.targetAudienceBoth || 'Both';
      case 'teachers': return t.targetAudienceTeachers || 'Teachers';
      case 'students': return t.targetAudienceStudents || 'Students';
      case 'custom': return t.targetAudienceCustom || 'Custom';
      default: return audience.charAt(0).toUpperCase() + audience.slice(1);
    }
  };

  const getLocationLabel = (location) => {
    switch (location) {
      case 'banner': return t.locationBanner || 'Banner';
      case 'dashboard': return t.locationDashboard || 'Dashboard';
      default: return location.charAt(0).toUpperCase() + location.slice(1);
    }
  };

  if (!isOpen || ads.length === 0) return null;

  const currentAd = ads[currentAdIndex];

  return (
    <div className={`fixed ${position === 'right' ? 'right-0' : 'left-0'} top-0 h-full w-80 bg-surface-light shadow-2xl border-l border-border-light z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : position === 'right' ? 'translate-x-full' : '-translate-x-full'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-primary text-white">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5" />
          <h3 className="font-semibold">{t.announcements}</h3>
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="p-4">
            {/* Current Ad */}
            <div className="bg-primary-light/50 rounded-lg p-4 border border-border-light">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-primary border border-border-light flex-shrink-0">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-text-main-light text-sm mb-2">
                    {currentAd.title}
                  </h4>
                  <p className="text-text-muted-light text-sm mb-3 leading-relaxed">
                    {currentAd.description}
                  </p>

                  {/* Ad Metadata */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-text-muted-light">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDateTime(currentAd.dateTime)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border bg-surface-light text-text-muted-light border-border-light`}>
                        <Target className="w-3 h-3 mr-1" />
                        {getTargetAudienceLabel(currentAd.targetAudience)}
                      </span>

                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border bg-surface-light text-text-muted-light border-border-light">
                        <MapPin className="w-3 h-3 mr-1" />
                        {getLocationLabel(currentAd.location)}
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
                  className="p-2 text-text-muted-light hover:text-text-main-light hover:bg-background-light rounded-lg transition-colors border border-transparent hover:border-border-light"
                  title={t.previous}
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
                      className={`w-2 h-2 rounded-full transition-colors ${index === currentAdIndex ? 'bg-primary' : 'bg-slate-300'
                        }`}
                    />
                  ))}
                </div>

                <button
                  onClick={nextAd}
                  className="p-2 text-text-muted-light hover:text-text-main-light hover:bg-background-light rounded-lg transition-colors border border-transparent hover:border-border-light"
                  title={t.next}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

            {/* All Ads List */}
            <div className="mt-6">
              <h4 className="font-medium text-text-main-light text-sm mb-3">{t.allAnnouncements}</h4>
              <div className="space-y-3">
                {ads.map((ad, index) => (
                  <div
                    key={ad._id}
                    onClick={() => setCurrentAdIndex(index)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${index === currentAdIndex
                      ? 'border-primary/30 bg-primary-light/30'
                      : 'border-border-light hover:border-border-dark bg-surface-light hover:bg-background-light'
                      }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${index === currentAdIndex ? 'bg-primary' : 'bg-slate-300'}`}></div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-text-main-light text-sm mb-1 truncate">
                          {ad.title}
                        </h5>
                        <p className="text-text-muted-light text-xs line-clamp-2">
                          {ad.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-text-muted-light">
                            {formatDateTime(ad.dateTime)}
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
      <div className="p-4 border-t border-border-light bg-background-light">
        <div className="text-center text-xs text-text-muted-light">
          <p>{(t.showingAnnouncements || 'Showing {count} announcements').replace('{count}', ads.length)}</p>
          <p className="mt-1">{t.clickToViewDetails}</p>
        </div>
      </div>
    </div>
  );
};

export default AdsPanel;
