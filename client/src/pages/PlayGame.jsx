// PlayGame.jsx - Enhanced with minimal clean design
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import axios from 'axios';

const PlayGame = () => {
  const { user } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const navigate = useNavigate();
  const { creationId } = useParams();
  const location = useLocation();
  const assignmentId = location.state?.assignmentId || null;
  const liveInfo = location.state?.live || null;
  const [gameCreation, setGameCreation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gate, setGate] = useState({ loading: true, allow: true, reason: null, attemptNumber: 1, attemptLimit: 1, attemptsRemaining: 1 });
  const [submitError, setSubmitError] = useState(null);
  const [liveSaved, setLiveSaved] = useState(false);
  const [ranks, setRanks] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    const fetchGameCreation = async () => {
      try {
        const config = liveInfo?.roomCode ? { headers: { 'X-Live-Room': liveInfo.roomCode } } : undefined;
        const { data } = await axios.get(`/api/creations/${creationId}`, config);
        setGameCreation(data);
      } catch (err) {
        setError('Failed to load game');
      } finally {
        setLoading(false);
      }
    };
    fetchGameCreation();
  }, [creationId]);

  // Fetch canAttempt gate
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!assignmentId) { setGate(g => ({ ...g, loading: false })); return; }
        const res = await axios.get(`/api/assignments/${assignmentId}/can-attempt`, { params: { gameId: creationId } });
        if (!mounted) return;
        const d = res.data || {};
        setGate({ loading: false, allow: !!d.allow, reason: d.reason || null, attemptNumber: d.attemptNumber || 1, attemptLimit: d.attemptLimit || 1, attemptsRemaining: d.attemptsRemaining ?? 0 });
      } catch (e) {
        if (!mounted) return;
        setGate({ loading: false, allow: true, reason: null, attemptNumber: 1, attemptLimit: 1, attemptsRemaining: 1 });
      }
    })();
    return () => { mounted = false; };
  }, [assignmentId, creationId]);

  useEffect(() => {
    const handleGameMessage = async (event) => {
      // Live progress from engine (optional but recommended for real-time leaderboard)
    if (liveInfo?.roomCode && socket && event.data?.type === 'LIVE_ANSWER') {
        try {
          const payload = event.data.payload || {};
          const correct = !!payload.correct;
          const deltaMs = Number.isFinite(Number(payload.deltaMs)) ? Number(payload.deltaMs) : 0;
      const scoreDelta = Number.isFinite(Number(payload.scoreDelta)) ? Number(payload.scoreDelta) : undefined;
      const currentScore = Number.isFinite(Number(payload.currentScore)) ? Number(payload.currentScore) : undefined;
      socket.emit('live:answer', { roomCode: liveInfo.roomCode, userId: user?._id, correct, deltaMs, scoreDelta, currentScore });
        } catch {}
      }
      if (liveInfo?.roomCode && socket && event.data?.type === 'LIVE_FINISH') {
        try {
          const payload = event.data.payload || {};
          const totalTimeMs = Number.isFinite(Number(payload.totalTimeMs)) ? Number(payload.totalTimeMs) : undefined;
          socket.emit('live:finish', { roomCode: liveInfo.roomCode, userId: user?._id, totalTimeMs });
        } catch {}
      }
  if (event.data?.type === 'GAME_COMPLETE') {
        try {
      const payload = { ...event.data.payload };
  // Normalize identifiers expected by backend
  if (!payload.gameCreationId && gameCreation?._id) payload.gameCreationId = gameCreation._id;
      if (assignmentId && !payload.assignmentId) payload.assignmentId = assignmentId;
  const headers = liveInfo?.roomCode ? { 'X-Live-Room': liveInfo.roomCode } : undefined;
  const resp = await axios.post('/api/results', payload, headers ? { headers } : undefined);
          console.log('Result saved successfully');
          // Dispatch events so dashboards/components can refresh without polling
          window.dispatchEvent(new Event('assignmentProgressRefresh'));
          window.dispatchEvent(new Event('templateBadgesRefresh'));
          // Dispatch a detailed event with XP and badges hint
          try {
            const detail = { detail: { 
              xpAwarded: resp.data?.xpAwarded ?? 0,
              percentage: resp.data?.percentage,
              attemptNumber: resp.data?.attemptNumber,
              attemptsRemaining: resp.data?.attemptsRemaining,
              counted: resp.data?.counted,
            }};
            window.dispatchEvent(new CustomEvent('assignmentResultSaved', detail));
          } catch {}
          // Reflect new counters locally for header/overlay
          if (assignmentId) {
            const submittedAttempt = Number(resp.data?.attemptNumber || 0);
            const attemptLimit = Number(gate.attemptLimit || 1);
            const remaining = Number(resp.data?.attemptsRemaining ?? Math.max(0, (gate.attemptsRemaining || 0) - 1));
            const nextAttempt = submittedAttempt > 0 ? submittedAttempt + 1 : gate.attemptNumber;
            const allowNext = remaining > 0;
            setGate(g => ({
              ...g,
              attemptNumber: nextAttempt,
              attemptLimit,
              attemptsRemaining: remaining,
              allow: allowNext,
              reason: allowNext ? null : 'attempt_limit',
            }));
          }
          // If this was a live game, show a small banner to view recent live results
          if (liveInfo?.roomCode) {
            setLiveSaved(true);
            // Optional: auto-hide the banner after a while
            setTimeout(() => setLiveSaved(false), 8000);
          }
        } catch (err) {
          // Surface server reason codes and counters
          const resp = err?.response?.data || {};
          const reason = resp.reason || null;
          const reasonMap = {
            assignment_completed: 'This assignment is completed.',
            canceled: 'This assignment has been canceled.',
            time_window: 'This assignment is not currently active.',
            attempt_limit: 'Attempt limit reached for this game.',
          };
          const msg = reason ? (reasonMap[reason] || 'You cannot submit this result right now.') : (resp.message || 'Failed to save result.');
          setSubmitError(msg);
          // Reflect counters in header if provided
          if (typeof resp.attemptNumber === 'number' || typeof resp.attemptsRemaining === 'number' || typeof resp.attemptLimit === 'number') {
            setGate(g => ({
              ...g,
              allow: reason ? false : g.allow,
              attemptNumber: typeof resp.attemptNumber === 'number' ? resp.attemptNumber : g.attemptNumber,
              attemptLimit: typeof resp.attemptLimit === 'number' ? resp.attemptLimit : g.attemptLimit,
              attemptsRemaining: typeof resp.attemptsRemaining === 'number' ? resp.attemptsRemaining : g.attemptsRemaining,
              reason: reason ?? g.reason,
            }));
          }
          // Auto-clear after a short delay
          setTimeout(() => setSubmitError(null), 4000);
        }
      }
    };

    window.addEventListener('message', handleGameMessage);
    return () => window.removeEventListener('message', handleGameMessage);
  }, [socket, liveInfo?.roomCode, user?._id, gameCreation?._id, assignmentId]);

  // Listen for live leaderboard updates during a live session
  useEffect(() => {
    if (!socket || !liveInfo?.roomCode) return;
    const handleScoreboard = ({ ranks }) => {
      if (Array.isArray(ranks)) setRanks(ranks);
    };
    socket.on('live:scoreboard', handleScoreboard);
    return () => { socket.off('live:scoreboard', handleScoreboard); };
  }, [socket, liveInfo?.roomCode]);

  const handleIframeLoad = () => {
    if (iframeRef.current && gameCreation) {
      const payload = {
        ...gameCreation,
        questions: gameCreation.content,
        assignmentId,
  mode: (user?.role === 'student') ? 'student' : (user?.role === 'teacher' ? 'teacher' : 'admin'),
  isTest: user?.role !== 'student',
        live: liveInfo || undefined,
      };
      iframeRef.current.contentWindow.postMessage(
        { type: 'INIT_GAME', payload },
        '*'
      );
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getDashboardPath = () => {
    const paths = {
      admin: '/admin/dashboard',
      teacher: '/teacher/dashboard',
      student: '/student/dashboard'
    };
    return paths[user.role] || '/';
  };

  if (loading || gate.loading) return (
    <div className="h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full mx-auto mb-3"></div>
        <p className="text-gray-600 text-sm">Loading game...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <div className="text-3xl mb-3">⚠️</div>
        <p className="text-gray-700 mb-4">{error}</p>
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  );

  const blockMsgMap = {
    assignment_completed: 'This assignment is completed.',
    canceled: 'This assignment has been canceled.',
    time_window: 'This assignment is not currently active.',
    attempt_limit: 'You have used all attempts for this game.',
  };

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              to={getDashboardPath()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
              title="Exit Game"
            >
              ←
            </Link>
            <div className="flex items-center gap-3">
              <img src="/Logo.jpg" alt="Skill Snap Logo" className="w-8 h-8 object-contain rounded" />
              <h1 className="text-lg font-semibold text-gray-900">
                {gameCreation?.name || 'Game'}
              </h1>
              <p className="text-xs text-gray-500">
                {assignmentId ? `Attempt ${gate.attemptNumber} of ${gate.attemptLimit}` : (gameCreation?.template?.name ? `Playing • ${gameCreation?.template?.name}` : '')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {liveInfo?.roomCode && (
              <button
                onClick={() => setShowLeaderboard(v => !v)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                title="Leaderboard"
                aria-label="Toggle leaderboard"
              >
                🏆
              </button>
            )}
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? '🔳' : '⛶'}
            </button>
            <Link 
              to={getDashboardPath()}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
            >
              Exit
            </Link>
          </div>
        </div>
      </header>
      {/* Submission error banner */}
      {submitError && (
        <div className="bg-red-50 border-b border-red-200 text-red-700 text-sm px-6 py-2">{submitError}</div>
      )}
      {liveSaved && user?.role === 'student' && (
        <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-sm px-6 py-2 flex items-center justify-between">
          <span>Your live result was saved. You can find it in Live Sessions.</span>
          <Link to="/student/dashboard" onClick={(e)=>{ e.preventDefault(); navigate('/student/dashboard', { state: { tab: 'live' } }); }} className="underline">View Live Sessions</Link>
        </div>
      )}

      {/* Live Leaderboard panel (students) */}
      {user?.role === 'student' && liveInfo?.roomCode && showLeaderboard && (
        <div className="absolute top-20 right-4 z-30 w-80 max-w-[85vw] bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="font-semibold text-gray-900 text-sm">Live Leaderboard</div>
            <button onClick={() => setShowLeaderboard(false)} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          <div className="max-h-96 overflow-auto p-2">
            {(!Array.isArray(ranks) || ranks.length === 0) && (
              <div className="text-xs text-gray-500 px-2 py-3">No progress yet.</div>
            )}
            <ol className="space-y-1">
              {Array.isArray(ranks) && ranks.map((r, i) => {
                const isMe = String(r.userId || r.studentId) === String(user?._id);
                return (
                  <li key={`${r.userId || r.studentId || 'u'}-${i}`} className={`flex items-center justify-between px-3 py-2 rounded-md text-xs ${isMe ? 'bg-indigo-50 border border-indigo-200' : 'bg-gray-50 border border-gray-100'}`}>
                    <span className="text-gray-800 truncate mr-2">
                      {i + 1}. {r.name || r.firstName || 'Player'}
                    </span>
                    <span className="text-gray-600 whitespace-nowrap">{r.score ?? 0} pts • {(r.effectiveTimeMs ? (r.effectiveTimeMs/1000).toFixed(1) : '0.0')}s • {r.wrong || 0}×❌</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}
      
      {/* Game Container */}
      <main className="flex-1 bg-gray-100 p-4">
        <div className="h-full bg-black rounded-lg overflow-hidden shadow-sm">
      { !assignmentId || gate.allow ? (
        (gameCreation?.enginePath || gameCreation?.template?.enginePath) ? (
            <iframe
              ref={iframeRef}
        src={`${(gameCreation.enginePath || gameCreation.template.enginePath)}/index.html`}
              title="Game Engine"
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-white bg-gray-900">
              <div className="text-center">
                <div className="text-4xl mb-4">🎮</div>
                <p className="text-gray-300">Game engine not available</p>
                <p className="text-gray-500 text-sm mt-1">Contact administrator for support</p>
              </div>
            </div>
          )
      ) : (
        <div className="h-full flex items-center justify-center text-white bg-gray-900">
          <div className="text-center">
            <div className="text-4xl mb-4">⛔</div>
            <p className="text-gray-300">{blockMsgMap[gate.reason] || 'You cannot attempt this game right now.'}</p>
            {gate.reason === 'attempt_limit' && <p className="text-gray-400 text-sm mt-1">Attempts used: {gate.attemptLimit}</p>}
          </div>
        </div>
      )}
        </div>
      </main>
    </div>
  );
};

export default PlayGame;