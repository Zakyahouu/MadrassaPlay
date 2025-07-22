// client/src/pages/HostLobby.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { SocketContext } from '../context/SocketContext';

const HostLobby = () => {
  const { gameCreationId } = useParams();
  const socket = useContext(SocketContext);
  const navigate = useNavigate();

  const [roomCode, setRoomCode] = useState(null);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    if (socket) {
      socket.emit('host-game', gameCreationId);

      socket.on('room-created', (newRoomCode) => {
        console.log(`Lobby: Room created with code: ${newRoomCode}`);
        setRoomCode(newRoomCode);
      });

      socket.on('player-joined', (updatedPlayerList) => {
        console.log('Lobby: A player joined. New player list:', updatedPlayerList);
        setPlayers(updatedPlayerList);
      });

      // --- NEW: Listen for the game starting ---
      // The server will send this event to everyone in the room.
      socket.on('game-started', ({ gameCreationId }) => {
        console.log(`Lobby: Game starting! Navigating to play game: ${gameCreationId}`);
        // Navigate the teacher to the play page along with the students.
        // In a more advanced version, the teacher's view could be a live dashboard.
        navigate(`/teacher/play-game/${gameCreationId}`);
      });

    }

    return () => {
      if (socket) {
        socket.off('room-created');
        socket.off('player-joined');
        socket.off('game-started'); // Clean up the new listener
      }
    };
  }, [socket, gameCreationId, navigate]);

  // --- NEW: Function to handle starting the game ---
  const handleStartGame = () => {
    if (socket && roomCode) {
      // Tell the server to start the game for everyone in this room.
      socket.emit('start-game', roomCode);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">Game Lobby</h1>
      
      {roomCode ? (
        <>
          <p className="text-xl text-gray-400 mb-2">Students can join with this code:</p>
          <div className="bg-white text-gray-900 font-mono text-6xl font-bold p-6 rounded-lg shadow-lg mb-8 tracking-widest">
            {roomCode}
          </div>
          <div className="w-full max-w-md bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Players Joined ({players.length})</h2>
            <ul className="space-y-2">
              {players.length > 0 ? (
                players.map((player) => (
                  <li key={player.id} className="bg-gray-700 p-3 rounded-md text-lg">
                    {player.name}
                  </li>
                ))
              ) : (
                <li className="text-gray-500">Waiting for players...</li>
              )}
            </ul>
          </div>
          {/* Add the onClick handler to the button */}
          <button 
            onClick={handleStartGame}
            className="mt-8 px-8 py-4 text-xl font-bold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-500" 
            disabled={players.length === 0}
          >
            Start Game
          </button>
        </>
      ) : (
        <p className="text-2xl">Creating a room...</p>
      )}

      <Link to="/teacher/dashboard" className="mt-8 text-indigo-400 hover:underline">
        Exit Lobby
      </Link>
    </div>
  );
};

export default HostLobby;
