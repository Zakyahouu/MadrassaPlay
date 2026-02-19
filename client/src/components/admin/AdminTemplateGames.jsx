import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { RefreshCcw, Play, Trash2, Filter, Gamepad2, Loader2, Edit } from 'lucide-react';
import LoadingState from '../shared/LoadingState';
import EmptyState from '../shared/EmptyState';
import StatusMessage from '../shared/StatusMessage';
import { useLanguage } from '../../context/LanguageContext';

/* AdminTemplateGames
   Purpose: Dedicated admin view to browse all game creations grouped by template,
   filter by template, and quickly play or delete a game.
*/
const AdminTemplateGames = () => {
  const { t } = useLanguage();
  // Data
  const [templates, setTemplates] = useState([]);
  const [games, setGames] = useState([]);
  // UI state
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingGames, setLoadingGames] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
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
        if (mounted) setError(t.failedToLoadTemplates);
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
        if (mounted) setError(t.failedToLoadGames);
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
    if (!confirm(t.deleteGameConfirm)) return;
    try {
      await axios.delete(`/api/creations/${id}`);
      setGames(prev => prev.filter(g => g._id !== id));
    } catch (e) {
      setError(e.response?.data?.message || t.deleteFailed);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-primary rounded-full" />
          <h1 className="text-2xl font-bold text-text-main-light">{t.gamesByTemplate}</h1>
          {templateId && (
            <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">{filteredGames.length} game{filteredGames.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="px-3 py-2 border border-border-light rounded-md text-sm bg-surface-light focus:ring-2 focus:ring-primary/20 focus:border-primary"
            value={templateId}
            onChange={e => setTemplateId(e.target.value)}
          >
            <option value="">{t.selectTemplate}</option>
            {templates.map(t => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder={t.searchGames}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-2 border border-border-light rounded-md text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
            disabled={!templateId}
          />
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            disabled={!templateId || loadingGames}
            className="inline-flex items-center gap-2 px-3 py-2 border border-border-light rounded-md text-sm bg-surface-light hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCcw className="w-4 h-4" /> {t.refresh}
          </button>
          {templateId && (
            <Link to={`/teacher/create-game/${templateId}`} className="inline-flex">
              <button className="btn-primary flex items-center gap-2">
                <Filter className="w-4 h-4" /> {t.newFromTemplate}
              </button>
            </Link>
          )}
        </div>
      </div>

      {error && <StatusMessage variant="error" message={error} onClose={() => setError(null)} />}
      {success && <StatusMessage variant="success" message={success} onClose={() => setSuccess('')} />}

      {/* Template Meta Summary */}
      {templateId && currentTemplate && (
        <div className="card-base p-4 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/5 border border-primary/10 rounded-md flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-text-main-light">{currentTemplate.name}</p>
              <p className="text-xs text-text-muted-light">{t.status}: {currentTemplate.status}</p>
            </div>
          </div>
          <div className="text-xs text-text-muted-light max-w-md line-clamp-2">{currentTemplate.description}</div>
        </div>
      )}

      {/* Games List */}
      <div className="card-base p-4 min-h-[200px]">
        {!templateId && (
          <div className="text-sm text-text-muted-light py-12 text-center">{t.selectTemplateToView}</div>
        )}
        {templateId && loadingGames && (
          <LoadingState message={t.loadingGames} />
        )}
        {templateId && !loadingGames && filteredGames.length === 0 && (
          <EmptyState
            icon={<Gamepad2 className="w-12 h-12 text-gray-400" />}
            title={t.noGamesYet}
            message={t.createFirstGameMessage}
            actionLabel={t.createFirstGame}
            onAction={() => window.location.assign(`/teacher/create-game/${templateId}`)}
          />
        )}
        {templateId && !loadingGames && filteredGames.length > 0 && (
          <div className="space-y-3">
            {filteredGames.map(g => {
              const isPublished = g.template?.status === 'published';
              return (
                <div key={g._id} className="p-4 bg-background-light rounded-md border border-border-light hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-text-main-light truncate" title={g.name}>{g.name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{isPublished ? t.templatePublished : t.templateDraft}</span>
                    </div>
                    <p className="text-xs text-text-muted-light">{t.created} {new Date(g.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/admin/edit-game/${g._id}`} state={{ templateId }}>
                      <button className="btn-secondary py-1.5 text-xs" aria-label={`Edit game ${g.name}`}>
                        <Edit className="w-4 h-4" /> {t.edit}
                      </button>
                    </Link>
                    <Link to={`/admin/play-game/${g._id}`} state={{ templateId }}>
                      <button className="btn-primary py-1.5 text-xs" aria-label={`Play game ${g.name}`}>
                        <Play className="w-4 h-4" /> {t.play}
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDelete(g._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      title={t.deleteGame}
                      aria-label={`Delete game ${g.name}`}
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
