// client/src/pages/PlayGame.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const PlayGame = () => {
  const { creationId } = useParams();
  const [gameCreation, setGameCreation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    const fetchGameCreation = async () => {
      try {
        const response = await axios.get(`/api/creations/${creationId}`);
        setGameCreation(response.data);
      } catch (err) {
        setError('Failed to load the game. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchGameCreation();
  }, [creationId]);

  // --- NEW: useEffect to handle messages from the game engine ---
  useEffect(() => {
    const handleGameMessage = async (event) => {
      // We only care about messages from our iframe's origin
      // In a real app, you would check event.origin for security.

      if (event.data && event.data.type === 'GAME_COMPLETE') {
        console.log('React App: Received GAME_COMPLETE message from engine.', event.data.payload);
        
        // Call our backend API to save the result.
        try {
          await axios.post('/api/results', event.data.payload);
          console.log('Result saved successfully!');
          // You could show a success message to the user here.
        } catch (err) {
          console.error('Failed to save game result:', err);
          // You could show an error message to the user here.
        }
      }
    };

    // Add the event listener
    window.addEventListener('message', handleGameMessage);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('message', handleGameMessage);
    };
  }, []); // The empty dependency array means this effect runs only once.


  const handleIframeLoad = () => {
    if (iframeRef.current && gameCreation) {
      console.log('React App: Iframe loaded. Sending game data to engine...');
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'INIT_GAME',
          payload: gameCreation,
        },
        '*'
      );
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading Game...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  return (
    <div className="h-screen bg-gray-800 text-white p-4 grid grid-rows-[auto_1fr] gap-4">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{gameCreation?.name}</h1>
        <Link to="/teacher/dashboard" className="px-4 py-2 bg-indigo-600 rounded-md hover:bg-indigo-700">
          Exit Game
        </Link>
      </header>
      
      <main className="bg-black rounded-lg overflow-hidden">
        {gameCreation?.template?.enginePath ? (
          <iframe
            ref={iframeRef}
            src={gameCreation.template.enginePath + '/index.html'}
            title="Game Engine"
            className="w-full h-full border-0"
            onLoad={() => {
              if (iframeRef.current && gameCreation) {
                // Send both the original payload and a 'questions' alias for compatibility
                const payload = {
                  ...gameCreation,
                  questions: gameCreation.content,
                };
                iframeRef.current.contentWindow.postMessage(
                  {
                    type: 'INIT_GAME',
                    payload,
                  },
                  '*'
                );
              }
            }}
          ></iframe>
        ) : (
          <div className="text-center p-8 text-red-500">Game engine not found for this template.</div>
        )}
      </main>
    </div>
  );
};

export default PlayGame;
