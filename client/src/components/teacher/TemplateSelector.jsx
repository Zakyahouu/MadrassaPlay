// client/src/components/teacher/TemplateSelector.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // 1. Import the Link component

const TemplateSelector = () => {
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

  if (loading) {
    return <div className="text-center p-4">Loading templates...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Choose a Game Template</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.length > 0 ? (
          templates.map((template) => (
            <div key={template._id} className="bg-white p-6 rounded-lg shadow hover:shadow-xl transition-shadow flex flex-col">
              <h4 className="font-bold text-lg text-indigo-700">{template.name}</h4>
              <p className="text-gray-600 mt-2 mb-4 flex-grow">{template.description}</p>
              
              {/* 2. Wrap the button in a Link component */}
              {/* The 'to' prop constructs the URL for the Create Game page,
                  including the specific template's ID. */}
              <Link to={`/teacher/create-game/${template._id}`}>
                <button className="w-full px-4 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                  Use this Template
                </button>
              </Link>
            </div>
          ))
        ) : (
          <p className="text-gray-500 col-span-full text-center">No game templates are available. Please contact an administrator.</p>
        )}
      </div>
    </div>
  );
};

export default TemplateSelector;
