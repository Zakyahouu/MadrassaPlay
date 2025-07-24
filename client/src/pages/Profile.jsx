import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import TopNav from '../components/layout/TopNav';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    position: user?.position || '',
    password: '',
    confirmPassword: '',
  });
  const [editMode, setEditMode] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xs w-full p-8 text-center border rounded-lg">
        <p className="text-neutral-600">Please sign in to view your profile</p>
      </div>
    </div>
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      setMessage({ text: 'Passwords do not match', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        bio: formData.bio,
        position: formData.position
      };
      if (formData.password) payload.password = formData.password;
      
      await axios.patch('/api/users/profile', payload);
      setMessage({ text: 'Profile updated', type: 'success' });
      setEditMode(false);
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Update failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 ">

      {/* Top Navigation Bar enwrap*/}
      <div className="mb-4 shadow-sm">
              <TopNav
        sidebarOpen={false}
        setSidebarOpen={() => {}}
        activeTab="profile"
        navigationItems={[{ id: 'profile', name: 'Profile' }]}
        logout={logout}
      />
      </div>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="w-full md:w-1/3">
            <div className="bg-white p-6 rounded-lg shadow-xs border border-neutral-100">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-neutral-100 mb-4 flex items-center justify-center text-2xl font-light text-neutral-400">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <h1 className="text-xl font-medium text-neutral-800">{user.name}</h1>
                <p className="text-neutral-500 text-sm">{user.position || 'No position specified'}</p>
                
                <div className="mt-6 w-full space-y-3">
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="w-full py-2 text-sm border rounded-md hover:bg-neutral-50 transition-colors"
                  >
                    {editMode ? 'Cancel' : 'Edit Profile'}
                  </button>
                  <button
                    onClick={logout}
                    className="w-full py-2 text-sm text-red-600 border border-red-100 rounded-md hover:bg-red-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full md:w-2/3">
            <div className="bg-white rounded-lg shadow-xs border border-neutral-100 overflow-hidden">
              {/* Navigation */}
              <div className="border-b border-neutral-100">
                <nav className="flex">
                  <button
                    onClick={() => setActiveSection('profile')}
                    className={`px-5 py-3 text-sm font-medium ${activeSection === 'profile' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-neutral-500 hover:text-neutral-700'}`}
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => setActiveSection('security')}
                    className={`px-5 py-3 text-sm font-medium ${activeSection === 'security' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-neutral-500 hover:text-neutral-700'}`}
                  >
                    Security
                  </button>
                </nav>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="p-6">
                {message.text && (
                  <div className={`mb-6 p-3 rounded-md text-sm ${
                    message.type === 'error' 
                      ? 'bg-red-50 text-red-600' 
                      : 'bg-green-50 text-green-600'
                  }`}>
                    {message.text}
                  </div>
                )}

                {activeSection === 'profile' ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name</label>
                        <input
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          disabled={!editMode}
                          className="w-full px-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-neutral-50 disabled:text-neutral-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                        <input
                          name="email"
                          value={formData.email}
                          disabled
                          className="w-full px-3 py-2 text-sm border rounded-md bg-neutral-50 text-neutral-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Phone</label>
                      <input
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={!editMode}
                        className="w-full px-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-neutral-50 disabled:text-neutral-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Position</label>
                      <input
                        name="position"
                        value={formData.position}
                        onChange={handleChange}
                        disabled={!editMode}
                        className="w-full px-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-neutral-50 disabled:text-neutral-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Bio</label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        disabled={!editMode}
                        rows={3}
                        className="w-full px-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-neutral-50 disabled:text-neutral-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">New Password</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={!editMode}
                        className="w-full px-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-neutral-50 disabled:text-neutral-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Confirm Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={!editMode}
                        className="w-full px-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-neutral-50 disabled:text-neutral-500"
                      />
                    </div>
                    <div className="bg-neutral-50 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-neutral-700 mb-2">Password Requirements</h4>
                      <ul className="text-xs text-neutral-500 space-y-1">
                        <li>• Minimum 8 characters</li>
                        <li>• At least one uppercase letter</li>
                        <li>• At least one number</li>
                      </ul>
                    </div>
                  </div>
                )}

                {editMode && (
                  <div className="mt-8 flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;