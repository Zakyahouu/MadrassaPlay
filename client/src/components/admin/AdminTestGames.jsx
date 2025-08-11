// AdminTestGames.jsx - Enhanced with creative minimal design
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { TemplateContext } from '../../context/TemplateContext';
import { Joystick,Trash } from 'lucide-react';
const AdminTestGames = () => {
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { lastUpdate } = useContext(TemplateContext);

  useEffect(() => {
    const fetchCreations = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('user')).token;
        const response = await axios.get('/api/creations', { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setCreations(response.data);
      } catch (err) {
        setError('Failed to fetch test games');
      } finally {
        setLoading(false);
      }
    };
    fetchCreations();
  }, [lastUpdate]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this test game?')) return;
    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      await axios.delete(`/api/creations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCreations(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      setError('Failed to delete game');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
      <p className="text-red-700">{error}</p>
    </div>
  );

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
        <h3 className="text-2xl font-bold text-gray-800">Test Games</h3>
        <span className="bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full">
          {creations.length}
        </span>
      </div>

      {creations.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {creations.map((creation) => {
            const isPublished = creation.template?.status === 'published';
            return (
              <div key={creation._id} className="group relative bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-indigo-200 transition-all duration-200">
                <div className="absolute top-4 right-4">
                  <div className={`w-3 h-3 rounded-full ${isPublished ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                </div>
                
                <h4 className="font-bold text-lg text-gray-900 mb-2 pr-6">{creation.name}</h4>
                <div className="space-y-1 text-sm text-gray-500 mb-4">
                  <p>Template: <span className="text-gray-700">{creation.template?.name || 'Unknown'}</span></p>
                  <p>{new Date(creation.createdAt).toLocaleDateString()}</p>
                </div>

                {!isPublished && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-4">
                    <p className="text-amber-700 text-xs">⚠️ Template unpublished</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Link to={`/admin/play-game/${creation._id}`} className="flex-1">
                    <button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 transition-colors">
                      Play
                    </button>
                  </Link>
                  <button
                    onClick={() => handleDelete(creation._id)}
                    className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-indigo-50 rounded-2xl">
          <div className="text-6xl mb-4"><Joystick /></div>
          <p className="text-gray-600 mb-4">No test games yet</p>
          <p className="text-sm text-gray-500">Create games from templates to start testing!</p>
        </div>
      )}
    </div>
  );
};
export default AdminTestGames