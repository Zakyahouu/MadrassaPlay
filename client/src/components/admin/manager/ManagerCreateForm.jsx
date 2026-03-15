// ManagerCreateForm.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../../../context/LanguageContext';

const ManagerCreateForm = ({ schoolId, onCreated }) => {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    phone1: '',
    phone2: ''
  });
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
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password
      };
      const contact = {};
      if (form.address) contact.address = form.address;
      if (form.phone1) contact.phone1 = form.phone1;
      if (form.phone2) contact.phone2 = form.phone2;
      if (Object.keys(contact).length > 0) {
        payload.contact = contact;
      }

      const response = await axios.post(`/api/schools/${schoolId}/managers`, payload);
      if (onCreated) onCreated(response.data);
      setForm({ name: '', email: '', password: '', address: '', phone1: '', phone2: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create manager.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="p-4 bg-white rounded shadow mb-4" onSubmit={handleSubmit}>
      <h4 className="font-bold mb-2">Create Manager for School</h4>
      <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="mb-2 p-2 border w-full" required />
      <input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="mb-2 p-2 border w-full" required />
      <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Password" className="mb-2 p-2 border w-full" required />
      <input name="address" value={form.address} onChange={handleChange} placeholder="Address" className="mb-2 p-2 border w-full" />
      <input name="phone1" value={form.phone1} onChange={handleChange} placeholder="Primary Phone" className="mb-2 p-2 border w-full" />
      <input name="phone2" value={form.phone2} onChange={handleChange} placeholder="Secondary Phone" className="mb-2 p-2 border w-full" />
      <button type="submit" disabled={loading} className="bg-green-500 text-white px-4 py-2 rounded">{loading ? 'Creating...' : 'Create Manager'}</button>
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </form>
  );
};

export default ManagerCreateForm;
