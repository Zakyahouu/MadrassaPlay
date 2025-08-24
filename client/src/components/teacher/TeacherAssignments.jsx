import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Calendar,
  Users,
  Clock,
  Target,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import AssignmentCreate from './AssignmentCreate';
import AssignmentsList from './AssignmentsList';

const TeacherAssignments = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const assignments = [
    {
      id: 1,
      title: 'Math Quiz: Fractions Practice',
      subject: 'Mathematics',
      dueDate: '2024-01-15',
      assignedTo: 24,
      completedBy: 20,
      status: 'active',
      difficulty: 'Medium',
      estimatedTime: '15 min',
      description: 'Practice fractions with interactive exercises'
    },
    {
      id: 2,
      title: 'Science Lab Report',
      subject: 'Science',
      dueDate: '2024-01-20',
      assignedTo: 18,
      completedBy: 12,
      status: 'active',
      difficulty: 'Hard',
      estimatedTime: '45 min',
      description: 'Complete lab report for chemical reactions experiment'
    },
    {
      id: 3,
      title: 'History Timeline Project',
      subject: 'History',
      dueDate: '2024-01-10',
      assignedTo: 30,
      completedBy: 28,
      status: 'completed',
      difficulty: 'Easy',
      estimatedTime: '30 min',
      description: 'Create timeline of major historical events'
    }
  ];

  const upcomingAssignments = [
    {
      id: 4,
      title: 'English Essay Writing',
      subject: 'English',
      dueDate: '2024-01-25',
      assignedTo: 22,
      status: 'scheduled',
      difficulty: 'Medium',
      estimatedTime: '60 min',
      description: 'Write an essay on environmental conservation'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600">Manage homework and learning tasks</p>
        </div>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" />
          <span>{showCreateForm ? 'Cancel' : 'New Assignment'}</span>
        </button>
      </div>

      {/* Create Assignment Form */}
      {showCreateForm && (
        <div className="mb-6">
          <AssignmentCreate />
        </div>
      )}

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
            Active ({assignments.filter(a => a.status === 'active').length})
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upcoming'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Upcoming ({upcomingAssignments.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'completed'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Completed ({assignments.filter(a => a.status === 'completed').length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Assignments
          </button>
        </nav>
      </div>

      {/* Active Assignments */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {assignments.filter(a => a.status === 'active').map((assignment) => (
            <div key={assignment.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                      <span className="flex items-center">
                        <Target className="w-4 h-4 mr-1" />
                        {assignment.subject}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Due: {assignment.dueDate}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {assignment.estimatedTime}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        assignment.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                        assignment.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {assignment.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{assignment.completedBy}/{assignment.assignedTo}</span>
                    </div>
                    <p className="text-xs text-gray-500">Completed</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming Assignments */}
      {activeTab === 'upcoming' && (
        <div className="space-y-4">
          {upcomingAssignments.map((assignment) => (
            <div key={assignment.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                      <span className="flex items-center">
                        <Target className="w-4 h-4 mr-1" />
                        {assignment.subject}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Due: {assignment.dueDate}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {assignment.estimatedTime}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        assignment.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                        assignment.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {assignment.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{assignment.assignedTo}</span>
                    </div>
                    <p className="text-xs text-gray-500">Assigned</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700">
                      Activate
                    </button>
                    <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg">
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed Assignments */}
      {activeTab === 'completed' && (
        <div className="space-y-4">
          {assignments.filter(a => a.status === 'completed').map((assignment) => (
            <div key={assignment.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                      <span className="flex items-center">
                        <Target className="w-4 h-4 mr-1" />
                        {assignment.subject}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Completed: {assignment.dueDate}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {assignment.estimatedTime}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        assignment.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                        assignment.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {assignment.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-900">{assignment.completedBy}/{assignment.assignedTo}</span>
                    </div>
                    <p className="text-xs text-gray-500">Completed</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg">
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Assignments</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">87%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Time</p>
              <p className="text-2xl font-bold text-gray-900">25 min</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* All Assignments List */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">All Assignments</h3>
            <AssignmentsList />
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAssignments;
