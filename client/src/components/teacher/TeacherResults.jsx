import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import { useLanguage } from '../../context/LanguageContext';
import { TrendingUp, Filter, Download, Eye, FileText } from 'lucide-react';

const TIME_FILTERS = [
  { value: 'week', label: 'This Week', days: 7 },
  { value: 'month', label: 'This Month', days: 30 },
  { value: 'quarter', label: 'This Quarter', days: 90 }
];

const getDateRange = (filter) => {
  const option = TIME_FILTERS.find((item) => item.value === filter);
  if (!option) return null;
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - option.days + 1);
  start.setHours(0, 0, 0, 0);
  return { start, end };
};

const getStudentId = (student) => {
  if (!student) return null;
  if (typeof student === 'string') return student;
  return student._id || student.id || null;
};

const getStudentName = (student) => {
  if (!student || typeof student === 'string') return 'Student';
  if (student.name) return student.name;
  if (student.fullName) return student.fullName;
  const parts = [student.firstName, student.lastName].filter(Boolean);
  return parts.length ? parts.join(' ') : 'Student';
};

const getInitials = (name) => {
  if (!name) return 'ST';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const buildTargetedCounts = (assignments) => {
  const map = new Map();
  (assignments || []).forEach((assignment) => {
    const students = Array.isArray(assignment.students) ? assignment.students : [];
    const gameIds = Array.isArray(assignment.gameCreations) ? assignment.gameCreations : [];
    if (!students.length || !gameIds.length) return;
    const studentIds = students
      .map((s) => (typeof s === 'string' ? s : s?._id?.toString() || s?.id?.toString()))
      .filter(Boolean);
    gameIds.forEach((gameId) => {
      const key = typeof gameId === 'string'
        ? gameId
        : gameId?._id?.toString() || gameId?.id?.toString();
      if (!key) return;
      if (!map.has(key)) map.set(key, new Set());
      const set = map.get(key);
      studentIds.forEach((id) => set.add(id));
    });
  });
  const out = {};
  map.forEach((set, key) => {
    out[key] = set.size;
  });
  return out;
};

const TeacherResults = () => {
  const { t } = useLanguage();
  const [selectedGame, setSelectedGame] = useState('all');
  const [timeFilter, setTimeFilter] = useState('week');
  const [gameLimit, setGameLimit] = useState('10');
  const [games, setGames] = useState([]);
  const [targetedCounts, setTargetedCounts] = useState({});
  const [gameResults, setGameResults] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState([]);
  const [studentPerformance, setStudentPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [creationsRes, assignmentsRes] = await Promise.all([
          axios.get('/api/creations'),
          axios.get('/api/assignments/teacher', { params: { status: 'all' } })
        ]);

        if (!mounted) return;
        const creations = Array.isArray(creationsRes.data)
          ? creationsRes.data
          : creationsRes.data?.creations || creationsRes.data?.items || [];
        const assignmentsPayload = assignmentsRes.data;
        const assignments = Array.isArray(assignmentsPayload?.items)
          ? assignmentsPayload.items
          : Array.isArray(assignmentsPayload)
            ? assignmentsPayload
            : [];

        setGames(creations);
        setTargetedCounts(buildTargetedCounts(assignments));
      } catch (err) {
        if (!mounted) return;
        setError('Failed to load results overview.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (selectedGame === 'all') return;
    const exists = games.some((game) => game._id === selectedGame);
    if (!exists) setSelectedGame('all');
  }, [games, selectedGame]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!games.length) {
        setGameResults([]);
        setPerformanceMetrics([]);
        setStudentPerformance([]);
        return;
      }

      setResultsLoading(true);
      const range = getDateRange(timeFilter);
      const params = range
        ? { startDate: range.start.toISOString(), endDate: range.end.toISOString() }
        : {};
      const gamesToFetch = selectedGame === 'all'
        ? games
        : games.filter((game) => game._id === selectedGame);

      if (!gamesToFetch.length) {
        setGameResults([]);
        setPerformanceMetrics([]);
        setStudentPerformance([]);
        setResultsLoading(false);
        return;
      }

      try {
        const settled = await Promise.allSettled(
          gamesToFetch.map((game) =>
            axios.get(`/api/results/${game._id}`, { params }).then((res) => ({
              game,
              results: Array.isArray(res.data) ? res.data : []
            }))
          )
        );

        if (!mounted) return;

        const pairs = settled.map((item, index) =>
          item.status === 'fulfilled'
            ? item.value
            : { game: gamesToFetch[index], results: [] }
        );

        const allResults = [];
        const summaries = [];

        pairs.forEach(({ game, results }) => {
          const filtered = (results || []).filter((result) => !result?.isTest && result?.counted !== false);
          const totalPossible = filtered.reduce((sum, r) => sum + (Number(r.totalPossibleScore) || 0), 0);
          const totalScore = filtered.reduce((sum, r) => sum + (Number(r.score) || 0), 0);
          const averageScore = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
          const uniqueStudents = new Set(
            filtered.map((r) => getStudentId(r.student)).filter(Boolean)
          );
          const lastPlayed = filtered.reduce((latest, r) => {
            const createdAt = r?.createdAt ? new Date(r.createdAt) : null;
            if (!createdAt) return latest;
            if (!latest || createdAt > latest) return createdAt;
            return latest;
          }, null);
          const attempts = filtered.length;
          const targeted = targetedCounts[game._id] || 0;
          const completionRate = targeted > 0
            ? Math.round((uniqueStudents.size / targeted) * 100)
            : null;

          filtered.forEach((result) => {
            allResults.push({ result, gameId: game._id, gameName: game.name });
          });

          const shouldInclude = selectedGame !== 'all' || attempts > 0 || targeted > 0;
          if (!shouldInclude) return;

          summaries.push({
            id: game._id,
            name: game.name || 'Game',
            totalStudents: uniqueStudents.size,
            averageScore,
            completionRate,
            attempts,
            lastPlayed
          });
        });

        summaries.sort((a, b) => {
          const aTime = a.lastPlayed ? a.lastPlayed.getTime() : 0;
          const bTime = b.lastPlayed ? b.lastPlayed.getTime() : 0;
          return bTime - aTime;
        });

        const uniqueStudentsGlobal = new Set(
          allResults.map((item) => getStudentId(item.result?.student)).filter(Boolean)
        );
        const totalPossibleGlobal = allResults.reduce((sum, item) => {
          return sum + (Number(item.result?.totalPossibleScore) || 0);
        }, 0);
        const totalScoreGlobal = allResults.reduce((sum, item) => {
          return sum + (Number(item.result?.score) || 0);
        }, 0);
        const averageScoreGlobal = totalPossibleGlobal > 0
          ? Math.round((totalScoreGlobal / totalPossibleGlobal) * 100)
          : 0;
        const completionRates = summaries
          .map((summary) => summary.completionRate)
          .filter((value) => typeof value === 'number');
        const completionAverage = completionRates.length
          ? Math.round(completionRates.reduce((sum, val) => sum + val, 0) / completionRates.length)
          : null;

        const metrics = [
          { label: 'Games with Results', value: summaries.length, color: 'text-indigo-600' },
          { label: 'Active Students', value: uniqueStudentsGlobal.size, color: 'text-emerald-600' },
          { label: 'Average Score', value: `${averageScoreGlobal}%`, color: 'text-blue-600' },
          { label: 'Completion Rate', value: completionAverage !== null ? `${completionAverage}%` : '-', color: 'text-amber-600' }
        ];

        const studentMap = new Map();
        allResults.forEach(({ result, gameId }) => {
          const studentId = getStudentId(result?.student);
          if (!studentId) return;
          const name = getStudentName(result.student);
          const percentage = result?.totalPossibleScore > 0
            ? (Number(result.score) / Number(result.totalPossibleScore)) * 100
            : 0;
          const existing = studentMap.get(studentId) || {
            id: studentId,
            name,
            attempts: 0,
            totalPercent: 0,
            bestScore: 0,
            games: new Set(),
            lastActive: null
          };
          existing.attempts += 1;
          existing.totalPercent += percentage;
          existing.bestScore = Math.max(existing.bestScore, percentage);
          existing.games.add(gameId);
          const createdAt = result?.createdAt ? new Date(result.createdAt) : null;
          if (createdAt && (!existing.lastActive || createdAt > existing.lastActive)) {
            existing.lastActive = createdAt;
          }
          studentMap.set(studentId, existing);
        });

        const studentRows = Array.from(studentMap.values())
          .map((entry) => ({
            id: entry.id,
            name: entry.name,
            avatar: getInitials(entry.name),
            gamesPlayed: entry.games.size,
            averageScore: entry.attempts ? Math.round(entry.totalPercent / entry.attempts) : 0,
            attempts: entry.attempts,
            bestScore: Math.round(entry.bestScore),
            lastActive: entry.lastActive
          }))
          .sort((a, b) => b.averageScore - a.averageScore)
          .slice(0, 8);

        setGameResults(summaries);
        setPerformanceMetrics(metrics);
        setStudentPerformance(studentRows);

        const anySuccess = settled.some((item) => item.status === 'fulfilled');
        if (!anySuccess) {
          setError('Failed to load game results.');
        } else {
          setError(null);
        }
      } catch (err) {
        if (!mounted) return;
        setError('Failed to load game results.');
      } finally {
        if (mounted) setResultsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [games, selectedGame, timeFilter, targetedCounts]);

  const gameOptions = useMemo(() => {
    return games
      .map((game) => ({ id: game._id, name: game.name || 'Game' }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [games]);

  const visibleGameResults = useMemo(() => {
    if (gameLimit === 'all') return gameResults;
    const limit = Number(gameLimit);
    if (!Number.isFinite(limit) || limit <= 0) return gameResults;
    return gameResults.slice(0, limit);
  }, [gameResults, gameLimit]);

  const selectedGameName = useMemo(() => {
    if (selectedGame === 'all') return 'All Games';
    return games.find((game) => game._id === selectedGame)?.name || 'Selected Game';
  }, [games, selectedGame]);

  const selectedTimeLabel = useMemo(() => {
    return TIME_FILTERS.find((item) => item.value === timeFilter)?.label || 'All Time';
  }, [timeFilter]);

  const formatShortDate = (value) => {
    if (!value) return '-';
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return '-';
    }
  };

  const escapeCsvValue = (value) => {
    const text = value === null || value === undefined ? '' : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };

  const downloadCsv = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToCsv = () => {
    if (exporting) return;
    const lines = [];
    lines.push('Teacher Results');
    lines.push(`Generated,${escapeCsvValue(new Date().toLocaleString())}`);
    lines.push(`Game Filter,${escapeCsvValue(selectedGameName)}`);
    lines.push(`Time Range,${escapeCsvValue(selectedTimeLabel)}`);
    lines.push('');
    lines.push('Game Performance');
    lines.push('Game,Students,Avg Score,Completion,Attempts,Last Played');
    visibleGameResults.forEach((game) => {
      const completion = typeof game.completionRate === 'number' ? `${game.completionRate}%` : '-';
      lines.push([
        escapeCsvValue(game.name),
        escapeCsvValue(game.totalStudents),
        escapeCsvValue(`${game.averageScore}%`),
        escapeCsvValue(completion),
        escapeCsvValue(game.attempts),
        escapeCsvValue(formatShortDate(game.lastPlayed))
      ].join(','));
    });

    lines.push('');
    lines.push('Top Students');
    lines.push('Student,Games Played,Avg Score,Best Score,Attempts,Last Active');
    studentPerformance.forEach((student) => {
      lines.push([
        escapeCsvValue(student.name),
        escapeCsvValue(student.gamesPlayed),
        escapeCsvValue(`${student.averageScore}%`),
        escapeCsvValue(`${student.bestScore}%`),
        escapeCsvValue(student.attempts),
        escapeCsvValue(formatShortDate(student.lastActive))
      ].join(','));
    });

    const filename = `teacher-results-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsv(lines.join('\n'), filename);
  };

  const exportToPdf = () => {
    if (exporting) return;
    setExporting(true);
    try {
      const doc = new jsPDF();
      let cursorY = 16;
      const lineHeight = 6;
      const marginX = 14;
      const pageBottom = 280;

      const addLines = (text, fontSize = 10) => {
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text, 180);
        if (cursorY + lines.length * lineHeight > pageBottom) {
          doc.addPage();
          cursorY = 16;
        }
        doc.text(lines, marginX, cursorY);
        cursorY += lines.length * lineHeight;
      };

      addLines('Teacher Results & Analytics', 16);
      addLines(`Generated: ${new Date().toLocaleString()}`);
      addLines(`Game Filter: ${selectedGameName}`);
      addLines(`Time Range: ${selectedTimeLabel}`);
      addLines('');

      addLines('Game Performance', 12);
      addLines('Game | Students | Avg Score | Completion | Attempts | Last Played');
      visibleGameResults.forEach((game) => {
        const completion = typeof game.completionRate === 'number' ? `${game.completionRate}%` : '-';
        const line = `${game.name} | ${game.totalStudents} | ${game.averageScore}% | ${completion} | ${game.attempts} | ${formatShortDate(game.lastPlayed)}`;
        addLines(line);
      });

      addLines('');
      addLines('Top Students', 12);
      addLines('Student | Games | Avg Score | Best Score | Attempts | Last Active');
      studentPerformance.forEach((student) => {
        const line = `${student.name} | ${student.gamesPlayed} | ${student.averageScore}% | ${student.bestScore}% | ${student.attempts} | ${formatShortDate(student.lastActive)}`;
        addLines(line);
      });

      const filename = `teacher-results-${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Results & Analytics</h1>
          <p className="text-gray-600">Track your students' performance and game effectiveness</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          <button
            onClick={exportToCsv}
            disabled={exporting || resultsLoading || loading}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>{t.exportCsv || 'Export CSV'}</span>
          </button>
          <button
            onClick={exportToPdf}
            disabled={exporting || resultsLoading || loading}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4" />
            <span>{t.exportPdf || t.exportPDF || 'Export PDF'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {(loading || resultsLoading) && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
          Loading results...
        </div>
      )}

      {!loading && !resultsLoading && gameResults.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
          Results are shown per game from the My Games screen.
        </div>
      )}

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceMetrics.length === 0 ? (
          <div className="col-span-full rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
            No performance metrics yet.
          </div>
        ) : (
          performanceMetrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className={`w-6 h-6 ${metric.color}`} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Game Results */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Game Performance</h2>
            <div className="flex items-center space-x-3">
              <select 
                value={selectedGame} 
                onChange={(e) => setSelectedGame(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">All Games</option>
                {gameOptions.map((game) => (
                  <option key={game.id} value={game.id}>{game.name}</option>
                ))}
              </select>
              <select 
                value={timeFilter} 
                onChange={(e) => setTimeFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2"
              >
                {TIME_FILTERS.map((filter) => (
                  <option key={filter.value} value={filter.value}>{filter.label}</option>
                ))}
              </select>
              <select
                value={gameLimit}
                onChange={(e) => setGameLimit(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2"
                disabled={selectedGame !== 'all'}
              >
                <option value="5">Top 5</option>
                <option value="10">Top 10</option>
                <option value="20">Top 20</option>
                <option value="all">All</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          {resultsLoading ? (
            <div className="p-6 text-sm text-gray-500">Loading game results...</div>
          ) : visibleGameResults.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No results yet.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Game</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attempts</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Played</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visibleGameResults.map((game) => (
                  <tr key={game.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{game.name}</div>
                        <div className="text-sm text-gray-500">{game.totalStudents} participants</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {game.totalStudents}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{game.averageScore}%</span>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${game.averageScore}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {typeof game.completionRate === 'number' ? `${game.completionRate}%` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {game.attempts}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {game.lastPlayed ? new Date(game.lastPlayed).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/teacher/results/${game.id}`}
                          className="text-purple-600 hover:text-purple-900"
                          title="View results"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Student Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Top Performing Students</h2>
        </div>
        <div className="p-6">
          {studentPerformance.length === 0 ? (
            <div className="text-sm text-gray-600">No student performance data yet.</div>
          ) : (
            <div className="space-y-4">
              {studentPerformance.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">{student.avatar}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-500">{student.gamesPlayed} games played</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{student.averageScore}%</p>
                      <p className="text-xs text-gray-500">Avg Score</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{student.attempts}</p>
                      <p className="text-xs text-gray-500">Attempts</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{student.bestScore}%</p>
                      <p className="text-xs text-gray-500">Best</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">
                        {student.lastActive ? new Date(student.lastActive).toLocaleDateString() : '-'}
                      </p>
                      <p className="text-xs text-gray-500">Last Active</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherResults;
