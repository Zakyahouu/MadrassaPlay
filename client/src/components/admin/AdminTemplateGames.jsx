import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { RefreshCcw, Play, Trash2, Filter, Gamepad2, Loader2 } from 'lucide-react';

/* AdminTemplateGames
   Purpose: Dedicated admin view to browse all game creations grouped by template,
   filter by template, and quickly play or delete a game.
*/
const AdminTemplateGames = () => {
  // Data
  const [templates, setTemplates] = useState([]);
  const [games, setGames] = useState([]);
  // UI state
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingGames, setLoadingGames] = useState(false);
  const [error, setError] = useState(null);
  const [templateId, setTemplateId] = useState('');
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch templates once
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingTemplates(true); setError(null);
      try {
        const { data } = await axios.get('/api/templates');
        if (mounted) setTemplates(data || []);
      } catch (e) {
        if (mounted) setError('Failed to load templates');
      } finally { if (mounted) setLoadingTemplates(false); }
    })();
    return () => { mounted = false; };
  }, []);

  // Fetch games for selected template
  useEffect(() => {
    if (!templateId) { setGames([]); return; }
    let mounted = true;
    (async () => {
      setLoadingGames(true); setError(null);
      try {
        const { data } = await axios.get(`/api/creations?template=${templateId}`);
        if (mounted) setGames(data || []);
      } catch (e) {
        if (mounted) setError('Failed to load games for template');
      } finally { if (mounted) setLoadingGames(false); }
    })();
    return () => { mounted = false; };
  }, [templateId, refreshKey]);

  const currentTemplate = useMemo(() => templates.find(t => t._id === templateId), [templates, templateId]);

  const filteredGames = useMemo(() => {
    if (!search.trim()) return games;
    const q = search.toLowerCase();
    return games.filter(g => g.name?.toLowerCase().includes(q));
  }, [games, search]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this game creation permanently?')) return;
    try {
      await axios.delete(`/api/creations/${id}`);
      setGames(prev => prev.filter(g => g._id !== id));
    } catch (e) {
      setError(e.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full" />
          <h1 className="text-2xl font-bold text-gray-900">Games by Template</h1>
          {templateId && (
            <span className="text-xs px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium">{filteredGames.length} game{filteredGames.length!==1?'s':''}</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="px-3 py-2 border rounded-lg text-sm bg-white"
            value={templateId}
            onChange={e => setTemplateId(e.target.value)}
          >
            <option value="">Select Template…</option>
            {templates.map(t => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search games…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
            disabled={!templateId}
          />
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            disabled={!templateId || loadingGames}
            className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-sm bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCcw className="w-4 h-4" /> Refresh
          </button>
          {templateId && (
            <Link to={`/teacher/create-game/${templateId}`} className="inline-flex">
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
                <Filter className="w-4 h-4" /> New From Template
              </button>
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded text-sm text-red-700">{error}</div>
      )}

      {/* Template Meta Summary */}
      {templateId && currentTemplate && (
        <div className="p-4 bg-white rounded-xl border shadow-sm flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-50 border rounded-lg flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{currentTemplate.name}</p>
              <p className="text-xs text-gray-500">Status: {currentTemplate.status}</p>
            </div>
          </div>
          <div className="text-xs text-gray-500 max-w-md line-clamp-2">{currentTemplate.description}</div>
        </div>
      )}

      {/* Games List */}
      <div className="bg-white rounded-xl border shadow-sm p-4 min-h-[200px]">
        {!templateId && (
          <div className="text-sm text-gray-500 py-12 text-center">Select a template to view its games.</div>
        )}
        {templateId && loadingGames && (
          <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading games…
          </div>
        )}
        {templateId && !loadingGames && filteredGames.length === 0 && (
          <div className="py-12 text-center text-gray-500 text-sm">
            No games created yet for this template.
            <div className="mt-4">
              <Link to={`/teacher/create-game/${templateId}`} className="inline-flex">
                <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium">Create First Game</button>
              </Link>
            </div>
          </div>
        )}
        {templateId && !loadingGames && filteredGames.length > 0 && (
          <div className="space-y-3">
            {filteredGames.map(g => {
              const isPublished = g.template?.status === 'published';
              return (
                <div key={g._id} className="p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 truncate" title={g.name}>{g.name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{isPublished ? 'Template Published' : 'Template Draft'}</span>
                    </div>
                    <p className="text-xs text-gray-500">Created {new Date(g.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/admin/play-game/${g._id}`} state={{ templateId }}>
                      <button className="inline-flex items-center gap-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm">
                        <Play className="w-4 h-4" /> Play
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDelete(g._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      title="Delete game"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTemplateGames;
