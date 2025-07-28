// client/src/pages/CreateGame.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const CreateGame = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [template, setTemplate] = useState(null);
  const [gameData, setGameData] = useState({ settings: {}, content: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('user')).token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const { data } = await axios.get(`/api/templates/${templateId}`, config);
        setTemplate(data);

        const initialSettings = {};
        if (data.formSchema && data.formSchema.settings) {
          Object.entries(data.formSchema.settings).forEach(([key, schema]) => {
            initialSettings[key] = '';
          });
        }
        setGameData({ settings: initialSettings, content: [] });
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load game template.');
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [templateId]);

  const handleSettingsChange = (key, value) => {
    setGameData(prev => ({ ...prev, settings: { ...prev.settings, [key]: value } }));
  };
  
  const handleContentChange = (index, key, value) => {
    setGameData(prev => {
      const newContent = [...prev.content];
      // Ensure the object exists before trying to assign a property
      if (!newContent[index]) newContent[index] = {};
      newContent[index][key] = value;
      return { ...prev, content: newContent };
    });
  };
  
  const addContentItem = () => {
    setGameData(prev => {
        const newItem = {};
        if (template?.formSchema?.content?.itemSchema) {
            Object.keys(template.formSchema.content.itemSchema).forEach(key => {
                newItem[key] = '';
            });
        }
        return { ...prev, content: [...prev.content, newItem] };
    });
  };

  const removeContentItem = (index) => {
    setGameData(prev => ({ ...prev, content: prev.content.filter((_, i) => i !== index) }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      template: templateId,
      settings: gameData.settings,
      content: gameData.content,
    };

    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post('/api/creations', payload, config);
      
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/teacher/dashboard');
      }
    } catch (err) {
      // --- THIS IS THE FIX ---
      // We now log the specific error message from the server to the console.
      const serverError = err.response?.data?.message || 'Failed to save game. Please ensure all required fields are filled.';
      setError(serverError);
      console.error("Server Response Error:", err.response?.data);
    }
  };

  if (loading) return <div className="text-center p-8">Loading Template...</div>;
  if (error && !template) return <div className="text-center p-8 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-gray-100">Create New Game</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">Based on: <span className="font-semibold">{template?.name}</span></p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Settings Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Game Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {template && template.formSchema.settings && Object.entries(template.formSchema.settings).map(([key, schema]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{schema.label}</label>
                <input
                  type={schema.type}
                  value={gameData.settings[key] || ''}
                  onChange={(e) => handleSettingsChange(key, e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
            ))}
          </div>
        </div>

        {/* Content Section */}
        {template?.formSchema?.content && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{template.formSchema.content.label}</h2>
                    <button type="button" onClick={addContentItem} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">
                        Add Item
                    </button>
                </div>
                <div className="space-y-6">
                    {gameData.content.map((item, index) => (
                        <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 relative">
                            <h3 className="font-semibold mb-2">Item #{index + 1}</h3>
                            {Object.entries(template.formSchema.content.itemSchema).map(([key, schema]) => (
                                <div key={key} className="mb-2">
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">{schema.label}</label>
                                    <input
                                        type={schema.type}
                                        value={item[key] || ''}
                                        onChange={(e) => handleContentChange(index, key, e.target.value)}
                                        className="mt-1 w-full p-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                                        required
                                    />
                                </div>
                            ))}
                            <button type="button" onClick={() => removeContentItem(index)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                                &times;
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {error && <div className="text-red-500 text-center font-semibold">{error}</div>}
        
        <div className="flex justify-end">
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg text-lg">
                Save Game
            </button>
        </div>
      </form>
    </div>
  );
};

export default CreateGame;
