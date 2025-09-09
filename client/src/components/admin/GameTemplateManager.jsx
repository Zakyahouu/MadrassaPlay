import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import TemplateUploader from './TemplateUploader';
import TemplateMetaEditor from './TemplateMetaEditor';
import { TemplateContext } from '../../context/TemplateContext';
import StatusMessage from '../shared/StatusMessage';

const GameTemplateManager = () => {
  const [error, setError] = useState('');
  const { templates, setTemplates, triggerTemplateUpdate } = useContext(TemplateContext);
  const [editing, setEditing] = useState(null);

  const fetchTemplates = async () => {
    try {
      const { data } = await axios.get('/api/templates');
      setTemplates(data);
    } catch (err) {
      setError('Failed to fetch templates');
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const [pendingStatusId, setPendingStatusId] = useState(null);
  const handlePublishToggle = async (templateId, newStatus) => {
    if (!confirm(`${newStatus === 'published' ? 'Publish' : 'Unpublish'} this template?`)) return;
    setPendingStatusId(templateId);
    try {
      await axios.put(`/api/templates/${templateId}/status`, { status: newStatus });
      fetchTemplates();
      triggerTemplateUpdate();
    } catch (err) {
      setError(`Failed to ${newStatus} template`);
    } finally {
      setPendingStatusId(null);
    }
  };

  const [success, setSuccess] = useState('');
  const handleDelete = async (templateId) => {
    if (!confirm('Permanently delete this template? This will also remove its game creations, results, engine files, uploaded assets, and its badge system (including earned badges).')) return;
    try {
      await axios.delete(`/api/templates/${templateId}`);
      fetchTemplates();
      setSuccess('Template deleted successfully');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete template';
      setError(msg);
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
        <StatusMessage variant="error" message={error} onClose={() => setError('')} />
      )}
      {success && (
        <StatusMessage variant="success" message={success} onClose={() => setSuccess('')} />
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
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                      template.status === 'draft'
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    }`}
                    aria-label={`${template.status === 'draft' ? 'Publish' : 'Unpublish'} template ${template.name}`}
                    disabled={pendingStatusId === template._id}
                  >
                    {pendingStatusId === template._id ? 'Working...' : (template.status === 'draft' ? 'Publish' : 'Unpublish')}
                  </button>
                  
                  <button
                    onClick={() => setEditing(template)}
                    aria-label={`Edit template ${template.name}`}
                    className="px-3 py-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >✏️</button>
                  <button 
                    onClick={() => handleDelete(template._id)}
                    aria-label={`Delete template ${template.name}`}
                    className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                  >🗑️</button>
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
      {editing && (
        <TemplateMetaEditor
          template={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); fetchTemplates(); triggerTemplateUpdate(); }}
        />
      )}
    </div>
  );
};
export default GameTemplateManager;