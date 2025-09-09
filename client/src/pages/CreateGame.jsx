// CreateGame.jsx - Enhanced with creative minimal design
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const CreateGame = () => {
    const { templateId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useContext(AuthContext);

    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    
    const [settingsData, setSettingsData] = useState({});
    const [contentItems, setContentItems] = useState([{}]);
    const [autoMode, setAutoMode] = useState(false);
    

    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                const { data } = await axios.get(`/api/templates/${templateId}`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setTemplate(data);

                // Initialize settings with defaults
                const initialSettings = {};
                if (data.formSchema.settings) {
                    Object.entries(data.formSchema.settings).forEach(([key, schema]) => {
                        if (schema.default !== undefined) {
                            initialSettings[key] = schema.default;
                        } else {
                            initialSettings[key] = schema.type === 'boolean' ? false : '';
                        }
                    });
                }
                setSettingsData(initialSettings);
                if (initialSettings.autoGenerate !== undefined) setAutoMode(!!initialSettings.autoGenerate);

                // Initialize content items
                const initialItem = {};
                if (data.formSchema.content?.itemSchema) {
                    Object.keys(data.formSchema.content.itemSchema).forEach(key => {
                        initialItem[key] = '';
                    });
                }
                setContentItems([initialItem]);

            } catch (err) {
                setError('Failed to load template');
            } finally {
                setLoading(false);
            }
        };
        fetchTemplate();
    }, [templateId, user.token]);

    

    const handleSettingsChange = (field, value) => {
        setSettingsData(prev => ({ ...prev, [field]: value }));
        if (field === 'autoGenerate') {
            setAutoMode(!!value);
        }
    };

    const handleContentChange = (index, field, value) => {
        setContentItems(prev => {
            const newItems = [...prev];
            newItems[index][field] = value;
            return newItems;
        });
    };

    const addContentItem = () => {
        const newItem = {};
        if (template.formSchema.content?.itemSchema) {
            Object.keys(template.formSchema.content.itemSchema).forEach(key => {
                newItem[key] = '';
            });
        }
        setContentItems(prev => [...prev, newItem]);
    };
    
    const removeContentItem = (index) => {
        setContentItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        // Filter empty content items if manual mode
        let filteredContent = contentItems;
        if (!autoMode) {
            filteredContent = contentItems.filter(item => Object.values(item).some(v => v !== '' && v !== undefined));
        } else {
            // In auto mode, we can send empty array
            filteredContent = [];
        }

        const gameData = {
            template: templateId,
            config: { ...settingsData, autoGenerate: autoMode },
            content: filteredContent,
            levelLabel: location.state?.levelLabel,
        };

        try {
            await axios.post('/api/creations', gameData, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`,
                },
            });
            navigate(-1);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create game');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading template...</p>
            </div>
        </div>
    );

    if (error && !template) return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 flex items-center justify-center">
            <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
                <div className="text-6xl mb-4">⚠️</div>
                <p className="text-red-600 font-medium">{error}</p>
                <button 
                    onClick={() => navigate(-1)}
                    className="mt-4 px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                >
                    Go Back
                </button>
            </div>
        </div>
    );

    if (!template) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => navigate(-1)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                ← Back
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Create Game</h1>
                                <p className="text-sm text-gray-500">Using template: {template.name}</p>
                            </div>
                        </div>
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                            <span className="text-lg">🎯</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg">
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Game Settings Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white text-sm">⚙️</span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">Game Settings</h2>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                {Object.entries(template.formSchema.settings).map(([key, field]) => {
                                    const hasAuto = Object.prototype.hasOwnProperty.call(template.formSchema.settings, 'autoGenerate');
                                    if (key === 'questionCount' && !autoMode) return null;
                                    if (key === 'autoGenerate') {
                                        return (
                                            <div key={key} className="flex items-center gap-3">
                                                <input
                                                    id="auto-generate-toggle"
                                                    type="checkbox"
                                                    checked={autoMode}
                                                    onChange={(e) => handleSettingsChange(key, e.target.checked)}
                                                    className="h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                                />
                                                <label htmlFor="auto-generate-toggle" className="text-sm font-medium text-gray-700">
                                                    {field.label}
                                                </label>
                                            </div>
                                        );
                                    }
                                    // Select/Enum: choose UI based on multiplicity
                                    if (field.type === 'enum' || field.type === 'select') {
                                        const isMultiple = Array.isArray(field.default) || field.multiple === true;
                                        const currentVal = settingsData[key] ?? (isMultiple ? [] : '');
                                        if (isMultiple) {
                                            return (
                                                <div key={key} className="group">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {field.options.map(opt => {
                                                            const active = (currentVal || []).includes(opt);
                                                            return (
                                                                <button
                                                                    type="button"
                                                                    key={opt}
                                                                    onClick={() => {
                                                                        let next = Array.isArray(currentVal) ? [...currentVal] : [];
                                                                        if (active) next = next.filter(o => o !== opt); else next.push(opt);
                                                                        handleSettingsChange(key, next);
                                                                    }}
                                                                    className={`px-3 py-1 rounded-full text-sm border transition ${active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-300'}`}
                                                                >
                                                                    {opt}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return (
                                            <div key={key} className="group">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
                                                <select
                                                    value={currentVal}
                                                    onChange={(e) => handleSettingsChange(key, e.target.value)}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-indigo-400 focus:bg-white focus:outline-none transition-all duration-200"
                                                >
                                                    <option value="" disabled>Choose...</option>
                                                    {field.options.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        );
                                    }
                                    // Boolean as checkbox (general case)
                                    if (field.type === 'boolean') {
                                        return (
                                            <div key={key} className="flex items-center gap-3">
                                                <input
                                                    id={`settings-${key}`}
                                                    type="checkbox"
                                                    checked={!!settingsData[key]}
                                                    onChange={(e) => handleSettingsChange(key, e.target.checked)}
                                                    className="h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                                />
                                                <label htmlFor={`settings-${key}`} className="text-sm font-medium text-gray-700">
                                                    {field.label}
                                                </label>
                                            </div>
                                        );
                                    }
                                    // Numbers with min/max
                                    return (
                                        <div key={key} className="group">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                {field.label}
                                            </label>
                                            <input
                                                type={field.type === 'number' ? 'number' : 'text'}
                                                value={settingsData[key] ?? ''}
                                                onChange={(e) => handleSettingsChange(key, e.target.value)}
                                                required={field.required}
                                                min={field.min !== undefined ? field.min : undefined}
                                                max={field.max !== undefined ? field.max : undefined}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-indigo-400 focus:bg-white focus:outline-none transition-all duration-200"
                                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                            {Object.prototype.hasOwnProperty.call(template.formSchema.settings, 'autoGenerate') && (
                                <div className="mt-4 text-xs text-gray-500 space-y-1">
                                    <p><strong>Auto Mode:</strong> System generates math questions based on operations, max operand and question count.</p>
                                    <p><strong>Manual Mode:</strong> Uncheck Auto Generate to enter your own questions below.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content Section */}
                    {template.formSchema.content && (!Object.prototype.hasOwnProperty.call(template.formSchema.settings, 'autoGenerate') || !autoMode) && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                            <span className="text-white text-sm">📝</span>
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-800">{template.formSchema.content.label}</h2>
                                        <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                                            {contentItems.length} items
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-6 space-y-6">
                                {contentItems.map((item, index) => (
                                    <div key={index} className="relative">
                                        {/* Item Header */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                                                    <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                                                </div>
                                                <h3 className="font-semibold text-gray-700">Content Item {index + 1}</h3>
                                            </div>
                                            {contentItems.length > 1 && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeContentItem(index)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>

                                        {/* Item Fields */}
                                        <div className="grid gap-4 md:grid-cols-2 p-4 bg-gray-50 rounded-xl">
                        {Object.entries(template.formSchema.content.itemSchema).map(([key, field]) => (
                                                <div key={key}>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        {field.label}
                                                    </label>
                            {(field.type === 'enum' || field.type === 'select') && Array.isArray(field.options) ? (
                                                        <select
                                                            value={item[key] || ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                const updated = { ...item, [key]: value };
                                                                if (['operandA','operandB','operation'].includes(key)) {
                                                                    const a = parseFloat(updated.operandA);
                                                                    const b = parseFloat(updated.operandB);
                                                                    const op = updated.operation;
                                                                    if (!isNaN(a) && !isNaN(b) && ['+','-','*','/'].includes(op)) {
                                                                        let ans = '';
                                                                        switch(op){
                                                                            case '+': ans = a + b; break;
                                                                            case '-': ans = a - b; break;
                                                                            case '*': ans = a * b; break;
                                                                            case '/': ans = b !== 0 ? parseFloat((a / b).toFixed(2)) : ''; break;
                                                                        }
                                                                        updated.correctAnswer = ans;
                                                                    }
                                                                }
                                                                handleContentChange(index, key, value);
                                                                if (updated.correctAnswer !== item.correctAnswer) {
                                                                    handleContentChange(index, 'correctAnswer', updated.correctAnswer);
                                                                }
                                                            }}
                                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-indigo-400 focus:outline-none transition-colors"
                                                        >
                                                            <option value="" disabled>Choose...</option>
                                                            {field.options.map(opt => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    ) : field.type === 'image' ? (
                                                        <div className="space-y-2">
                                                            {item[key] && (
                                                                <img src={item[key]} alt="preview" className="w-24 h-24 object-cover rounded" />
                                                            )}
                                                            <input
                                                                type="file"
                                                                accept={(field.accept || ['image/webp','image/png','image/jpeg']).join(',')}
                                                                onChange={async (e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (!file) return;
                                                                    if (file.size > (10 * 1024 * 1024)) {
                                                                        return setError('Image exceeds 10MB limit.');
                                                                    }
                                                                    try {
                                                                        const fd = new FormData();
                                                                        fd.append('file', file);
                                                                        fd.append('usage', 'content');
                                                                        fd.append('creationId', 'draft');
                                                                        const { data } = await axios.post(`/api/templates/${templateId}/media`, fd, {
                                                                            headers: { Authorization: `Bearer ${user.token}` }
                                                                        });
                                                                        handleContentChange(index, key, data.url);
                                                                    } catch (err) {
                                                                        setError(err.response?.data?.message || 'Upload failed');
                                                                    }
                                                                }}
                                                                className="block"
                                                            />
                                                        </div>
                                                    ) : field.type === 'imageArray' ? (
                                                        <div className="space-y-2">
                                                            <div className="flex gap-2 flex-wrap">
                                                                {(Array.isArray(item[key]) ? item[key] : []).map((url, i2) => (
                                                                    <div key={i2} className="relative">
                                                                        <img src={url} alt="preview" className="w-20 h-20 object-cover rounded" />
                                                                        <button type="button" className="absolute -top-2 -right-2 bg-white text-red-600 rounded-full shadow p-1" onClick={() => {
                                                                            const arr = Array.isArray(item[key]) ? [...item[key]] : [];
                                                                            arr.splice(i2,1);
                                                                            handleContentChange(index, key, arr);
                                                                        }}>×</button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <input
                                                                type="file"
                                                                multiple
                                                                accept={(field.accept || ['image/webp','image/png','image/jpeg']).join(',')}
                                                                onChange={async (e) => {
                                                                    const files = Array.from(e.target.files || []);
                                                                    if (!files.length) return;
                                                                    const existing = Array.isArray(item[key]) ? item[key] : [];
                                                                    try {
                                                                        const uploads = [];
                                                                        for (const f of files) {
                                                                            if (f.size > (10 * 1024 * 1024)) throw new Error('One of images exceeds 10MB limit.');
                                                                            const fd = new FormData();
                                                                            fd.append('file', f);
                                                                            fd.append('usage', 'content');
                                                                            fd.append('creationId', 'draft');
                                                                            const { data } = await axios.post(`/api/templates/${templateId}/media`, fd, {
                                                                                headers: { Authorization: `Bearer ${user.token}` }
                                                                            });
                                                                            uploads.push(data.url);
                                                                        }
                                                                        handleContentChange(index, key, existing.concat(uploads));
                                                                    } catch (err) {
                                                                        setError(err.message || err.response?.data?.message || 'Upload failed');
                                                                    }
                                                                }}
                                                                className="block"
                                                            />
                                                        </div>
                                                    ) : field.type === 'boolean' ? (
                                                        <input
                                                            type="checkbox"
                                                            checked={!!item[key]}
                                                            onChange={(e) => handleContentChange(index, key, e.target.checked)}
                                                            className="h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                                        />
                                                    ) : (
                                                        <input
                                                            type={field.type === 'number' ? 'number' : 'text'}
                                                            value={item[key] || ''}
                                                            onChange={(e) => {
                                                                let value = e.target.value;
                                                                const updated = { ...item, [key]: value };
                                                                if (['operandA','operandB','operation'].includes(key)) {
                                                                    const a = parseFloat(updated.operandA);
                                                                    const b = parseFloat(updated.operandB);
                                                                    const op = updated.operation;
                                                                    if (!isNaN(a) && !isNaN(b) && ['+','-','*','/'].includes(op)) {
                                                                        let ans = '';
                                                                        switch(op){
                                                                            case '+': ans = a + b; break;
                                                                            case '-': ans = a - b; break;
                                                                            case '*': ans = a * b; break;
                                                                            case '/': ans = b !== 0 ? parseFloat((a / b).toFixed(2)) : ''; break;
                                                                        }
                                                                        updated.correctAnswer = ans;
                                                                    }
                                                                }
                                                                handleContentChange(index, key, value);
                                                                if (updated.correctAnswer !== item.correctAnswer) {
                                                                    handleContentChange(index, 'correctAnswer', updated.correctAnswer);
                                                                }
                                                            }}
                                                            min={field.min !== undefined ? field.min : undefined}
                                                            max={field.max !== undefined ? field.max : undefined}
                                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-indigo-400 focus:outline-none transition-colors"
                                                            placeholder={`Enter ${field.label.toLowerCase()}`}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                
                                {/* Add Item Button */}
                                <button 
                                    type="button" 
                                    onClick={addContentItem}
                                    className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all duration-200 flex items-center justify-center gap-2 text-gray-600 hover:text-green-600"
                                >
                                    <span className="text-xl">+</span>
                                    <span className="font-medium">Add Content Item</span>
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {/* Submit Section */}
                    <div className="flex justify-end gap-4">
                        <button 
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={saving}
                            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                                    <span>Creating...</span>
                                </>
                            ) : (
                                <>
                                    <span>💾</span>
                                    <span>Save Game</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateGame;