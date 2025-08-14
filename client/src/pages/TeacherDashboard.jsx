import React, { useContext, useState, useEffect } from 'react';
import { LogOut, Plus, Sparkles, BookOpen, Play, Edit3, Trash2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext'; // Assuming this context provides user and logout function

// --- Child Components ---
// In a real app, these would likely be in separate files. They are included here for a complete example.
// Import the components for the dashboard
import MyCreations from '../components/teacher/MyCreations';
import TemplateSelector from '../components/teacher/TemplateSelector';
import Reports from '../components/teacher/Reports';
import AssignmentCreate from '../components/teacher/AssignmentCreate';
import AssignmentsList from '../components/teacher/AssignmentsList';

const TeacherDashboard = () => {
  // In a real app, user and logout would come from a real AuthContext
  const { user, logout } = useContext(AuthContext) || { user: { name: 'Dr. Anya Sharma' }, logout: () => console.log('Logout clicked') };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white font-sans">
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 border-b border-gray-200/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Creator Dashboard</h1>
              <p className="text-sm text-gray-500">Design amazing learning experiences</p>
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
        <section className="mb-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">My Creations</h2>
            <p className="text-gray-600 max-w-2xl">
              Your personalized learning games are ready to engage and inspire. Launch existing games or edit them to keep the content fresh.
            </p>
          </div>
          <MyCreations />
        </section>

        <section className="mt-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Reports</h2>
            <p className="text-gray-600 max-w-2xl">Assignment progress at a glance.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border p-6">
              <h3 className="text-xl font-semibold mb-3">My Assignments</h3>
              <AssignmentsList />
            </div>
            <Reports />
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Assignment</h2>
            <p className="text-gray-600 max-w-2xl">Target classes and pick games to assign.</p>
          </div>
          <AssignmentCreate />
        </section>

        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create New Game</h2>
            <p className="text-gray-600 max-w-2xl">
              Transform your lessons into interactive adventures. Choose a template that matches your teaching style and watch your students light up with excitement.
            </p>
          </div>
          <TemplateSelector />
        </section>
        
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
