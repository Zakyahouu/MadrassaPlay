import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import { TrendingUp, Award, Calendar, Target, Zap, Clock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import LoadingState from '../shared/LoadingState';
import UnifiedCard from '../shared/UnifiedCard';

export default function StudentProgress() {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        history: [],
        summary: {},
        assignments: []
    });

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                // Fetch multiple data points for analytics
                const [historyRes, summaryRes, assignmentsRes] = await Promise.all([
                    axios.get('/api/results/me/history?limit=50'), // Get last 50 results for trends
                    axios.get('/api/results/me/summary'),
                    axios.get('/api/assignments/my-assignments/detailed?limit=20') // Recent assignments for comparison
                ]);

                setData({
                    history: Array.isArray(historyRes.data) ? historyRes.data.reverse() : [], // Reverse to chronological order
                    summary: summaryRes.data || {},
                    assignments: assignmentsRes.data?.items || []
                });
            } catch (e) {
                console.error("Failed to load progress stats", e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Process data for charts
    const xpTrendData = useMemo(() => {
        let runningXp = 0;
        return data.history.map(item => {
            runningXp += (item.xpEarned || 0);
            return {
                date: new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                xp: runningXp,
                score: item.scorePercent
            };
        });
    }, [data.history]);

    const assignmentPerformanceData = useMemo(() => {
        return data.assignments.map(a => ({
            name: a.title.length > 15 ? a.title.substring(0, 15) + '...' : a.title,
            score: a.progress?.averagePercent || 0,
            completed: a.progress?.completionPercent || 0
        }));
    }, [data.assignments]);

    if (loading) return <LoadingState message={t.loadingProgress || "Analyzing your progress..."} />;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-8 h-8 text-indigo-600" />
                <h2 className="text-2xl font-bold text-gray-900">{t.myProgress || "My Progress"}</h2>
            </div>

            {/* Top Level Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <UnifiedCard className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none">
                    <div className="flex items-center gap-3 mb-2 opacity-80">
                        <Zap className="w-5 h-5" />
                        <span className="text-sm font-bold uppercase tracking-wider">{t.totalXp || "Total XP"}</span>
                    </div>
                    <div className="text-4xl font-extrabold">{data.summary.totalPoints || 0}</div>
                    <div className="mt-2 text-sm opacity-80 flex items-center gap-1">
                        <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs font-bold">Lvl {data.summary.level || 1}</span>
                        <span>Keep it up!</span>
                    </div>
                </UnifiedCard>

                <UnifiedCard className="bg-white border-indigo-100">
                    <div className="flex items-center gap-3 mb-2 text-indigo-600">
                        <Target className="w-5 h-5" />
                        <span className="text-sm font-bold uppercase tracking-wider">{t.gamesPlayed || "Games Played"}</span>
                    </div>
                    <div className="text-4xl font-extrabold text-gray-900">{data.summary.gamesCompleted || 0}</div>
                    <div className="mt-2 text-sm text-gray-500">
                        {t.acrossAllClasses || "Across all classes"}
                    </div>
                </UnifiedCard>

                <UnifiedCard className="bg-white border-orange-100">
                    <div className="flex items-center gap-3 mb-2 text-orange-600">
                        <Clock className="w-5 h-5" />
                        <span className="text-sm font-bold uppercase tracking-wider">{t.timeSpent || "Time Spent"}</span>
                    </div>
                    <div className="text-4xl font-extrabold text-gray-900">{Math.round((data.summary.timeSpentMinutes || 0) / 60)}h {(data.summary.timeSpentMinutes || 0) % 60}m</div>
                    <div className="mt-2 text-sm text-gray-500">
                        {t.learningTime || "Total learning time"}
                    </div>
                </UnifiedCard>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* XP Trend Chart */}
                <UnifiedCard title={t.xpGrowth || "XP Growth"}>
                    <div className="h-[300px] w-full mt-4">
                        {xpTrendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={xpTrendData}>
                                    <defs>
                                        <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                                    <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
                                    <RechartsTooltip />
                                    <Area type="monotone" dataKey="xp" stroke="#8884d8" fillOpacity={1} fill="url(#colorXp)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 italic">
                                {t.notEnoughData || "Not enough data yet"}
                            </div>
                        )}
                    </div>
                </UnifiedCard>

                {/* Assignment Performance */}
                <UnifiedCard title={t.assignmentPerformance || "Assignment Performance"}>
                    <div className="h-[300px] w-full mt-4">
                        {assignmentPerformanceData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={assignmentPerformanceData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                                    <XAxis type="number" domain={[0, 100]} hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} stroke="#4b5563" />
                                    <RechartsTooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="score" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={20} name={t.score || "Score"} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 italic">
                                {t.noAssignmentsData || "No assignment data yet"}
                            </div>
                        )}
                    </div>
                </UnifiedCard>
            </div>

            {/* Recent Activity List */}
            <UnifiedCard title={t.recentActivity || "Recent Activity"}>
                <div className="space-y-1">
                    {data.history.length > 0 ? data.history.slice(0, 5).map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-50 last:border-0">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${item.scorePercent >= 80 ? 'bg-green-100 text-green-700' :
                                        item.scorePercent >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {Math.round(item.scorePercent)}%
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{item.name || "Game Session"}</p>
                                    <p className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-indigo-600">+{item.xpEarned} XP</p>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center py-4 text-gray-500 italic">{t.noActivityYet || "No recent activity recorded."}</p>
                    )}
                </div>
            </UnifiedCard>
        </div>
    );
}
