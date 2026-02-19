import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const LandingPageSettings = () => {
  const { t } = useLanguage();
  const { user } = useContext(AuthContext);
  const [data, setData] = useState({
    isEnabled: false,
    heroTitle: '',
    aboutSection: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    galleryImages: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCurrent = async () => {
      if (!user?.school) { setLoading(false); return; }
      try {
        const token = JSON.parse(localStorage.getItem('user'))?.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get(`/api/schools/${user.school}`, config);
        const lp = res.data?.landingPage || {};
        setData({
          isEnabled: !!lp.isEnabled,
          heroTitle: lp.heroTitle || '',
          aboutSection: lp.aboutSection || '',
          contactPhone: lp.contactPhone || '',
          contactEmail: lp.contactEmail || '',
          address: lp.address || '',
          galleryImages: Array.isArray(lp.galleryImages) ? lp.galleryImages : [],
        });
      } catch (err) {
        console.error('Failed to load landing page', err);
      } finally { setLoading(false); }
    };
    fetchCurrent();
  }, [user?.school]);

  const uploadImage = async (file) => {
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      const config = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } };
      const form = new FormData();
      form.append('image', file);
      const res = await axios.post('/api/schools/my-school/landing-page/upload', form, config);
      return res.data?.url;
    } catch (err) {
      console.error('Image upload failed', err);
      return null;
    }
  };

  const handleAddImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (url) setData((d) => ({ ...d, galleryImages: [...d.galleryImages, url] }));
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const payload = { ...data };
      await axios.put('/api/schools/my-school/landing-page', payload, config);
      alert(t.landingPageSaved);
    } catch (err) {
      console.error('Save failed', err);
      alert(err?.response?.data?.message || t.saveFailed);
    } finally { setSaving(false); }
  };

  const handlePreview = () => {
    // Determine school id from current user context
    const rawSchool = user?.school;
    const schoolId = typeof rawSchool === 'string' ? rawSchool : (rawSchool && rawSchool._id ? rawSchool._id : null);
    if (!schoolId) {
      alert(t.noSchoolToPreview);
      return;
    }
    const url = `${window.location.origin}/school/${schoolId}`;
    window.open(url, '_blank');
  };

  if (loading) return <div className="p-6">{t.loading}</div>;

  return (
    <div className="space-y-4 bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold">{t.landingPageSettings}</h3>
      <div>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={data.isEnabled} onChange={(e) => setData({ ...data, isEnabled: e.target.checked })} /> {t.enablePublicPage}
        </label>
      </div>
      <div>
        <label className="block text-sm text-gray-600">{t.heroTitle}</label>
        <input value={data.heroTitle} onChange={(e) => setData({ ...data, heroTitle: e.target.value })} className="w-full p-2 border rounded" />
      </div>
      <div>
        <label className="block text-sm text-gray-600">{t.aboutSection}</label>
        <textarea value={data.aboutSection} onChange={(e) => setData({ ...data, aboutSection: e.target.value })} className="w-full p-2 border rounded" rows={6} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600">{t.contactPhone}</label>
          <input value={data.contactPhone} onChange={(e) => setData({ ...data, contactPhone: e.target.value })} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm text-gray-600">{t.contactEmail}</label>
          <input value={data.contactEmail} onChange={(e) => setData({ ...data, contactEmail: e.target.value })} className="w-full p-2 border rounded" />
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-600">{t.address}</label>
        <input value={data.address} onChange={(e) => setData({ ...data, address: e.target.value })} className="w-full p-2 border rounded" />
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-2">{t.gallery}</label>
        <div className="flex gap-2 items-center">
          <input type="file" accept="image/*" onChange={handleAddImage} />
          <small className="text-xs text-gray-500">{t.uploadImageNote}</small>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {data.galleryImages.map((u, i) => (
            <div key={i} className="border rounded p-1">
              <img src={u} alt={`gallery-${i}`} className="w-full h-24 object-cover" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button className="px-4 py-2 bg-blue-600 text-white rounded" disabled={saving} onClick={onSave}>{saving ? t.saving : t.save}</button>
        <button
          className="px-4 py-2 bg-white border text-gray-700 rounded hover:bg-gray-50"
          onClick={handlePreview}
          disabled={!user?.school}
          title={user?.school ? t.openPublicPage : t.assignSchoolToPreview}
        >
          {t.preview}
        </button>
      </div>
    </div>
  );
};

export default LandingPageSettings;