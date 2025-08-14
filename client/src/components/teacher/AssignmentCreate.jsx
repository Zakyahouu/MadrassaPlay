import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Minimal, additive Teacher Assignment Create
// - Multi-class selection (from /api/classes/teaching)
// - Choose one or more existing game creations (from /api/creations)
// - Start/End dates and attempt limit
// - Posts to POST /api/assignments with { title, gameCreations, startDate, endDate, classIds }

const AssignmentCreate = () => {
  const [title, setTitle] = useState('');
  const [classes, setClasses] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [creations, setCreations] = useState([]);
  const [selectedCreations, setSelectedCreations] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [attemptLimit, setAttemptLimit] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [cls, cr] = await Promise.all([
          axios.get('/api/classes/teaching'),
          axios.get('/api/creations'),
        ]);
        if (!mounted) return;
        setClasses(cls.data || []);
        setCreations(cr.data || []);
      } catch (_) { /* ignore */ }
    })();
    return () => { mounted = false; };
  }, []);

  const toggleSelected = (list, setList, id) => {
    setList(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const datesValid = startDate && endDate && new Date(startDate) < new Date(endDate);
  const canSubmit = title && selectedCreations.length > 0 && datesValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const payload = {
        title,
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
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create assignment.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border p-6 space-y-6">
      <div>
        <h3 className="text-xl font-semibold">Create Assignment</h3>
        <p className="text-sm text-gray-500">Target multiple classes and choose one or more games.</p>
      </div>

      {message && (
        <div className={`p-3 rounded ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

  <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="e.g., Chapter 5 Review" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Classes</label>
          <div className="grid grid-cols-2 gap-2">
            {classes.map(c => (
              <label key={c._id} className={`border rounded px-3 py-2 cursor-pointer ${selectedClasses.includes(c._id) ? 'bg-indigo-50 border-indigo-300' : ''}`}>
                <input type="checkbox" className="mr-2" checked={selectedClasses.includes(c._id)} onChange={()=>toggleSelected(selectedClasses, setSelectedClasses, c._id)} />
                {c.name} ({c.level})
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Games</label>
          <div className="grid grid-cols-2 gap-2">
            {creations.map(g => (
              <label key={g._id} className={`border rounded px-3 py-2 cursor-pointer ${selectedCreations.includes(g._id) ? 'bg-green-50 border-green-300' : ''}`}>
                <input type="checkbox" className="mr-2" checked={selectedCreations.includes(g._id)} onChange={()=>toggleSelected(selectedCreations, setSelectedCreations, g._id)} />
                {g.name}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input type="datetime-local" value={startDate} onChange={(e)=>setStartDate(e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input type="datetime-local" value={endDate} onChange={(e)=>setEndDate(e.target.value)} className="w-full border rounded px-3 py-2" />
            {!datesValid && (startDate || endDate) && (
              <p className="text-xs text-red-600 mt-1">End date must be after start date.</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Attempt Limit</label>
          <input type="number" min={1} value={attemptLimit} onChange={(e)=>setAttemptLimit(parseInt(e.target.value||'1',10))} className="w-32 border rounded px-3 py-2" />
        </div>

  <button disabled={!canSubmit || submitting} className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50">
          {submitting ? 'Creating…' : 'Create Assignment'}
        </button>
      </form>
    </div>
  );
};

export default AssignmentCreate;
