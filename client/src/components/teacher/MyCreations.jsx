// MyCreations.jsx - Enhanced with creative minimal design
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import AssignmentCreate from './AssignmentCreate';
import { useLanguage } from '../../context/LanguageContext';
import {
  Gamepad2,
  Search,
  Filter,
  Edit,
  Tv,
  Zap,
  BarChart2,
  ArrowRight,
  Calendar,
  UserPlus,
  MoreVertical
} from 'lucide-react';

const MyCreations = () => {
  const { t } = useLanguage();
  const [creations, setCreations] = useState([]);
  const [query, setQuery] = useState('');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignCreationId, setAssignCreationId] = useState(null);
  const [availableLevels, setAvailableLevels] = useState([]);

  useEffect(() => {
    const fetchCreations = async () => {
      try {
        const { data } = await axios.get('/api/creations');
        setCreations(data);
      } catch (err) {
        setError('Failed to fetch your games');
      } finally {
        setLoading(false);
      }
    };
    fetchCreations();
  }, []);

  // Build level options from creations’ own labels
  useEffect(() => {
    const labels = Array.from(new Set(creations.map(c => c.levelLabel || 'Any')));
    setAvailableLevels(labels);
  }, [creations]);

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full"></div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg">
      <p className="text-red-700">{error}</p>
    </div>
  );

  const actionButtons = [
    {
      to: (id) => `/teacher/edit-game/${id}`,
      label: t.edit || 'Edit',
      icon: Edit,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      description: t.editGameSettings || 'Edit game settings'
    },
    {
      to: (id) => `/teacher/host-lobby/${id}`,
      label: t.hostLive,
      icon: Tv,
      color: 'text-green-600',
      bg: 'bg-green-50',
      description: 'Real-time multiplayer'
    },
    {
      to: (id) => `/teacher/play-game/${id}`,
      label: t.hotSpot,
      icon: Zap,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      description: 'Self-paced mode'
    },
    {
      to: (id) => `/teacher/results/${id}`,
      label: t.results || 'Results',
      icon: BarChart2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      description: t.viewAnalytics || 'View analytics'
    }
  ];

  return (
    <div className="mb-12 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
            <Gamepad2 className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{t.myGames}</h3>
            <p className="text-sm text-gray-500">{creations.length} games created</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchByName}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border-transparent rounded-lg focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all text-sm"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={templateFilter}
              onChange={(e) => setTemplateFilter(e.target.value)}
              className="pl-9 pr-8 py-2 bg-gray-50 border-transparent rounded-lg focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all text-sm appearance-none"
            >
              <option value="all">{t.allTemplates}</option>
              {Array.from(new Map(creations.map(c => [c.template?._id || 'na', c.template?.name || 'Unknown']))).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="pl-9 pr-8 py-2 bg-gray-50 border-transparent rounded-lg focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all text-sm appearance-none"
            >
              <option value="all">{t.allLevels}</option>
              {availableLevels.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      {creations.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {creations
            .filter(c => {
              const matchesText = c.name.toLowerCase().includes(query.trim().toLowerCase());
              const matchesTemplate = templateFilter === 'all' || (c.template && (c.template._id === templateFilter));
              const label = c.levelLabel || 'Any';
              const matchesLevel = levelFilter === 'all' ? true : (label === levelFilter);
              return matchesText && matchesTemplate && matchesLevel;
            })
            .map((creation) => (
              <div
                key={creation._id}
                className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
              >
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-gray-900 line-clamp-1 mb-1" title={creation.name}>{creation.name}</h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(creation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {/* Level badge */}
                    {(creation.levelLabel || 'Any') && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                        {creation.levelLabel || 'Any'}
                      </span>
                    )}
                  </div>

                  {/* Template Info */}
                  <div className="mb-4">
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                      Dataset: {creation.template?.name || 'Unknown'}
                    </span>
                  </div>

                  {/* Minimal Action Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {actionButtons.map((button, index) => (
                      <Link key={index} to={button.to(creation._id)} title={button.description}>
                        <button className={`w-full py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${button.bg} hover:brightness-95`}>
                          <button.icon className={`w-4 h-4 ${button.color}`} />
                          <span className={`text-xs font-medium ${button.color}`}>{button.label}</span>
                        </button>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-3 bg-gray-50 border-t border-gray-100">
                  <button
                    onClick={() => setAssignCreationId(creation._id)}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200"
                  >
                    <UserPlus className="w-4 h-4" />
                    {t.assignToStudents}
                  </button>
                </div>

                {/* Inline Assign Modal */}
                {assignCreationId === creation._id && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
                      <div className="flex items-center justify-between p-4 border-b border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <UserPlus className="w-5 h-5 text-purple-600" />
                          {t.assignGame} “{creation.name}”
                        </h3>
                        <button onClick={() => setAssignCreationId(null)} className="p-2 hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-600">
                          <span className="text-xl">×</span>
                        </button>
                      </div>
                      <div className="p-6">
                        <AssignmentCreate initialSelectedCreations={[creation._id]} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gamepad2 className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">{t.noGamesCreated}</h4>
          <p className="text-gray-500 max-w-sm mx-auto mb-6">
            {t.startByChoosingTemplate}
          </p>
          <div className="inline-flex items-center gap-2 text-primary font-medium">
            <ArrowRight className="w-4 h-4 animate-bounce" />
            <span>{t.chooseTemplate}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCreations;
