// ManagerUpdateForm.jsx
import React, { useState } from 'react';
import axios from 'axios';

const ManagerUpdateForm = ({ schoolId, manager, onUpdated }) => {
  const [form, setForm] = useState({ name: manager.name, email: manager.email, password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await axios.put(`/api/schools/${schoolId}/managers/${manager._id}`, form);
      if (onUpdated) onUpdated(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update manager.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="p-4 bg-white rounded shadow mb-4" onSubmit={handleSubmit}>
      <h4 className="font-bold mb-2">Update Manager</h4>
      <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="mb-2 p-2 border w-full" required />
      <input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="mb-2 p-2 border w-full" required />
      <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="New Password (optional)" className="mb-2 p-2 border w-full" />
      <button type="submit" disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded">{loading ? 'Updating...' : 'Update Manager'}</button>
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </form>
  );
};

export default ManagerUpdateForm;
