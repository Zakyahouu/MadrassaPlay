import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Megaphone, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';

// Simple in-memory cache to avoid repeated network calls on re-mounts
// Keyed by role, expires after 5 minutes
const adsCache = {};
const CACHE_TTL_MS = 5 * 60 * 1000;

const AdsBar = ({ userRole, schoolId }) => {
  const [ads, setAds] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false); // guard against React.StrictMode double-invoke

  const role = useMemo(() => userRole || 'students', [userRole]);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        // StrictMode guard: prevent duplicate run on mount
        if (fetchedRef.current) return;
        fetchedRef.current = true;

        // Serve from cache if fresh
        const cached = adsCache[role];
        const now = Date.now();
        if (cached && now - cached.timestamp < CACHE_TTL_MS) {
          setAds(cached.data);
          setIndex(0);
          setLoading(false);
          return;
        }

        setLoading(true);
        const token = getAuthToken();
        const config = { headers: { Authorization: `Bearer ${token}` } };
        // console.debug('[AdsBar] fetching /api/advertisements/user/' + role);
        const res = await axios.get(`/api/advertisements/user/${role}`, config);
        console.log('[AdsBar] Raw response:', res.data);
        // Show all active ads, not just banner ads
        const activeAds = (res.data || []).filter(a => a.status === 'active');
        console.log('[AdsBar] Active ads after filtering:', activeAds);
        // cache result
        adsCache[role] = { data: activeAds, timestamp: Date.now() };
        setAds(activeAds);
        setIndex(0);
      } catch (e) {
        console.error('[AdsBar] fetch error', e);
        setAds([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAds();
  }, [role]);

  useEffect(() => {
    if (ads.length <= 1) return;
    const id = setInterval(() => {
      setIndex(prev => (prev + 1) % ads.length);
    }, 8000);
    return () => clearInterval(id);
  }, [ads]);

  const current = useMemo(() => (ads.length ? ads[Math.max(0, Math.min(index, ads.length - 1))] : null), [ads, index]);

  if (loading || !current) return null;

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center gap-3 py-3">
          {/* Left control */}
          {ads.length > 1 && (
            <button
              onClick={() => setIndex(i => (i - 1 + ads.length) % ads.length)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
              aria-label="Previous announcement"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Banner content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-md flex items-center justify-center text-indigo-600 flex-shrink-0">
                <Megaphone className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <p className="font-medium text-gray-900 truncate">{current.title}</p>
                </div>
                <p className="text-sm text-gray-600 truncate">{current.description}</p>
              </div>
            </div>
            {current.bannerImageUrl && (
              <div className="mt-3 overflow-hidden rounded-md border border-gray-100 bg-gray-50">
                {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
                <img
                  src={current.bannerImageUrl}
                  alt="Announcement banner"
                  className="w-full h-56 object-cover"
                  loading="lazy"
                />
              </div>
            )}
          </div>

          {/* Right control */}
          {ads.length > 1 && (
            <button
              onClick={() => setIndex(i => (i + 1) % ads.length)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
              aria-label="Next announcement"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

function getAuthToken() {
  const str = localStorage.getItem('user');
  if (!str) return null;
  try {
    const obj = JSON.parse(str);
    return obj?.token || null;
  } catch {
    return null;
  }
}

export default AdsBar;


