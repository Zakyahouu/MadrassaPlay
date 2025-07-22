// client/src/components/admin/GameTemplateManager.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TemplateUploader from './TemplateUploader';

const GameTemplateManager = () => {
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await axios.get('/api/templates');
        setTemplates(response.data);
        setFilteredTemplates(response.data);
      } catch (err) {
        setError('Failed to fetch game templates.');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleUploadSuccess = (newTemplate) => {
    const updatedTemplates = [newTemplate, ...templates];
    setTemplates(updatedTemplates);
    setFilteredTemplates(updatedTemplates);
    alert('Template uploaded successfully.');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      setDeletingId(id);
      await axios.delete(`/api/templates/${id}`);
      const updatedTemplates = templates.filter(template => template._id !== id);
      setTemplates(updatedTemplates);
      setFilteredTemplates(updatedTemplates);
      alert('Template deleted.');
    } catch (err) {
      alert('Failed to delete template.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setFilteredTemplates(templates.filter(template =>
      template.name.toLowerCase().includes(query)
    ));
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-600">
        <span className="animate-spin inline-block w-6 h-6 border-4 border-gray-300 border-t-blue-500 rounded-full"></span>
        <p>Loading templates...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow mt-8">
      <h3 className="text-2xl font-bold mb-6">Game Templates</h3>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search templates..."
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      <div className="space-y-4 mb-6">
        {filteredTemplates.length > 0 ? (
          filteredTemplates.map((template) => (
            <div key={template._id} className="p-4 border rounded-md bg-gray-50 flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-lg">{template.name}</h4>
                <p className="text-gray-600">{template.description}</p>
              </div>
              <button
                onClick={() => handleDelete(template._id)}
                className="text-red-500 hover:text-red-700 text-sm ml-4"
                disabled={deletingId === template._id}
              >
                {deletingId === template._id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          ))
        ) : (
          <div className="text-gray-500 text-center py-8">
            <p className="text-xl">🗂️ No matching templates found.</p>
            <p className="text-sm mt-1">Try uploading a new one or adjusting your search.</p>
          </div>
        )}
      </div>

      <hr className="my-6" />

      <TemplateUploader onUploadSuccess={handleUploadSuccess} />
    </div>
  );
};

export default GameTemplateManager;
