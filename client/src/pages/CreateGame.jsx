// client/src/pages/CreateGame.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const CreateGame = () => {
  const { templateId } = useParams();
  const navigate = useNavigate(); // Hook for programmatic navigation
  const [template, setTemplate] = useState(null);
  const [gameData, setGameData] = useState({ settings: {}, content: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await axios.get(`/api/templates/${templateId}`);
        setTemplate(response.data);
        const initialSettings = {};
        if (response.data.formSchema.settings) {
          for (const key in response.data.formSchema.settings) {
            initialSettings[key] = '';
          }
        }
        setGameData({ settings: initialSettings, content: [] });
      } catch (err) {
        setError('Failed to load game template.');
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [templateId]);

  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setGameData(prevData => ({
      ...prevData,
      settings: {
        ...prevData.settings,
        [name]: value,
      },
    }));
  };

  const handleContentChange = (index, field, value) => {
    const newContent = [...gameData.content];
    newContent[index][field] = value;
    setGameData(prevData => ({ ...prevData, content: newContent }));
  };

  const handleAddItem = () => {
    const newItem = { id: Date.now() };
    const itemSchema = template.formSchema.content.itemSchema;
    for (const key in itemSchema) {
      newItem[key] = '';
    }
    setGameData(prevData => ({
      ...prevData,
      content: [...prevData.content, newItem],
    }));
  };

  const handleDeleteItem = (index) => {
    const newContent = gameData.content.filter((_, i) => i !== index);
    setGameData(prevData => ({ ...prevData, content: newContent }));
  };

  // --- NEW: Handle Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Basic validation: ensure the game has a title
    const gameTitle = gameData.settings.title || gameData.settings.Title;
    if (!gameTitle || !gameTitle.trim()) {
        setError('Please provide a title for your game.');
        return;
    }

    try {
      // Construct the payload to send to the backend
      const payload = {
        template: templateId,
        name: gameTitle, // Use the title from settings as the game name
        config: gameData,
      };
      
      await axios.post('/api/creations', payload);
      
      // If successful, navigate back to the teacher's dashboard
      navigate('/teacher/dashboard');

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save game.');
    }
  };

  const renderField = (key, schema, value, onChange) => {
    switch (schema.type) {
      case 'text':
      case 'number':
        return (
          <div key={key}>
            <label className="block font-semibold text-gray-700">{schema.label}</label>
            <input
              type={schema.type}
              name={key}
              value={value}
              onChange={onChange}
              className="mt-1 w-full p-2 border rounded-md"
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) return <div className="text-center p-8">Loading Game Creator...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <Link to="/teacher/dashboard" className="text-indigo-600 hover:underline">
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold mt-2">Create: {template.name}</h1>
        <p className="text-gray-600">{template.description}</p>
      </header>

      <form className="space-y-8" onSubmit={handleSubmit}>
        {error && <p className="text-red-500 text-center p-2 bg-red-100 rounded-md">{error}</p>}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Game Settings</h2>
          <div className="space-y-4">
            {template.formSchema.settings && Object.entries(template.formSchema.settings).map(([key, schema]) =>
              renderField(key, schema, gameData.settings[key], handleSettingsChange)
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{template.formSchema.content?.label || 'Game Content'}</h2>
            <button
              type="button"
              onClick={handleAddItem}
              className="px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              + Add Item
            </button>
          </div>
          <div className="space-y-6">
            {gameData.content.map((item, index) => (
              <div key={item.id} className="p-4 border rounded-md relative bg-gray-50">
                <button
                  type="button"
                  onClick={() => handleDeleteItem(index)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 font-bold text-xl"
                >
                  &times;
                </button>
                <div className="space-y-4">
                  {Object.entries(template.formSchema.content.itemSchema).map(([key, schema]) =>
                    renderField(key, schema, item[key], (e) => handleContentChange(index, key, e.target.value))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 font-bold text-white bg-green-600 rounded-md hover:bg-green-700"
          >
            Save Game
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateGame;
