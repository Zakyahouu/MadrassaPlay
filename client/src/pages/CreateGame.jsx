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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [settingsData, setSettingsData] = useState({});
    const [contentItems, setContentItems] = useState([{}]);

    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                const token = user.token;
                const config = {
                    headers: { Authorization: `Bearer ${token}` }
                };
                const { data } = await axios.get(`/api/templates/${templateId}`, config);
                setTemplate(data);

                const initialSettings = {};
                if (data.formSchema.settings) {
                    Object.keys(data.formSchema.settings).forEach(key => {
                        initialSettings[key] = '';
                    });
                }
                setSettingsData(initialSettings);

                const initialItem = {};
                if (data.formSchema.content && data.formSchema.content.itemSchema) {
                    Object.keys(data.formSchema.content.itemSchema).forEach(key => {
                        initialItem[key] = '';
                    });
                }
                setContentItems([initialItem]);

            } catch (err) {
                setError('Failed to load game template');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTemplate();
    }, [templateId, user.token]);

    const handleSettingsChange = (field, value) => {
        setSettingsData(prev => ({ ...prev, [field]: value }));
    };

    const handleContentChange = (index, field, value) => {
        const newItems = [...contentItems];
        newItems[index][field] = value;
        setContentItems(newItems);
    };

    const addContentItem = () => {
        const newItem = {};
        if (template.formSchema.content && template.formSchema.content.itemSchema) {
            Object.keys(template.formSchema.content.itemSchema).forEach(key => {
                newItem[key] = '';
            });
        }
        setContentItems([...contentItems, newItem]);
    };
    
    const removeContentItem = (index) => {
        const newItems = [...contentItems];
        newItems.splice(index, 1);
        setContentItems(newItems);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // --- THIS IS THE FIX ---
        // We create the final data object, ensuring the key 'config' matches
        // what the backend controller (`gameCreationController.js`) expects.
        const gameData = {
            template: templateId,
            config: settingsData, // Changed 'settings' to 'config'
            content: contentItems,
        };

        try {
            const token = user.token;
            const apiConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            };
            console.log(gameData);
            await axios.post('/api/creations', gameData, apiConfig);
            
            navigate(-1); // Go back to the previous dashboard

        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to create game';
            setError(errorMessage);
            console.error('Server Response Error:', err.response?.data || err.message);
        }
    };

    if (loading) return <div className="text-center p-8">Loading template...</div>;
    if (error) return <div className="text-red-500 text-center p-8">{error}</div>;
    if (!template) return null;

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Create Game from "{template.name}"</h1>
            
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Game Settings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(template.formSchema.settings).map(([key, field]) => (
                            <div key={key}>
                                <label htmlFor={key} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
                                <input 
                                    type={field.type}
                                    name={key}
                                    id={key}
                                    value={settingsData[key] || ''}
                                    onChange={(e) => handleSettingsChange(key, e.target.value)}
                                    required
                                    className="block w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {template.formSchema.content && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">{template.formSchema.content.label}</h2>
                        {contentItems.map((item, index) => (
                            <div key={index} className="border-b dark:border-gray-700 pb-6 mb-6 last:border-b-0 last:mb-0">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300">Item #{index + 1}</h3>
                                    {contentItems.length > 1 && (
                                        <button type="button" onClick={() => removeContentItem(index)} className="text-red-500 hover:text-red-700 font-semibold">Remove</button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {Object.entries(template.formSchema.content.itemSchema).map(([key, field]) => (
                                        <div key={key}>
                                            <label htmlFor={`${key}-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
                                            <input
                                                type={field.type}
                                                name={`${key}-${index}`}
                                                id={`${key}-${index}`}
                                                value={item[key] || ''}
                                                onChange={(e) => handleContentChange(index, key, e.target.value)}
                                                required
                                                className="block w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                         <button type="button" onClick={addContentItem} className="mt-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg">
                            + Add Item
                        </button>
                    </div>
                )}
                
                <div className="flex justify-end">
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg">
                        Save Game
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateGame;
