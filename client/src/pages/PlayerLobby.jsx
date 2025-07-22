// client/src/pages/PlayerLobby.jsx
import React, { useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SocketContext } from '../context/SocketContext';

const PlayerLobby = () => {
  const { roomCode } = useParams();
  const socket = useContext(SocketContext);
  const navigate = useNavigate();

  // This useEffect hook listens for the game starting
  useEffect(() => {
    if (socket) {
      // Listen for the 'game-started' event from the server
      const handleGameStarted = ({ gameCreationId }) => {
        console.log(`Player Lobby: Game starting! Navigating to play game: ${gameCreationId}`);
        // Navigate the student to the same play page as the teacher
        navigate(`/teacher/play-game/${gameCreationId}`);
      };

      socket.on('game-started', handleGameStarted);

      // Clean up the event listener when the component unmounts
      return () => {
        socket.off('game-started', handleGameStarted);
      };
    }
  }, [socket, navigate]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-bold mb-4">You're In!</h1>
      <p className="text-xl text-gray-400 mb-8">
        Waiting for the teacher to start the game...
      </p>
      <div className="bg-gray-800 p-6 rounded-lg">
        <p className="text-lg text-gray-500">Room Code:</p>
        <p className="text-4xl font-bold font-mono text-indigo-400">{roomCode}</p>
      </div>
    </div>
  );
};

export default PlayerLobby;
