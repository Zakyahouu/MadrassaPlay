// PlayGame.jsx - Enhanced with minimal clean design
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const PlayGame = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { creationId } = useParams();
  const location = useLocation();
  const assignmentId = location.state?.assignmentId || null;
  const [gameCreation, setGameCreation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    const fetchGameCreation = async () => {
      try {
        const { data } = await axios.get(`/api/creations/${creationId}`);
        setGameCreation(data);
      } catch (err) {
        setError('Failed to load game');
      } finally {
        setLoading(false);
      }
    };
    fetchGameCreation();
  }, [creationId]);

  useEffect(() => {
    const handleGameMessage = async (event) => {
    if (event.data?.type === 'GAME_COMPLETE') {
        try {
      const payload = { ...event.data.payload };
  // Normalize identifiers expected by backend
  if (!payload.gameCreationId && gameCreation?._id) payload.gameCreationId = gameCreation._id;
      if (assignmentId && !payload.assignmentId) payload.assignmentId = assignmentId;
      await axios.post('/api/results', payload);
          console.log('Result saved successfully');
          // Dispatch events so dashboards/components can refresh without polling
          window.dispatchEvent(new Event('assignmentProgressRefresh'));
          window.dispatchEvent(new Event('templateBadgesRefresh'));
        } catch (err) {
          console.error('Failed to save result:', err);
        }
      }
    };

    window.addEventListener('message', handleGameMessage);
    return () => window.removeEventListener('message', handleGameMessage);
  }, []);

  const handleIframeLoad = () => {
    if (iframeRef.current && gameCreation) {
      const payload = {
        ...gameCreation,
        questions: gameCreation.content,
        assignmentId,
  mode: (user?.role === 'student') ? 'student' : (user?.role === 'teacher' ? 'teacher' : 'admin'),
  isTest: user?.role !== 'student',
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

  if (loading) return (
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
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {gameCreation?.name || 'Game'}
              </h1>
              <p className="text-xs text-gray-500">
                Playing • {gameCreation?.template?.name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
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
      
      {/* Game Container */}
      <main className="flex-1 bg-gray-100 p-4">
        <div className="h-full bg-black rounded-lg overflow-hidden shadow-sm">
      { (gameCreation?.enginePath || gameCreation?.template?.enginePath) ? (
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
          )}
        </div>
      </main>
    </div>
  );
};

export default PlayGame;