import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import ManagerPanel from './ManagerPanel';
import SchoolDocuments from './SchoolDocuments';
import SchoolCreationWizard from './SchoolCreationWizard';
import StatusMessage from '../shared/StatusMessage';

// --- SVG ICONS ---
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>;
const EmailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>;
const LocationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2 2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const DocumentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10,9 9,9 8,9"></polyline></svg>;

// --- Helper Functions ---
const getToken = () => JSON.parse(localStorage.getItem('user'))?.token;

// --- StatusBadge Component ---
const StatusBadge = ({ status }) => {
  const getStatusStyle = (status) => {
    switch (status) {
      case 'trial':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'active':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(status)}`}>
      {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown'}
    </span>
  );
};

// --- Enhanced SchoolCard Component ---
const SchoolCard = ({ school, onEdit, onDelete, onViewManagers, onChangeStatus, onViewDocuments }) => {
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const isTrialExpiring = school.status === 'trial' && school.trialExpiresAt && 
    new Date(school.trialExpiresAt) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <div className="group bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg text-gray-900 mb-2">{school.name}</h3>
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge status={school.status} />
            {isTrialExpiring && (
              <span className="text-xs text-red-600 font-medium">
                Trial expires {formatDate(school.trialExpiresAt)}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={onEdit} 
            className="p-1.5 text-yellow-600 hover:bg-yellow-100 rounded-md transition-colors"
            title="Edit School"
          >
            <EditIcon />
          </button>
          <button 
            onClick={() => onChangeStatus(school)} 
            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
            title="Change Status"
          >
            <SettingsIcon />
          </button>
          <button 
            onClick={onDelete} 
            className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors"
            title="Delete School"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
      
      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-2">
          <EmailIcon />
          <span>{school.contact?.email || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2">
          <PhoneIcon />
          <span>{school.contact?.phone || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2">
          <LocationIcon />
          <span className="truncate">{school.contact?.address || 'N/A'}</span>
        </div>
        {school.status === 'trial' && school.trialExpiresAt && (
          <div className="flex items-center gap-2 text-yellow-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>
              Trial: {formatDate(school.createdAt)} - {formatDate(school.trialExpiresAt)}
            </span>
          </div>
        )}
        {school.status === 'active' && school.subscriptionStartDate && (
          <div className="flex items-center gap-2 text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="16,12 12,8 8,12"></polyline>
            </svg>
            <span>Active since: {formatDate(school.subscriptionStartDate)}</span>
          </div>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onViewManagers}
            className="bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full hover:bg-blue-100 hover:text-blue-800 transition-colors font-semibold flex items-center gap-2"
          >
            <UserIcon />
            <span>{school.managers?.length || 0} managers</span>
          </button>
          
          <button
            onClick={onViewDocuments}
            className="bg-purple-100 text-purple-700 text-xs px-3 py-1.5 rounded-full hover:bg-purple-200 hover:text-purple-800 transition-colors font-semibold flex items-center gap-2"
            title="Manage Documents"
          >
            <DocumentIcon />
            <span>Documents</span>
          </button>
        </div>
        
        {school.status === 'trial' && (
          <button
            onClick={() => onChangeStatus(school)}
            className="text-xs text-yellow-600 hover:text-yellow-800 font-medium hover:underline"
            title="Extend trial or upgrade to active"
          >
            Extend Trial
          </button>
        )}
      </div>
    </div>
  );
};

// --- Enhanced School Form Component ---
const SchoolForm = ({ title, schoolToEdit, onSave, onClose }) => {
  const [form, setForm] = useState({
    _id: schoolToEdit?._id || null,
    name: schoolToEdit?.name || '',
    email: schoolToEdit?.contact?.email || schoolToEdit?.email || '',
    phone1: schoolToEdit?.contact?.phone || schoolToEdit?.phone1 || '',
    phone2: schoolToEdit?.phone2 || '',
    address: schoolToEdit?.contact?.address || schoolToEdit?.address || '',
    commercialRegistryNo: schoolToEdit?.commercialRegistryNo || '',
    socialLinks: {
      website: schoolToEdit?.socialLinks?.website || '',
      facebook: schoolToEdit?.socialLinks?.facebook || '',
      twitter: schoolToEdit?.socialLinks?.twitter || '',
      instagram: schoolToEdit?.socialLinks?.instagram || ''
    },
    manager: {
      name: '',
      email: '',
      password: '',
      address: '',
      phone1: '',
      phone2: ''
    }
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(form);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
      
      {/* School Information */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-700 border-b pb-2">School Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            name="name" 
            value={form.name} 
            onChange={handleChange} 
            placeholder="School Name *" 
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" 
            required 
          />
          <input 
            name="commercialRegistryNo" 
            value={form.commercialRegistryNo} 
            onChange={handleChange} 
            placeholder="Commercial Registry No *" 
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" 
            required 
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            name="email" 
            value={form.email} 
            onChange={handleChange} 
            placeholder="Email *" 
            type="email" 
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" 
            required 
          />
          <input 
            name="phone1" 
            value={form.phone1} 
            onChange={handleChange} 
            placeholder="Primary Phone *" 
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" 
            required 
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            name="phone2" 
            value={form.phone2} 
            onChange={handleChange} 
            placeholder="Secondary Phone" 
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" 
          />
          <input 
            name="address" 
            value={form.address} 
            onChange={handleChange} 
            placeholder="Address *" 
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" 
            required 
          />
        </div>
      </div>

      {/* Social Links */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-700 border-b pb-2">Social Links</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            name="socialLinks.website" 
            value={form.socialLinks.website} 
            onChange={handleChange} 
            placeholder="Website URL" 
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" 
          />
          <input 
            name="socialLinks.facebook" 
            value={form.socialLinks.facebook} 
            onChange={handleChange} 
            placeholder="Facebook URL" 
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" 
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            name="socialLinks.twitter" 
            value={form.socialLinks.twitter} 
            onChange={handleChange} 
            placeholder="Twitter URL" 
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" 
          />
          <input 
            name="socialLinks.instagram" 
            value={form.socialLinks.instagram} 
            onChange={handleChange} 
            placeholder="Instagram URL" 
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" 
          />
        </div>
      </div>

      {/* Manager Information (only for new schools) */}
      {!schoolToEdit && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-700 border-b pb-2">Initial Manager</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              name="manager.name" 
              value={form.manager.name} 
              onChange={handleChange} 
              placeholder="Manager Name *" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" 
              required 
            />
            <input 
              name="manager.email" 
              value={form.manager.email} 
              onChange={handleChange} 
              placeholder="Manager Email *" 
              type="email" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" 
              required 
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              name="manager.password" 
              value={form.manager.password} 
              onChange={handleChange} 
              placeholder="Manager Password *" 
              type="password" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" 
              required 
            />
            <input 
              name="manager.address" 
              value={form.manager.address} 
              onChange={handleChange} 
              placeholder="Manager Address *" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" 
              required 
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              name="manager.phone1" 
              value={form.manager.phone1} 
              onChange={handleChange} 
              placeholder="Manager Primary Phone *" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" 
              required 
            />
            <input 
              name="manager.phone2" 
              value={form.manager.phone2} 
              onChange={handleChange} 
              placeholder="Manager Secondary Phone" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" 
            />
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-6">
        <button 
          type="button" 
          onClick={onClose} 
          className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-700 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Saving...' : (schoolToEdit ? 'Update' : 'Create')}
        </button>
      </div>
    </form>
  );
};

// --- Status Change Modal ---
const StatusChangeModal = ({ school, onSave, onClose }) => {
  const [newStatus, setNewStatus] = useState(school.status);
  const [trialExtensionDays, setTrialExtensionDays] = useState(30);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let additionalData = {};
      
      // If extending trial or setting to trial, calculate new expiration date
      if (newStatus === 'trial') {
        const newExpirationDate = new Date();
        newExpirationDate.setDate(newExpirationDate.getDate() + trialExtensionDays);
        additionalData.trialExpiresAt = newExpirationDate.toISOString();
      }
      
      // If setting to active, set subscription start date
      if (newStatus === 'active') {
        additionalData.subscriptionStartDate = new Date().toISOString();
      }
      
      await onSave(school._id, newStatus, additionalData);
    } catch (error) {
      console.error('Status update error:', error);
      pushMessage('error', 'Failed to update status: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Change School Status</h3>
      <p className="text-gray-600 mb-4">
        Changing the status of <strong>{school.name}</strong>
      </p>
      
      {school.status === 'trial' && school.trialExpiresAt && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-yellow-700 text-sm">
            <strong>Current Trial:</strong> Expires on {formatDate(school.trialExpiresAt)}
          </p>
        </div>
      )}
      
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">New Status</label>
        <select
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
          required
        >
          <option value="trial">Trial</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {newStatus === 'trial' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {school.status === 'trial' ? 'Extend Trial by (Days)' : 'Trial Duration (Days)'}
          </label>
          <input
            type="number"
            min="1"
            max="365"
            value={trialExtensionDays}
            onChange={(e) => setTrialExtensionDays(parseInt(e.target.value))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
            required
          />
          <p className="text-sm text-gray-600">
            {school.status === 'trial' ? 'New expiration date' : 'Trial will expire on'}: {' '}
            {new Date(Date.now() + trialExtensionDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
          </p>
        </div>
      )}

      {newStatus === 'active' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-700 text-sm">
            ✅ School will be activated with full access. Subscription will start today.
          </p>
        </div>
      )}

      {newStatus === 'inactive' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">
            ⚠️ Setting status to "Inactive" will prevent all users from this school from logging in.
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button 
          type="button" 
          onClick={onClose} 
          className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Status'}
        </button>
      </div>
    </form>
  );
};

// --- Secure Delete Modal Component ---
const SecureDeleteModal = ({ school, onConfirm, onCancel }) => {
  const [confirmText, setConfirmText] = useState('');
  const [countdown, setCountdown] = useState(10);
  const [canDelete, setCanDelete] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setCanDelete(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const isValidConfirm = confirmText === school.name && canDelete;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <TrashIcon />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Delete School</h3>
        <p className="text-sm text-gray-500">
          This action cannot be undone. This will permanently delete the school and all associated data.
        </p>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="font-semibold text-red-800 mb-2">⚠️ This will delete:</h4>
        <ul className="text-sm text-red-700 space-y-1">
          <li>• The school: <strong>{school.name}</strong></li>
          <li>• All managers and their accounts</li>
          <li>• All teachers and their accounts</li>
          <li>• All students and their accounts</li>
          <li>• All classes, rooms, and equipment</li>
          <li>• All game creations and results</li>
          <li>• All assignments and attendance records</li>
        </ul>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type the school name <span className="font-bold text-red-600">{school.name}</span> to confirm:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Enter school name"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
          />
        </div>

        {!canDelete && (
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Please wait <span className="font-bold text-red-600">{countdown}</span> seconds before you can delete
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button 
          onClick={onCancel} 
          className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button 
          onClick={onConfirm} 
          disabled={!isValidConfirm}
          className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isValidConfirm ? 'Delete Forever' : 'Enter school name above'}
        </button>
      </div>
    </div>
  );
};

// --- Main SchoolManager Component ---
const SchoolManager = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState({ type: null, data: null });
  const [messages, setMessages] = useState([]); // { id, variant, text }

  const pushMessage = (variant, text) => {
    const id = Date.now() + Math.random();
    setMessages(prev => [...prev, { id, variant, text }]);
    setTimeout(() => setMessages(prev => prev.filter(m => m.id !== id)), 6000);
  };

  // Fetch schools data
  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      setError(null);
      setLoading(true);
      const { data } = await axios.get('/api/schools', {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setSchools(data || []);
    } catch (err) {
      setError('Failed to fetch schools. Please try again later.');
      console.error('Error fetching schools:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered schools based on search and status
  const filteredSchools = useMemo(() => {
    return schools.filter(school => {
      const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || school.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [schools, searchTerm, statusFilter]);

  // CRUD Handlers
  const handleSaveSchool = async (formData) => {
    const isEditing = !!formData._id;
    
    try {
      if (isEditing) {
        // Update existing school
        const payload = {
          name: formData.name,
          contact: {
            email: formData.email || formData.contact?.email,
            phone: formData.phone1 || formData.contact?.phone,
            address: formData.address || formData.contact?.address
          },
          commercialRegistryNo: formData.commercialRegistryNo,
          socialLinks: formData.socialLinks
        };
        
        const { data: updatedSchool } = await axios.put(`/api/schools/${formData._id}`, payload, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        
        setSchools(prev => prev.map(s => s._id === formData._id ? updatedSchool : s));
        setModal({ type: null, data: null });
        
        // Force refresh to ensure we have latest data
        await fetchSchools();
      } else {
        // Create new school with manager
        const { data: newSchool } = await axios.post('/api/schools', formData, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        
        setSchools(prev => [...prev, newSchool]);
      }
      
      setModal({ type: null, data: null });
    } catch (err) {
      console.error("Save operation failed:", err);
      pushMessage('error', err.response?.data?.message || 'Operation failed. Please try again.');
    }
  };

  const handleStatusChange = async (schoolId, newStatus, additionalData = {}) => {
    try {
      const updatePayload = { 
        status: newStatus,
        ...additionalData
      };
      
      const { data: updatedSchool } = await axios.put(`/api/schools/${schoolId}`, 
        updatePayload, 
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      
      setSchools(prev => prev.map(s => s._id === schoolId ? updatedSchool : s));
      setModal({ type: null, data: null });
      
      // Refresh the school list to ensure we have the latest data
      await fetchSchools();
    } catch (err) {
      console.error("Status update failed:", err);
      pushMessage('error', err.response?.data?.message || 'Failed to update status. Please try again.');
    }
  };

  const handleDeleteSchool = async (schoolId) => {
    try {
      await axios.delete(`/api/schools/${schoolId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      
      setSchools(prev => prev.filter(s => s._id !== schoolId));
      setModal({ type: null, data: null });
    } catch (err) {
      console.error("Delete operation failed:", err);
      pushMessage('error', err.response?.data?.message || 'Failed to delete school. Please try again.');
    }
  };

  // Render loading skeleton
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Schools</h2>
          <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border-2 border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded-full w-28 mt-4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      {messages.length > 0 && (
        <div className="mb-4 space-y-2">
          {messages.map(m => (
            <StatusMessage key={m.id} variant={m.variant} message={m.text} onClose={() => setMessages(prev => prev.filter(x => x.id !== m.id))} />
          ))}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-cyan-600 rounded-full"></div>
          <h2 className="text-2xl font-bold text-gray-800">Schools</h2>
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
            {filteredSchools.length}
          </span>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search schools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-48 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
          />
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="trial">Trial</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          
          <button
            onClick={() => setModal({ type: 'ADD_SCHOOL', data: null })}
            className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all shadow-sm hover:shadow-md flex items-center gap-2 whitespace-nowrap"
          >
            <PlusIcon /> Add School
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Schools Grid */}
      {filteredSchools.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          {schools.length === 0 ? 'No schools found.' : 'No schools match your filters.'}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
          {filteredSchools.map(school => (
            <SchoolCard
              key={school._id}
              school={school}
              onEdit={() => setModal({ type: 'EDIT_SCHOOL', data: school })}
              onDelete={() => setModal({ type: 'DELETE_SCHOOL', data: school })}
              onViewManagers={() => setModal({ type: 'VIEW_MANAGERS', data: school })}
              onViewDocuments={() => setModal({ type: 'VIEW_DOCUMENTS', data: school })}
              onChangeStatus={(school) => setModal({ type: 'CHANGE_STATUS', data: school })}
            />
          ))}
        </div>
      )}

      {/* Modal Renderer */}
      {modal.type && modal.type !== 'ADD_SCHOOL' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setModal({ type: null, data: null })} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
            >
              <CloseIcon />
            </button>
            
            {modal.type === 'EDIT_SCHOOL' && (
              <SchoolForm 
                title="Edit School" 
                schoolToEdit={modal.data} 
                onSave={handleSaveSchool} 
                onClose={() => setModal({ type: null, data: null })} 
              />
            )}
            
            {modal.type === 'CHANGE_STATUS' && (
              <StatusChangeModal 
                school={modal.data} 
                onSave={handleStatusChange} 
                onClose={() => setModal({ type: null, data: null })} 
              />
            )}
            
            {modal.type === 'VIEW_MANAGERS' && (
              <ManagerPanel 
                schoolId={modal.data._id} 
                schoolName={modal.data.name}
                onClose={() => setModal({ type: null, data: null })}
              />
            )}
            
            {modal.type === 'VIEW_DOCUMENTS' && (
              <SchoolDocuments 
                schoolId={modal.data._id} 
                schoolName={modal.data.name}
                onClose={() => setModal({ type: null, data: null })}
              />
            )}
            
            {modal.type === 'DELETE_SCHOOL' && (
              <SecureDeleteModal
                school={modal.data}
                onConfirm={() => handleDeleteSchool(modal.data._id)}
                onCancel={() => setModal({ type: null, data: null })}
              />
            )}
          </div>
        </div>
      )}

      {/* School Creation Wizard */}
      {modal.type === 'ADD_SCHOOL' && (
        <SchoolCreationWizard
          onClose={() => setModal({ type: null, data: null })}
          onSchoolCreated={fetchSchools}
        />
      )}

      {/* Status Messages */}
      <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm">
        {messages.map(msg => (
          <StatusMessage key={msg.id} variant={msg.variant} text={msg.text} />
        ))}
      </div>
    </div>
  );
};

export default SchoolManager;
