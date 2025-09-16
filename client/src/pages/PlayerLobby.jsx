// client/src/pages/PlayerLobby.jsx
import React, { useEffect, useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';

const PlayerLobby = () => {
  const { roomCode } = useParams();
  const socket = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');

  // This useEffect hook listens for the game starting
  useEffect(() => {
    if (socket) {
      // Attempt to join the game room with full name from profile
      const playerName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.name || 'Player';
      const userId = user?._id;
      if (roomCode && userId) {
        socket.emit('join-game', { roomCode, playerName, userId });
      }
      // Listen for the 'game-started' event from the server
  const handleGameStarted = ({ gameCreationId }) => {
        console.log(`Player Lobby: Game starting! Navigating to play game: ${gameCreationId}`);
        // Navigate the student to their play page and pass live room code
        navigate(`/student/play-game/${gameCreationId}`, { state: { live: { roomCode } } });
      };

      socket.on('game-started', handleGameStarted);
      const handleScoreboard = ({ ranks }) => {
        console.log('Live scoreboard update (player):', ranks?.slice(0,5));
      };
      socket.on('live:scoreboard', handleScoreboard);
      const handleJoinError = (msg) => {
        setError(msg || 'Could not join this room.');
      };
      socket.on('join-error', handleJoinError);

      // Clean up the event listener when the component unmounts
      return () => {
  socket.off('game-started', handleGameStarted);
  socket.off('live:scoreboard', handleScoreboard);
  socket.off('join-error', handleJoinError);
      };
    }
  }, [socket, navigate]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8 text-center">
      {!error ? (
        <>
          <h1 className="text-4xl font-bold mb-2">You're In!</h1>
          <p className="text-sm text-gray-400 mb-6">{[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.name}</p>
          <p className="text-xl text-gray-300 mb-8 flex items-center gap-3">
            <span className="inline-block w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
            Waiting for the teacher to start the game...
          </p>
          <div className="bg-gray-800 p-6 rounded-lg">
            <p className="text-lg text-gray-500">Room Code</p>
            <p className="text-4xl font-bold font-mono text-indigo-400 select-all">{roomCode}</p>
          </div>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="mt-8 px-4 py-2 rounded-md bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white"
          >Leave Lobby</button>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-3">Join Failed</h1>
          <p className="text-sm text-red-300 mb-6">{error}</p>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="px-4 py-2 rounded-md bg-white text-gray-900 hover:bg-gray-100"
          >Back to Dashboard</button>
        </>
      )}
    </div>
  );
};

export default PlayerLobby;
