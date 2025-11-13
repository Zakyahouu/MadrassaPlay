import React, { useState, useEffect } from 'react';
import axios from 'axios';

// --- SVG ICONS ---
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1-2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const EyeOpenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const EyeClosedIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-7-11-7a18.45 18.45 0 0 1 5.06-5.94"></path><path d="M9.88 9.88A3 3 0 0 1 12 9a3 3 0 0 1 3 3"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>;

// Helper function to get auth token
const getToken = () => JSON.parse(localStorage.getItem('user'))?.token;

const buildDisplayName = (manager) => {
  if (!manager) return 'Unknown Manager';
  const identity = [manager.firstName, manager.lastName].filter(Boolean).join(' ').trim();
  if (identity) return identity;
  if (manager.name) return manager.name;
  if (manager.email) return manager.email;
  return 'Unknown Manager';
};

const extractContact = (manager) => ({
  phone1: manager?.contact?.phone1 || manager?.phone1 || '',
  phone2: manager?.contact?.phone2 || manager?.phone2 || '',
  address: manager?.contact?.address || manager?.address || ''
});

// --- ManagerPanel Component ---
const ManagerPanel = ({ schoolId, schoolName, onClose }) => {
  const [managers, setManagers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    address: '',
    phone1: '',
    phone2: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [viewModal, setViewModal] = useState({ open: false, manager: null });
  const [editModal, setEditModal] = useState({ open: false, manager: null });
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    contact: { phone1: '', phone2: '', address: '' }
  });

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
      console.error(err);
      setError('Failed to fetch managers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadManagers();
  }, [schoolId]);

  const resetAddForm = () => {
    setForm({ firstName: '', lastName: '', email: '', password: '', address: '', phone1: '', phone2: '' });
    setShowPassword(false);
  };

  const closeCreateModal = () => {
    setCreateModal(false);
    resetAddForm();
    setSubmitting(false);
  };

  const createManager = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const managerPayload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        address: form.address.trim(),
        phone1: form.phone1.trim(),
        phone2: form.phone2.trim(),
        role: 'manager',
        school: schoolId
      };

      await axios.post('/api/users/register', managerPayload, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      resetAddForm();
      setFeedback({ type: 'success', text: 'Manager added successfully.' });
      closeCreateModal();
      await loadManagers();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create manager';
      setFeedback({ type: 'error', text: message });
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
      setFeedback({ type: 'success', text: 'Manager removed successfully.' });
      await loadManagers();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete manager';
      setFeedback({ type: 'error', text: message });
    }
  };

  const openView = (manager) => {
    setViewModal({ open: true, manager });
  };

  const openEdit = (manager) => {
    const contact = extractContact(manager);
    setEditForm({
      firstName: manager.firstName || '',
      lastName: manager.lastName || '',
      email: manager.email || '',
      username: manager.username || '',
      contact
    });
    setEditModal({ open: true, manager });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editModal.manager) return;
    setUpdating(true);
    setFeedback(null);
    try {
      const sanitize = (value) => (typeof value === 'string' ? value.trim() : value);
      const payload = {};
      const firstName = sanitize(editForm.firstName);
      const lastName = sanitize(editForm.lastName);
      const email = sanitize(editForm.email);
      const username = sanitize(editForm.username);
      if (firstName) payload.firstName = firstName;
      if (lastName) payload.lastName = lastName;
      if (email) payload.email = email;
      if (username) payload.username = username;

      const contactPayload = {};
      const phone1 = sanitize(editForm.contact.phone1);
      const phone2 = sanitize(editForm.contact.phone2);
      const address = sanitize(editForm.contact.address);
      if (phone1) contactPayload.phone1 = phone1;
      if (phone2) contactPayload.phone2 = phone2;
      if (address) contactPayload.address = address;
      if (Object.keys(contactPayload).length > 0) {
        payload.contact = contactPayload;
      }

      await axios.put(`/api/schools/${schoolId}/managers/${editModal.manager._id}`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      setEditModal({ open: false, manager: null });
      setFeedback({ type: 'success', text: 'Manager updated successfully.' });
      await loadManagers();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update manager';
      setFeedback({ type: 'error', text: message });
    } finally {
      setUpdating(false);
    }
  };

  const viewContact = viewModal.manager ? extractContact(viewModal.manager) : null;

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

      {/* Surface inline feedback for add/edit/delete operations */}
      {feedback && (
        <div
          className={`border rounded-lg px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Managers List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h4 className="font-semibold text-gray-700">Current Managers ({managers.length})</h4>
          <button
            type="button"
            onClick={() => {
              resetAddForm();
              setFeedback(null);
              setCreateModal(true);
            }}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <PlusIcon />
            Add Manager
          </button>
        </div>
        
        {managers.length > 0 ? (
          <div className="space-y-3">
            {managers.map(manager => {
              const displayName = buildDisplayName(manager);
              const contact = extractContact(manager);
              
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
                      <p><strong>Address:</strong> {contact.address || 'N/A'}</p>
                      <p><strong>Phone:</strong> {contact.phone1 || 'N/A'} {contact.phone2 && `| ${contact.phone2}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openView(manager)}
                      className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md transition-colors flex items-center gap-1"
                      title="View Manager"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => openEdit(manager)}
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
      {viewModal.open && viewModal.manager && viewContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg relative">
            <button
              onClick={() => setViewModal({ open: false, manager: null })}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              title="Close"
            >
              <CloseIcon />
            </button>
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <UserIcon />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-800">{buildDisplayName(viewModal.manager)}</h4>
                  <p className="text-sm text-gray-500">Manager · {schoolName}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Account</h5>
                  <dl className="mt-3 space-y-3 text-sm text-gray-600">
                    <div>
                      <dt className="font-medium text-gray-700">Email</dt>
                      <dd className="mt-1 break-words">{viewModal.manager.email || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-700">Username</dt>
                      <dd className="mt-1">{viewModal.manager.username || 'Not set'}</dd>
                    </div>
                  </dl>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</h5>
                  <dl className="mt-3 space-y-3 text-sm text-gray-600">
                    <div>
                      <dt className="font-medium text-gray-700">Address</dt>
                      <dd className="mt-1 break-words">{viewContact.address || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-700">Primary Phone</dt>
                      <dd className="mt-1">{viewContact.phone1 || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-700">Secondary Phone</dt>
                      <dd className="mt-1">{viewContact.phone2 || 'N/A'}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {createModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl relative">
            <button
              onClick={closeCreateModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              title="Close"
              disabled={submitting}
            >
              <CloseIcon />
            </button>
            <form onSubmit={createManager} className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800">Register New Manager</h4>
              <p className="text-sm text-gray-500">
                Provide the manager details to create their access for {schoolName}.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  placeholder="First Name *"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                  disabled={submitting}
                />
                <input
                  className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  placeholder="Last Name *"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required
                  disabled={submitting}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none md:col-span-2"
                  placeholder="Email *"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  disabled={submitting}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none w-full pr-16"
                    placeholder="Password *"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none md:col-span-2"
                  placeholder="Address *"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  required
                  disabled={submitting}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  placeholder="Primary Phone *"
                  value={form.phone1}
                  onChange={(e) => setForm({ ...form, phone1: e.target.value })}
                  required
                  disabled={submitting}
                />
                <input
                  className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  placeholder="Secondary Phone"
                  value={form.phone2}
                  onChange={(e) => setForm({ ...form, phone2: e.target.value })}
                  disabled={submitting}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-4 py-2 rounded bg-gray-200 text-gray-800"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Register Manager'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md relative">
            <button
              onClick={() => setEditModal({ open: false, manager: null })}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              title="Close"
            >
              <CloseIcon />
            </button>
            <form onSubmit={saveEdit} className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800">Edit Manager</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  placeholder="First Name"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  required
                />
                <input
                  className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  placeholder="Last Name"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  required
                />
              </div>
              <input
                className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-400 focus:outline-none"
                placeholder="Email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                required
              />
              <input
                className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-400 focus:outline-none"
                placeholder="Username"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  placeholder="Primary Phone"
                  value={editForm.contact.phone1}
                  onChange={(e) => setEditForm({ ...editForm, contact: { ...editForm.contact, phone1: e.target.value } })}
                />
                <input
                  className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  placeholder="Secondary Phone"
                  value={editForm.contact.phone2}
                  onChange={(e) => setEditForm({ ...editForm, contact: { ...editForm.contact, phone2: e.target.value } })}
                />
              </div>
              <input
                className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-400 focus:outline-none"
                placeholder="Address"
                value={editForm.contact.address}
                onChange={(e) => setEditForm({ ...editForm, contact: { ...editForm.contact, address: e.target.value } })}
              />
              <p className="text-xs text-gray-500">
                Password changes are handled separately. Updating details here will not affect the manager's password.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditModal({ open: false, manager: null })}
                  className="px-4 py-2 rounded bg-gray-200 text-gray-800"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
                  disabled={updating}
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerPanel;
