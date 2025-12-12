import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const PublicSchoolPage = () => {
  const { schoolId } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/public/landing-page/${schoolId}`);
        setPage(res.data);
      } catch (err) {
        setError(err?.response?.data?.message || 'Page not found');
      } finally { setLoading(false); }
    };
    load();
  }, [schoolId]);

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

  const { name, logo, pageContent } = page || {};

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="flex items-center gap-4 mb-8">
        {logo && <img src={logo} alt={`${name} logo`} className="w-20 h-20 object-cover rounded-full" />}
        <div>
          <h1 className="text-2xl font-bold">{name}</h1>
          <p className="text-sm text-gray-600">{pageContent?.contactEmail}</p>
        </div>
      </header>

      <section className="bg-blue-50 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">{pageContent?.heroTitle}</h2>
        <p className="text-gray-700">{pageContent?.aboutSection}</p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Contact</h3>
        <p>Phone: {pageContent?.contactPhone || '-'}</p>
        <p>Email: {pageContent?.contactEmail || '-'}</p>
        <p>Address: {pageContent?.address || '-'}</p>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">Gallery</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(pageContent?.galleryImages || []).map((imgUrl, i) => (
            <img key={i} src={imgUrl} alt={`gallery-${i}`} className="w-full h-48 object-cover rounded" />
          ))}
        </div>
      </section>
    </div>
  );
};

export default PublicSchoolPage;