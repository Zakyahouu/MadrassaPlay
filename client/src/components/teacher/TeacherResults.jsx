import React, { useState } from 'react';
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  Calendar,
  Filter,
  Download,
  Eye,
  BarChart3,
  Target,
  Award,
  Clock,
  Star
} from 'lucide-react';

const TeacherResults = () => {
  const [selectedGame, setSelectedGame] = useState('all');
  const [timeFilter, setTimeFilter] = useState('week');

  const gameResults = [
    {
      id: 1,
      name: 'Math Quiz: Fractions',
      totalStudents: 24,
      averageScore: 87,
      highestScore: 100,
      lowestScore: 65,
      completionRate: 96,
      timeSpent: '12.5 min',
      lastPlayed: '2 hours ago',
      status: 'active'
    },
    {
      id: 2,
      name: 'Science Lab: Chemical Reactions',
      totalStudents: 18,
      averageScore: 92,
      highestScore: 100,
      lowestScore: 78,
      completionRate: 100,
      timeSpent: '18.2 min',
      lastPlayed: '1 day ago',
      status: 'active'
    },
    {
      id: 3,
      name: 'History Timeline Challenge',
      totalStudents: 30,
      averageScore: 79,
      highestScore: 95,
      lowestScore: 45,
      completionRate: 87,
      timeSpent: '15.8 min',
      lastPlayed: '3 days ago',
      status: 'completed'
    }
  ];

  const studentPerformance = [
    {
      id: 1,
      name: 'Sarah Johnson',
      gamesPlayed: 8,
      averageScore: 94,
      totalTime: '2h 15m',
      improvement: '+12%',
      lastActive: '1 hour ago',
      avatar: 'SJ'
    },
    {
      id: 2,
      name: 'Michael Chen',
      gamesPlayed: 6,
      averageScore: 88,
      totalTime: '1h 45m',
      improvement: '+8%',
      lastActive: '3 hours ago',
      avatar: 'MC'
    },
    {
      id: 3,
      name: 'Emma Davis',
      gamesPlayed: 10,
      averageScore: 91,
      totalTime: '3h 20m',
      improvement: '+15%',
      lastActive: '30 min ago',
      avatar: 'ED'
    }
  ];

  const performanceMetrics = [
    { label: 'Overall Average', value: '87%', change: '+5%', color: 'text-green-600' },
    { label: 'Engagement Rate', value: '94%', change: '+8%', color: 'text-blue-600' },
    { label: 'Completion Rate', value: '91%', change: '+3%', color: 'text-purple-600' },
    { label: 'Time Spent', value: '2.3h', change: '+12%', color: 'text-orange-600' }
  ];

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
          <button className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              </div>
              <div className={`w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center`}>
                <TrendingUp className={`w-6 h-6 ${metric.color}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className={metric.color}>{metric.change}</span>
              <span className="text-gray-500 ml-1">from last period</span>
            </div>
          </div>
        ))}
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
                <option value="math">Math Games</option>
                <option value="science">Science Games</option>
                <option value="history">History Games</option>
              </select>
              <select 
                value={timeFilter} 
                onChange={(e) => setTimeFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Game</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Spent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Played</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {gameResults.map((game) => (
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
                    {game.completionRate}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {game.timeSpent}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {game.lastPlayed}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-purple-600 hover:text-purple-900">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-blue-600 hover:text-blue-900">
                        <BarChart3 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Top Performing Students</h2>
        </div>
        <div className="p-6">
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
                    <p className="text-sm font-medium text-gray-900">{student.totalTime}</p>
                    <p className="text-xs text-gray-500">Total Time</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-green-600">{student.improvement}</p>
                    <p className="text-xs text-gray-500">Improvement</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">{student.lastActive}</p>
                    <p className="text-xs text-gray-500">Last Active</p>
                  </div>
                  <button className="text-purple-600 hover:text-purple-900">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherResults;
