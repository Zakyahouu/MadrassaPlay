import React, { useState } from 'react';
import { 
  Play, 
  Users, 
  Clock, 
  Calendar,
  Plus,
  Eye,
  Settings,
  Trophy,
  Target,
  Activity,
  CheckCircle,
  XCircle
} from 'lucide-react';

const TeacherLiveSessions = () => {
  const [activeTab, setActiveTab] = useState('active');

  const activeSessions = [
    {
      id: 1,
      name: 'Math Quiz: Fractions Adventure',
      roomCode: 'ABC123',
      participants: 18,
      maxParticipants: 25,
      startTime: '2:30 PM',
      duration: '15 min',
      status: 'active',
      subject: 'Mathematics',
      difficulty: 'Medium'
    },
    {
      id: 2,
      name: 'Science Lab: Chemical Reactions',
      roomCode: 'XYZ789',
      participants: 12,
      maxParticipants: 20,
      startTime: '3:15 PM',
      duration: '20 min',
      status: 'active',
      subject: 'Science',
      difficulty: 'Hard'
    }
  ];

  const pastSessions = [
    {
      id: 3,
      name: 'History Timeline Challenge',
      roomCode: 'DEF456',
      participants: 22,
      maxParticipants: 25,
      startTime: '1:00 PM',
      endTime: '1:18 PM',
      duration: '18 min',
      status: 'completed',
      subject: 'History',
      difficulty: 'Easy',
      averageScore: 87
    },
    {
      id: 4,
      name: 'Geography World Tour',
      roomCode: 'GHI789',
      participants: 15,
      maxParticipants: 20,
      startTime: '10:30 AM',
      endTime: '10:45 AM',
      duration: '15 min',
      status: 'completed',
      subject: 'Geography',
      difficulty: 'Medium',
      averageScore: 92
    }
  ];

  const upcomingSessions = [
    {
      id: 5,
      name: 'English Grammar Quiz',
      scheduledTime: '4:00 PM',
      duration: '12 min',
      subject: 'English',
      difficulty: 'Easy',
      expectedParticipants: 20
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Sessions</h1>
          <p className="text-gray-600">Manage your real-time gaming sessions</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700">
          <Plus className="w-4 h-4" />
          <span>New Session</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('active')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'active'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Active Sessions ({activeSessions.length})
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upcoming'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Upcoming ({upcomingSessions.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'past'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Past Sessions ({pastSessions.length})
          </button>
        </nav>
      </div>

      {/* Active Sessions */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {activeSessions.map((session) => (
            <div key={session.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{session.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <span className="flex items-center">
                        <Target className="w-4 h-4 mr-1" />
                        {session.subject}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {session.duration}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        session.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                        session.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {session.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{session.participants}/{session.maxParticipants}</span>
                    </div>
                    <p className="text-xs text-gray-500">Participants</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">Room: {session.roomCode}</p>
                    <p className="text-xs text-gray-500">Started {session.startTime}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming Sessions */}
      {activeTab === 'upcoming' && (
        <div className="space-y-4">
          {upcomingSessions.map((session) => (
            <div key={session.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{session.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <span className="flex items-center">
                        <Target className="w-4 h-4 mr-1" />
                        {session.subject}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {session.duration}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        session.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                        session.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {session.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">{session.scheduledTime}</p>
                    <p className="text-xs text-gray-500">Scheduled</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">{session.expectedParticipants}</p>
                    <p className="text-xs text-gray-500">Expected</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700">
                      Start Now
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Past Sessions */}
      {activeTab === 'past' && (
        <div className="space-y-4">
          {pastSessions.map((session) => (
            <div key={session.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{session.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <span className="flex items-center">
                        <Target className="w-4 h-4 mr-1" />
                        {session.subject}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {session.duration}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        session.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                        session.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {session.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{session.participants}/{session.maxParticipants}</span>
                    </div>
                    <p className="text-xs text-gray-500">Participants</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">{session.averageScore}%</p>
                    <p className="text-xs text-gray-500">Avg Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">{session.startTime} - {session.endTime}</p>
                    <p className="text-xs text-gray-500">Duration</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg">
                      <Trophy className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">24</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Play className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600">+15%</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Participants</p>
              <p className="text-2xl font-bold text-gray-900">18.5</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600">+8%</span>
            <span className="text-gray-500 ml-1">from last week</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Session Time</p>
              <p className="text-2xl font-bold text-gray-900">16.2 min</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600">+3%</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherLiveSessions;
