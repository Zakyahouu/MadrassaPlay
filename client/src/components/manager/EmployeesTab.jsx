import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Eye, X, Shield } from 'lucide-react';

const getUser = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };
const authConfig = () => { 
  const user = getUser();
  if (!user?.token) {
    console.error('No authentication token found');
  }
  return { headers: { Authorization: `Bearer ${user?.token}` } }; 
};

const EmployeesTab = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ type: '', role: '' });
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });

  // Debug user data
  useEffect(() => {
    const user = getUser();
    console.log('Current user data:', user);
    console.log('User school:', user?.school);
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.role) params.append('role', filters.role);
      
      const { data } = await axios.get(`/api/employees?${params.toString()}`, authConfig());
      
      // The API returns { success: true, data: employees }
      if (data && data.success && Array.isArray(data.data)) {
        setItems(data.data);
      } else {
        console.warn('API response is not in expected format:', data);
        setItems([]);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to fetch employees');
      setItems([]); // Ensure items is always an array even on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [filters.type, filters.role]);

  const filtered = useMemo(() => {
    if (!Array.isArray(items)) {
      console.warn('items is not an array:', items);
      return [];
    }
    const filteredItems = items.filter(x => {
      if (!x || typeof x !== 'object') return false;
      
      // Search filter
      const searchText = `${x.name || ''} ${x.role || ''} ${x.phone || ''}`.toLowerCase();
      const matchesSearch = searchText.includes(search.toLowerCase());
      
      // Type filter
      const matchesType = !filters.type || (x.employeeType || 'other') === filters.type;
      
      // Role filter
      const matchesRole = !filters.role || x.role === filters.role;
      
      return matchesSearch && matchesType && matchesRole;
    });
    return filteredItems;
  }, [items, search, filters.type, filters.role]);

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
      console.error('Save error:', err);
      alert(err.response?.data?.message || 'Save failed');
    }
  };

  const onDelete = async (item) => {
    if (!confirm(`Delete ${item.name}?`)) return;
    try {
      await axios.delete(`/api/employees/${item._id}`, authConfig());
      setItems(prev => prev.filter(i => i._id !== item._id));
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Employee Management</h2>
              <p className="text-sm text-gray-500">
                Manage non-teacher staff members and their information
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setModal({ open: true, mode: 'create', data: null })}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4" /> Add Employee
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input 
              value={search} 
              onChange={(e)=>setSearch(e.target.value)} 
              placeholder="Search by name, role, or phone..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <select 
              value={filters.type} 
              onChange={(e)=>setFilters(prev=>({...prev, type:e.target.value}))}
              className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="staff">Staff (Platform Access)</option>
              <option value="other">Other (No Platform Access)</option>
            </select>
            <select 
              value={filters.role} 
              onChange={(e)=>setFilters(prev=>({...prev, role:e.target.value}))}
              className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              <option value="Janitor">Janitor</option>
              <option value="Secretary">Secretary</option>
              <option value="Security Guard">Security Guard</option>
              <option value="Maintenance Worker">Maintenance Worker</option>
              <option value="Cleaner">Cleaner</option>
              <option value="Receptionist">Receptionist</option>
              <option value="Administrative Assistant">Administrative Assistant</option>
              <option value="IT Support">IT Support</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading employees...</p>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="text-red-600 mr-3">⚠️</div>
            <div>
              <h3 className="text-lg font-medium text-red-800">Error Loading Employees</h3>
              <p className="text-red-600 mt-1">{error}</p>
              {error.includes('No school associated') && (
                <p className="text-sm text-red-500 mt-2">
                  Please contact an administrator to associate your account with a school.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
            <p className="text-gray-500 mb-6">
              {search || filters.type || filters.role
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by adding your first employee'
              }
            </p>
            {!search && !filters.type && !filters.role && (
              <button
                onClick={() => setModal({ open: true, mode: 'create', data: null })}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Employee
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(e => (
            <div key={e._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-semibold text-lg text-gray-900">{e.name}</div>
                  <div className="text-sm text-gray-600">{e.role}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                      (e.employeeType || 'other') === 'staff' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {(e.employeeType || 'other') === 'staff' ? 'Staff' : 'Other'}
                    </span>
                    {(e.employeeType || 'other') === 'staff' && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        🔐 Platform Access
                      </span>
                    )}
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                  e.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {e.status}
                </span>
              </div>
              <div className="text-sm text-gray-700 mb-4 space-y-1">
                {e.phone && <div>📞 {e.phone}</div>}
                {e.email && <div>✉️ {e.email}</div>}
                {(e.employeeType || 'other') === 'staff' && e.username && (
                  <div className="text-blue-600">👤 {e.username}</div>
                )}
                <div className="font-medium text-blue-600">
                  {e.salaryType === 'fixed' ? 'Monthly' : 'Hourly'}: {e.salaryValue ? `$${e.salaryValue}` : 'Not set'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors" 
                  onClick={()=>setModal({ open:true, mode:'view', data:e })}
                >
                  <Eye className="w-4 h-4"/> View
                </button>
                <button 
                  className="flex items-center gap-1 px-3 py-2 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors" 
                  onClick={()=>setModal({ open:true, mode:'edit', data:e })}
                >
                  <Edit className="w-4 h-4"/> Edit
                </button>
                <button 
                  className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors" 
                  onClick={()=>onDelete(e)}
                >
                  <Trash2 className="w-4 h-4"/> Delete
                </button>
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
    name: data?.name || '',
    role: data?.role || '',
    employeeType: data?.employeeType || 'other', // 'staff' or 'other'
    salaryType: data?.salaryType || 'fixed',
    salaryValue: data?.salaryValue || '',
    hireDate: data?.hireDate ? (typeof data.hireDate === 'string' ? data.hireDate.substring(0,10) : new Date(data.hireDate).toISOString().substring(0,10)) : '',
    phone: data?.phone || '',
    email: data?.email || '',
    address: data?.address || '',
    notes: data?.notes || '',
    status: data?.status || 'active',
    // Platform access fields (only for staff)
    username: data?.username || '',
    password: data?.password || '',
    // Permissions (only for staff)
    permissions: {
      finance: data?.permissions?.finance || false,
      logs: data?.permissions?.logs || false
    }
  });


  // Update form when data changes
  useEffect(() => {
    if (data) {
      setForm({
        name: data.name || '',
        role: data.role || '',
        employeeType: data.employeeType || 'other',
        salaryType: data.salaryType || 'fixed',
        salaryValue: data.salaryValue || '',
        hireDate: data.hireDate ? (typeof data.hireDate === 'string' ? data.hireDate.substring(0,10) : new Date(data.hireDate).toISOString().substring(0,10)) : '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        notes: data.notes || '',
        status: data.status || 'active',
        username: data.username || '',
        password: data.password || '',
        permissions: {
          finance: data?.permissions?.finance || false,
          logs: data?.permissions?.logs || false
        }
      });
    } else {
      // Reset form for new employee
      setForm({
        name: '',
        role: '',
        employeeType: 'other',
        salaryType: 'fixed',
        salaryValue: '',
        hireDate: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
        status: 'active',
        username: '',
        password: '',
        permissions: {
          finance: false,
          logs: false
        }
      });
    }
  }, [data]);

  // Reset role when employeeType changes
  useEffect(() => {
    if (form.employeeType === 'staff') {
      // Reset role to empty for staff if current role is not valid for staff
      if (form.role && !['Administrative Assistant', 'Secretary', 'IT Support', 'Receptionist', 'Other'].includes(form.role)) {
        setForm(prev => ({ ...prev, role: '' }));
      }
    } else {
      // Reset role to empty for other if current role is not valid for other
      if (form.role && !['Janitor', 'Security Guard', 'Maintenance Worker', 'Cleaner', 'Other'].includes(form.role)) {
        setForm(prev => ({ ...prev, role: '' }));
      }
    }
  }, [form.employeeType]);









  const readonly = mode==='view';

  const submit = (e) => {
    e.preventDefault();
    
    const payload = { 
      ...form,
      salaryValue: parseFloat(form.salaryValue) || 0
    };
    
    console.log('Form submission payload:', payload);
    console.log('Permissions being sent:', payload.permissions);
    
    // Remove platform access fields if not staff
    if (form.employeeType !== 'staff') {
      delete payload.username;
      delete payload.password;
      delete payload.permissions;
    }
    
    console.log('Final payload being sent:', payload);
    onSave(payload);
  };

  const togglePerm = () => {};

  const permissionsList = ['manage_classes','manage_students','manage_equipment','manage_rooms'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative" onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mode==='edit'?'Edit Employee':mode==='view'?'Employee Profile':'Add New Employee'}
              </h2>
              <p className="text-sm text-gray-500">
                {mode==='edit'?'Update employee information':mode==='view'?'View employee details':'Add a new non-teacher staff member'}
              </p>
            </div>
          </div>
          <button 
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg" 
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        {/* Form Content */}
        <div className="p-6">
          <form onSubmit={submit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee Type *</label>
                <select 
                  disabled={readonly} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                  value={form.employeeType} 
                  onChange={(e)=>setForm({...form, employeeType:e.target.value})}
                  required
                >
                  <option value="">Select employee type</option>
                  <option value="staff">Staff (Platform Access)</option>
                  <option value="other">Other (No Platform Access)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {form.employeeType === 'staff' 
                    ? 'Staff members can access the platform with email and password'
                    : 'Other employees do not need platform access'
                  }
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input 
                  disabled={readonly} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                  value={form.name} 
                  onChange={(e)=>setForm({...form, name:e.target.value})} 
                  placeholder="Enter full name"
                  required 
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                <select 
                  disabled={readonly} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                  value={form.role} 
                  onChange={(e)=>setForm({...form, role:e.target.value})}
                  required
                >
                  <option value="">Select a role</option>
                  {form.employeeType === 'staff' ? (
                    <>
                      <option value="Administrative Assistant">Administrative Assistant</option>
                      <option value="Secretary">Secretary</option>
                      <option value="IT Support">IT Support</option>
                      <option value="Receptionist">Receptionist</option>
                      <option value="Other">Other</option>
                    </>
                  ) : (
                    <>
                      <option value="Janitor">Janitor</option>
                      <option value="Security Guard">Security Guard</option>
                      <option value="Maintenance Worker">Maintenance Worker</option>
                      <option value="Cleaner">Cleaner</option>
                      <option value="Other">Other</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input 
                  disabled={readonly} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                  value={form.phone} 
                  onChange={(e)=>setForm({...form, phone:e.target.value})} 
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email {form.employeeType === 'staff' && '*'}
                </label>
                <input 
                  type="email" 
                  disabled={readonly} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                  value={form.email} 
                  onChange={(e)=>setForm({...form, email:e.target.value})} 
                  placeholder="Email address"
                  required={form.employeeType === 'staff'}
                />
                {form.employeeType === 'staff' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Required for platform access
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <textarea 
                disabled={readonly} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                value={form.address} 
                onChange={(e)=>setForm({...form, address:e.target.value})} 
                placeholder="Address"
                rows={2}
              />
            </div>
          </div>

          {/* Salary Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Salary Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Salary Type *</label>
                <select 
                  disabled={readonly} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                  value={form.salaryType} 
                  onChange={(e)=>setForm({...form, salaryType:e.target.value})}
                  required
                >
                  <option value="fixed">Fixed Monthly</option>
                  <option value="hourly">Hourly Rate</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {form.salaryType === 'fixed' ? 'Monthly Salary' : 'Hourly Rate'} *
                </label>
                <input 
                  type="number" 
                  min={0} 
                  step="0.01"
                  disabled={readonly} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                  value={form.salaryValue} 
                  onChange={(e)=>setForm({...form, salaryValue:e.target.value})} 
                  placeholder={form.salaryType === 'fixed' ? 'Monthly amount' : 'Rate per hour'}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hire Date *</label>
                <input 
                  type="date" 
                  disabled={readonly} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                  value={form.hireDate} 
                  onChange={(e)=>setForm({...form, hireDate:e.target.value})} 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select 
                  disabled={readonly} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                  value={form.status} 
                  onChange={(e)=>setForm({...form, status:e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Platform Access (Only for Staff) */}
          {form.employeeType === 'staff' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Platform Access</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-medium">🔐</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-800">Platform Access Required</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      This employee will be able to access the platform with their email and password.
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
                  <input 
                    disabled={readonly || mode === 'edit'} 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                    value={form.username} 
                    onChange={(e)=>setForm({...form, username:e.target.value})} 
                    placeholder="Choose a username"
                    required={mode !== 'edit'}
                  />
                  {mode === 'edit' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Username cannot be changed after creation
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                  <input 
                    type="password" 
                    disabled={readonly || mode === 'edit'} 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                    value={form.password} 
                    onChange={(e)=>setForm({...form, password:e.target.value})} 
                    placeholder="Choose a password"
                    required={mode !== 'edit'}
                  />
                  {mode === 'edit' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Password cannot be changed here. Use profile settings instead.
                    </p>
                  )}
                </div>
              </div>
              
              {/* Permissions Section */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">Access Permissions</h4>
                <p className="text-sm text-gray-600">
                  Select which sections this staff member can access on the platform.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="finance-permission"
                      disabled={readonly}
                      checked={form.permissions.finance}
                      onChange={(e) => setForm({
                        ...form,
                        permissions: {
                          ...form.permissions,
                          finance: e.target.checked
                        }
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="finance-permission" className="text-sm font-medium text-gray-700">
                      Finance Access
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="logs-permission"
                      disabled={readonly}
                      checked={form.permissions.logs}
                      onChange={(e) => setForm({
                        ...form,
                        permissions: {
                          ...form.permissions,
                          logs: e.target.checked
                        }
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="logs-permission" className="text-sm font-medium text-gray-700">
                      Activity Logs Access
                    </label>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    <strong>Note:</strong> Staff members can only access sections they have been granted permission for. 
                    Without permissions, they will only see basic platform features.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Additional Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea 
                disabled={readonly} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                value={form.notes} 
                onChange={(e)=>setForm({...form, notes:e.target.value})} 
                placeholder="Additional notes about the employee"
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
            >
              Cancel
            </button>
            {mode!=='view' && (
              <button 
                type="submit" 
                className="px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
              >
                {mode === 'edit' ? 'Update Employee' : 'Add Employee'}
              </button>
            )}
          </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeesTab;
