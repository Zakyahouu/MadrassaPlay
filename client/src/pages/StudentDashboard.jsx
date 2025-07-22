// client/src/pages/StudentDashboard.jsx
import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import MyAssignments from '../components/student/MyAssignments';

const StudentDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const navigate = useNavigate();

  const [roomCode, setRoomCode] = useState('');
  const [joinError, setJoinError] = useState(null);

  useEffect(() => {
    if (socket) {
      const handleJoinSuccess = (data) => {
        console.log('Successfully joined room:', data.roomCode);
        navigate(`/student/lobby/${data.roomCode}`);
      };

      const handleJoinError = (errorMessage) => {
        console.error('Join error:', errorMessage);
        setJoinError(errorMessage);
      };

      socket.on('join-success', handleJoinSuccess);
      socket.on('join-error', handleJoinError);

      return () => {
        socket.off('join-success', handleJoinSuccess);
        socket.off('join-error', handleJoinError);
      };
    }
  }, [socket, navigate]);

  const handleJoinGame = (e) => {
    e.preventDefault();
    if (!roomCode.trim() || !socket) return;
    
    setJoinError(null);

    // --- FIX: Include the user's ID in the payload ---
    // This allows the server to know which user is joining the lobby.
    socket.emit('join-game', { 
      roomCode, 
      playerName: user.name,
      userId: user._id // Add the user's ID
    });
  };

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
          {/* Join Live Game Form */}
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4">Join a Live Game</h3>
            <form onSubmit={handleJoinGame} className="flex space-x-2">
              <input 
                type="text" 
                placeholder="Enter Room Code" 
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="flex-grow p-3 border rounded-md" 
              />
              <button 
                type="submit"
                className="px-6 py-3 font-bold text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Join
              </button>
            </form>
            {joinError && <p className="text-red-500 mt-2">{joinError}</p>}
          </div>
          
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
