import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import ResetPasswordForm from '../components/shared/ResetPasswordForm';
import { useLanguage } from '../context/LanguageContext';

const ManagerPasswordReset = () => {
  const { user } = useContext(AuthContext);
  const { t } = useLanguage();
  const [roleFilter, setRoleFilter] = useState('student');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/manager/users', { params: { role: roleFilter, q: search } });
        if (!mounted) return;
        setUsers(Array.isArray(res.data) ? res.data : []);
        setSelectedUser(prev => prev || (res.data && res.data[0]?._id) || '');
      } catch (e) {
        console.error('Failed to load users for manager', e);
        setUsers([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [roleFilter, search]);

  const handleReset = async ({ newPassword }) => {
    if (!selectedUser) throw new Error('No user selected');
    await axios.post('/api/manager/reset-password', { userId: selectedUser, newPassword });
    // Optionally: show toast or success handled by form
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{t('password-reset') || 'Password Reset'}</h2>
        </div>

        <div className="bg-white border rounded-2xl p-4 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-600">Role</label>
              <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md">
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-600">Search</label>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="name or email" className="w-full mt-1 px-3 py-2 border rounded-md" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="text-xs text-gray-600">Users</label>
              <div className="mt-1 border rounded-md p-2 h-64 overflow-auto">
                {loading && <div className="text-sm text-gray-500">Loading…</div>}
                {!loading && users.length === 0 && <div className="text-sm text-gray-500">No users found</div>}
                {!loading && users.map(u => (
                  <div key={u._id} className={`p-2 rounded-md cursor-pointer ${selectedUser===u._id?'bg-indigo-50 border border-indigo-100':''}`} onClick={()=>setSelectedUser(u._id)}>
                    <div className="text-sm font-medium text-gray-900">{u.name || `${u.firstName || ''} ${u.lastName || ''}`}</div>
                    <div className="text-xs text-gray-500">{u.email || u.studentCode || ''}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="p-3 border rounded-md">
                {!selectedUser && <div className="text-sm text-gray-500">Select a user to reset password</div>}
                {selectedUser && (
                  <div>
                    <div className="mb-3 text-sm text-gray-700">Reset password for: <span className="font-medium">{(users.find(x=>x._id===selectedUser)?.name)||selectedUser}</span></div>
                    <ResetPasswordForm onSubmit={handleReset} submitLabel="Reset password" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerPasswordReset;
