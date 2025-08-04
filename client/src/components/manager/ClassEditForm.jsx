// ClassEditForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ClassEditForm = ({ classId, onUpdated }) => {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClass = async () => {
      try {
        const response = await axios.get(`/api/classes/${classId}`);
        setForm(response.data);
      } catch (err) {
        setError('Failed to fetch class.');
      } finally {
        setLoading(false);
      }
    };
    fetchClass();
  }, [classId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleScheduleChange = (idx, field, value) => {
    const newSchedule = [...form.schedule];
    newSchedule[idx][field] = value;
    setForm({ ...form, schedule: newSchedule });
  };

  const addScheduleRow = () => {
    setForm({ ...form, schedule: [...form.schedule, { day: '', time: '' }] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await axios.put(`/api/classes/${classId}`, form);
      if (onUpdated) onUpdated(response.data);
    } catch (err) {
      setError('Failed to update class.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading class...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!form) return null;

  return (
    <form className="p-6 bg-white rounded shadow mb-6" onSubmit={handleSubmit}>
      <h3 className="text-xl font-bold mb-4">Edit Class</h3>
      <input name="name" value={form.name} onChange={handleChange} placeholder="Class Name" className="mb-2 p-2 border w-full" required />
      <input name="school" value={form.school} onChange={handleChange} placeholder="School ID" className="mb-2 p-2 border w-full" required />
      <input name="teacher" value={form.teacher} onChange={handleChange} placeholder="Teacher ID" className="mb-2 p-2 border w-full" required />
      <div className="mb-2">
        <label className="block font-bold">Schedule</label>
        {form.schedule.map((row, idx) => (
          <div key={idx} className="flex gap-2 mb-1">
            <input value={row.day} onChange={e => handleScheduleChange(idx, 'day', e.target.value)} placeholder="Day" className="p-2 border" required />
            <input value={row.time} onChange={e => handleScheduleChange(idx, 'time', e.target.value)} placeholder="Time" className="p-2 border" required />
          </div>
        ))}
        <button type="button" onClick={addScheduleRow} className="text-blue-500">+ Add Schedule</button>
      </div>
      <input name="subject" value={form.subject} onChange={handleChange} placeholder="Subject" className="mb-2 p-2 border w-full" required />
      <input name="level" value={form.level} onChange={handleChange} placeholder="Level" className="mb-2 p-2 border w-full" required />
      <input name="paymentRule" type="number" value={form.paymentRule} onChange={handleChange} placeholder="Payment Rule (sessions)" className="mb-2 p-2 border w-full" required />
      {/* Students can be managed separately */}
      <button type="submit" disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded">{loading ? 'Updating...' : 'Update Class'}</button>
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </form>
  );
};

export default ClassEditForm;
