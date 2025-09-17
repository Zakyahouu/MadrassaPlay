// client/src/pages/HostLobby.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { SocketContext } from '../context/SocketContext';
import { useToast } from '../components/shared/ToastProvider';

const HostLobby = () => {
  const { gameCreationId, sessionId } = useParams();
  const socket = useContext(SocketContext);
  const navigate = useNavigate();

  const [roomCode, setRoomCode] = useState(null);
  const [players, setPlayers] = useState([]);
  const [playerSearch, setPlayerSearch] = useState('');
  const [ranks, setRanks] = useState([]);
  const [running, setRunning] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [awaitingCreate, setAwaitingCreate] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!socket) return;
      // Allow either gameCreationId (fresh) or sessionId (resume). Only redirect if both missing.
      if (!gameCreationId && !sessionId) { navigate('/teacher/dashboard'); return; }
      try {
        if (sessionId) {
          // Resume: fetch session to get code and creation
          const s = await axios.get(`/api/live-sessions/${sessionId}/summary`);
          const code = s.data?.session?.code;
          const creation = s.data?.session?.gameCreationId || gameCreationId;
          setSessionInfo(s.data?.session || null);
          if (!code || !creation) { navigate('/teacher/dashboard'); return; }
          socket.emit('host-game', { code, sessionId, gameCreationId: creation });
        } else {
          // Fresh session: wait for user to confirm and optionally set a title
          setAwaitingCreate(true);
        }
      } catch (e) {
        console.error('Failed to create/resume live session', e);
      }
    })();

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
        console.log(`Lobby: Game starting! Staying in host view for leaderboard. gameCreationId=${gameCreationId}`);
        setRunning(true);
      });

      // When game ends, offer a direct jump to summary
      const handleGameEnded = ({ sessionId }) => {
        if (sessionId) {
          navigate(`/teacher/live-sessions/${sessionId}`);
        }
      };
      socket.on('game-ended', handleGameEnded);

      const handleScoreboard = ({ ranks }) => {
        setRanks(Array.isArray(ranks) ? ranks : []);
      };
      socket.on('live:scoreboard', handleScoreboard);

    return () => {
      mounted = false;
      if (socket) {
        socket.off('room-created');
        socket.off('player-joined');
  socket.off('game-started');
  socket.off('game-ended', handleGameEnded);
  socket.off('live:scoreboard', handleScoreboard);
      }
    };
  }, [socket, gameCreationId, sessionId, navigate]);

  // --- NEW: Function to handle starting the game ---
  const handleStartGame = () => {
    if (socket && roomCode) {
      // Tell the server to start the game for everyone in this room.
      socket.emit('start-game', roomCode);
    }
  };
  const handleEndGame = () => {
  if (!roomCode) return;
  setConfirmEndOpen(true);
  };

  const handleCreateLobby = async () => {
    try {
      // Fresh session: create then host
      const classesRes = await axios.get('/api/classes/teacher');
      const classIds = (classesRes.data || []).map(c => c._id);
      const createRes = await axios.post('/api/live-sessions', {
        title: sessionTitle?.trim() || undefined,
        gameCreationId,
        classIds,
        allowLateJoin: false,
        config: { strictProgress: false, timePenaltyPerWrongMs: 3000 }
      });
      const { sessionId: newSessionId, code } = createRes.data || {};
      setSessionInfo({ _id: newSessionId, code, status: 'lobby', title: sessionTitle?.trim() || undefined });
      setAwaitingCreate(false);
      socket.emit('host-game', { code, sessionId: newSessionId, gameCreationId });
    } catch (e) {
      console.error('Failed to create lobby', e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">Game Lobby</h1>
      {sessionInfo && (
        <div className="mb-4 text-sm text-gray-300">
          <span className="mr-2">Registered as session</span>
          <Link to={`/teacher/live-sessions/${sessionInfo._id}`} className="text-indigo-300 underline">{sessionInfo._id}</Link>
        </div>
      )}
      
      {/* Fresh creation gate: let teacher set title before creating */}
    {!sessionInfo && awaitingCreate && (
        <div className="w-full max-w-md bg-gray-800 p-6 rounded-lg mb-8">
          <h2 className="text-2xl font-semibold mb-3">Create Lobby</h2>
          <label className="block text-sm text-gray-300 mb-1">Session name (optional)</label>
          <input
            className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 mb-3"
            placeholder="e.g., Friday Quiz – Class A"
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
          />
          <div className="rounded-md border border-amber-400/30 bg-amber-400/10 text-amber-200 p-3 text-sm mb-4">
            No late joins. Once the session starts, new students cannot join.
          </div>
      <button onClick={handleCreateLobby} className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-700">Create Lobby</button>
        </div>
      )}

      {roomCode ? (
        <>
          <p className="text-xl text-gray-400 mb-2">Students can join with this code:</p>
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white text-gray-900 font-mono text-6xl font-bold px-6 py-4 rounded-lg shadow-lg tracking-widest select-all">
              {roomCode}
            </div>
            <button
              onClick={async()=>{ try{ await navigator.clipboard.writeText(roomCode); toast('Room code copied'); } catch{} }}
              className="px-3 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
              aria-label="Copy room code"
            >Copy</button>
          </div>
          {/* Quick actions for the host */}
          <div className="flex items-center gap-3 mb-6">
            <Link
              to={`/teacher/dashboard?tab=live-sessions`}
              className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              aria-label="Open Live Sessions"
            >Live Sessions</Link>
          </div>
          <div className="w-full max-w-md bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Players Joined ({players.length})</h2>
            <input
              type="text"
              value={playerSearch}
              onChange={e => setPlayerSearch(e.target.value)}
              placeholder="Search players..."
              className="w-full mb-3 px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
              aria-label="Search players"
            />
            <div className="max-h-64 overflow-y-auto">
              <ul className="space-y-2">
                {players.length > 0 ? (
                  players
                    .filter(p => p.name.toLowerCase().includes(playerSearch.toLowerCase()))
                    .map((player) => (
                      <li key={player.id} className="bg-gray-700 p-3 rounded-md text-lg flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-base">
                          {player.name ? player.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() : '?'}
                        </div>
                        <span className="truncate">{player.name}</span>
                      </li>
                    ))
                ) : (
                  <li className="text-gray-500">Waiting for players...</li>
                )}
              </ul>
            </div>
          </div>
          {/* Live leaderboard preview */}
          <div className="w-full max-w-md bg-gray-800 p-6 rounded-lg mt-6">
            <h2 className="text-2xl font-semibold mb-4">Live Leaderboard</h2>
            {ranks.length === 0 ? (
              <div className="text-gray-500">No progress yet.</div>
            ) : (
              <ol className="space-y-2">
                {ranks.slice(0, 10).map((r, i) => (
                  <li key={`${r.userId}-${i}`} className="bg-gray-700 p-3 rounded-md text-sm flex items-center justify-between">
                    <span className="text-gray-300">{i+1}. {r.name || r.userId}</span>
                    <span className="text-gray-400">Score {r.score} • Time {(r.effectiveTimeMs/1000).toFixed(1)}s • Wrong {r.wrong||0}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
          {/* Controls */}
          <div className="mt-8 flex items-center gap-3">
            <button 
              onClick={handleStartGame}
              className="px-6 py-3 text-lg font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300" 
              disabled={players.length === 0 || running}
            >
              {running ? 'Running…' : 'Start Game'}
            </button>
            {running && (
              <button
                onClick={handleEndGame}
                className="px-6 py-3 text-lg font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                aria-label="End Game"
              >End Game</button>
            )}
          </div>
        </>
      ) : (
        <div className="flex items-center gap-3 text-2xl text-gray-300">
          <span className="inline-block w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          <span>Preparing lobby…</span>
        </div>
      )}

      <Link to="/teacher/dashboard" className="mt-8 text-indigo-400 hover:underline">
        Exit Lobby
      </Link>

      {/* Confirm End Game modal */}
      {confirmEndOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white text-gray-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh]">
            <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
              <h3 className="text-lg font-semibold">End Game</h3>
              <button onClick={() => setConfirmEndOpen(false)} className="text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400" aria-label="Close">✕</button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <p>Are you sure you want to end this live game for everyone?</p>
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => setConfirmEndOpen(false)} className="px-4 py-2 text-sm rounded-md border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300">Cancel</button>
                <button
                  onClick={() => { setConfirmEndOpen(false); if (socket && roomCode) socket.emit('end-game', roomCode); }}
                  className="px-4 py-2 text-sm rounded-md text-white bg-red-600 hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                >End Game</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostLobby;
