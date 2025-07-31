import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { TemplateContext } from '../../context/TemplateContext';

const AdminTestGames = () => {
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { lastUpdate } = useContext(TemplateContext);

  useEffect(() => {
    const fetchCreations = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('user')).token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get('/api/creations', config);
        console.log('Fetched creations:', response.data); // Debug log
        setCreations(response.data);
      } catch (err) {
        setError('Failed to fetch your test games.');
        console.error('Error fetching creations:', err); // Debug log
      } finally {
        setLoading(false);
      }
    };
    fetchCreations();
  }, [lastUpdate]); // Re-fetch when templates are updated

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this test game?')) return;
    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`/api/creations/${id}`, config);
      setCreations(creations.filter((c) => c._id !== id));
    } catch (err) {
      setError('Failed to delete the test game.');
    }
  };

  if (loading) return <div className="text-center p-4">Loading your test games...</div>;
  if (error) return <div className="text-center p-4 text-red-500">{error}</div>;

  return (
    <div className="mb-12">
      <h3 className="text-xl font-bold text-gray-800 mb-4">My Test Games</h3>
      {creations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {creations.map((creation) => {
            const isTemplatePublished = creation.template?.status === 'published';
            console.log('Template status:', creation.template?.status); // Debug log
            return (
              <div key={creation._id} className="bg-white p-6 rounded-lg shadow hover:shadow-xl transition-shadow flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-lg text-gray-900">{creation.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Template: {creation.template?.name || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Created on: {new Date(creation.createdAt).toLocaleDateString()}
                  </p> 
                  <p className="text-sm text-gray-500 mt-1">
                    Template Status: {creation.template?.status || 'Unknown'}
                  </p>
                  {!isTemplatePublished && (
                    <div className="mt-2 text-yellow-700 text-xs font-semibold">Template is unpublished. This game is locked for teachers.</div>
                  )}
                </div>
                <div className="mt-4 space-y-2">
                  <Link to={`/teacher/play-game/${creation._id}`}>
                    <button className={`w-full px-4 py-2 font-semibold text-white rounded-md bg-indigo-600 hover:bg-indigo-700'`}>
                      Play/Test
                    </button>
                  </Link>
                  <button
                    className="w-full px-4 py-2 font-semibold text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                    onClick={() => handleDelete(creation._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center p-6 bg-white rounded-lg shadow">
          <p className="text-gray-600">You haven't created any test games yet. Use a template to create and test a game!</p>
        </div>
      )}
    </div>
  );
};

export default AdminTestGames;