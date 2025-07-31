import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const AdminSchoolDetailsPage = () => {
  const { schoolId } = useParams();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    },
    contact: {
      phone: '',
      email: '',
      website: ''
    },
    status: 'active'
  });

  useEffect(() => {
    fetchSchoolDetails();
  }, [schoolId]);

  const fetchSchoolDetails = async () => {
    try {
      const response = await axios.get(`/api/schools/${schoolId}`);
      setSchool(response.data);
      setFormData({
        name: response.data.name,
        address: response.data.address || {
          street: '',
          city: '',
          state: '',
          country: '',
          postalCode: ''
        },
        contact: response.data.contact || {
          phone: '',
          email: '',
          website: ''
        },
        status: response.data.status || 'active'
      });
    } catch (err) {
      setError('Failed to fetch school details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSchool = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/schools/${schoolId}`, formData);
      setEditMode(false);
      fetchSchoolDetails();
    } catch (err) {
      setError('Failed to update school details');
      console.error(err);
    }
  };

  const handleResetPassword = async (managerId) => {
    const newPassword = prompt('Enter new password for manager:');
    if (!newPassword) return;

    try {
      await axios.post(`/api/schools/manager/${managerId}/reset-password`, { newPassword });
      alert('Password reset successfully');
    } catch (err) {
      alert('Failed to reset password');
      console.error(err);
    }
  };

  if (loading) return <div className="p-8">Loading school details...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!school) return <div className="p-8">School not found</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/admin/dashboard" className="text-blue-600 hover:underline">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">{school.name}</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {editMode ? (
            <form onSubmit={handleUpdateSchool} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">School Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Address</h3>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Street"
                      value={formData.address.street}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: {...formData.address, street: e.target.value}
                      })}
                      className="w-full p-2 border rounded"
                    />
                    <input
                      type="text"
                      placeholder="City"
                      value={formData.address.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: {...formData.address, city: e.target.value}
                      })}
                      className="w-full p-2 border rounded"
                    />
                    <input
                      type="text"
                      placeholder="State/Province"
                      value={formData.address.state}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: {...formData.address, state: e.target.value}
                      })}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Contact</h3>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Phone"
                      value={formData.contact.phone}
                      onChange={(e) => setFormData({
                        ...formData,
                        contact: {...formData.contact, phone: e.target.value}
                      })}
                      className="w-full p-2 border rounded"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={formData.contact.email}
                      onChange={(e) => setFormData({
                        ...formData,
                        contact: {...formData.contact, email: e.target.value}
                      })}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-semibold mb-4">School Information</h2>
                <button
                  onClick={() => setEditMode(true)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Address</p>
                  <p>{school.address?.street}</p>
                  <p>{school.address?.city}, {school.address?.state}</p>
                  <p>{school.address?.country} {school.address?.postalCode}</p>
                </div>
                <div>
                  <p className="text-gray-600">Contact</p>
                  <p>Phone: {school.contact?.phone}</p>
                  <p>Email: {school.contact?.email}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-gray-600">Status</p>
                <p>{school.status || 'Active'}</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">School Principal</h2>
          {school.principal ? (
            <div className="flex justify-between items-center p-4 border rounded">
              <div>
                <p className="font-medium">{school.principal.name}</p>
                <p className="text-gray-600">{school.principal.email}</p>
              </div>
              <button
                onClick={() => handleResetPassword(school.principal._id)}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Reset Password
              </button>
            </div>
          ) : (
            <p className="text-gray-500">No principal assigned to this school yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSchoolDetailsPage;
