import React, { useEffect, useState } from 'react';

const TeacherResources = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [resources, setResources] = useState([]);
  const [allResources, setAllResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('class'); // 'class' | 'all'
  const [uploading, setUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isOwner, setIsOwner] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editAllowed, setEditAllowed] = useState([]); // class ids
  const [editMode, setEditMode] = useState('meta'); // 'meta' | 'access'
  const [selectedIds, setSelectedIds] = useState([]); // bulk selection
  const [bulkMode, setBulkMode] = useState(null); // null | 'access'
  const [bulkAllowed, setBulkAllowed] = useState([]);
  const [bulkApplying, setBulkApplying] = useState(false);

  const TEACHER_LIMIT = 20;
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_MIME = new Set([
    'application/pdf',
    'image/png', 'image/jpeg', 'image/jpg', 'image/gif',
    'text/plain', 'text/markdown',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]);
  const limitReached = allResources.length >= TEACHER_LIMIT;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const axios = (await import('axios')).default;
        const res = await axios.get('/api/classes/teacher');
        if (!mounted) return;
  const list = res.data || [];
        setClasses(list);
        if (list.length) {
          setSelectedClass(list[0]._id);
          setIsOwner(true);
        }
      } catch (e) {
        if (!mounted) return;
        setError('Failed to load classes');
      }
    })();
    return () => { mounted = false; };
  }, []);

  const fetchResources = async (classId) => {
    if (!classId) { setResources([]); return; }
    setLoading(true);
    setError(null);
    try {
      const axios = (await import('axios')).default;
      const res = await axios.get(`/api/classes/${classId}/resources`);
      setResources((res.data || []).map(r => ({
        ...r,
        _size: typeof r.size === 'number' ? r.size : 0,
        _type: r.mimeType || '',
        _date: r.createdAt || r.updatedAt || null,
      })));
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load resources');
      setResources([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchResources(selectedClass); }, [selectedClass]);

  const fetchAllResources = async () => {
    setLoadingAll(true);
    setError(null);
    try {
      const axios = (await import('axios')).default;
      const res = await axios.get(`/api/classes/me/resources`);
      setAllResources((res.data || []).map(r => ({
        ...r,
        _size: typeof r.size === 'number' ? r.size : 0,
        _type: r.mimeType || '',
        _date: r.createdAt || r.updatedAt || null,
      })));
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load your files');
      setAllResources([]);
    } finally { setLoadingAll(false); }
  };

  useEffect(() => {
    if (viewMode === 'all') fetchAllResources();
  }, [viewMode]);

  // Fetch once on mount for usage counter
  useEffect(() => { fetchAllResources(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
  // Client-side validation
  if (uploadFile.size > MAX_FILE_SIZE) { setError('File too large (max 5MB)'); return; }
  if (!ALLOWED_MIME.has(uploadFile.type)) { setError('File type not allowed'); return; }
    setUploading(true);
    setError(null);
    try {
      const axios = (await import('axios')).default;
      const fd = new FormData();
      fd.append('file', uploadFile);
      if (uploadTitle) fd.append('title', uploadTitle);
      if (uploadDesc) fd.append('description', uploadDesc);
      // No class assignment at upload time; teachers will manage access later
      await axios.post(`/api/classes/me/resources`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadFile(null); setUploadTitle(''); setUploadDesc('');
  // After upload with no classes, show in "All Files"
  setViewMode('all');
  await fetchAllResources();
    } catch (e) {
      setError(e?.response?.data?.message || 'Upload failed');
    } finally { setUploading(false); }
  };

  // Drag & drop handlers
  const onDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const onDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const onDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) { setError('File too large (max 5MB)'); return; }
    if (!ALLOWED_MIME.has(file.type)) { setError('File type not allowed'); return; }
    setUploadFile(file);
  };

  const handleDelete = async (resId) => {
    if (!window.confirm('Delete this resource?')) return;
    try {
      const axios = (await import('axios')).default;
      await axios.delete(`/api/classes/me/resources/${resId}`);
      if (viewMode === 'all') await fetchAllResources(); else await fetchResources(selectedClass);
    } catch (e) {
      setError(e?.response?.data?.message || 'Delete failed');
    }
  };

  const handleReplace = async (resId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const axios = (await import('axios')).default;
        const fd = new FormData();
        fd.append('file', file);
        await axios.put(`/api/classes/me/resources/${resId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (viewMode === 'all') await fetchAllResources(); else await fetchResources(selectedClass);
      } catch (e) {
        setError(e?.response?.data?.message || 'Replace failed');
      }
    };
    input.click();
  };

  const startInlineEdit = (r) => {
    setEditingId(r._id);
    setEditTitle(r.title || '');
    setEditDesc(r.description || '');
  const allowed = Array.isArray(r.allowedClasses) ? r.allowedClasses.map(x=> (typeof x === 'string' ? x : x?._id || String(x))) : [];
  setEditAllowed(allowed);
    setEditMode('meta');
  };

  const startAssignAccess = (r) => {
    setEditingId(r._id);
    setEditMode('access');
    const allowed = Array.isArray(r.allowedClasses) ? r.allowedClasses.map(x=> (typeof x === 'string' ? x : x?._id || String(x))) : [];
    setEditAllowed(allowed);
  };

  const saveInlineEdit = async () => {
    if (!editingId) return;
    try {
      const axios = (await import('axios')).default;
      const payload = {};
      if (editMode === 'meta') {
        if (typeof editTitle === 'string') payload.title = editTitle;
        if (typeof editDesc === 'string') payload.description = editDesc;
      }
      if (editMode === 'access') {
        if (Array.isArray(editAllowed)) payload.allowedClasses = editAllowed;
      }
  await axios.put(`/api/classes/me/resources/${editingId}`, payload);
  setEditingId(null);
  if (viewMode === 'all') await fetchAllResources(); else await fetchResources(selectedClass);
    } catch (e) {
      setError(e?.response?.data?.message || 'Save failed');
    }
  };

  // Bulk selection helpers
  const toggleSelected = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const clearSelection = () => setSelectedIds([]);
  const selectAllInView = () => {
    const current = viewMode === 'all' ? allResources : resources;
    setSelectedIds(current.map(r => r._id));
  };

  const bulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Delete ${selectedIds.length} file(s)?`)) return;
    try {
      const axios = (await import('axios')).default;
      for (const id of selectedIds) {
        // eslint-disable-next-line no-await-in-loop
        await axios.delete(`/api/classes/me/resources/${id}`);
      }
      clearSelection();
      await fetchAllResources();
      if (viewMode === 'class') await fetchResources(selectedClass);
    } catch (e) {
      setError(e?.response?.data?.message || 'Bulk delete failed');
    }
  };

  const startBulkAccess = () => {
    setBulkMode('access');
    setBulkAllowed([]);
  };

  const applyBulkAccess = async () => {
    if (!selectedIds.length) return;
    setBulkApplying(true);
    try {
      const axios = (await import('axios')).default;
      for (const id of selectedIds) {
        // eslint-disable-next-line no-await-in-loop
        await axios.put(`/api/classes/me/resources/${id}`, { allowedClasses: bulkAllowed });
      }
      setBulkMode(null);
      clearSelection();
      await fetchAllResources();
      if (viewMode === 'class') await fetchResources(selectedClass);
    } catch (e) {
      setError(e?.response?.data?.message || 'Bulk update failed');
    } finally { setBulkApplying(false); }
  };

  const cancelInlineEdit = () => {
    setEditingId(null);
  };

  const handleDownload = async (resId, originalName, classIdOverride) => {
    try {
      const axios = (await import('axios')).default;
      const clsId = classIdOverride || selectedClass;
      if (!clsId) {
        setError('No class selected or assigned for download');
        return;
      }
      const resp = await axios.get(`/api/classes/${clsId}/resources/${resId}/download`, { responseType: 'blob' });
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
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Class Resources</h1>
            <p className="text-gray-600 text-lg">Upload and manage educational materials for your classes</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-indigo-600">{allResources.length}</div>
            <div className="text-sm text-indigo-600">Files uploaded</div>
          </div>
        </div>
      </div>

      {/* Enhanced View switch + Class Picker */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-2">
            <button 
              onClick={()=>setViewMode('class')} 
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                viewMode==='class'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                  : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-700'
              }`}
            >
              By Class
            </button>
            <button 
              onClick={()=>setViewMode('all')} 
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                viewMode==='all'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                  : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-700'
              }`}
            >
              All Files
            </button>
          </div>
          {viewMode==='class' && (
            <div className="flex items-center gap-3 w-full md:w-auto md:ml-4">
              <label className="text-sm font-medium text-gray-700">Class</label>
              <select
                value={selectedClass}
                onChange={(e)=>setSelectedClass(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {classes.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-2 md:ml-auto">
            <div className="text-sm text-gray-500">Storage:</div>
            <div className="text-sm font-medium text-indigo-600">{allResources.length}/20 files</div>
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-indigo-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(allResources.length / 20) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Uploader */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}
        {limitReached && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="text-sm text-amber-700">
              <span className="font-medium">Storage limit reached!</span> You've reached the limit of {TEACHER_LIMIT} files. Delete some files to upload new ones.
            </div>
          </div>
        )}
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text" 
              placeholder="File title (optional)" 
              value={uploadTitle} 
              onChange={(e)=>setUploadTitle(e.target.value)} 
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
            />
            <input 
              type="text" 
              placeholder="Description (optional)" 
              value={uploadDesc} 
              onChange={(e)=>setUploadDesc(e.target.value)} 
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
            />
          </div>
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
              isDragging 
                ? 'border-indigo-400 bg-indigo-50' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <div className="space-y-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="text-lg font-medium text-gray-700">Drop your file here</div>
              <div className="text-sm text-gray-500">or click to browse your computer</div>
              <div className="mt-4">
                <input id="fileInput" type="file" onChange={(e)=>setUploadFile(e.target.files?.[0]||null)} className="hidden" disabled={limitReached} />
                <label
                  htmlFor="fileInput"
                  className={`px-6 py-3 text-sm font-medium rounded-lg border inline-block transition-all duration-200 ${
                    limitReached 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                      : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-sm hover:shadow-md'
                  }`}
                >
                  Choose File
                </label>
              </div>
            </div>
            {uploadFile && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm text-green-700">
                  <span className="font-medium">Selected:</span> {uploadFile.name} • {(uploadFile.size/1024).toFixed(1)} KB
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <button 
              type="submit" 
              disabled={!isOwner || uploading || !uploadFile || limitReached} 
              className="px-6 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
            >
              {uploading ? 'Uploading...' : 'Upload File'}
            </button>
            <div className="text-sm text-gray-500">
              <span className="font-medium">{allResources.length}</span> of <span className="font-medium">{TEACHER_LIMIT}</span> files used
            </div>
          </div>
        </form>
      </div>

      {/* Bulk actions toolbar */}
      {(viewMode === 'all' ? allResources : resources).length > 0 && (
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center gap-3">
          <button onClick={selectAllInView} className="px-2 py-1 text-xs rounded border bg-white hover:bg-gray-50">Select all</button>
          <button onClick={clearSelection} className="px-2 py-1 text-xs rounded border bg-white hover:bg-gray-50">Clear</button>
          <div className="text-xs text-gray-600">{selectedIds.length} selected</div>
          <div className="ml-auto flex items-center gap-2">
            <button disabled={!selectedIds.length} onClick={startBulkAccess} className="px-2 py-1 text-xs rounded border bg-white hover:bg-gray-50 disabled:opacity-50">Manage Access</button>
            <button disabled={!selectedIds.length} onClick={bulkDelete} className="px-2 py-1 text-xs rounded border bg-white hover:bg-gray-50 text-red-600 disabled:opacity-50">Delete</button>
          </div>
        </div>
      )}

      {/* Enhanced Resources List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {viewMode === 'class' ? (
          loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Loading resources...</span>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {resources.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">No resources yet</p>
                  <p className="text-sm text-gray-400 mt-1">Upload files to share with your students</p>
                </div>
              ) : (
                resources.map(r => (
                  <div key={r._id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" 
                        checked={selectedIds.includes(r._id)} 
                        onChange={()=>toggleSelected(r._id)} 
                      />
                      <div className="flex-1 min-w-0">
                        {editingId === r._id ? (
                          <div className="space-y-3">
                            {editMode === 'meta' && (
                              <>
                                <input 
                                  value={editTitle} 
                                  onChange={(e)=>setEditTitle(e.target.value)} 
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
                                  placeholder="File title" 
                                />
                                <input 
                                  value={editDesc} 
                                  onChange={(e)=>setEditDesc(e.target.value)} 
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
                                  placeholder="Description" 
                                />
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{(r._type||'').split('/')[1] || r._type || 'file'}</span>
                                  <span>{(r._size/1024).toFixed(1)} KB</span>
                                  {r._date && <span>{new Date(r._date).toLocaleDateString()}</span>}
                                </div>
                              </>
                            )}
                            {editMode === 'access' && (
                              <>
                                <div className="text-sm font-medium text-gray-700 mb-2">Choose classes with access</div>
                                <div className="flex items-center gap-2 mb-3">
                                  <button type="button" onClick={() => setEditAllowed(classes.map(c=>c._id))} className="px-3 py-1 text-xs rounded-lg border border-gray-300 bg-white hover:bg-gray-50">Select all</button>
                                  <button type="button" onClick={() => setEditAllowed([])} className="px-3 py-1 text-xs rounded-lg border border-gray-300 bg-white hover:bg-gray-50">Clear all</button>
                                  <div className="text-xs text-gray-500">{editAllowed.length}/{classes.length} selected</div>
                                </div>
                                <div className="max-h-40 overflow-auto border border-gray-200 rounded-lg p-3 bg-white">
                                  {classes.map(c => (
                                    <label key={c._id} className="flex items-center gap-2 text-sm py-1">
                                      <input type="checkbox" checked={editAllowed.includes(c._id)} onChange={(e)=>{ setEditAllowed(prev => e.target.checked ? [...new Set([...prev, c._id])] : prev.filter(id => id !== c._id)); }} />
                                      <span className="truncate">{c.name}</span>
                                    </label>
                                  ))}
                                </div>
                                <div className="text-xs text-gray-500">{editAllowed.length} class{editAllowed.length!==1?'es':''} selected</div>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-gray-900 truncate">{r.title || r.originalName}</h3>
                              {r.description && <p className="text-sm text-gray-500 truncate mt-1">{r.description}</p>}
                              <div className="flex items-center gap-3 mt-2">
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">{(r._type||'').split('/')[1] || r._type || 'file'}</span>
                                <span className="text-xs text-gray-500">{(r._size/1024).toFixed(1)} KB</span>
                                {r._date && <span className="text-xs text-gray-500">{new Date(r._date).toLocaleDateString()}</span>}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {editingId === r._id ? (
                          <>
                            <button onClick={saveInlineEdit} className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Save</button>
                            <button onClick={cancelInlineEdit} className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                          </>
                        ) : (
                          <>
                            <button onClick={()=>handleDownload(r._id, r.originalName)} className="px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100">Download</button>
                            {isOwner && (
                              <>
                                <button onClick={()=>startInlineEdit(r)} className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Edit</button>
                                <button onClick={()=>startAssignAccess(r)} className="px-3 py-1 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100">Access</button>
                                <button onClick={()=>handleReplace(r._id)} className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">Replace</button>
                                <button onClick={()=>handleDelete(r._id)} className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100">Delete</button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )
        ) : (
          loadingAll ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Loading your files...</span>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {allResources.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-gray-500">No files yet</p>
                  <p className="text-sm text-gray-400 mt-1">Upload files to get started</p>
                </div>
              ) : (
                allResources.map(r => {
                  const allowedIds = Array.isArray(r.allowedClasses) ? r.allowedClasses.map(x => (typeof x === 'string' ? x : x?._id || String(x))) : [];
                  const classForDownload = allowedIds.includes(selectedClass) ? selectedClass : (allowedIds[0] || null);
                  return (
                    <div key={r._id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" 
                          checked={selectedIds.includes(r._id)} 
                          onChange={()=>toggleSelected(r._id)} 
                        />
                        <div className="flex-1 min-w-0">
                          {editingId === r._id ? (
                            <div className="space-y-3">
                              {editMode === 'meta' && (
                                <>
                                  <input 
                                    value={editTitle} 
                                    onChange={(e)=>setEditTitle(e.target.value)} 
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
                                    placeholder="File title" 
                                  />
                                  <input 
                                    value={editDesc} 
                                    onChange={(e)=>setEditDesc(e.target.value)} 
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
                                    placeholder="Description" 
                                  />
                                  <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{(r._type||'').split('/')[1] || r._type || 'file'}</span>
                                    <span>{(r._size/1024).toFixed(1)} KB</span>
                                    {r._date && <span>{new Date(r._date).toLocaleDateString()}</span>}
                                  </div>
                                </>
                              )}
                              {editMode === 'access' && (
                                <>
                                  <div className="text-sm font-medium text-gray-700 mb-2">Choose classes with access</div>
                                  <div className="flex items-center gap-2 mb-3">
                                    <button type="button" onClick={() => setEditAllowed(classes.map(c=>c._id))} className="px-3 py-1 text-xs rounded-lg border border-gray-300 bg-white hover:bg-gray-50">Select all</button>
                                    <button type="button" onClick={() => setEditAllowed([])} className="px-3 py-1 text-xs rounded-lg border border-gray-300 bg-white hover:bg-gray-50">Clear all</button>
                                    <div className="text-xs text-gray-500">{editAllowed.length}/{classes.length} selected</div>
                                  </div>
                                  <div className="max-h-40 overflow-auto border border-gray-200 rounded-lg p-3 bg-white">
                                    {classes.map(c => (
                                      <label key={c._id} className="flex items-center gap-2 text-sm py-1">
                                        <input type="checkbox" checked={editAllowed.includes(c._id)} onChange={(e)=>{ setEditAllowed(prev => e.target.checked ? [...new Set([...prev, c._id])] : prev.filter(id => id !== c._id)); }} />
                                        <span className="truncate">{c.name}</span>
                                      </label>
                                    ))}
                                  </div>
                                  <div className="text-xs text-gray-500">{editAllowed.length} class{editAllowed.length!==1?'es':''} selected</div>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-gray-900 truncate">{r.title || r.originalName}</h3>
                                {r.description && <p className="text-sm text-gray-500 truncate mt-1">{r.description}</p>}
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">{(r._type||'').split('/')[1] || r._type || 'file'}</span>
                                  <span className="text-xs text-gray-500">{(r._size/1024).toFixed(1)} KB</span>
                                  {r._date && <span className="text-xs text-gray-500">{new Date(r._date).toLocaleDateString()}</span>}
                                  {Array.isArray(r.allowedClasses) && r.allowedClasses.length === 0 && (
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">No access</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {editingId === r._id ? (
                            <>
                              <button onClick={saveInlineEdit} className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Save</button>
                              <button onClick={cancelInlineEdit} className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                            </>
                          ) : (
                            <>
                              <button 
                                disabled={!classForDownload} 
                                onClick={()=>handleDownload(r._id, r.originalName, classForDownload)} 
                                className={`px-3 py-1 text-xs font-medium rounded-lg ${
                                  classForDownload 
                                    ? 'text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100' 
                                    : 'text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed'
                                }`}
                              >
                                Download
                              </button>
                              {isOwner && (
                                <>
                                  <button onClick={()=>startInlineEdit(r)} className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Edit</button>
                                  <button onClick={()=>startAssignAccess(r)} className="px-3 py-1 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100">Access</button>
                                  <button onClick={()=>handleReplace(r._id)} className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">Replace</button>
                                  <button onClick={()=>handleDelete(r._id)} className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100">Delete</button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )
        )}
      </div>

      {/* Bulk Manage Access drawer */}
      {bulkMode === 'access' && (
        <div className="fixed inset-0 z-40 bg-black/30 flex items-end md:items-center md:justify-center" onClick={()=>!bulkApplying && setBulkMode(null)}>
          <div className="bg-white w-full md:max-w-lg rounded-t-2xl md:rounded-2xl p-4 shadow-lg" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium">Manage Access for {selectedIds.length} file(s)</div>
              <button disabled={bulkApplying} onClick={()=>setBulkMode(null)} className="px-2 py-1 text-xs rounded border bg-white hover:bg-gray-50 disabled:opacity-50">Close</button>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <button type="button" onClick={() => setBulkAllowed(classes.map(c=>c._id))} className="px-2 py-1 text-xs rounded-md border bg-white hover:bg-gray-50">Select all</button>
              <button type="button" onClick={() => setBulkAllowed([])} className="px-2 py-1 text-xs rounded-md border bg-white hover:bg-gray-50">Clear all</button>
              <div className="text-[11px] text-gray-500">{bulkAllowed.length}/{classes.length} selected</div>
            </div>
            <div className="max-h-64 overflow-auto border rounded p-2 bg-white">
              {classes.map(c => (
                <label key={c._id} className="flex items-center gap-2 text-sm py-0.5">
                  <input type="checkbox" checked={bulkAllowed.includes(c._id)} onChange={(e)=>{
                    setBulkAllowed(prev => e.target.checked ? [...new Set([...prev, c._id])] : prev.filter(id => id !== c._id));
                  }} />
                  <span className="truncate">{c.name}</span>
                </label>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button disabled={bulkApplying} onClick={applyBulkAccess} className="px-3 py-2 text-sm rounded-md border bg-white hover:bg-gray-50 disabled:opacity-50">Apply</button>
              <button disabled={bulkApplying} onClick={()=>setBulkMode(null)} className="px-3 py-2 text-sm rounded-md border bg-white hover:bg-gray-50 disabled:opacity-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherResources;
