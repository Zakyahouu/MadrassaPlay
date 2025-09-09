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
    <div className="space-y-6">
  <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Resources</h1>
          <p className="text-gray-600">Upload and manage files for your classes</p>
        </div>
      </div>

      {/* View switch + Class Picker */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="flex items-center gap-2">
            <button onClick={()=>setViewMode('class')} className={`px-3 py-1.5 text-sm rounded-md border ${viewMode==='class'?'bg-gray-900 text-white border-gray-900':'bg-white hover:bg-gray-50'}`}>By Class</button>
            <button onClick={()=>setViewMode('all')} className={`px-3 py-1.5 text-sm rounded-md border ${viewMode==='all'?'bg-gray-900 text-white border-gray-900':'bg-white hover:bg-gray-50'}`}>All Files</button>
          </div>
          {viewMode==='class' && (
            <div className="flex items-center gap-2 w-full md:w-auto md:ml-4">
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
          )}
          <div className="text-xs text-gray-500 md:ml-auto">Per-teacher limit: 20 files</div>
        </div>
      </div>

      {/* Uploader (no class selection) */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        {error && <div className="text-xs text-red-600 mb-2">{error}</div>}
        {limitReached && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mb-2">
            You reached the limit of {TEACHER_LIMIT} files. Delete some files to upload new ones.
          </div>
        )}
        <form onSubmit={handleUpload} className="flex flex-col gap-3">
          <input type="text" placeholder="Title (optional)" value={uploadTitle} onChange={(e)=>setUploadTitle(e.target.value)} className="flex-1 px-3 py-2 border rounded-md" />
          <input type="text" placeholder="Description (optional)" value={uploadDesc} onChange={(e)=>setUploadDesc(e.target.value)} className="flex-1 px-3 py-2 border rounded-md" />
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-md p-4 text-center ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}
          >
            <div className="text-sm text-gray-600">Drag and drop a file here, or click to browse</div>
            <div className="mt-2">
              <input id="fileInput" type="file" onChange={(e)=>setUploadFile(e.target.files?.[0]||null)} className="hidden" disabled={limitReached} />
              <label
                htmlFor="fileInput"
                className={`px-3 py-2 text-sm rounded-md border inline-block ${limitReached ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50 cursor-pointer'}`}
              >
                Choose file
              </label>
            </div>
            {uploadFile && (
              <div className="mt-2 text-xs text-gray-500">Selected: {uploadFile.name} • {(uploadFile.size/1024).toFixed(1)} KB</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button type="submit" disabled={!isOwner || uploading || !uploadFile || limitReached} className="px-3 py-2 text-sm rounded-md border bg-white hover:bg-gray-50 disabled:opacity-50">{uploading ? 'Uploading…' : 'Upload'}</button>
            <div className="text-xs text-gray-500 ml-auto">Usage: {allResources.length}/{TEACHER_LIMIT}</div>
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

      {/* Resources List */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        {viewMode === 'class' ? (
          loading ? (
            <div className="text-sm text-gray-500 py-8 text-center">Loading resources…</div>
          ) : (
            <div className="space-y-2">
              {resources.length === 0 && <div className="text-sm text-gray-500 py-8 text-center">No resources yet.</div>}
              {resources.map(r => (
                <div key={r._id} className="flex items-center justify-between p-3 rounded border bg-gray-50">
                  <input type="checkbox" className="mr-3" checked={selectedIds.includes(r._id)} onChange={()=>toggleSelected(r._id)} />
                  <div className="min-w-0 flex-1">
                    {editingId === r._id ? (
                      <div className="space-y-1">
                        {editMode === 'meta' && (
                          <>
                            <input value={editTitle} onChange={(e)=>setEditTitle(e.target.value)} className="w-full px-2 py-1 border rounded" placeholder="Title" />
                            <input value={editDesc} onChange={(e)=>setEditDesc(e.target.value)} className="w-full px-2 py-1 border rounded" placeholder="Description" />
                            <div className="flex items-center gap-2 text-[11px] text-gray-500">
                              <span>{(r._type||'').split('/')[1] || r._type || 'file'}</span>
                              <span>• {(r._size/1024).toFixed(1)} KB</span>
                              {r._date && <span>• {new Date(r._date).toLocaleString()}</span>}
                            </div>
                          </>
                        )}
                        {editMode === 'access' && (
                          <>
                            <div className="text-[11px] text-gray-600 mt-1">Choose classes with access</div>
                            <div className="flex items-center gap-2 mt-1">
                              <button type="button" onClick={() => setEditAllowed(classes.map(c=>c._id))} className="px-2 py-1 text-xs rounded-md border bg-white hover:bg-gray-50">Select all</button>
                              <button type="button" onClick={() => setEditAllowed([])} className="px-2 py-1 text-xs rounded-md border bg-white hover:bg-gray-50">Clear all</button>
                              <div className="text-[11px] text-gray-500">{editAllowed.length}/{classes.length} selected</div>
                            </div>
                            <div className="max-h-40 overflow-auto border rounded p-2 bg-white">
                              {classes.map(c => (
                                <label key={c._id} className="flex items-center gap-2 text-sm py-0.5">
                                  <input type="checkbox" checked={editAllowed.includes(c._id)} onChange={(e)=>{ setEditAllowed(prev => e.target.checked ? [...new Set([...prev, c._id])] : prev.filter(id => id !== c._id)); }} />
                                  <span className="truncate">{c.name}</span>
                                </label>
                              ))}
                            </div>
                            <div className="text-[11px] text-gray-500">{editAllowed.length} class{editAllowed.length!==1?'es':''} selected</div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="truncate">
                        <div className="text-sm font-medium text-gray-800 truncate">{r.title || r.originalName}</div>
                        <div className="text-[11px] text-gray-500 truncate">{r.description}</div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                          <span>{(r._type||'').split('/')[1] || r._type || 'file'}</span>
                          <span>• {(r._size/1024).toFixed(1)} KB</span>
                          {r._date && <span>• {new Date(r._date).toLocaleString()}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    {editingId === r._id ? (
                      <>
                        <button onClick={saveInlineEdit} className="px-2 py-1 text-xs rounded-md border bg-white hover:bg-gray-50">Save</button>
                        <button onClick={cancelInlineEdit} className="px-2 py-1 text-xs rounded-md border bg-white hover:bg-gray-50">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={()=>handleDownload(r._id, r.originalName)} className="px-2 py-1 text-xs rounded-md border bg-white hover:bg-gray-50">Download</button>
                        {isOwner && (
                          <>
                            <button onClick={()=>startInlineEdit(r)} className="px-2 py-1 text-xs rounded-md border bg-white hover:bg-gray-50">Edit Meta</button>
                            <button onClick={()=>startAssignAccess(r)} className="px-2 py-1 text-xs rounded-md border bg-white hover:bg-gray-50">Manage Access</button>
                            <button onClick={()=>handleReplace(r._id)} className="px-2 py-1 text-xs rounded-md border bg-white hover:bg-gray-50">Replace</button>
                            <button onClick={()=>handleDelete(r._id)} className="px-2 py-1 text-xs rounded-md border bg-white hover:bg-gray-50 text-red-600">Delete</button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          loadingAll ? (
            <div className="text-sm text-gray-500 py-8 text-center">Loading your files…</div>
          ) : (
            <div className="space-y-2">
              {allResources.length === 0 && <div className="text-sm text-gray-500 py-8 text-center">No files yet. Upload to get started.</div>}
              {allResources.map(r => {
                const allowedIds = Array.isArray(r.allowedClasses) ? r.allowedClasses.map(x => (typeof x === 'string' ? x : x?._id || String(x))) : [];
                const classForDownload = allowedIds.includes(selectedClass) ? selectedClass : (allowedIds[0] || null);
                return (
                  <div key={r._id} className="flex items-center justify-between p-3 rounded border bg-gray-50">
                    <input type="checkbox" className="mr-3" checked={selectedIds.includes(r._id)} onChange={()=>toggleSelected(r._id)} />
                    <div className="min-w-0 flex-1">
                      {editingId === r._id ? (
                        <div className="space-y-1">
                          {editMode === 'meta' && (
                            <>
                              <input value={editTitle} onChange={(e)=>setEditTitle(e.target.value)} className="w-full px-2 py-1 border rounded" placeholder="Title" />
                              <input value={editDesc} onChange={(e)=>setEditDesc(e.target.value)} className="w-full px-2 py-1 border rounded" placeholder="Description" />
                              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                <span>{(r._type||'').split('/')[1] || r._type || 'file'}</span>
                                <span>• {(r._size/1024).toFixed(1)} KB</span>
                                {r._date && <span>• {new Date(r._date).toLocaleString()}</span>}
                              </div>
                            </>
                          )}
                          {editMode === 'access' && (
                            <>
                              <div className="text-[11px] text-gray-600 mt-1">Choose classes with access</div>
                              <div className="flex items-center gap-2 mt-1">
                                <button type="button" onClick={() => setEditAllowed(classes.map(c=>c._id))} className="px-2 py-1 text-xs rounded-md border bg-white hover:bg-gray-50">Select all</button>
                                <button type="button" onClick={() => setEditAllowed([])} className="px-2 py-1 text-xs rounded-md border bg-white hover:bg-gray-50">Clear all</button>
                                <div className="text-[11px] text-gray-500">{editAllowed.length}/{classes.length} selected</div>
                              </div>
                              <div className="max-h-40 overflow-auto border rounded p-2 bg-white">
                                {classes.map(c => (
                                  <label key={c._id} className="flex items-center gap-2 text-sm py-0.5">
                                    <input type="checkbox" checked={editAllowed.includes(c._id)} onChange={(e)=>{ setEditAllowed(prev => e.target.checked ? [...new Set([...prev, c._id])] : prev.filter(id => id !== c._id)); }} />
                                    <span className="truncate">{c.name}</span>
                                  </label>
                                ))}
                              </div>
                              <div className="text-[11px] text-gray-500">{editAllowed.length} class{editAllowed.length!==1?'es':''} selected</div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="truncate">
                          <div className="text-sm font-medium text-gray-800 truncate">{r.title || r.originalName}</div>
                          <div className="text-[11px] text-gray-500 truncate">{r.description}</div>
                          <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                            <span>{(r._type||'').split('/')[1] || r._type || 'file'}</span>
                            <span>• {(r._size/1024).toFixed(1)} KB</span>
                            {r._date && <span>• {new Date(r._date).toLocaleString()}</span>}
                            {Array.isArray(r.allowedClasses) && r.allowedClasses.length === 0 && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">No class access</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      {editingId === r._id ? (
                        <>
                          <button onClick={saveInlineEdit} className="px-2 py-1 text-xs rounded-md border bg-white hover:bg-gray-50">Save</button>
                          <button onClick={cancelInlineEdit} className="px-2 py-1 text-xs rounded-md border bg-white hover:bg-gray-50">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button disabled={!classForDownload} onClick={()=>handleDownload(r._id, r.originalName, classForDownload)} className={`px-2 py-1 text-xs rounded-md border ${classForDownload ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>Download</button>
                          {isOwner && (
                            <>
                              <button onClick={()=>startInlineEdit(r)} className="px-2 py-1 text-xs rounded-md border bg-white hover:bg-gray-50">Edit Meta</button>
                              <button onClick={()=>startAssignAccess(r)} className="px-2 py-1 text-xs rounded-md border bg-white hover:bg-gray-50">Manage Access</button>
                              <button onClick={()=>handleReplace(r._id)} className="px-2 py-1 text-xs rounded-md border bg-white hover:bg-gray-50">Replace</button>
                              <button onClick={()=>handleDelete(r._id)} className="px-2 py-1 text-xs rounded-md border bg-white hover:bg-gray-50 text-red-600">Delete</button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
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
