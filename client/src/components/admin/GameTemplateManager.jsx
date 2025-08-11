import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import TemplateUploader from './TemplateUploader';
import { TemplateContext } from '../../context/TemplateContext';

const GameTemplateManager = () => {
  const [error, setError] = useState('');
  const { templates, setTemplates, triggerTemplateUpdate } = useContext(TemplateContext);

  const fetchTemplates = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      const { data } = await axios.get('/api/templates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(data);
    } catch (err) {
      setError('Failed to fetch templates');
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handlePublishToggle = async (templateId, newStatus) => {
    if (!confirm(`${newStatus === 'published' ? 'Publish' : 'Unpublish'} this template?`)) return;
    
    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      await axios.put(`/api/templates/${templateId}/status`, 
        { status: newStatus }, 
        { headers: { Authorization: `Bearer ${token}` }}
      );
      fetchTemplates();
      triggerTemplateUpdate();
    } catch (err) {
      setError(`Failed to ${newStatus} template`);
    }
  };

  const handleDelete = async (templateId) => {
    if (!confirm('Permanently delete this template?')) return;
    
    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      await axios.delete(`/api/templates/${templateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTemplates();
    } catch (err) {
      setError('Failed to delete template');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-2 h-8 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
        <h3 className="text-2xl font-bold text-gray-800">Game Templates</h3>
        <span className="bg-emerald-100 text-emerald-800 text-sm font-medium px-3 py-1 rounded-full">
          {templates.length}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      <div className="space-y-3 mb-8">
        {templates.length > 0 ? (
          templates.map((template) => (
            <div key={template._id} className="group p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-bold text-lg text-gray-800">{template.name}</h4>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      template.status === 'published' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {template.status === 'published' ? '✓ Published' : '⏳ Draft'}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{template.description}</p>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Link 
                    to={`/teacher/create-game/${template._id}`}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Test
                  </Link>
                  
                  <button 
                    onClick={() => handlePublishToggle(template._id, template.status === 'draft' ? 'published' : 'draft')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      template.status === 'draft'
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    }`}
                  >
                    {template.status === 'draft' ? 'Publish' : 'Unpublish'}
                  </button>
                  
                  <button 
                    onClick={() => handleDelete(template._id)}
                    className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-emerald-50 rounded-xl">
            <div className="text-6xl mb-4">🎯</div>
            <p className="text-gray-600 mb-2">No game templates</p>
            <p className="text-sm text-gray-500">Upload templates to get started!</p>
          </div>
        )}
      </div>
      
      <div className="border-t border-gray-200 pt-6">
        <TemplateUploader onUploadSuccess={fetchTemplates} />
      </div>
    </div>
  );
};
export default GameTemplateManager;