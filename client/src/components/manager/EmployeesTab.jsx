import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Eye, X, Shield, Phone, Mail, User, Lock, AlertTriangle, Calendar, DollarSign, MapPin } from 'lucide-react';
import formatDZ from '../../utils/currency';
import { useLanguage } from '../../context/LanguageContext';

const getUser = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };
const authConfig = () => {
  const user = getUser();
  if (!user?.token) {
    console.error('No authentication token found');
  }
  return { headers: { Authorization: `Bearer ${user?.token}` } };
};

const getStatusMeta = (status, t) => {
  switch (status) {
    case 'active':
      return { label: t.active || 'Active', className: 'bg-green-100 text-green-800' };
    case 'on_vacation':
      return { label: t.onVacation || 'On Vacation', className: 'bg-amber-100 text-amber-800' };
    case 'inactive':
    default:
      return { label: t.inactive || 'Inactive', className: 'bg-red-100 text-red-800' };
  }
};

const EmployeesTab = () => {
  const { t } = useLanguage();
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
      const payload = { ...form };
      if (modal.mode === 'edit') {
        const response = await axios.put(`/api/employees/${modal.data._id}`, payload, authConfig());
        const saved = response.data?.data || response.data;
        setItems(prev => prev.map(i => i._id === saved._id ? saved : i));
      } else {
        const response = await axios.post('/api/employees', payload, authConfig());
        const saved = response.data?.data || response.data;
        setItems(prev => [saved, ...prev]);
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
      <div className="card-base p-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-main-light">{t.employeeManagement}</h2>
              <p className="text-sm text-text-muted-light">
                {t.manageStaffDesc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setModal({ open: true, mode: 'create', data: null })}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> {t.addEmployee}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-base p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchByNameRolePhone}
              className="w-full p-3 border border-border-light rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="px-3 py-3 border border-border-light rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">{t.allTypes}</option>
              <option value="staff">{t.staffPlatformAccess}</option>
              <option value="other">{t.otherNoPlatform}</option>
            </select>
            <select
              value={filters.role}
              onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
              className="px-3 py-3 border border-border-light rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">{t.allRoles}</option>
              <option value="Janitor">{t.janitor}</option>
              <option value="Secretary">{t.secretary}</option>
              <option value="Security Guard">{t.securityGuard}</option>
              <option value="Maintenance Worker">{t.maintenanceWorker}</option>
              <option value="Cleaner">{t.cleaner}</option>
              <option value="Receptionist">{t.receptionist}</option>
              <option value="Administrative Assistant">{t.adminAssistant}</option>
              <option value="IT Support">{t.itSupport}</option>
              <option value="Other">{t.other}</option>
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
              <p className="text-gray-500">{t.loadingEmployees}</p>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="text-red-500 mr-3"><AlertTriangle className="w-5 h-5" /></div>
            <div>
              <h3 className="text-lg font-medium text-red-800">Error Loading Employees</h3>
              <p className="text-red-600 mt-1">{error}</p>
              {error.includes('No school associated') && (
                <p className="text-sm text-red-500 mt-2">
                  {t.contactAdminSchool}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-base p-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-background-light rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-text-muted-light" />
            </div>
            <h3 className="text-lg font-medium text-text-main-light mb-2">{t.noEmployeesFound}</h3>
            <p className="text-text-muted-light mb-6">
              {search || filters.type || filters.role
                ? t.tryAdjustingSearch
                : t.addFirstEmployee
              }
            </p>
            {!search && !filters.type && !filters.role && (
              <button
                onClick={() => setModal({ open: true, mode: 'create', data: null })}
                className="btn-primary flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                {t.addEmployee}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(e => (
            <div key={e._id} className="card-base p-6 hover:shadow-md transition-shadow">
              {(() => {
                const statusMeta = getStatusMeta(e.status, t);
                return (
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold">
                        {(e.name?.[0] || '?').toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-lg text-text-main-light">{e.name}</div>
                        <div className="text-sm text-text-muted-light">{e.role}</div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${statusMeta.className}`}>
                      {statusMeta.label}
                    </span>
                  </div>
                );
              })()}

              <div className="flex items-center gap-2 mb-3">
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${(e.employeeType || 'other') === 'staff'
                  ? 'bg-blue-50 text-blue-700 border border-blue-100'
                  : 'bg-slate-50 text-slate-700 border border-slate-100'
                  }`}>
                  {(e.employeeType || 'other') === 'staff' ? 'Staff' : 'Other'}
                </span>
                {(e.employeeType || 'other') === 'staff' && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 items-center gap-1">
                    <Lock className="w-3 h-3" /> {t.platformAccess}
                  </span>
                )}
              </div>

              <div className="text-sm text-gray-700 mb-4 space-y-2">
                {e.phone && <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4 text-gray-400" /> {e.phone}</div>}
                {e.email && <div className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4 text-gray-400" /> {e.email}</div>}
                {(e.employeeType || 'other') === 'staff' && e.username && (
                  <div className="flex items-center gap-2 text-blue-600"><User className="w-4 h-4" /> {e.username}</div>
                )}
                <div className="flex items-center gap-2 font-medium text-emerald-700">
                  <DollarSign className="w-4 h-4" />
                  {e.salaryType === 'fixed' ? t.monthly : t.hourly}: {e.salaryValue ? `${formatDZ(e.salaryValue)}` : t.notSet}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-border-light">
                <button
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-primary bg-primary/5 hover:bg-primary/10 rounded-md transition-colors font-medium"
                  onClick={() => setModal({ open: true, mode: 'view', data: e })}
                >
                  <Eye className="w-4 h-4" />{t.view}</button>
                <button
                  className="p-2 text-text-muted-light hover:bg-slate-100 rounded-md transition-colors"
                  onClick={() => setModal({ open: true, mode: 'edit', data: e })}
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                  onClick={() => onDelete(e)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <EmployeeModal mode={modal.mode} data={modal.data} onClose={() => setModal({ open: false, mode: 'create', data: null })} onSave={onSave} />
      )}
    </div>
  );
};

const EmployeeModal = ({ mode, data, onClose, onSave }) => {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: data?.name || '',
    role: data?.role || '',
    employeeType: data?.employeeType || 'other', // 'staff' or 'other'
    salaryType: data?.salaryType || 'fixed',
    salaryValue: data?.salaryValue || '',
    hireDate: data?.hireDate ? (typeof data.hireDate === 'string' ? data.hireDate.substring(0, 10) : new Date(data.hireDate).toISOString().substring(0, 10)) : '',
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
        hireDate: data.hireDate ? (typeof data.hireDate === 'string' ? data.hireDate.substring(0, 10) : new Date(data.hireDate).toISOString().substring(0, 10)) : '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        notes: data.notes || '',
        status: data.status || 'active',
        username: data.username || '',
        password: data.password || '',
        permissions: {
          dashboard: data?.permissions?.dashboard ?? true,
          classes: data?.permissions?.classes || false,
          students: data?.permissions?.students || false,
          teachers: data?.permissions?.teachers || false,
          attendance: data?.permissions?.attendance || false,
          timetable: data?.permissions?.timetable || false,
          employees: data?.permissions?.employees || false,
          finance: data?.permissions?.finance || false,
          logs: data?.permissions?.logs || false,
          rooms: data?.permissions?.rooms || false,
          equipment: data?.permissions?.equipment || false,
          catalog: data?.permissions?.catalog || false,
          ads: data?.permissions?.ads || false,
          landingPage: data?.permissions?.landingPage || false,
          reports: data?.permissions?.reports || false,
          settings: data?.permissions?.settings || false
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
        hireDate: new Date().toISOString().substring(0, 10),
        phone: '',
        email: '',
        address: '',
        notes: '',
        status: 'active',
        username: '',
        password: '',
        permissions: {
          dashboard: true,
          classes: false,
          students: false,
          teachers: false,
          attendance: false,
          timetable: false,
          employees: false,
          finance: false,
          logs: false,
          rooms: false,
          equipment: false,
          catalog: false,
          ads: false,
          landingPage: false,
          reports: false,
          settings: false
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

  const readonly = mode === 'view';

  const submit = (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      salaryValue: parseFloat(form.salaryValue) || 0
    };

    // Remove platform access fields if not staff
    if (form.employeeType !== 'staff') {
      delete payload.username;
      delete payload.password;
      delete payload.permissions;
    }
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${mode === 'create' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600'
              }`}>
              {mode === 'create' ? <Plus className="w-6 h-6" /> : <User className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {mode === 'edit' ? t.editEmployee : mode === 'view' ? t.employeeProfile : t.addNewEmployee}
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                {mode === 'view' && (() => {
                  const statusMeta = getStatusMeta(form.status, t);
                  return (
                    <>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase ${statusMeta.className}`}>
                        {statusMeta.label}
                      </span>
                      <span>•</span>
                    </>
                  );
                })()}
                <span>{form.employeeType === 'staff' ? 'Staff' : 'General Employee'}</span>
              </div>
            </div>
          </div>
          <button
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 md:p-8 space-y-8">
          <form id="employee-form" onSubmit={submit} className="space-y-8">

            {/* 1. Essential Information */}
            <section>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> {t.basicInfo}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.fullName} <span className="text-red-500">*</span></label>
                  <input
                    disabled={readonly}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.role} <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      disabled={readonly}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      value={form.employeeType}
                      onChange={(e) => setForm({ ...form, employeeType: e.target.value })}
                      required
                    >
                      <option value="staff">{t.staffPlatformAccess}</option>
                      <option value="other">{t.otherNoPlatform}</option>
                    </select>
                    <select
                      disabled={readonly}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      required
                    >
                      <option value="">{t.selectRole}</option>
                      {form.employeeType === 'staff' ? (
                        <>
                          <option value="Administrative Assistant">{t.adminAssistant}</option>
                          <option value="Secretary">{t.secretary}</option>
                          <option value="IT Support">{t.itSupport}</option>
                          <option value="Receptionist">{t.receptionist}</option>
                          <option value="Other">{t.other}</option>
                        </>
                      ) : (
                        <>
                          <option value="Janitor">{t.janitor}</option>
                          <option value="Security Guard">{t.securityGuard}</option>
                          <option value="Maintenance Worker">{t.maintenanceWorker}</option>
                          <option value="Cleaner">{t.cleaner}</option>
                          <option value="Other">{t.other}</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Contact & Personal */}
            <section className="pt-4 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" /> {t.contactInfo}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.email} {form.employeeType === 'staff' && <span className="text-red-500">*</span>}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      disabled={readonly}
                      className="w-full pl-9 p-2.5 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="email@example.com"
                      required={form.employeeType === 'staff'}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.phone}</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      disabled={readonly}
                      className="w-full pl-9 p-2.5 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+213 ..."
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.address}</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      disabled={readonly}
                      className="w-full pl-9 p-2.5 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder={t.address}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Employment & Salary */}
            <section className="pt-4 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" /> {t.employmentDetails}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.hireDate}</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      disabled={readonly}
                      className="w-full pl-9 p-2.5 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      value={form.hireDate}
                      onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.salaryType}</label>
                  <select
                    disabled={readonly}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={form.salaryType}
                    onChange={(e) => setForm({ ...form, salaryType: e.target.value })}
                  >
                    <option value="fixed">{t.fixedMonthly}</option>
                    <option value="hourly">{t.hourlyRate}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.amount} (DZD)</label>
                  <input
                    type="number"
                    disabled={readonly}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={form.salaryValue}
                    onChange={(e) => setForm({ ...form, salaryValue: e.target.value })}
                    placeholder="0.00"
                      min="1"
                      required
                  />
                </div>
              </div>
            </section>

            {/* 4. Platform Access (Staff Only) */}
            {form.employeeType === 'staff' && (
              <section className="pt-4 border-t border-gray-100">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
                  <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> {t.platformAccess}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-1.5">{t.username} <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 w-4 h-4 text-blue-400" />
                        <input
                          disabled={readonly}
                          className="w-full pl-9 p-2.5 bg-white border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          value={form.username}
                          onChange={(e) => setForm({ ...form, username: e.target.value })}
                          autoComplete="new-username"
                          required={form.employeeType === 'staff'}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-1.5">{mode === 'edit' ? t.newPassword : t.password} {mode === 'create' && <span className="text-red-500">*</span>}</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 w-4 h-4 text-blue-400" />
                        <input
                          type="password"
                          disabled={readonly}
                          className="w-full pl-9 p-2.5 bg-white border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          autoComplete="new-password"
                          placeholder={mode === 'edit' ? '••••••••' : ''}
                          required={mode === 'create' && form.employeeType === 'staff'}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Permissions Section */}
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <h4 className="text-sm font-semibold text-blue-900 mb-3">{t.permissions || 'Permissions'}</h4>
                    <p className="text-xs text-blue-700 mb-3">
                      {t.permissionsDesc || 'Toggle which sections of the sidebar this staff member can access.'}
                    </p>

                    <div className="space-y-4">
                      {/* General */}
                      <div>
                        <h5 className="text-xs font-bold text-blue-800 uppercase mb-2">General</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            { key: 'dashboard', label: t.dashboard || 'Dashboard' },
                            { key: 'reports', label: t.reports || 'Reports & Analytics' },
                            { key: 'settings', label: t.settings || 'Settings' }
                          ].map(p => (
                            <label key={p.key} className="flex items-center space-x-2 p-1.5 rounded hover:bg-blue-100/50 transition-colors">
                              <input
                                type="checkbox"
                                disabled={readonly}
                                checked={form.permissions?.[p.key] || false}
                                onChange={(e) => setForm({
                                  ...form,
                                  permissions: { ...form.permissions, [p.key]: e.target.checked }
                                })}
                                className="rounded text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-blue-900">{p.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Academic */}
                      <div>
                        <h5 className="text-xs font-bold text-blue-800 uppercase mb-2">Academic</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            { key: 'classes', label: t.classes || 'Classes' },
                            { key: 'students', label: t.students || 'Students' },
                            { key: 'teachers', label: t.teachers || 'Teachers' },
                            { key: 'attendance', label: t.attendance || 'Attendance' },
                            { key: 'timetable', label: t.timetable || 'Timetable' }
                          ].map(p => (
                            <label key={p.key} className="flex items-center space-x-2 p-1.5 rounded hover:bg-blue-100/50 transition-colors">
                              <input
                                type="checkbox"
                                disabled={readonly}
                                checked={form.permissions?.[p.key] || false}
                                onChange={(e) => setForm({
                                  ...form,
                                  permissions: { ...form.permissions, [p.key]: e.target.checked }
                                })}
                                className="rounded text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-blue-900">{p.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Administration */}
                      <div>
                        <h5 className="text-xs font-bold text-blue-800 uppercase mb-2">Administration</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            { key: 'employees', label: t.employees || 'Employees' },
                            { key: 'finance', label: t.finance || 'Finance Management' },
                            { key: 'logs', label: t.logs || 'System Logs' }
                          ].map(p => (
                            <label key={p.key} className="flex items-center space-x-2 p-1.5 rounded hover:bg-blue-100/50 transition-colors">
                              <input
                                type="checkbox"
                                disabled={readonly}
                                checked={form.permissions?.[p.key] || false}
                                onChange={(e) => setForm({
                                  ...form,
                                  permissions: { ...form.permissions, [p.key]: e.target.checked }
                                })}
                                className="rounded text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-blue-900">{p.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Resources */}
                      <div>
                        <h5 className="text-xs font-bold text-blue-800 uppercase mb-2">Resources</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            { key: 'rooms', label: t.rooms || 'Rooms' },
                            { key: 'equipment', label: t.equipment || 'Equipment' },
                            { key: 'catalog', label: t.catalog || 'Catalog' }
                          ].map(p => (
                            <label key={p.key} className="flex items-center space-x-2 p-1.5 rounded hover:bg-blue-100/50 transition-colors">
                              <input
                                type="checkbox"
                                disabled={readonly}
                                checked={form.permissions?.[p.key] || false}
                                onChange={(e) => setForm({
                                  ...form,
                                  permissions: { ...form.permissions, [p.key]: e.target.checked }
                                })}
                                className="rounded text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-blue-900">{p.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Marketing */}
                      <div>
                        <h5 className="text-xs font-bold text-blue-800 uppercase mb-2">Marketing</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            { key: 'ads', label: t.ads || 'Ads Management' },
                            { key: 'landingPage', label: t.landingPageBuilder || 'Landing Page' }
                          ].map(p => (
                            <label key={p.key} className="flex items-center space-x-2 p-1.5 rounded hover:bg-blue-100/50 transition-colors">
                              <input
                                type="checkbox"
                                disabled={readonly}
                                checked={form.permissions?.[p.key] || false}
                                onChange={(e) => setForm({
                                  ...form,
                                  permissions: { ...form.permissions, [p.key]: e.target.checked }
                                })}
                                className="rounded text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-blue-900">{p.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Notes */}
            <section className="pt-4 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.notes}</label>
              <textarea
                disabled={readonly}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                placeholder={t.addNotes}
              />
            </section>

          </form>
        </div>

        {/* Footer actions */}
        {!readonly && (
          <div className="p-4 bg-gray-50 border-t border-gray-200 sticky bottom-0 rounded-b-lg flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              form="employee-form"
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-sm"
            >
              {mode === 'edit' ? t.saveChanges : t.createEmployee}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeesTab;
