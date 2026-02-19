// TemplateSelector.jsx - Enhanced with creative minimal design
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
  Gamepad2,
  Target,
  Image,
  Puzzle,
  ClipboardList,
  CheckCircle,
  ArrowRight,
  Layers
} from 'lucide-react';

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
          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
            <Layers className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Game Templates</h3>
            <p className="text-sm text-gray-500">{templates.length} templates available</p>
          </div>
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
                <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-indigo-600" />
                </div>

                {/* Content */}
                <div className="flex-grow">
                  <h4 className="font-bold text-xl text-gray-900 mb-2">{template.name}</h4>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">{template.description}</p>
                  {/* Quotas/limits for teachers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                      <Image className="w-4 h-4 text-gray-400" />
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900">Images</div>
                        <div className="text-gray-500">
                          {(() => {
                            const maxImages = Number(template?.manifest?.assets?.maxImagesPerCreation || 0);
                            return maxImages > 0 ? `${maxImages} max` : 'Unlimited';
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                      <Puzzle className="w-4 h-4 text-gray-400" />
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900">Limit</div>
                        <div className="text-gray-500">
                          {(() => {
                            const maxCreations = Number(template?.manifest?.limits?.maxCreationsPerTeacher || 0);
                            return maxCreations > 0 ? `${maxCreations}/teacher` : 'Unlimited';
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => startWithLevel(template._id)}
                  className="w-full py-3 px-4 rounded-lg font-semibold bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span>Use Template</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-xl font-medium text-gray-900 mb-2">No Templates Available</h4>
            <p className="text-gray-500 max-w-sm mx-auto">
              Contact your administrator to add game templates to the platform.
            </p>
          </div>
        )}
      </div>
      {levelModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Choose Level</h3>
              <button onClick={() => setLevelModal(null)} className="p-2 hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-600">
                <span className="text-xl">×</span>
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Pick a level (your class name) to tag the game, or choose Any.</p>
            <select
              value={levelChoice}
              onChange={e => setLevelChoice(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 mb-6 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
            >
              {levels.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setLevelModal(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={proceed}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium shadow-sm transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default TemplateSelector;

