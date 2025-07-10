// client/src/components/teacher/MyCreations.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const MyCreations = () => {
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCreations = async () => {
      try {
        const response = await axios.get('/api/creations');
        setCreations(response.data);
      } catch (err) {
        setError('Failed to fetch your saved games.');
      } finally {
        setLoading(false);
      }
    };

    fetchCreations();
  }, []);

  if (loading) {
    return <div className="text-center p-4">Loading your creations...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="mb-12">
      <h3 className="text-xl font-bold text-gray-800 mb-4">My Saved Games</h3>
      {creations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {creations.map((creation) => (
            <div key={creation._id} className="bg-white p-6 rounded-lg shadow hover:shadow-xl transition-shadow flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-lg text-gray-900">{creation.name}</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Created on: {new Date(creation.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="mt-4 space-y-2">
                <Link to={`/teacher/play-game/${creation._id}`}>
                  <button className="w-full px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">
                    Launch Game
                  </button>
                </Link>
                {/* NEW: Link to the View Results page */}
                <Link to={`/teacher/results/${creation._id}`}>
                  <button className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">
                    View Results
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-6 bg-white rounded-lg shadow">
          <p className="text-gray-600">You haven't created any games yet. Choose a template below to get started!</p>
        </div>
      )}
    </div>
  );
};

export default MyCreations;
