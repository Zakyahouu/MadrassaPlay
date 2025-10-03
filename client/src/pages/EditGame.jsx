// EditGame.jsx - Enhanced with creative minimal design
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const EditGame = () => {
    const { creationId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useContext(AuthContext);

    const [template, setTemplate] = useState(null);
    const [gameCreation, setGameCreation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    
    const [settingsData, setSettingsData] = useState({});
    const [contentItems, setContentItems] = useState([{}]);
    const [autoMode, setAutoMode] = useState(false);
    

    useEffect(() => {
        const fetchGameData = async () => {
            try {
                // Fetch the game creation data
                const { data: creationData } = await axios.get(`/api/creations/${creationId}`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setGameCreation(creationData);

                // Fetch the template data
                const { data: templateData } = await axios.get(`/api/templates/${creationData.template._id}`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setTemplate(templateData);

                // Initialize settings with existing data
                const initialSettings = { ...creationData.config };
                setSettingsData(initialSettings);
                if (initialSettings.autoGenerate !== undefined) setAutoMode(!!initialSettings.autoGenerate);

                // Initialize content items with existing data
                if (creationData.content && creationData.content.length > 0) {
                    setContentItems(creationData.content);
                } else {
                    // Initialize with empty item if no content
                    const initialItem = {};
                    if (templateData.formSchema.content?.itemSchema) {
                        Object.keys(templateData.formSchema.content.itemSchema).forEach(key => {
                            initialItem[key] = '';
                        });
                    }
                    setContentItems([initialItem]);
                }

            } catch (err) {
                setError('Failed to load game data');
            } finally {
                setLoading(false);
            }
        };
        fetchGameData();
    }, [creationId, user.token]);

    

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
            config: { ...settingsData, autoGenerate: autoMode },
            content: filteredContent,
            levelLabel: gameCreation.levelLabel,
        };

        try {
            await axios.put(`/api/creations/${creationId}`, gameData, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`,
                },
            });
            navigate(-1);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update game');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading game data...</p>
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

    if (!template || !gameCreation) return null;

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
                                <h1 className="text-2xl font-bold text-gray-800">Edit Game</h1>
                                <p className="text-sm text-gray-500">Editing: {gameCreation.name}</p>
                            </div>
                        </div>
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                            <span className="text-lg">✏️</span>
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
                                    // Textarea
                                    if (field.type === 'textarea') {
                                        return (
                                            <div key={key} className="group col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    {field.label}
                                                </label>
                                                <textarea
                                                    value={settingsData[key] ?? ''}
                                                    onChange={(e) => handleSettingsChange(key, e.target.value)}
                                                    required={field.required}
                                                    rows={field.rows || 4}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-indigo-400 focus:bg-white focus:outline-none transition-all duration-200 resize-y"
                                                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                                                />
                                            </div>
                                        );
                                    }
                                    // Color picker
                                    if (field.type === 'color') {
                                        return (
                                            <div key={key} className="group">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    {field.label}
                                                </label>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="color"
                                                        value={settingsData[key] || '#000000'}
                                                        onChange={(e) => handleSettingsChange(key, e.target.value)}
                                                        className="h-12 w-20 rounded-xl border border-gray-200 cursor-pointer"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={settingsData[key] || '#000000'}
                                                        onChange={(e) => handleSettingsChange(key, e.target.value)}
                                                        pattern="^#[0-9A-Fa-f]{6}$"
                                                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-indigo-400 focus:bg-white focus:outline-none transition-all duration-200 font-mono text-sm"
                                                        placeholder="#000000"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    }
                                    // Range slider
                                    if (field.type === 'range') {
                                        return (
                                            <div key={key} className="group">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    {field.label}
                                                </label>
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="range"
                                                        value={settingsData[key] ?? field.default ?? field.min ?? 0}
                                                        onChange={(e) => handleSettingsChange(key, Number(e.target.value))}
                                                        min={field.min ?? 0}
                                                        max={field.max ?? 100}
                                                        step={field.step ?? 1}
                                                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                                    />
                                                    <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-center bg-gray-100 px-3 py-1 rounded-lg">
                                                        {settingsData[key] ?? field.default ?? field.min ?? 0}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    }
                                    // Date input
                                    if (field.type === 'date') {
                                        return (
                                            <div key={key} className="group">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    {field.label}
                                                </label>
                                                <input
                                                    type="date"
                                                    value={settingsData[key] ?? ''}
                                                    onChange={(e) => handleSettingsChange(key, e.target.value)}
                                                    required={field.required}
                                                    min={field.min}
                                                    max={field.max}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-indigo-400 focus:bg-white focus:outline-none transition-all duration-200"
                                                />
                                            </div>
                                        );
                                    }
                                    // DateTime input
                                    if (field.type === 'datetime-local' || field.type === 'datetime') {
                                        return (
                                            <div key={key} className="group">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    {field.label}
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    value={settingsData[key] ?? ''}
                                                    onChange={(e) => handleSettingsChange(key, e.target.value)}
                                                    required={field.required}
                                                    min={field.min}
                                                    max={field.max}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-indigo-400 focus:bg-white focus:outline-none transition-all duration-200"
                                                />
                                            </div>
                                        );
                                    }
                                    // Time input
                                    if (field.type === 'time') {
                                        return (
                                            <div key={key} className="group">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    {field.label}
                                                </label>
                                                <input
                                                    type="time"
                                                    value={settingsData[key] ?? ''}
                                                    onChange={(e) => handleSettingsChange(key, e.target.value)}
                                                    required={field.required}
                                                    min={field.min}
                                                    max={field.max}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-indigo-400 focus:bg-white focus:outline-none transition-all duration-200"
                                                />
                                            </div>
                                        );
                                    }
                                    // Month input
                                    if (field.type === 'month') {
                                        return (
                                            <div key={key} className="group">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    {field.label}
                                                </label>
                                                <input
                                                    type="month"
                                                    value={settingsData[key] ?? ''}
                                                    onChange={(e) => handleSettingsChange(key, e.target.value)}
                                                    required={field.required}
                                                    min={field.min}
                                                    max={field.max}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-indigo-400 focus:bg-white focus:outline-none transition-all duration-200"
                                                />
                                            </div>
                                        );
                                    }
                                    // Week input
                                    if (field.type === 'week') {
                                        return (
                                            <div key={key} className="group">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    {field.label}
                                                </label>
                                                <input
                                                    type="week"
                                                    value={settingsData[key] ?? ''}
                                                    onChange={(e) => handleSettingsChange(key, e.target.value)}
                                                    required={field.required}
                                                    min={field.min}
                                                    max={field.max}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-indigo-400 focus:bg-white focus:outline-none transition-all duration-200"
                                                />
                                            </div>
                                        );
                                    }
                                    // URL input
                                    if (field.type === 'url') {
                                        return (
                                            <div key={key} className="group">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    {field.label}
                                                </label>
                                                <input
                                                    type="url"
                                                    value={settingsData[key] ?? ''}
                                                    onChange={(e) => handleSettingsChange(key, e.target.value)}
                                                    required={field.required}
                                                    pattern={field.pattern}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-indigo-400 focus:bg-white focus:outline-none transition-all duration-200"
                                                    placeholder={field.placeholder || 'https://example.com'}
                                                />
                                            </div>
                                        );
                                    }
                                    // Email input
                                    if (field.type === 'email') {
                                        return (
                                            <div key={key} className="group">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    {field.label}
                                                </label>
                                                <input
                                                    type="email"
                                                    value={settingsData[key] ?? ''}
                                                    onChange={(e) => handleSettingsChange(key, e.target.value)}
                                                    required={field.required}
                                                    pattern={field.pattern}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-indigo-400 focus:bg-white focus:outline-none transition-all duration-200"
                                                    placeholder={field.placeholder || 'example@email.com'}
                                                />
                                            </div>
                                        );
                                    }
                                    // Tel input
                                    if (field.type === 'tel') {
                                        return (
                                            <div key={key} className="group">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    {field.label}
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={settingsData[key] ?? ''}
                                                    onChange={(e) => handleSettingsChange(key, e.target.value)}
                                                    required={field.required}
                                                    pattern={field.pattern}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-indigo-400 focus:bg-white focus:outline-none transition-all duration-200"
                                                    placeholder={field.placeholder || '+1234567890'}
                                                />
                                            </div>
                                        );
                                    }
                                    // Numbers with min/max and default text
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
                                                                        fd.append('creationId', creationId);
                                                                        const { data } = await axios.post(`/api/templates/${template._id}/media`, fd, {
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
                                                                            fd.append('creationId', creationId);
                                                                            const { data } = await axios.post(`/api/templates/${template._id}/media`, fd, {
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
                                                    ) : field.type === 'textarea' ? (
                                                        <textarea
                                                            value={item[key] || ''}
                                                            onChange={(e) => handleContentChange(index, key, e.target.value)}
                                                            rows={field.rows || 4}
                                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-indigo-400 focus:outline-none transition-colors resize-y"
                                                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                                                        />
                                                    ) : field.type === 'color' ? (
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="color"
                                                                value={item[key] || '#000000'}
                                                                onChange={(e) => handleContentChange(index, key, e.target.value)}
                                                                className="h-12 w-20 rounded-lg border border-gray-200 cursor-pointer"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={item[key] || '#000000'}
                                                                onChange={(e) => handleContentChange(index, key, e.target.value)}
                                                                pattern="^#[0-9A-Fa-f]{6}$"
                                                                className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-indigo-400 focus:outline-none transition-colors font-mono text-sm"
                                                                placeholder="#000000"
                                                            />
                                                        </div>
                                                    ) : field.type === 'range' ? (
                                                        <div className="flex items-center gap-4">
                                                            <input
                                                                type="range"
                                                                value={item[key] ?? field.default ?? field.min ?? 0}
                                                                onChange={(e) => handleContentChange(index, key, Number(e.target.value))}
                                                                min={field.min ?? 0}
                                                                max={field.max ?? 100}
                                                                step={field.step ?? 1}
                                                                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                                            />
                                                            <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-center bg-gray-100 px-3 py-1 rounded-lg">
                                                                {item[key] ?? field.default ?? field.min ?? 0}
                                                            </span>
                                                        </div>
                                                    ) : field.type === 'date' ? (
                                                        <input
                                                            type="date"
                                                            value={item[key] || ''}
                                                            onChange={(e) => handleContentChange(index, key, e.target.value)}
                                                            min={field.min}
                                                            max={field.max}
                                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-indigo-400 focus:outline-none transition-colors"
                                                        />
                                                    ) : (field.type === 'datetime-local' || field.type === 'datetime') ? (
                                                        <input
                                                            type="datetime-local"
                                                            value={item[key] || ''}
                                                            onChange={(e) => handleContentChange(index, key, e.target.value)}
                                                            min={field.min}
                                                            max={field.max}
                                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-indigo-400 focus:outline-none transition-colors"
                                                        />
                                                    ) : field.type === 'time' ? (
                                                        <input
                                                            type="time"
                                                            value={item[key] || ''}
                                                            onChange={(e) => handleContentChange(index, key, e.target.value)}
                                                            min={field.min}
                                                            max={field.max}
                                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-indigo-400 focus:outline-none transition-colors"
                                                        />
                                                    ) : field.type === 'month' ? (
                                                        <input
                                                            type="month"
                                                            value={item[key] || ''}
                                                            onChange={(e) => handleContentChange(index, key, e.target.value)}
                                                            min={field.min}
                                                            max={field.max}
                                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-indigo-400 focus:outline-none transition-colors"
                                                        />
                                                    ) : field.type === 'week' ? (
                                                        <input
                                                            type="week"
                                                            value={item[key] || ''}
                                                            onChange={(e) => handleContentChange(index, key, e.target.value)}
                                                            min={field.min}
                                                            max={field.max}
                                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-indigo-400 focus:outline-none transition-colors"
                                                        />
                                                    ) : field.type === 'url' ? (
                                                        <input
                                                            type="url"
                                                            value={item[key] || ''}
                                                            onChange={(e) => handleContentChange(index, key, e.target.value)}
                                                            pattern={field.pattern}
                                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-indigo-400 focus:outline-none transition-colors"
                                                            placeholder={field.placeholder || 'https://example.com'}
                                                        />
                                                    ) : field.type === 'email' ? (
                                                        <input
                                                            type="email"
                                                            value={item[key] || ''}
                                                            onChange={(e) => handleContentChange(index, key, e.target.value)}
                                                            pattern={field.pattern}
                                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-indigo-400 focus:outline-none transition-colors"
                                                            placeholder={field.placeholder || 'example@email.com'}
                                                        />
                                                    ) : field.type === 'tel' ? (
                                                        <input
                                                            type="tel"
                                                            value={item[key] || ''}
                                                            onChange={(e) => handleContentChange(index, key, e.target.value)}
                                                            pattern={field.pattern}
                                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-indigo-400 focus:outline-none transition-colors"
                                                            placeholder={field.placeholder || '+1234567890'}
                                                        />
                                                    ) : field.type === 'array' ? (
                                                        <div className="space-y-3">
                                                            {/* Render existing array items */}
                                                            {(Array.isArray(item[key]) ? item[key] : []).map((arrayItem, arrayIndex) => (
                                                                <div key={arrayIndex} className="flex items-start gap-2">
                                                                    {/* Simple itemType (text, number, etc) */}
                                                                    {field.itemType && !field.itemSchema && (
                                                                        field.itemType === 'textarea' ? (
                                                                            <textarea
                                                                                value={arrayItem || ''}
                                                                                onChange={(e) => {
                                                                                    const newArray = [...(Array.isArray(item[key]) ? item[key] : [])];
                                                                                    newArray[arrayIndex] = e.target.value;
                                                                                    handleContentChange(index, key, newArray);
                                                                                }}
                                                                                rows={field.rows || 3}
                                                                                className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg focus:border-indigo-400 focus:outline-none transition-colors resize-y"
                                                                                placeholder={field.placeholder || `Enter ${field.label}`}
                                                                            />
                                                                        ) : (
                                                                            <input
                                                                                type={field.itemType === 'number' ? 'number' : 'text'}
                                                                                value={arrayItem || ''}
                                                                                onChange={(e) => {
                                                                                    const newArray = [...(Array.isArray(item[key]) ? item[key] : [])];
                                                                                    newArray[arrayIndex] = field.itemType === 'number' ? Number(e.target.value) : e.target.value;
                                                                                    handleContentChange(index, key, newArray);
                                                                                }}
                                                                                className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg focus:border-indigo-400 focus:outline-none transition-colors"
                                                                                placeholder={field.placeholder || `Enter ${field.label}`}
                                                                            />
                                                                        )
                                                                    )}
                                                                    
                                                                    {/* Complex itemSchema (object with multiple fields) */}
                                                                    {field.itemSchema && (
                                                                        <div className="flex-1 grid gap-2 p-3 bg-white border border-gray-200 rounded-lg">
                                                                            {Object.entries(field.itemSchema).map(([nestedKey, nestedField]) => (
                                                                                <div key={nestedKey}>
                                                                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                                        {nestedField.label}
                                                                                    </label>
                                                                                    {nestedField.type === 'textarea' ? (
                                                                                        <textarea
                                                                                            value={(arrayItem && arrayItem[nestedKey]) || ''}
                                                                                            onChange={(e) => {
                                                                                                const newArray = [...(Array.isArray(item[key]) ? item[key] : [])];
                                                                                                newArray[arrayIndex] = {
                                                                                                    ...(arrayItem || {}),
                                                                                                    [nestedKey]: e.target.value
                                                                                                };
                                                                                                handleContentChange(index, key, newArray);
                                                                                            }}
                                                                                            rows={nestedField.rows || 2}
                                                                                            className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded focus:border-indigo-400 focus:bg-white focus:outline-none resize-y"
                                                                                            placeholder={nestedField.placeholder || nestedField.label}
                                                                                        />
                                                                                    ) : (
                                                                                        <input
                                                                                            type={nestedField.type === 'number' ? 'number' : 'text'}
                                                                                            value={(arrayItem && arrayItem[nestedKey]) || ''}
                                                                                            onChange={(e) => {
                                                                                                const newArray = [...(Array.isArray(item[key]) ? item[key] : [])];
                                                                                                newArray[arrayIndex] = {
                                                                                                    ...(arrayItem || {}),
                                                                                                    [nestedKey]: nestedField.type === 'number' ? Number(e.target.value) : e.target.value
                                                                                                };
                                                                                                handleContentChange(index, key, newArray);
                                                                                            }}
                                                                                            className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded focus:border-indigo-400 focus:bg-white focus:outline-none"
                                                                                            placeholder={nestedField.placeholder || nestedField.label}
                                                                                        />
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                    
                                                                    {/* Remove button */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const newArray = (Array.isArray(item[key]) ? item[key] : []).filter((_, i) => i !== arrayIndex);
                                                                            handleContentChange(index, key, newArray);
                                                                        }}
                                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                                                        title="Remove item"
                                                                    >
                                                                        🗑️
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            
                                                            {/* Add new item button */}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const currentArray = Array.isArray(item[key]) ? item[key] : [];
                                                                    let newItem;
                                                                    if (field.itemType) {
                                                                        newItem = field.itemType === 'number' ? 0 : '';
                                                                    } else if (field.itemSchema) {
                                                                        newItem = {};
                                                                        Object.keys(field.itemSchema).forEach(k => {
                                                                            newItem[k] = field.itemSchema[k].type === 'number' ? 0 : '';
                                                                        });
                                                                    } else {
                                                                        newItem = '';
                                                                    }
                                                                    handleContentChange(index, key, [...currentArray, newItem]);
                                                                }}
                                                                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 hover:border-indigo-400 transition-colors text-sm font-medium text-gray-600"
                                                            >
                                                                + Add {field.label || 'Item'}
                                                            </button>
                                                        </div>
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
                                    <span>Updating...</span>
                                </>
                            ) : (
                                <>
                                    <span>💾</span>
                                    <span>Update Game</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditGame;
