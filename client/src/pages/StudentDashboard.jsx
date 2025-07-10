// client/src/pages/StudentDashboard.jsx
import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// 1. Import the new MyAssignments component
import MyAssignments from '../components/student/MyAssignments';

const StudentDashboard = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Student Launchpad</h1>
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
      <main className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Join Live Game */}
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4">Join a Live Game</h3>
            <div className="flex space-x-2">
              <input type="text" placeholder="Enter Room Code" className="flex-grow p-3 border rounded-md" />
              <button className="px-6 py-3 font-bold text-white bg-green-600 rounded-md hover:bg-green-700">Join</button>
            </div>
          </div>
          
          {/* 2. Render the MyAssignments component */}
          <MyAssignments />

        </div>
        {/* My Progress */}
        <div className="p-6 bg-white rounded-lg shadow space-y-6">
          <h3 className="text-xl font-bold">My Progress</h3>
          <div>
            <label className="block font-semibold text-gray-700">Level {user?.level || 1}</label>
            <div className="w-full bg-gray-200 rounded-full h-4 mt-1">
              <div className="bg-indigo-500 h-4 rounded-full" style={{ width: `${user?.xp || 0}%` }}></div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700">Badges</h4>
            <div className="flex space-x-2 mt-2">
              {/* Badges will be mapped here later */}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
