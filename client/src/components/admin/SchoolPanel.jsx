// SchoolPanel.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ManagerPanel from './manager/ManagerPanel';
import { FaEdit, FaTrash, FaCheckCircle, FaPlus, FaTimes } from 'react-icons/fa';

const SchoolPanel = () => {
  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [editMode, setEditMode] = useState(false);
  const [editSchoolId, setEditSchoolId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/schools');
      setSchools(response.data);
    } catch (err) {
      setError('Failed to fetch schools.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await axios.post('/api/schools', {
        name: form.name,
        contact: { email: form.email, phone: form.phone, address: form.address }
      });
      setSchools([...schools, response.data]);
      setForm({ name: '', email: '', phone: '', address: '' });
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create school.');
    }
  };

  const handleEdit = (school) => {
    setEditMode(true);
    setEditSchoolId(school._id);
    setForm({
      name: school.name,
      email: school.contact?.email || '',
      phone: school.contact?.phone || '',
      address: school.contact?.address || ''
    });
    setShowForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await axios.put(`/api/schools/${editSchoolId}`, {
        name: form.name,
        contact: { email: form.email, phone: form.phone, address: form.address }
      });
      setSchools(schools.map(s => (s._id === editSchoolId ? response.data : s)));
      setEditMode(false);
      setEditSchoolId(null);
      setForm({ name: '', email: '', phone: '', address: '' });
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update school.');
    }
  };

  const handleDelete = async (schoolId) => {
    if (!window.confirm('Are you sure you want to delete this school?')) return;
    setError(null);
    try {
      await axios.delete(`/api/schools/${schoolId}`);
      setSchools(schools.filter(s => s._id !== schoolId));
      if (selectedSchoolId === schoolId) setSelectedSchoolId(null);
    } catch (err) {
      setError('Failed to delete school.');
    }
  };

  const handleSelect = (schoolId) => {
    setSelectedSchoolId(schoolId);
    setEditMode(false);
    setEditSchoolId(null);
    setForm({ name: '', email: '', phone: '', address: '' });
  };

  const selectedSchool = schools.find(s => s._id === selectedSchoolId);

  return (
    <div className="p-6">
      <h2 className="text-3xl font-extrabold mb-6 text-indigo-700">School Management</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div className="flex justify-between items-center mb-6">
        <span className="text-lg font-semibold">Schools</span>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-indigo-700" onClick={() => { setShowForm(true); setEditMode(false); setForm({ name: '', email: '', phone: '', address: '', principal: '' }); }}>
          <FaPlus /> Add School
        </button>
      </div>
      {/* Modal for create/edit form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-red-500" onClick={() => { setShowForm(false); setEditMode(false); setEditSchoolId(null); }}><FaTimes size={20} /></button>
            <form onSubmit={editMode ? handleUpdate : handleCreate}>
              <h4 className="font-bold mb-4 text-xl">{editMode ? 'Edit School' : 'Create New School'}</h4>
              <input name="name" value={form.name} onChange={handleChange} placeholder="School Name" className="mb-3 p-2 border w-full rounded" required />
              <input name="email" value={form.email} onChange={handleChange} placeholder="Contact Email" className="mb-3 p-2 border w-full rounded" />
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="Contact Phone" className="mb-3 p-2 border w-full rounded" />
              <input name="address" value={form.address} onChange={handleChange} placeholder="Address" className="mb-3 p-2 border w-full rounded" />
              <div className="flex gap-2 mt-4">
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded flex-1">{editMode ? 'Update School' : 'Create School'}</button>
                <button type="button" className="bg-gray-300 px-4 py-2 rounded flex-1" onClick={() => { setShowForm(false); setEditMode(false); setEditSchoolId(null); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {schools.map(school => (
          <div key={school._id} className={`p-4 rounded-lg shadow border transition-all ${selectedSchoolId === school._id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 bg-white'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-lg flex items-center gap-2">
                {selectedSchoolId === school._id && <FaCheckCircle className="text-green-500" title="Selected" />}
                {school.name}
              </span>
              <div className="flex gap-2">
                <button title="Select" onClick={() => handleSelect(school._id)} className="text-indigo-600 hover:text-indigo-800"><FaCheckCircle /></button>
                <button title="Edit" onClick={() => handleEdit(school)} className="text-yellow-600 hover:text-yellow-800"><FaEdit /></button>
                <button title="Delete" onClick={() => handleDelete(school._id)} className="text-red-600 hover:text-red-800"><FaTrash /></button>
              </div>
            </div>
            <div className="text-sm text-gray-700">
              <div><span className="font-semibold">Email:</span> {school.contact?.email || '-'}</div>
              <div><span className="font-semibold">Phone:</span> {school.contact?.phone || '-'}</div>
              <div><span className="font-semibold">Address:</span> {school.contact?.address || '-'}</div>
              {/* Principal removed from UI */}
              <div><span className="font-semibold">Managers:</span> {school.managers?.length || 0}</div>
            </div>
          </div>
        ))}
      </div>
      {selectedSchool && (
        <div className="mt-8">
          <h3 className="text-2xl font-bold mb-4 text-indigo-700">Selected School Details</h3>
          <div className="mb-6 p-6 border rounded-lg bg-gray-50 shadow">
            <div className="grid grid-cols-2 gap-4">
              <div><span className="font-semibold">Name:</span> {selectedSchool.name}</div>
              <div><span className="font-semibold">Email:</span> {selectedSchool.contact?.email || '-'}</div>
              <div><span className="font-semibold">Phone:</span> {selectedSchool.contact?.phone || '-'}</div>
              <div><span className="font-semibold">Address:</span> {selectedSchool.contact?.address || '-'}</div>
              <div><span className="font-semibold">Principal:</span> {selectedSchool.principal || '-'}</div>
              <div><span className="font-semibold">Managers:</span> {selectedSchool.managers?.length || 0}</div>
            </div>
          </div>
          <ManagerPanel schoolId={selectedSchool._id} />
        </div>
      )}
    </div>
  );
};

export default SchoolPanel;
