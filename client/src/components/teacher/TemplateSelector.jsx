// TemplateSelector.jsx - Enhanced with creative minimal design
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const TemplateSelector = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [levelModal, setLevelModal] = useState(null); // templateId when open
  const [levels, setLevels] = useState([]);
  const [levelChoice, setLevelChoice] = useState('Any');
  const navigate = useNavigate();
  

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data } = await axios.get('/api/templates');
        setTemplates(data);
      } catch (err) {
        setError('Failed to fetch templates');
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  useEffect(() => {
    // Preload teacher classes to build level options
    (async () => {
      try {
        const res = await axios.get('/api/classes/teacher');
        const classes = Array.isArray(res.data) ? res.data : [];
        const names = Array.from(new Set(classes.map(c => c.name).filter(Boolean)));
        setLevels(['Any', ...names]);
      } catch (_) { setLevels(['Any']); }
    })();
  }, []);

  const startWithLevel = (templateId) => {
    setLevelModal(templateId);
    setLevelChoice('Any');
  };

  const proceed = () => {
    const tmpl = levelModal;
    setLevelModal(null);
    navigate(`/teacher/create-game/${tmpl}`, { state: { levelLabel: levelChoice === 'Any' ? undefined : levelChoice } });
  };

  

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg">
      <p className="text-red-700 font-medium">{error}</p>
    </div>
  );

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
        <h3 className="text-2xl font-bold text-gray-800">Game Templates</h3>
        <span className="bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full">
          {templates.length}
        </span>
      </div>

      {/* Templates Grid */}
      {templates.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <div 
              key={template._id} 
              className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 flex flex-col"
            >
              {/* Template Icon */}
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🎯</span>
              </div>

              {/* Content */}
              <div className="flex-grow">
                <h4 className="font-bold text-xl text-gray-900 mb-2">{template.name}</h4>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">{template.description}</p>
                {/* Quotas/limits for teachers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <span className="text-base">🖼️</span>
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900">Images per game</div>
                      <div className="text-gray-600">
                        {(() => {
                          const maxImages = Number(template?.manifest?.assets?.maxImagesPerCreation || 0);
                          return maxImages > 0 ? `${maxImages} max` : 'Unlimited';
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <span className="text-base">🧩</span>
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900">Creations you can make</div>
                      <div className="text-gray-600">
                        {(() => {
                          const maxCreations = Number(template?.manifest?.limits?.maxCreationsPerTeacher || 0);
                          return maxCreations > 0 ? `${maxCreations} per teacher` : 'Unlimited';
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button onClick={() => startWithLevel(template._id)} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2">
                <span>Use Template</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-indigo-50 rounded-2xl">
          <div className="text-6xl mb-6">📋</div>
          <h4 className="text-xl font-semibold text-gray-700 mb-2">No Templates Available</h4>
          <p className="text-gray-500 max-w-md mx-auto">
            Contact your administrator to add game templates to the platform.
          </p>
        </div>
      )}
  </div>
  {levelModal && (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Choose Level</h3>
          <button onClick={() => setLevelModal(null)} className="text-gray-500 hover:text-gray-800">✕</button>
        </div>
        <p className="text-sm text-gray-600 mb-3">Pick a level (your class name) to tag the game, or choose Any.</p>
        <select value={levelChoice} onChange={e=>setLevelChoice(e.target.value)} className="w-full border rounded px-3 py-2 mb-4">
          {levels.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <div className="flex justify-end gap-2">
          <button onClick={() => setLevelModal(null)} className="px-4 py-2 rounded border">Cancel</button>
          <button onClick={proceed} className="px-4 py-2 rounded bg-indigo-600 text-white">Continue</button>
        </div>
      </div>
    </div>
  )}
    
  </>
  );
};

export default TemplateSelector;

