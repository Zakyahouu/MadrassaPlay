import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Eye, X, Shield } from 'lucide-react';

const getUser = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };
const authConfig = () => ({ headers: { Authorization: `Bearer ${getUser()?.token}` } });

const EmployeesTab = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ type: '', contractType: '' });
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.contractType) params.append('contractType', filters.contractType);
      const { data } = await axios.get(`/api/employees?${params.toString()}`, authConfig());
      
      // The API returns { success: true, data: employees }
      if (data && data.success && Array.isArray(data.data)) {
        setItems(data.data);
      } else {
        console.warn('API response is not in expected format:', data);
        setItems([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch employees');
      setItems([]); // Ensure items is always an array even on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [filters.type, filters.contractType]);

  const filtered = useMemo(() => {
    if (!Array.isArray(items)) {
      console.warn('items is not an array:', items);
      return [];
    }
    return items.filter(x => {
      if (!x || typeof x !== 'object') return false;
      const searchText = `${x.firstName || ''} ${x.lastName || ''} ${x.contact?.phone1 || ''}`.toLowerCase();
      return searchText.includes(search.toLowerCase());
    });
  }, [items, search]);

  const onSave = async (form) => {
    try {
      // Strip permissions so UI remains non-functional for backend
      const payload = { ...form };
      if (payload.permissions) delete payload.permissions;
      // Remove banking always
      delete payload.banking;
      if (modal.mode === 'edit') {
        const { data } = await axios.put(`/api/employees/${modal.data._id}`, payload, authConfig());
        setItems(prev => prev.map(i => i._id === data._id ? data : i));
      } else {
        const { data } = await axios.post('/api/employees', payload, authConfig());
        setItems(prev => [data, ...prev]);
      }
      setModal({ open: false, mode: 'create', data: null });
    } catch (err) {
      alert(err.response?.data?.message || 'Save failed');
    }
  };

  const onDelete = async (item) => {
    if (!confirm(`Delete ${item.firstName} ${item.lastName}?`)) return;
    try {
      await axios.delete(`/api/employees/${item._id}`, authConfig());
      setItems(prev => prev.filter(i => i._id !== item._id));
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">All Employees</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => setModal({ open: true, mode: 'create', data: null })}
            className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 mb-4">
        <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search by name or phone..."
          className="w-full md:w-64 p-2 border border-gray-300 rounded-md" />
        <select value={filters.type} onChange={(e)=>setFilters(prev=>({...prev, type:e.target.value}))}
          className="w-full md:w-48 p-2 border border-gray-300 rounded-md">
          <option value="">All Types</option>
          <option>Staff</option>
          <option>Other</option>
        </select>
        <input value={filters.contractType} onChange={(e)=>setFilters(prev=>({...prev, contractType:e.target.value}))}
          placeholder="Filter by contract type" className="w-full md:w-48 p-2 border border-gray-300 rounded-md" />
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500">No employees found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(e => (
            <div key={e._id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-semibold">{e.firstName} {e.lastName}</div>
                  <div className="text-sm text-gray-600">{e.type} {e.contractType? `• ${e.contractType}`:''}</div>
                </div>
                {e.type === 'Staff' && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-purple-50 text-purple-700 border border-purple-200">
                    <Shield className="w-3 h-3"/> Permissions
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-700 mb-3">
                <div>{e.contact?.phone1}</div>
                {e.contact?.email && <div>{e.contact.email}</div>}
              </div>
              <div className="flex items-center gap-3">
                <button className="text-blue-600 hover:underline" onClick={()=>setModal({ open:true, mode:'view', data:e })}><Eye className="inline w-4 h-4"/> View</button>
                <button className="text-indigo-600 hover:underline" onClick={()=>setModal({ open:true, mode:'edit', data:e })}><Edit className="inline w-4 h-4"/> Edit</button>
                <button className="text-red-600 hover:underline" onClick={()=>onDelete(e)}><Trash2 className="inline w-4 h-4"/> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <EmployeeModal mode={modal.mode} data={modal.data} onClose={()=>setModal({ open:false, mode:'create', data:null })} onSave={onSave} />
      )}
    </div>
  );
};

const EmployeeModal = ({ mode, data, onClose, onSave }) => {
  const [form, setForm] = useState({
    type: data?.type || 'Staff',
    firstName: data?.firstName || '',
    lastName: data?.lastName || '',
    contact: {
      phone1: data?.contact?.phone1 || '',
      phone2: data?.contact?.phone2 || '',
      email: data?.contact?.email || '',
      address: data?.contact?.address || '',
    },
    educationLevel: data?.educationLevel || '',
    contractType: data?.contractType || '',
    startDate: data?.startDate ? data.startDate.substring(0,10) : '',
    salary: data?.salary ?? '',
    // banking removed (UI not needed)
    // Only for Staff
    permissions: data?.permissions || [],
    username: '',
    password: '',
    status: data?.status || 'active',
  });

  const readonly = mode==='view';

  const submit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (form.type !== 'Staff') {
      delete payload.username; delete payload.password; delete payload.permissions;
    }
    onSave(payload);
  };

  const togglePerm = () => {};

  const permissionsList = ['manage_classes','manage_students','manage_equipment','manage_rooms'];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl relative" onClick={e=>e.stopPropagation()}>
        <button className="absolute top-3 right-3 text-gray-500" onClick={onClose}><X/></button>
        <h4 className="text-lg font-semibold mb-4">
          {mode==='edit'?'Edit Employee':mode==='view'?'Employee Profile':'Add Employee'}
        </h4>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Type</label>
              <select disabled={readonly} className="w-full p-2 border rounded" value={form.type} onChange={(e)=>setForm({...form, type:e.target.value})}>
                <option>Staff</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">First Name</label>
              <input disabled={readonly} className="w-full p-2 border rounded" value={form.firstName} onChange={(e)=>setForm({...form, firstName:e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Last Name</label>
              <input disabled={readonly} className="w-full p-2 border rounded" value={form.lastName} onChange={(e)=>setForm({...form, lastName:e.target.value})} required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Phone 1</label>
              <input disabled={readonly} className="w-full p-2 border rounded" value={form.contact.phone1} onChange={(e)=>setForm({...form, contact:{...form.contact, phone1:e.target.value}})} required />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Phone 2 (optional)</label>
              <input disabled={readonly} className="w-full p-2 border rounded" value={form.contact.phone2} onChange={(e)=>setForm({...form, contact:{...form.contact, phone2:e.target.value}})} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Email</label>
              {form.type === 'Staff' ? (
                <input type="email" disabled={readonly} className="w-full p-2 border rounded" value={form.contact.email} onChange={(e)=>setForm({...form, contact:{...form.contact, email:e.target.value}})} />
              ) : (
                <input type="email" disabled className="w-full p-2 border rounded opacity-50" value="" placeholder="Not required" />
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Address</label>
              <input disabled={readonly} className="w-full p-2 border rounded" value={form.contact.address} onChange={(e)=>setForm({...form, contact:{...form.contact, address:e.target.value}})} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Education Level</label>
              <select disabled={readonly} className="w-full p-2 border rounded" value={form.educationLevel} onChange={(e)=>setForm({...form, educationLevel:e.target.value})}>
                <option value="">Select…</option>
                <option value="Baccalaureate">Baccalaureate</option>
                <option value="Licence">Licence</option>
                <option value="Magister">Magister</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Contract Type</label>
              <select disabled={readonly} className="w-full p-2 border rounded" value={form.contractType} onChange={(e)=>setForm({...form, contractType:e.target.value})}>
                <option value="">Select…</option>
                <option value="CDD">CDD</option>
                <option value="CDI">CDI</option>
                <option value="Other">Other</option>
                <option value="Without">Without</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Start Date</label>
              <input type="date" disabled={readonly} className="w-full p-2 border rounded" value={form.startDate} onChange={(e)=>setForm({...form, startDate:e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Salary</label>
              <input type="number" min={0} disabled={readonly} className="w-full p-2 border rounded" value={form.salary} onChange={(e)=>setForm({...form, salary:Number(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Status</label>
              <select disabled={readonly} className="w-full p-2 border rounded" value={form.status} onChange={(e)=>setForm({...form, status:e.target.value})}>
                <option value="active">Active</option>
                <option value="on_vacation">On Vacation</option>
                <option value="stopped">Stopped</option>
              </select>
            </div>
          </div>

          {form.type === 'Staff' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Username</label>
                <input disabled={readonly || mode==='edit'} className="w-full p-2 border rounded" value={form.username} onChange={(e)=>setForm({...form, username:e.target.value})} required={mode!=='edit'} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Password</label>
                <input type="password" disabled={readonly || mode==='edit'} className="w-full p-2 border rounded" value={form.password} onChange={(e)=>setForm({...form, password:e.target.value})} required={mode!=='edit'} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">Permissions (UI only)</label>
                <div className="flex flex-wrap gap-2">
                  {permissionsList.map(p => (
                    <span key={p} className="px-2 py-1 rounded border text-xs bg-gray-50 border-gray-200 text-gray-700 opacity-70 cursor-not-allowed">
                      {p}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">UI only — not saved to backend.</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 border rounded">Close</button>
            {mode!=='view' && (
              <button type="submit" className="px-3 py-2 bg-indigo-600 text-white rounded">Save</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeesTab;
