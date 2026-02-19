import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import {
    Loader2, AlertTriangle, TrendingUp, Users, Clock, HelpCircle,
    Target, Award, Download, ArrowLeft
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const GameAnalyticsDashboard = () => {
    const { assignmentId } = useParams();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [activeTab, setActiveTab] = useState('overview'); // overview, questions, students
    const [selectedGameId, setSelectedGameId] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, [assignmentId]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const token = JSON.parse(localStorage.getItem('user'))?.token;
            const res = await axios.get(`/api/analytics/assignment/${assignmentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
            if (res.data.games?.length > 0) {
                setSelectedGameId(res.data.games[0].gameId);
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    const getActiveGame = () => {
        return data?.games?.find(g => g.gameId === selectedGameId) || data?.games?.[0];
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-500">Loading analytics...</span>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center bg-red-50 rounded-lg border border-red-200 text-red-700">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3" />
            <h3 className="text-lg font-bold">Error</h3>
            <p>{error}</p>
        </div>
    );

    const activeGame = getActiveGame();

    if (!activeGame) return (
        <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p>No game data available for this assignment.</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <button onClick={() => window.history.back()} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 mb-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Assignments
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">{data.assignment.title}</h1>
                    <p className="text-gray-500 text-sm">Analytics & Insights</p>
                </div>

                <div className="flex items-center gap-2">
                    {data.games.length > 1 && (
                        <select
                            value={activeGame.gameId}
                            onChange={(e) => setSelectedGameId(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                        >
                            {data.games.map(g => (
                                <option key={g.gameId} value={g.gameId}>{g.name}</option>
                            ))}
                        </select>
                    )}
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Target className="w-5 h-5" /></div>
                        <span className="text-sm text-gray-500 font-medium">Avg Accuracy</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{activeGame.summary.averagePercentage}%</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-green-50 p-2 rounded-lg text-green-600"><Users className="w-5 h-5" /></div>
                        <span className="text-sm text-gray-500 font-medium">Students</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{activeGame.summary.uniquePlayers}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-purple-50 p-2 rounded-lg text-purple-600"><TrendingUp className="w-5 h-5" /></div>
                        <span className="text-sm text-gray-500 font-medium">Attempts</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{activeGame.summary.totalAttempts}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-orange-50 p-2 rounded-lg text-orange-600"><Award className="w-5 h-5" /></div>
                        <span className="text-sm text-gray-500 font-medium">Top Score</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">
                        {activeGame.leaderboard[0] ? `${activeGame.leaderboard[0].bestScore}` : '-'}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Insights & Questions
                    </button>
                    <button
                        onClick={() => setActiveTab('students')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'students'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Student Leaderboard
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        {/* Questions Chart */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold mb-6 text-gray-800">Question Performance</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={activeGame.questions} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="index" tickFormatter={(i) => `Q${i + 1}`} />
                                        <YAxis unit="%" />
                                        <Tooltip
                                            formatter={(value) => [`${value}%`, 'Accuracy']}
                                            labelFormatter={(label) => `Question ${label + 1}`}
                                        />
                                        <Legend />
                                        <Bar dataKey="accuracy" name="Accuracy" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Detailed Question Breakdown */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800">Detailed Breakdown</h3>
                            {activeGame.questions.map((q, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex gap-3">
                                            <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${q.accuracy >= 70 ? 'bg-green-100 text-green-700' :
                                                    q.accuracy >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {q.accuracy}%
                                            </span>
                                            <div>
                                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Question {idx + 1}</span>
                                                <p className="font-medium text-gray-800 mt-0.5">{q.text}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded capitalize">{q.type}</span>
                                    </div>

                                    {/* Answer Distribution Mini-Bar */}
                                    <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden flex">
                                        <div className="bg-green-500 h-full" style={{ width: `${(q.correctCount / (q.correctCount + q.incorrectCount || 1)) * 100}%` }} />
                                        <div className="bg-red-500 h-full" style={{ width: `${(q.incorrectCount / (q.correctCount + q.incorrectCount || 1)) * 100}%` }} />
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>{q.correctCount} Correct</span>
                                        <span>{q.incorrectCount} Incorrect</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'students' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-300">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Best Score</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attempts</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {activeGame.leaderboard.map((student, idx) => (
                                    <tr key={student.studentId} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {idx + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3">
                                                    {student.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                                            {student.bestScore}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${student.bestPercentage >= 70 ? 'bg-green-100 text-green-800' :
                                                    student.bestPercentage >= 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {student.bestPercentage}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {student.attempts}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GameAnalyticsDashboard;
