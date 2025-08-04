import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

const ClassCreateForm = ({ onCreated }) => {
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState({
    number: '',
    name: '',
    teacher: '',
    schedule: [{ day: '', time: '' }],
    subject: '',
    level: '',
    paymentRule: '',
    students: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await axios.get('/api/teachers');
        setTeachers(res.data);
      } catch (err) {
        setTeachers([]);
      }
    };
    fetchTeachers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleScheduleChange = (idx, field, value) => {
    const newSchedule = form.schedule.map((row, i) =>
      i === idx ? { ...row, [field]: value } : row
    );
    setForm({ ...form, schedule: newSchedule });
  };

  const addScheduleRow = () => {
    setForm({ ...form, schedule: [...form.schedule, { day: '', time: '' }] });
  };

  const removeScheduleRow = (idx) => {
    setForm({ ...form, schedule: form.schedule.filter((_, i) => i !== idx) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...form,
        school: user.school
      };
      const response = await axios.post('/api/classes', payload);
      if (onCreated) onCreated(response.data);
      setForm({
        number: '', name: '', teacher: '', schedule: [{ day: '', time: '' }], subject: '', level: '', paymentRule: '', students: []
      });
    } catch (err) {
      setError('Failed to create class.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="p-6 bg-white rounded shadow mb-6" onSubmit={handleSubmit}>
      <h3 className="text-xl font-bold mb-4">Create New Class</h3>
      <input name="number" value={form.number} onChange={handleChange} placeholder="Class Number (e.g. 1, 12)" className="mb-2 p-2 border w-full" required />
      <input name="name" value={form.name} onChange={handleChange} placeholder="Class Name" className="mb-2 p-2 border w-full" required />
      <div className="mb-2">
        <label className="block font-bold">Teacher</label>
        <select name="teacher" value={form.teacher} onChange={handleChange} className="p-2 border w-full" required>
          <option value="">Select Teacher</option>
          {teachers.map(t => (
            <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
          ))}
        </select>
      </div>
      <div className="mb-2">
        <label className="block font-bold">Schedule</label>
        {form.schedule.map((row, idx) => (
          <div key={idx} className="flex gap-2 mb-1 items-center">
            <select value={row.day} onChange={e => handleScheduleChange(idx, 'day', e.target.value)} className="p-2 border" required>
              <option value="">Select Day</option>
              {daysOfWeek.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
            <input value={row.time} onChange={e => handleScheduleChange(idx, 'time', e.target.value)} placeholder="Time" className="p-2 border" required />
            <button type="button" onClick={() => removeScheduleRow(idx)} className="text-red-500 ml-2">Remove</button>
          </div>
        ))}
        <button type="button" onClick={addScheduleRow} className="text-blue-500">+ Add Schedule</button>
      </div>
      <input name="subject" value={form.subject} onChange={handleChange} placeholder="Subject" className="mb-2 p-2 border w-full" required />
      <input name="level" value={form.level} onChange={handleChange} placeholder="Level" className="mb-2 p-2 border w-full" required />
      <input name="paymentRule" type="number" value={form.paymentRule} onChange={handleChange} placeholder="Payment Rule (sessions)" className="mb-2 p-2 border w-full" required />
      {/* Students can be added later via class update */}
      <button type="submit" disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded">{loading ? 'Creating...' : 'Create Class'}</button>
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </form>
  );
};

export default ClassCreateForm;