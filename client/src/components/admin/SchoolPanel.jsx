import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

// --- SVG ICONS ---
// A collection of SVG icons used throughout the application for a clean and consistent UI.
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;


// --- ManagerPanel Component ---
// This component is displayed inside a modal to show and manage managers for a specific school.
const ManagerPanel = ({ schoolId, schoolName }) => {
    const [managers, setManagers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [editModal, setEditModal] = useState({ open: false, manager: null });
    const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', username: '', contact: { phone1: '', phone2: '', address: '' }, password: '' });

        const load = async () => {
        if (!schoolId) return;
        setIsLoading(true);
        try {
                const token = JSON.parse(localStorage.getItem('user'))?.token;
                const { data } = await axios.get(`/api/schools/${schoolId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            setManagers(data.managers || []);
            setError(null);
        } catch (err) {
            setError('Failed to fetch managers');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { load(); }, [schoolId]);

        const createManager = async (e) => {
        e.preventDefault();
        try {
                const token = JSON.parse(localStorage.getItem('user'))?.token;
                await axios.post(`/api/schools/${schoolId}/managers`, form, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            setForm({ name: '', email: '', password: '' });
            await load();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create manager');
        }
    };

        const deleteManager = async (managerId) => {
        if (!confirm('Remove this manager?')) return;
        try {
                const token = JSON.parse(localStorage.getItem('user'))?.token;
                await axios.delete(`/api/schools/${schoolId}/managers/${managerId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            await load();
        } catch (err) {
            alert('Failed to delete manager');
        }
    };

        const openEdit = (m) => {
            setEditForm({
                firstName: '',
                lastName: '',
                email: '',
                username: '',
                contact: { phone1: '', phone2: '', address: '' },
                password: ''
            });
            setEditModal({ open: true, manager: m });
        };

        const saveEdit = async (e) => {
            e.preventDefault();
            try {
                const token = JSON.parse(localStorage.getItem('user'))?.token;
                const payload = {};
                if (editForm.firstName && editForm.firstName.trim()) payload.firstName = editForm.firstName.trim();
                if (editForm.lastName && editForm.lastName.trim()) payload.lastName = editForm.lastName.trim();
                if (editForm.email && editForm.email.trim()) payload.email = editForm.email.trim();
                if (editForm.username && editForm.username.trim()) payload.username = editForm.username.trim();
                const contact = {};
                if (editForm.contact.phone1 && editForm.contact.phone1.trim()) contact.phone1 = editForm.contact.phone1.trim();
                if (editForm.contact.phone2 && editForm.contact.phone2.trim()) contact.phone2 = editForm.contact.phone2.trim();
                if (editForm.contact.address && editForm.contact.address.trim()) contact.address = editForm.contact.address.trim();
                if (Object.keys(contact).length) payload.contact = contact;
                if (editForm.password && editForm.password.trim()) payload.password = editForm.password;
                await axios.put(`/api/schools/${schoolId}/managers/${editModal.manager._id}`,
                    payload,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setEditModal({ open: false, manager: null });
                await load();
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to update manager');
            }
        };

    if (isLoading) return <div className="text-center p-4">Loading managers...</div>;
    if (error) return <div className="text-center p-4 text-red-600">{error}</div>;

    return (
        <div className="space-y-4">
            <form onSubmit={createManager} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input className="border p-2 rounded" placeholder="Name" value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} required />
                <input className="border p-2 rounded" placeholder="Email" type="email" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} required />
                <input className="border p-2 rounded" placeholder="Password" type="password" value={form.password} onChange={(e)=>setForm({...form, password:e.target.value})} required />
                <button type="submit" className="bg-blue-600 text-white rounded px-3 py-2">Add Manager</button>
            </form>
            <div className="space-y-3">
                {managers.length > 0 ? managers.map(m => (
                    <div key={m._id} className="flex items-center justify-between bg-gray-100 p-3 rounded-lg">
                        <div>
                            <p className="font-semibold text-gray-800">{m.name}</p>
                            <p className="text-sm text-gray-500">{m.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={()=>openEdit(m)} className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded">Edit</button>
                            <button onClick={()=>deleteManager(m._id)} className="text-red-600 hover:bg-red-50 px-3 py-1 rounded">Delete</button>
                        </div>
                    </div>
                )) : (
                    <p className="text-center text-gray-500 p-4">No managers found for {schoolName}.</p>
                )}
            </div>

            {/* Edit Manager Modal */}
            {editModal.open && (
                <Modal onClose={() => setEditModal({ open: false, manager: null })}>
                    <form onSubmit={saveEdit} className="space-y-4">
                        <h4 className="text-lg font-semibold">Edit Manager</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input className="border p-2 rounded w-full" placeholder={`First Name${editModal.manager?.firstName ? ` (${editModal.manager.firstName})` : ''}`} value={editForm.firstName} onChange={(e)=>setEditForm({...editForm, firstName: e.target.value})} />
                            <input className="border p-2 rounded w-full" placeholder={`Last Name${editModal.manager?.lastName ? ` (${editModal.manager.lastName})` : ''}`} value={editForm.lastName} onChange={(e)=>setEditForm({...editForm, lastName: e.target.value})} />
                        </div>
                        <input className="border p-2 rounded w-full" placeholder={`Email${editModal.manager?.email ? ` (${editModal.manager.email})` : ''}`} type="email" value={editForm.email} onChange={(e)=>setEditForm({...editForm, email: e.target.value})} />
                        <input className="border p-2 rounded w-full" placeholder={`Username${editModal.manager?.username ? ` (${editModal.manager.username})` : ''}`} value={editForm.username} onChange={(e)=>setEditForm({...editForm, username: e.target.value})} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input className="border p-2 rounded w-full" placeholder={`Phone 1${editModal.manager?.contact?.phone1 ? ` (${editModal.manager.contact.phone1})` : ''}`} value={editForm.contact.phone1} onChange={(e)=>setEditForm({...editForm, contact: { ...editForm.contact, phone1: e.target.value }})} />
                            <input className="border p-2 rounded w-full" placeholder={`Phone 2${editModal.manager?.contact?.phone2 ? ` (${editModal.manager.contact.phone2})` : ''}`} value={editForm.contact.phone2} onChange={(e)=>setEditForm({...editForm, contact: { ...editForm.contact, phone2: e.target.value }})} />
                        </div>
                        <input className="border p-2 rounded w-full" placeholder={`Address${editModal.manager?.contact?.address ? ` (${editModal.manager.contact.address})` : ''}`} value={editForm.contact.address} onChange={(e)=>setEditForm({...editForm, contact: { ...editForm.contact, address: e.target.value }})} />
                        <input className="border p-2 rounded w-full" placeholder="New Password (optional)" type="password" value={editForm.password} onChange={(e)=>setEditForm({...editForm, password: e.target.value})} />
                        <div className="flex gap-2 justify-end">
                            <button type="button" onClick={()=>setEditModal({ open: false, manager: null })} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Cancel</button>
                            <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Save</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};


// --- Main SchoolPanel Component ---
// This is the primary component that orchestrates the entire UI.
const SchoolPanel = () => {
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [modal, setModal] = useState({ type: null, data: null }); // Manages all modals

    const fetchSchools = async () => {
        try {
            setError(null);
            setLoading(true);
            const token = JSON.parse(localStorage.getItem('user'))?.token;
            const { data } = await axios.get('/api/schools', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSchools(data || []);
        } catch (err) {
            setError('Failed to fetch schools. Please try again later.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch initial school data from the API on component mount
    useEffect(() => {
        fetchSchools();
    }, []);

    // Memoized filtering of schools based on the search term for performance
    const filteredSchools = useMemo(() =>
        schools.filter(school =>
            school.name.toLowerCase().includes(searchTerm.toLowerCase())
        ), [schools, searchTerm]);

    // --- CRUD Handlers ---

    const handleSaveSchool = async (formData) => {
        const isEditing = !!formData._id;
        const payload = { 
            name: formData.name, 
            contact: { 
                email: formData.email, 
                phone: formData.phone, 
                address: formData.address 
            } 
        };

        try {
            const token = JSON.parse(localStorage.getItem('user'))?.token;
            if (isEditing) {
                const response = await axios.put(`/api/schools/${formData._id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSchools(prev => prev.map(s => s._id === formData._id ? response.data : s));
                await fetchSchools();
            } else {
                const response = await axios.post('/api/schools', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSchools(prev => [...prev, response.data]);
            }
            setModal({ type: null, data: null }); // Close modal on success
        } catch (err) {
            console.error("SchoolPanel - Save operation failed:", err);
            console.error("SchoolPanel - Error response:", err.response?.data);
            alert('Operation failed. Please check the console for details.');
        }
    };

    const handleDeleteSchool = async (schoolId) => {
        try {
            const token = JSON.parse(localStorage.getItem('user'))?.token;
            await axios.delete(`/api/schools/${schoolId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSchools(prev => prev.filter(s => s._id !== schoolId));
            setModal({ type: null, data: null }); // Close confirmation modal
        } catch (err) {
            console.error("Delete operation failed:", err);
            alert('Failed to delete school. Please try again.');
        }
    };

    // --- Render Logic ---

    const renderContent = () => {
        if (loading) {
            return (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
            );
        }

        if (error) {
            return <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md text-center">{error}</div>;
        }

        if (filteredSchools.length === 0) {
            return <div className="text-center py-10 text-gray-500">No schools found.</div>;
        }

        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredSchools.map(school => (
                    <SchoolCard
                        key={school._id}
                        school={school}
                        onEdit={() => setModal({ type: 'EDIT_SCHOOL', data: school })}
                        onDelete={() => setModal({ type: 'DELETE_SCHOOL', data: school })}
                        onViewManagers={() => setModal({ type: 'VIEW_MANAGERS', data: school })}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-cyan-600 rounded-full"></div>
                    <h2 className="text-2xl font-bold text-gray-800">Schools</h2>
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                        {schools.length}
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
                    <button
                        onClick={() => setModal({ type: 'ADD_SCHOOL', data: null })}
                        className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                    >
                        <PlusIcon /> Add School
                    </button>
                </div>
            </div>

            {renderContent()}

            {/* Modal Renderer */}
            {modal.type && (
                <Modal onClose={() => setModal({ type: null, data: null })}>
                    {modal.type === 'ADD_SCHOOL' && (
                        <SchoolForm title="Add New School" onSave={handleSaveSchool} onClose={() => setModal({ type: null, data: null })} />
                    )}
                    {modal.type === 'EDIT_SCHOOL' && (
                        <SchoolForm title="Edit School" schoolToEdit={modal.data} onSave={handleSaveSchool} onClose={() => setModal({ type: null, data: null })} />
                    )}
                    {modal.type === 'VIEW_MANAGERS' && (
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Managers at {modal.data.name}</h3>
                            <ManagerPanel schoolId={modal.data._id} schoolName={modal.data.name} />
                        </div>
                    )}
                    {modal.type === 'DELETE_SCHOOL' && (
                         <DeleteConfirmation
                            itemName={modal.data.name}
                            onConfirm={() => handleDeleteSchool(modal.data._id)}
                            onCancel={() => setModal({ type: null, data: null })}
                        />
                    )}
                </Modal>
            )}
        </div>
    );
};

// --- Child Components ---

const SchoolCard = ({ school, onEdit, onDelete, onViewManagers }) => (
    <div className="group bg-white p-5 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
        <div>
            <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-lg text-gray-900 pr-2">{school.name}</h3>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={onEdit} className="p-1.5 text-yellow-600 hover:bg-yellow-100 rounded-md"><EditIcon /></button>
                    <button onClick={onDelete} className="p-1.5 text-red-600 hover:bg-red-100 rounded-md"><TrashIcon /></button>
                </div>
            </div>
            <div className="space-y-1.5 text-sm text-gray-600">
                <p>📧 {school.contact?.email || 'N/A'}</p>
                <p>📞 {school.contact?.phone || 'N/A'}</p>
                <p>📍 {school.contact?.address || 'N/A'}</p>
            </div>
        </div>
        <div className="mt-4">
            <button
                onClick={onViewManagers}
                className="bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full hover:bg-blue-100 hover:text-blue-800 transition-colors font-semibold flex items-center gap-2"
            >
                <UserIcon />
                <span>{school.managers?.length || 0} managers</span>
            </button>
        </div>
    </div>
);

const SkeletonCard = () => (
    <div className="bg-white p-5 rounded-xl border-2 border-gray-200">
        <div className="animate-pulse flex flex-col justify-between h-full">
            <div>
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
            </div>
            <div className="h-6 bg-gray-200 rounded-full w-28 mt-4"></div>
        </div>
    </div>
);

const Modal = ({ children, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><CloseIcon /></button>
            {children}
        </div>
    </div>
);

const SchoolForm = ({ title, schoolToEdit, onSave, onClose }) => {
    const [form, setForm] = useState({
        _id: schoolToEdit?._id || null,
        name: schoolToEdit?.name || '',
        email: schoolToEdit?.contact?.email || '',
        phone: schoolToEdit?.contact?.phone || '',
        address: schoolToEdit?.contact?.address || '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
            <div className="space-y-4">
                <input name="name" value={form.name} onChange={handleChange} placeholder="School Name" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" required />
                <input name="email" value={form.email} onChange={handleChange} placeholder="Email" type="email" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" />
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" />
                <input name="address" value={form.address} onChange={handleChange} placeholder="Address" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" />
            </div>
            <div className="flex gap-3 pt-6">
                <button type="button" onClick={onClose} className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-700 transition-colors">
                    {schoolToEdit ? 'Update' : 'Create'}
                </button>
            </div>
        </form>
    );
};

const DeleteConfirmation = ({ itemName, onConfirm, onCancel }) => (
    <div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Confirm Deletion</h3>
        <p className="text-gray-600 mb-6">Are you sure you want to delete <span className="font-semibold">{itemName}</span>? This action cannot be undone.</p>
        <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors">Cancel</button>
            <button onClick={onConfirm} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors">Delete</button>
        </div>
    </div>
);

// Export the actual panel (AdminDashboard handles page layout)
export default SchoolPanel;
