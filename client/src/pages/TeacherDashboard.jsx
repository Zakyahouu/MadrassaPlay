import React, { useContext, useState } from 'react';
import { LogOut, Plus, Sparkles, BookOpen, Play, Edit3, Trash2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
// Mock AuthContext for demo


// Mock components with creative implementations
const MyCreations = () => {
  const games = [
    { id: 1, title: 'Math Quest Adventures', type: 'Quiz Game', students: 24, lastPlayed: '2 days ago', color: 'bg-gradient-to-br from-purple-500 to-pink-500' },
    { id: 2, title: 'Science Lab Explorer', type: 'Interactive', students: 18, lastPlayed: '1 week ago', color: 'bg-gradient-to-br from-blue-500 to-cyan-500' },
    { id: 3, title: 'History Timeline Challenge', type: 'Memory Game', students: 32, lastPlayed: '3 days ago', color: 'bg-gradient-to-br from-green-500 to-emerald-500' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {games.map((game) => (
        <div key={game.id} className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className={`w-12 h-12 ${game.color} rounded-xl mb-4 flex items-center justify-center shadow-lg`}>
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          
          <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
            {game.title}
          </h3>
          
          <div className="space-y-1 text-sm text-gray-500 mb-4">
            <p>{game.type}</p>
            <p>{game.students} students</p>
            <p>Last played: {game.lastPlayed}</p>
          </div>
          
          <div className="flex gap-2">
            <button className="flex-1 bg-gray-900 hover:bg-gray-800 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors">
              <Play className="w-4 h-4" />
              Launch
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Edit3 className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

const TemplateSelector = () => {
  const templates = [
    { 
      id: 1, 
      name: 'Quiz Master', 
      description: 'Multiple choice questions with instant feedback',
      icon: '🧠',
      difficulty: 'Beginner',
      estimatedTime: '5-10 min'
    },
    { 
      id: 2, 
      name: 'Memory Match', 
      description: 'Card matching game for vocabulary and concepts',
      icon: '🎯',
      difficulty: 'Intermediate',
      estimatedTime: '10-15 min'
    },
    { 
      id: 3, 
      name: 'Adventure Quest', 
      description: 'Story-driven learning with branching paths',
      icon: '🗺️',
      difficulty: 'Advanced',
      estimatedTime: '20-30 min'
    },
    { 
      id: 4, 
      name: 'Word Builder', 
      description: 'Drag and drop letters to form words',
      icon: '📝',
      difficulty: 'Beginner',
      estimatedTime: '5-10 min'
    }
  ];

  const [selectedTemplate, setSelectedTemplate] = useState(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {templates.map((template) => (
        <div 
          key={template.id}
          onClick={() => setSelectedTemplate(template.id)}
          className={`relative cursor-pointer rounded-xl p-6 border-2 transition-all duration-200 hover:scale-[1.02] ${
            selectedTemplate === template.id 
              ? 'border-gray-900 bg-gray-50' 
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="text-3xl">{template.icon}</div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
              <p className="text-gray-600 text-sm mb-3">{template.description}</p>
              
              <div className="flex items-center gap-4 text-xs">
                <span className={`px-2 py-1 rounded-full ${
                  template.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                  template.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {template.difficulty}
                </span>
                <span className="text-gray-500">{template.estimatedTime}</span>
              </div>
            </div>
          </div>
          
          {selectedTemplate === template.id && (
            <div className="absolute -top-2 -right-2">
              <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
          )}
        </div>
      ))}
      
      {selectedTemplate && (
        <div className="md:col-span-2 mt-4">
          <button className="w-full bg-gray-900 hover:bg-gray-800 text-white py-4 px-6 rounded-xl font-medium flex items-center justify-center gap-3 transition-colors shadow-lg">
            <Plus className="w-5 h-5" />
            Create Game with Selected Template
          </button>
        </div>
      )}
    </div>
  );
};

const TeacherDashboard = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Floating header with glassmorphism effect */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 border-b border-gray-200/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500">Create amazing learning experiences</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Welcome back!</p>
              <p className="text-xs text-gray-500">{user?.name}</p>
            </div>
            
            <button 
              onClick={logout}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors group"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" />
            </button>
          </div>
        </div>
      </header>

      <main className="px-6 py-8 max-w-7xl mx-auto">
        {/* My Creations Section with enhanced spacing and visual hierarchy */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">My Creations</h2>
            <p className="text-gray-600 max-w-2xl">
              Your personalized learning games are ready to engage and inspire your students. 
              Launch existing games or edit them to keep the content fresh.
            </p>
          </div>
          <MyCreations />
        </section>

        {/* Template Selector Section with modern card design */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create New Game</h2>
            <p className="text-gray-600 max-w-2xl">
              Transform your lessons into interactive adventures. Choose a template that matches 
              your teaching style and watch your students light up with excitement.
            </p>
          </div>
          <TemplateSelector />
        </section>
        
        {/* Subtle decorative element */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 text-gray-400 text-sm">
            <div className="w-8 h-px bg-gradient-to-r from-transparent to-gray-300"></div>
            <Sparkles className="w-4 h-4" />
            <div className="w-8 h-px bg-gradient-to-l from-transparent to-gray-300"></div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;