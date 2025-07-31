import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StaffManager = ({ schoolId }) => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    isPrincipal: false,
    permissions: {}
  });

  // Permission groups for UI organization
  const permissionGroups = [
    {
      name: 'Student Management',
      permissions: [
        { key: 'viewStudents', label: 'View Students' },
        { key: 'manageStudents', label: 'Add/Edit Students' },
        { key: 'deleteStudents', label: 'Delete Students' },
        { key: 'manageEnrollments', label: 'Manage Enrollments' }
      ]
    },
    {
      name: 'Teacher Management',
      permissions: [
        { key: 'viewTeachers', label: 'View Teachers' },
        { key: 'manageTeachers', label: 'Add/Edit Teachers' },
        { key: 'deleteTeachers', label: 'Delete Teachers' },
        { key: 'assignTeachers', label: 'Assign to Classes' }
      ]
    },
    {
      name: 'Class Management',
      permissions: [
        { key: 'viewClasses', label: 'View Classes' },
        { key: 'manageClasses', label: 'Create/Edit Classes' },
        { key: 'deleteClasses', label: 'Delete Classes' },
        { key: 'manageSchedules', label: 'Manage Schedules' }
      ]
    },
    {
      name: 'Grade System Management',
      permissions: [
        { key: 'viewGradeSystems', label: 'View Grade Systems' },
        { key: 'manageGradeSystems', label: 'Create/Edit Grade Systems' },
        { key: 'deleteGradeSystems', label: 'Delete Grade Systems' }
      ]
    },
    {
      name: 'Staff Management',
      permissions: [
        { key: 'viewStaff', label: 'View Staff' },
        { key: 'manageStaff', label: 'Add/Edit Staff' },
        { key: 'managePermissions', label: 'Manage Permissions' },
        { key: 'deleteStaff', label: 'Delete Staff' }
      ]
    },
    {
      name: 'Reports & Data Access',
      permissions: [
        { key: 'viewReports', label: 'View Reports' },
        { key: 'exportData', label: 'Export Data' },
        { key: 'viewAnalytics', label: 'View Analytics' }
      ]
    }
  ];

  useEffect(() => {
    if (schoolId && typeof schoolId === 'string') {
      fetchStaff();
    }
  }, [schoolId]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/schools/${schoolId}/staff`);
      setStaff(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch staff members');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/schools/${schoolId}/staff`, formData);
      setFormData({
        name: '',
        email: '',
        password: '',
        isPrincipal: false,
        permissions: {}
      });
      setShowAddForm(false);
      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add staff member');
    }
  };

  const handlePermissionChange = (e, permissionKey) => {
    const { checked } = e.target;
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [permissionKey]: checked
      }
    });
  };

  const handleEditPermissions = (staffMember) => {
    setSelectedStaff(staffMember);
    setFormData({
      ...formData,
      permissions: staffMember.permissions || {}
    });
    setShowPermissionsModal(true);
  };

  const updatePermissions = async () => {
    try {
      await axios.put(`/api/schools/${schoolId}/staff/${selectedStaff._id}/permissions`, {
        permissions: formData.permissions
      });
      setShowPermissionsModal(false);
      fetchStaff();
    } catch (err) {
      setError('Failed to update permissions');
    }
  };

  const handleRemoveStaff = async (staffId) => {
    if (!window.confirm('Are you sure you want to remove this staff member?')) return;
    
    try {
      await axios.delete(`/api/schools/${schoolId}/staff/${staffId}`);
      fetchStaff();
    } catch (err) {
      setError('Failed to remove staff member');
    }
  };

  if (loading) return <div>Loading staff members...</div>;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Staff Management</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {showAddForm ? 'Cancel' : 'Add Staff'}
        </button>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Add New Staff Member</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPrincipal"
                  checked={formData.isPrincipal}
                  onChange={(e) => setFormData({...formData, isPrincipal: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="isPrincipal" className="text-sm font-medium">
                  Make Principal (has all permissions)
                </label>
              </div>
            </div>

            {!formData.isPrincipal && (
              <div>
                <h4 className="font-medium mb-2">Permissions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {permissionGroups.map(group => (
                    <div key={group.name} className="border rounded p-3">
                      <h5 className="font-medium mb-2">{group.name}</h5>
                      {group.permissions.map(permission => (
                        <div key={permission.key} className="flex items-center mb-1">
                          <input
                            type="checkbox"
                            id={permission.key}
                            checked={formData.permissions[permission.key] || false}
                            onChange={(e) => handlePermissionChange(e, permission.key)}
                            className="mr-2"
                          />
                          <label htmlFor={permission.key} className="text-sm">
                            {permission.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Staff Member
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff list */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {staff.length > 0 ? (
              staff.map((member) => (
                <tr key={member._id}>
                  <td className="px-6 py-4 whitespace-nowrap">{member.user?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{member.user?.email || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {member.isPrincipal ? 'Principal' : 'Staff'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {!member.isPrincipal && (
                      <button
                        onClick={() => handleEditPermissions(member)}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                      >
                        Permissions
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveStaff(member._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  No staff members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Permission editing modal */}
      {showPermissionsModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              Edit Permissions for {selectedStaff.user?.name}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {permissionGroups.map(group => (
                <div key={group.name} className="border rounded p-3">
                  <h5 className="font-medium mb-2">{group.name}</h5>
                  {group.permissions.map(permission => (
                    <div key={permission.key} className="flex items-center mb-1">
                      <input
                        type="checkbox"
                        id={`edit-${permission.key}`}
                        checked={formData.permissions[permission.key] || false}
                        onChange={(e) => handlePermissionChange(e, permission.key)}
                        className="mr-2"
                      />
                      <label htmlFor={`edit-${permission.key}`} className="text-sm">
                        {permission.label}
                      </label>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={updatePermissions}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManager;
