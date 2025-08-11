// TemplateSelector.jsx - Enhanced with creative minimal design
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const TemplateSelector = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
              </div>

              {/* Action Button */}
              <Link to={`/teacher/create-game/${template._id}`} className="block">
                <button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2">
                  <span>Use Template</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </Link>
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
  );
};

export default TemplateSelector;

