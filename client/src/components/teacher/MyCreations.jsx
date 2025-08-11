// MyCreations.jsx - Enhanced with creative minimal design
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
        const { data } = await axios.get('/api/creations');
        setCreations(data);
      } catch (err) {
        setError('Failed to fetch your games');
      } finally {
        setLoading(false);
      }
    };
    fetchCreations();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full"></div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg">
      <p className="text-red-700">{error}</p>
    </div>
  );

  const actionButtons = [
    {
      to: (id) => `/teacher/host-lobby/${id}`,
      label: 'Host Live',
      icon: '🎪',
      style: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700',
      description: 'Real-time multiplayer'
    },
    {
      to: (id) => `/teacher/play-game/${id}`,
      label: 'Hot Spot',
      icon: '🔥',
      style: 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700',
      description: 'Self-paced mode'
    },
    {
      to: (id) => `/teacher/results/${id}`,
      label: 'Results',
      icon: '📊',
      style: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700',
      description: 'View analytics'
    }
  ];

  return (
    <div className="mb-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-2 h-8 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full"></div>
        <h3 className="text-2xl font-bold text-gray-800">My Games</h3>
        <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
          {creations.length}
        </span>
      </div>

      {/* Games Grid */}
      {creations.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {creations.map((creation) => (
            <div 
              key={creation._id} 
              className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-green-200 transition-all duration-300"
            >
              {/* Game Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <h4 className="font-bold text-xl text-gray-900 truncate">{creation.name}</h4>
                  </div>
                  <p className="text-sm text-gray-500">
                    Created {new Date(creation.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                  <span className="text-lg">🎮</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid gap-2">
                {actionButtons.map((button, index) => (
                  <Link key={index} to={button.to(creation._id)} className="block">
                    <button className={`w-full px-4 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-between ${button.style}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{button.icon}</span>
                        <div className="text-left">
                          <div className="font-semibold">{button.label}</div>
                          <div className="text-xs opacity-80">{button.description}</div>
                        </div>
                      </div>
                      <span className="group-hover:translate-x-1 transition-transform text-lg">→</span>
                    </button>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-green-50 rounded-2xl">
          <div className="text-6xl mb-6">🎮</div>
          <h4 className="text-xl font-semibold text-gray-700 mb-2">No Games Created Yet</h4>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            Start by choosing a template below to create your first interactive game!
          </p>
          <div className="inline-flex items-center gap-2 text-green-600 font-medium">
            <span>👇</span>
            <span>Choose a template to get started</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCreations;