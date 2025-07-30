// client/src/components/admin/GameTemplateManager.jsx
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
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get('/api/templates', config);
      setTemplates(data);
    } catch (err) {
      setError('Failed to fetch templates');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handlePublishToggle = async (templateId, newStatus) => {
    if (!window.confirm(`Are you sure you want to ${newStatus === 'published' ? 'publish' : 'unpublish'} this template?`)) {
      return;
    }
    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`/api/templates/${templateId}/status`, { status: newStatus }, config);
      fetchTemplates();
      triggerTemplateUpdate(); // Trigger update for other components
    } catch (err) {
      setError(`Failed to ${newStatus} template`);
      console.error(err);
    }
  };

  // New function to handle deleting a template
  const handleDelete = async (templateId) => {
    if (!window.confirm('Are you sure you want to permanently delete this template? This action cannot be undone.')) {
      return;
    }
    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`/api/templates/${templateId}`, config);
      fetchTemplates(); // Re-fetch to update the list
    } catch (err) {
      setError('Failed to delete template');
      console.error(err);
    }
  };


  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Game Templates</h3>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
      
      <div className="space-y-4">
        {templates.length > 0 ? (
          templates.map((template) => (
            <div key={template._id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200">{template.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{template.description}</p>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    template.status === 'published' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                }`}>
                  {template.status}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Link to={`/teacher/create-game/${template._id}`} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg text-sm">
                  Test
                </Link>
                {template.status === 'draft' ? (
                  <button onClick={() => handlePublishToggle(template._id, 'published')} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg text-sm">
                    Publish
                  </button>
                ) : (
                  <button onClick={() => handlePublishToggle(template._id, 'draft')} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg text-sm">
                    Unpublish
                  </button>
                )}
                 <button onClick={() => handleDelete(template._id)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm">
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No game templates found.</p>
        )}
      </div>
      
      <div className="mt-8 border-t pt-6">
        <TemplateUploader onUploadSuccess={fetchTemplates} />
      </div>
    </div>
  );
};

export default GameTemplateManager;
