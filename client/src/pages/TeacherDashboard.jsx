// client/src/pages/TeacherDashboard.jsx
import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// Import the components for the dashboard
import MyCreations from '../components/teacher/MyCreations';
import TemplateSelector from '../components/teacher/TemplateSelector';

const TeacherDashboard = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Teacher Dashboard</h1>
        <div>
          <span className="mr-4">Welcome, {user?.name}</span>
          <button 
            onClick={logout}
            className="px-4 py-2 font-semibold text-sm text-white bg-red-600 rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="p-8 max-w-7xl mx-auto">
        
        {/* Section for the teacher's saved games */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold text-gray-900">My Creations</h2>
          <p className="text-gray-600 mt-1 mb-6">These are the games you have created and saved. You can launch or edit them from here.</p>
          <MyCreations />
        </div>

        {/* Section for creating a new game from a template */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900">Create a New Game</h2>
          <p className="text-gray-600 mt-1 mb-6">Choose one of the available templates below to start creating a new game for your students.</p>
          <TemplateSelector />
        </div>
        
      </main>
    </div>
  );
};

export default TeacherDashboard;
