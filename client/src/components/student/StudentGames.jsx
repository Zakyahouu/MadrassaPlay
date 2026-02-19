import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Play, Star, Clock, Filter, Gamepad2, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import LoadingState from '../shared/LoadingState';
import EmptyState from '../shared/EmptyState';
import UnifiedCard from '../shared/UnifiedCard';

export default function StudentGames() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                // We reuse the assignments endpoint but filter for active ones primarily
                const res = await axios.get('/api/assignments/my-assignments/detailed', {
                    params: { status: 'active', limit: 100 }
                });
                setGames(res.data.items || []);
            } catch (e) {
                setError('Failed to load games library');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const filteredGames = games.filter(g => {
        const matchesSearch = g.title.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'all' || g.status === filter; // basic filter for now
        return matchesSearch && matchesFilter;
    });

    if (loading) return <LoadingState message={t.loadingGames || "Loading Game Library..."} />;
    if (error) return <div className="text-red-500 text-center py-10">{error}</div>;

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Gamepad2 className="text-primary w-8 h-8" />
                        {t.gameLibrary || "Game Library"}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">{t.explorePlayLearn || "Explore, play, and learn!"}</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder={t.searchGames || "Search games..."}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none w-full md:w-64"
                        />
                    </div>
                </div>
            </div>

            {!loading && filteredGames.length === 0 && (
                <EmptyState
                    icon={<Gamepad2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />}
                    title={t.noGamesFound || "No games found"}
                    message={t.noGamesMessage || "You don't have any active game assignments right now."}
                />
            )}

            {/* Game Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredGames.map(game => (
                    <div key={game._id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full">
                        {/* Thumbnail Area (Mock or Real) */}
                        <div className={`h-40 w-full relative overflow-hidden flex items-center justify-center ${'bg-gradient-to-br from-indigo-500 to-purple-600'
                            }`}>
                            {/* If we had a thumbnail URL, we'd use it here. For now, a pattern or icon. */}
                            <Gamepad2 className="text-white/20 w-24 h-24 absolute -bottom-4 -right-4 rotate-12" />
                            <div className="relative z-10 text-white text-center p-4">
                                <h3 className="font-bold text-lg leading-tight line-clamp-2">{game.title}</h3>
                                <span className="text-xs font-medium bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full mt-2 inline-block">
                                    {game.classId?.name || "Class Activity"}
                                </span>
                            </div>

                            {/* Play Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                <button
                                    onClick={() => navigate(`/student/play-game/${game.nextGameId || ''}`, { state: { assignmentId: game._id } })}
                                    className="bg-white text-primary rounded-full p-4 shadow-lg transform scale-90 group-hover:scale-100 transition-transform"
                                >
                                    <Play className="w-8 h-8 fill-current pl-1" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{new Date(game.endDate).toLocaleDateString()}</span>
                                </div>
                                {game.progress?.averagePercent > 0 && (
                                    <div className="flex items-center gap-1 font-bold text-amber-500">
                                        <Star className="w-3.5 h-3.5 fill-current" />
                                        <span>{Math.round(game.progress.averagePercent)}%</span>
                                    </div>
                                )}
                            </div>

                            <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
                                {game.description || t.noDescription || "No description provided."}
                            </p>

                            <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                                <div className="text-xs font-medium text-gray-500">
                                    {game.progress?.completed} / {game.progress?.totalGames} {t.levels || "Levels"}
                                </div>
                                <button
                                    onClick={() => navigate(`/student/play-game/${game.nextGameId || ''}`, { state: { assignmentId: game._id } })}
                                    className="text-sm font-bold text-primary hover:text-primary-dark transition-colors"
                                >
                                    {game.progress?.completed > 0 ? (t.continue || "Continue") : (t.start || "Start")} <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Progress Bar Bottom */}
                        <div className="h-1.5 w-full bg-gray-100">
                            <div
                                className="h-full bg-primary transition-all duration-500"
                                style={{ width: `${game.progress?.completionPercent || 0}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
