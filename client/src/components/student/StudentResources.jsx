import React, { useEffect, useState } from 'react';

const StudentResources = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState(null); // { url, type, name }

  // Load student's classes
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const axios = (await import('axios')).default;
  const res = await axios.get('/api/classes/my');
        if (!mounted) return;
        const list = res.data || [];
        setClasses(list);
  const last = localStorage.getItem('student:lastClassId');
  const initial = list.find(c=>c._id===last)? last : (list[0]?._id || '');
  if (initial) setSelectedClass(initial);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || 'Failed to load your classes');
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Load resources for selected class
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!selectedClass) { setResources([]); return; }
      localStorage.setItem('student:lastClassId', selectedClass);
      setLoading(true);
      setError(null);
      try {
        const axios = (await import('axios')).default;
        const res = await axios.get(`/api/classes/${selectedClass}/resources`);
        if (!mounted) return;
        setResources((res.data || []).map(r => ({
          ...r,
          _size: typeof r.size === 'number' ? r.size : 0,
          _type: r.mimeType || '',
          _date: r.createdAt || r.updatedAt || null,
        })));
      } catch (e) {
        if (!mounted) return;
        setResources([]);
        setError(e?.response?.data?.message || 'Failed to load resources');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [selectedClass]);

  const handleDownload = async (resId, originalName) => {
    try {
      const axios = (await import('axios')).default;
      const resp = await axios.get(`/api/classes/${selectedClass}/resources/${resId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName || 'resource');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError(e?.response?.data?.message || 'Download failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Resources</h1>
          <p className="text-gray-600">View and download files shared by your teachers</p>
        </div>
      </div>

      {/* Class Picker */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <label className="text-sm text-gray-600">Class</label>
            <select
              value={selectedClass}
              onChange={(e)=>setSelectedClass(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              {classes.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 ml-auto w-full md:w-auto">
            <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search…" className="px-3 py-2 border rounded-md w-full md:w-64" />
            <div className="text-xs text-gray-500 whitespace-nowrap">{resources.length} files</div>
          </div>
        </div>
      </div>

      {/* Resources List */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        {error && <div className="text-xs text-red-600 mb-2">{error}</div>}
        {loading ? (
          <div className="text-xs text-gray-500">Loading…</div>
        ) : (
          <div className="space-y-2">
            {resources.filter(r=>{
              const q = query.toLowerCase();
              const a = (r.title||'').toLowerCase();
              const b = (r.description||'').toLowerCase();
              const c = (r.originalName||'').toLowerCase();
              return !q || a.includes(q) || b.includes(q) || c.includes(q);
            }).length === 0 && <div className="text-xs text-gray-500">No resources yet.</div>}
            {resources.filter(r=>{
              const q = query.toLowerCase();
              const a = (r.title||'').toLowerCase();
              const b = (r.description||'').toLowerCase();
              const c = (r.originalName||'').toLowerCase();
              return !q || a.includes(q) || b.includes(q) || c.includes(q);
            }).map(r => (
              <div key={r._id} className="flex items-center justify-between p-2 rounded border bg-gray-50">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{r.title || r.originalName}</div>
                  <div className="text-[11px] text-gray-500 truncate">{r.description}</div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                    <span>{(r._type||'').split('/')[1] || r._type || 'file'}</span>
                    <span>• {(r._size/1024).toFixed(1)} KB</span>
                    {r._date && <span>• {new Date(r._date).toLocaleString()}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(r._type?.startsWith('image/') || r._type === 'application/pdf') && (
                    <button onClick={async ()=>{
                      try {
                        const axios = (await import('axios')).default;
                        const resp = await axios.get(`/api/classes/${selectedClass}/resources/${r._id}/download`, { responseType: 'blob' });
                        const url = URL.createObjectURL(new Blob([resp.data], { type: r._type }));
                        setPreview({ url, type: r._type, name: r.originalName });
                      } catch (_) {}
                    }} className="px-2 py-1 text-xs rounded-md border bg-white hover:bg-gray-50">Preview</button>
                  )}
                  <button onClick={()=>handleDownload(r._id, r.originalName)} className="px-2 py-1 text-xs rounded-md border bg-white hover:bg-gray-50">Download</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={()=>{ URL.revokeObjectURL(preview.url); setPreview(null); }}>
          <div className="bg-white w-full max-w-3xl rounded-xl overflow-hidden" onClick={(e)=>e.stopPropagation()}>
            <div className="p-3 border-b flex items-center justify-between">
              <div className="text-sm font-medium text-gray-800 truncate">{preview.name}</div>
              <button onClick={()=>{ URL.revokeObjectURL(preview.url); setPreview(null); }} className="px-2 py-1 text-xs rounded-md border bg-white hover:bg-gray-50">Close</button>
            </div>
            <div className="p-3">
              {preview.type === 'application/pdf' ? (
                <iframe src={preview.url} title="preview" className="w-full h-[70vh] border" />
              ) : (
                <img src={preview.url} alt="preview" className="max-h-[70vh] mx-auto" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentResources;
