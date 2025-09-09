import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

// Minimal, additive Teacher Assignment Create
// - Multi-class selection (from /api/classes/teaching)
// - Choose one or more existing game creations (from /api/creations)
// - Start/End dates and attempt limit
// - Posts to POST /api/assignments with { title, gameCreations, startDate, endDate, classIds }

const AssignmentCreate = ({ initialSelectedCreations = [], onCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [allClasses, setAllClasses] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [creations, setCreations] = useState([]);
  const [selectedCreations, setSelectedCreations] = useState([]);
  const [restrictToLevelOnly, setRestrictToLevelOnly] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [attemptLimit, setAttemptLimit] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [step, setStep] = useState(1);
  const [timePreset, setTimePreset] = useState('3d'); // 1d,3d,7d,15d,30d,custom
  // Lightweight UI helpers
  const [classSearch, setClassSearch] = useState('');
  const [gamesSearch, setGamesSearch] = useState('');
  const [gamesLevelFilter, setGamesLevelFilter] = useState('all'); // 'all' or specific levelLabel

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [cls, cr] = await Promise.all([
          axios.get('/api/classes/teacher'),
          axios.get('/api/creations'),
        ]);
        if (!mounted) return;
  const klasses = cls.data || [];
  const allCreations = cr.data || [];
  setCreations(allCreations);
  setAllClasses(klasses);
        if (Array.isArray(initialSelectedCreations) && initialSelectedCreations.length) {
          setSelectedCreations(initialSelectedCreations);
        }
      } catch (_) { /* ignore */ }
    })();
    return () => { mounted = false; };
  }, []);

  const toggleSelected = (list, setList, id) => {
    setList(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Quick presets handling
  const nowLocal = useMemo(() => {
    const d = new Date();
    // Round to nearest 15 minutes for nicer UX
    d.setSeconds(0,0);
    const m = d.getMinutes();
    const rounded = Math.ceil(m / 15) * 15;
    d.setMinutes(rounded >= 60 ? 0 : rounded);
    if (rounded >= 60) d.setHours(d.getHours()+1);
    return d;
  }, []);

  useEffect(() => {
    if (!timePreset || timePreset === 'custom') return;
    const start = new Date(nowLocal);
    let end = new Date(start);
    const addDays = (n) => { const e = new Date(start); e.setDate(e.getDate()+n); e.setHours(23,59,0,0); return e; };
    if (timePreset === '1d') end = addDays(1);
    if (timePreset === '3d') end = addDays(3);
    if (timePreset === '7d') end = addDays(7);
    if (timePreset === '15d') end = addDays(15);
    if (timePreset === '30d') end = addDays(30);
    const toLocalInput = (d) => {
      const pad = (n) => String(n).padStart(2,'0');
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    setStartDate(toLocalInput(start));
    setEndDate(toLocalInput(end));
  }, [timePreset, nowLocal]);

  const datesValid = startDate && endDate && new Date(startDate) < new Date(endDate);
  const canSubmit = title && selectedCreations.length > 0 && datesValid;

  // Derive game filter options and filtered list
  const gameLevelOptions = useMemo(() => {
    const set = new Set();
    for (const g of creations) {
      if (g.levelLabel && g.levelLabel !== 'Any') set.add(g.levelLabel);
    }
    return ['all', ...Array.from(set)];
  }, [creations]);

  const filteredCreations = useMemo(() => {
    const term = gamesSearch.trim().toLowerCase();
    return creations.filter(g => {
      const matchesName = !term || (g.name || '').toLowerCase().includes(term);
      const matchesLevel = gamesLevelFilter === 'all' || g.levelLabel === gamesLevelFilter;
      return matchesName && matchesLevel;
    });
  }, [creations, gamesSearch, gamesLevelFilter]);

  // Step 2 helpers
  const selected = useMemo(() => creations.filter(g => selectedCreations.includes(g._id)), [creations, selectedCreations]);
  const levelSet = useMemo(() => new Set(selected.map(g => g.levelLabel).filter(l => l && l !== 'Any')), [selected]);
  const effectiveLevel = levelSet.size === 1 ? Array.from(levelSet)[0] : 'Any';
  const classesFilteredByLevel = useMemo(() => {
    if (effectiveLevel !== 'Any' && restrictToLevelOnly) return allClasses.filter(c => c.name === effectiveLevel);
    return allClasses;
  }, [allClasses, effectiveLevel, restrictToLevelOnly]);
  const classesToShow = useMemo(() => {
    const term = classSearch.trim().toLowerCase();
    if (!term) return classesFilteredByLevel;
    return classesFilteredByLevel.filter(c => (c.name || '').toLowerCase().includes(term));
  }, [classesFilteredByLevel, classSearch]);

  const selectAllShownClasses = () => {
    const ids = classesToShow.map(c => c._id);
    setSelectedClasses(prev => Array.from(new Set([...prev, ...ids])));
  };
  const clearAllClassSelection = () => setSelectedClasses([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const payload = {
        title,
        description,
        gameCreations: selectedCreations,
        startDate,
        endDate,
        classIds: selectedClasses,
        attemptLimit,
      };
      const res = await axios.post('/api/assignments', payload);
  setMessage({ type: 'success', text: 'Assignment created.' });
      // reset minimal fields
      setTitle('');
  setSelectedClasses([]);
      setSelectedCreations([]);
      setStartDate('');
      setEndDate('');
      setAttemptLimit(1);
  setDescription('');
  if (typeof onCreated === 'function') onCreated();
    } catch (err) {
      const apiMsg = err.response?.data?.message;
      setMessage({ type: 'error', text: apiMsg || 'Failed to create assignment.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Create Assignment</h3>
          <p className="text-sm text-gray-500">A quick, three-step wizard: Details → Classes → Schedule</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className={`px-2 py-1 rounded ${step===1?'bg-indigo-50 text-indigo-700':'bg-gray-50'}`}>1. Details</span>
          <span className={`px-2 py-1 rounded ${step===2?'bg-indigo-50 text-indigo-700':'bg-gray-50'}`}>2. Classes</span>
          <span className={`px-2 py-1 rounded ${step===3?'bg-indigo-50 text-indigo-700':'bg-gray-50'}`}>3. Schedule</span>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Step 1: Details */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="e.g., Chapter 5 Review" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description (optional)</label>
            <textarea value={description} onChange={(e)=>setDescription(e.target.value)} className="w-full border rounded px-3 py-2" rows={3} placeholder="Instructions for students, resources, or goals..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Games</label>
            <p className="text-[11px] text-gray-500 mb-2">Rule: A game cannot be assigned to the same class twice at the same time. If already assigned, cancel/complete the previous one or adjust dates/classes.</p>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <input
                type="text"
                value={gamesSearch}
                onChange={(e)=>setGamesSearch(e.target.value)}
                placeholder="Search games by name..."
                className="border rounded px-3 py-1.5 text-sm w-full sm:w-64"
              />
              {gameLevelOptions.length > 1 && (
                <select
                  value={gamesLevelFilter}
                  onChange={(e)=>setGamesLevelFilter(e.target.value)}
                  className="border rounded px-3 py-1.5 text-sm"
                >
                  {gameLevelOptions.map(opt => (
                    <option key={opt} value={opt}>{opt === 'all' ? 'All levels' : opt}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredCreations.map(g => (
                <label key={g._id} className={`border rounded px-3 py-2 cursor-pointer flex items-center gap-2 ${selectedCreations.includes(g._id) ? 'bg-green-50 border-green-300' : ''}`}>
                  <input type="checkbox" className="mr-1" checked={selectedCreations.includes(g._id)} onChange={()=>toggleSelected(selectedCreations, setSelectedCreations, g._id)} />
                  <span className="truncate">{g.name}</span>
                  {g.levelLabel && (
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{g.levelLabel}</span>
                  )}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <button disabled={!title || selectedCreations.length===0} onClick={()=>setStep(2)} className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50">Next</button>
          </div>
        </div>
      )}

  {/* Step 2: Classes */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Target Classes</label>
            <div className="mb-2 text-xs text-gray-500 flex flex-wrap items-center gap-3">
              <div>
                Selected game level: <span className="font-medium">{effectiveLevel}</span>
              </div>
              {effectiveLevel !== 'Any' && (
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={restrictToLevelOnly} onChange={e=> setRestrictToLevelOnly(e.target.checked)} />
                  <span>Show only classes in this level</span>
                </label>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <input
                type="text"
                value={classSearch}
                onChange={(e)=>setClassSearch(e.target.value)}
                placeholder="Search classes by name..."
                className="border rounded px-3 py-1.5 text-sm w-full sm:w-64"
              />
              <div className="ml-auto flex items-center gap-2 text-xs">
                <span className="text-gray-500">Selected: {selectedClasses.length}</span>
                <button type="button" onClick={selectAllShownClasses} className="px-2 py-1 border rounded">Select all shown</button>
                <button type="button" onClick={clearAllClassSelection} className="px-2 py-1 border rounded">Clear</button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {classesToShow.map(c => (
                <label key={c._id} className={`border rounded px-3 py-2 cursor-pointer flex items-center gap-2 ${selectedClasses.includes(c._id) ? 'bg-indigo-50 border-indigo-300' : ''}`}>
                  <input type="checkbox" className="mr-1" checked={selectedClasses.includes(c._id)} onChange={()=>toggleSelected(selectedClasses, setSelectedClasses, c._id)} />
                  <span className="truncate">{c.name}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">You must select at least one class. Assignments are class-based.</p>
          </div>
          <div className="flex justify-between">
            <button onClick={()=>setStep(1)} className="px-4 py-2 rounded border">Back</button>
            <button disabled={selectedCreations.length===0 || !title} onClick={()=>setStep(3)} className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50">Next</button>
          </div>
        </div>
      )}

      {/* Step 3: Schedule */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Quick Duration</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: '1d', label: '1 day' },
                { id: '3d', label: '3 days' },
                { id: '7d', label: '7 days' },
                { id: '15d', label: '15 days' },
                { id: '30d', label: '1 month' },
                { id: 'custom', label: 'Custom' },
              ].map(opt => (
                <button type="button" key={opt.id} onClick={()=>setTimePreset(opt.id)} className={`px-3 py-1.5 rounded border text-sm ${timePreset===opt.id?'bg-indigo-50 border-indigo-300 text-indigo-700':'bg-white'}`}>{opt.label}</button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">Pick a quick duration or choose Custom to specify exact dates.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input type="datetime-local" value={startDate} onChange={(e)=>{ setTimePreset('custom'); setStartDate(e.target.value); }} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input type="datetime-local" value={endDate} onChange={(e)=>{ setTimePreset('custom'); setEndDate(e.target.value); }} className="w-full border rounded px-3 py-2" />
              {!datesValid && (startDate || endDate) && (
                <p className="text-xs text-red-600 mt-1">End date must be after start date.</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Attempt Limit</label>
            <input type="number" min={1} max={10} value={attemptLimit} onChange={(e)=>setAttemptLimit(parseInt(e.target.value||'1',10))} className="w-32 border rounded px-3 py-2" />
          </div>

          <div className="flex justify-between">
            <button type="button" onClick={()=>setStep(2)} className="px-4 py-2 rounded border">Back</button>
            <button disabled={!canSubmit || submitting} className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50">
              {submitting ? 'Creating…' : 'Create Assignment'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AssignmentCreate;
