import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';

import {
  User,
  Trash2,
  Plus,
  X,
  Edit,
  Eye,
  EyeOff,
  MapPin,
  Phone,
  Mail,
  LockKeyhole,
  UserIcon,
  XIcon,
  CheckIcon


} from 'lucide-react';

// Helper function to get auth token
const getToken = () => JSON.parse(localStorage.getItem('user'))?.token;

const buildDisplayName = (manager, t) => {
  if (!manager) return t?.unknownManager || 'Unknown Manager';
  const identity = [manager.firstName, manager.lastName].filter(Boolean).join(' ').trim();
  if (identity) return identity;
  if (manager.name) return manager.name;
  if (manager.email) return manager.email;
  return t?.unknownManager || 'Unknown Manager';
};

const extractContact = (manager) => ({
  phone1: manager?.contact?.phone1 || manager?.phone1 || '',
  phone2: manager?.contact?.phone2 || manager?.phone2 || '',
  address: manager?.contact?.address || manager?.address || ''
});

// --- ManagerPanel Component ---
const ManagerPanel = ({ schoolId, schoolName, onClose }) => {
  const { t } = useLanguage();
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
      setError(t.failedToFetchManagers);
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
      setFeedback({ type: 'success', text: t.managerAddedSuccess });
      closeCreateModal();
      await loadManagers();
    } catch (err) {
      const message = err.response?.data?.message || t.failedToCreateManager;
      setFeedback({ type: 'error', text: message });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteManager = async (managerId) => {
    if (!confirm(t.removeManagerConfirm)) return;
    try {
      await axios.delete(`/api/schools/${schoolId}/managers/${managerId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setFeedback({ type: 'success', text: t.managerRemovedSuccess });
      await loadManagers();
    } catch (err) {
      const message = err.response?.data?.message || t.failedToDeleteManager;
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
      setFeedback({ type: 'success', text: t.managerUpdatedSuccess });
      await loadManagers();
    } catch (err) {
      const message = err.response?.data?.message || t.failedToUpdateManager;
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
        <p className="text-gray-500 mt-2">{t.loadingManagers}</p>
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
            {t.managersDescription}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Close"
          >
            <XIcon />
          </button>
        )}
      </div>

      {/* Surface inline feedback for add/edit/delete operations */}
      {feedback && (
        <div
          className={`border rounded-lg px-4 py-3 text-sm ${feedback.type === 'success'
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
          <h4 className="font-semibold text-gray-700">{t.currentManagers} ({managers.length})</h4>
          <button
            type="button"
            onClick={() => {
              resetAddForm();
              setFeedback(null);
              setCreateModal(true);
            }}
            className="bg-blue-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t.addManager}
          </button>
        </div>

        {managers.length > 0 ? (
          <div className="space-y-3">
            {managers.map(manager => {
              const displayName = buildDisplayName(manager, t);
              const contact = extractContact(manager);

              return (
                <div key={manager._id} className="flex items-start justify-between bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{displayName}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {manager.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1.5 ml-1">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <span>{contact.address || <span className="text-gray-400 italic">{t.noAddress || 'No address'}</span>}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <span>
                          {contact.phone1 ? (
                            <>
                              {contact.phone1}
                              {contact.phone2 && <span className="text-gray-400 mx-1">|</span>}
                              {contact.phone2}
                            </>
                          ) : (
                            <span className="text-gray-400 italic">{t.noPhone || 'No phone'}</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openView(manager)}
                      className="text-gray-600 hover:bg-gray-100 p-2 rounded-md transition-colors"
                      title="View Manager"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEdit(manager)}
                      className="text-blue-600 hover:bg-blue-50 p-2 rounded-md transition-colors"
                      title="Edit Manager"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteManager(manager._id)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded-md transition-colors"
                      title="Remove Manager"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
              <User className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">{t.noManagersFound} {schoolName}.</p>
            <p className="text-sm text-gray-500 mt-1">{t.addManagerUsingForm}</p>
          </div>
        )}
      </div>
      {viewModal.open && viewModal.manager && viewContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative">
            <button
              onClick={() => setViewModal({ open: false, manager: null })}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-800">{buildDisplayName(viewModal.manager, t)}</h4>
                  <p className="text-sm text-gray-500">{t.manager} · {schoolName}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                    <User className="w-3 h-3" /> {t.account}
                  </h5>
                  <dl className="space-y-3 text-sm text-gray-600">
                    <div>
                      <dt className="font-medium text-gray-700 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" /> {t.email}</dt>
                      <dd className="mt-1 break-words pl-5">{viewModal.manager.email || <span className="text-gray-400 italic">N/A</span>}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-700 flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-gray-400" /> {t.username}</dt>
                      <dd className="mt-1 pl-5">{viewModal.manager.username || <span className="text-gray-400 italic">{t.notSet}</span>}</dd>
                    </div>
                  </dl>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {t.contact}
                  </h5>
                  <dl className="space-y-3 text-sm text-gray-600">
                    <div>
                      <dt className="font-medium text-gray-700 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-400" /> {t.address}</dt>
                      <dd className="mt-1 break-words pl-5">{viewContact.address || <span className="text-gray-400 italic">N/A</span>}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-700 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" />{t.primaryPhone}</dt>
                      <dd className="mt-1 pl-5">{viewContact.phone1 || <span className="text-gray-400 italic">N/A</span>}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-700 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" />{t.secondaryPhone}</dt>
                      <dd className="mt-1 pl-5">{viewContact.phone2 || <span className="text-gray-400 italic">N/A</span>}</dd>
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
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl relative">
            <button
              onClick={closeCreateModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              title="Close"
              disabled={submitting}
            >
              <X className="w-5 h-5" />
            </button>
            <form onSubmit={createManager} className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800">{t.registerNewManager}</h4>
              <p className="text-sm text-gray-500">
                {t.provideManagerDetails} {schoolName}.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  placeholder="First Name *"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                  disabled={submitting}
                />
                <input
                  className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
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
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showPassword ? t.hide : t.show}
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
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? t.registering : t.registerManager}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
            <button
              onClick={() => setEditModal({ open: false, manager: null })}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <form onSubmit={saveEdit} className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800">{t.editManager}</h4>
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
                {t.passwordChangeSeparate}
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditModal({ open: false, manager: null })}
                  className="px-4 py-2 rounded bg-gray-200 text-gray-800"
                  disabled={updating}
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
                  disabled={updating}
                >
                  {updating ? t.saving : t.saveChanges}
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
