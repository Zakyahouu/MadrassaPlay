// client/src/components/admin/GameTemplateManager.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TemplateUploader from './TemplateUploader'; // 1. Import the new uploader component

const GameTemplateManager = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await axios.get('/api/templates');
        setTemplates(response.data);
      } catch (err) {
        setError('Failed to fetch game templates.');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  // 2. Create a handler function to update the list when an upload is successful
  const handleUploadSuccess = (newTemplate) => {
    // Add the newly uploaded template to the top of the list
    setTemplates(prevTemplates => [newTemplate, ...prevTemplates]);
  };

  if (loading) {
    return <div>Loading templates...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow mt-8">
      <h3 className="text-xl font-bold mb-4">Game Templates</h3>
      
      <div className="space-y-4 mb-6">
        {templates.length > 0 ? (
          templates.map((template) => (
            <div key={template._id} className="p-4 border rounded-md bg-gray-50">
              <h4 className="font-semibold text-lg">{template.name}</h4>
              <p className="text-gray-600">{template.description}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No game templates have been created yet.</p>
        )}
      </div>

      {/* 3. Render the TemplateUploader component and pass the handler function as a prop */}
      <TemplateUploader onUploadSuccess={handleUploadSuccess} />
    </div>
  );
};

export default GameTemplateManager;
