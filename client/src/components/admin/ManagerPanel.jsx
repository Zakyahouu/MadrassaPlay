import React, { useState, useEffect } from 'react';
import axios from 'axios';

// --- SVG ICONS ---
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1-2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;

// Helper function to get auth token
const getToken = () => JSON.parse(localStorage.getItem('user'))?.token;

// --- ManagerPanel Component ---
const ManagerPanel = ({ schoolId, schoolName, onClose }) => {
  const [managers, setManagers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ 
    firstName: '', 
    lastName: '',
    email: '', 
    password: '',
    address: '',
    phone1: '',
    phone2: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const loadManagers = async () => {
    if (!schoolId) return;
    setIsLoading(true);
    try {
      const { data } = await axios.get(`/api/schools/${schoolId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setManagers(data.managers || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch managers');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    loadManagers(); 
  }, [schoolId]);

  const createManager = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const managerPayload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        address: form.address,
        phone1: form.phone1,
        phone2: form.phone2,
        role: 'manager',
        school: schoolId
      };

      await axios.post('/api/users/register', managerPayload, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setForm({ firstName: '', lastName: '', email: '', password: '', address: '', phone1: '', phone2: '' });
      await loadManagers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create manager');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteManager = async (managerId) => {
    if (!confirm('Remove this manager? This action cannot be undone.')) return;
    try {
      await axios.delete(`/api/schools/${schoolId}/managers/${managerId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      await loadManagers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete manager');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Loading managers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <UserIcon />
            Managers at {schoolName}
          </h3>
          <p className="text-gray-600 text-sm mb-6">
            Managers can access the school dashboard and manage teachers, students, and school data.
          </p>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Close"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {/* Add Manager Form */}
      <form onSubmit={createManager} className="bg-gray-50 p-4 rounded-lg space-y-4">
        <h4 className="font-semibold text-gray-700 mb-3">Add New Manager</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" 
            placeholder="First Name *" 
            value={form.firstName} 
            onChange={(e) => setForm({...form, firstName: e.target.value})} 
            required 
          />
          <input 
            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" 
            placeholder="Last Name *" 
            value={form.lastName} 
            onChange={(e) => setForm({...form, lastName: e.target.value})} 
            required 
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" 
            placeholder="Email *" 
            type="email" 
            value={form.email} 
            onChange={(e) => setForm({...form, email: e.target.value})} 
            required 
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" 
            placeholder="Password *" 
            type="password" 
            value={form.password} 
            onChange={(e) => setForm({...form, password: e.target.value})} 
            required 
          />
          <input 
            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" 
            placeholder="Address *" 
            value={form.address} 
            onChange={(e) => setForm({...form, address: e.target.value})} 
            required 
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" 
            placeholder="Primary Phone *" 
            value={form.phone1} 
            onChange={(e) => setForm({...form, phone1: e.target.value})} 
            required 
          />
          <input 
            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" 
            placeholder="Secondary Phone" 
            value={form.phone2} 
            onChange={(e) => setForm({...form, phone2: e.target.value})} 
          />
        </div>
        
        <button 
          type="submit" 
          disabled={submitting}
          className="bg-blue-600 text-white rounded-lg px-4 py-3 font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <PlusIcon />
          {submitting ? 'Adding Manager...' : 'Add Manager'}
        </button>
      </form>

      {/* Managers List */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-700">Current Managers ({managers.length})</h4>
        
        {managers.length > 0 ? (
          <div className="space-y-3">
            {managers.map(manager => {
              const displayName = manager.firstName && manager.lastName 
                ? `${manager.firstName} ${manager.lastName}` 
                : manager.name || 'Unknown Manager';
                
              return (
                <div key={manager._id} className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserIcon />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{displayName}</p>
                        <p className="text-sm text-gray-500">{manager.email}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Address:</strong> {manager.address || 'N/A'}</p>
                      <p><strong>Phone:</strong> {manager.phone1 || 'N/A'} {manager.phone2 && `| ${manager.phone2}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {/* TODO: Add edit manager functionality */}}
                      className="text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md transition-colors flex items-center gap-1"
                      title="Edit Manager"
                    >
                      <EditIcon />
                      Edit
                    </button>
                    <button 
                      onClick={() => deleteManager(manager._id)} 
                      className="text-red-600 hover:bg-red-50 px-3 py-2 rounded-md transition-colors flex items-center gap-1"
                      title="Remove Manager"
                    >
                      <TrashIcon />
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <UserIcon />
            <p className="text-gray-500 mt-2">No managers found for {schoolName}.</p>
            <p className="text-sm text-gray-400 mt-1">Add a manager using the form above.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerPanel;
