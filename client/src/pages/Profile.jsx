import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Award, 
  BookOpen, 
  Users, 
  Settings, 
  Edit3,
  Save,
  X,
  Camera,
  Shield,
  Star,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import UnifiedCard from '../components/shared/UnifiedCard';

const Profile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    contact: {
      phone1: user?.contact?.phone1 || '',
      phone2: user?.contact?.phone2 || '',
      address: user?.contact?.address || '',
    },
    experience: user?.experience || 0,
    status: user?.status || 'active'
  });

  // Update formData when user data changes
  useEffect(() => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      contact: {
        phone1: user?.contact?.phone1 || '',
        phone2: user?.contact?.phone2 || '',
        address: user?.contact?.address || '',
      },
      experience: user?.experience || 0,
      status: user?.status || 'active'
    });
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      const response = await axios.put('/api/users/profile', formData);
      
      // Update the user data in context
      const updatedUserData = response.data;
      updateUser(updatedUserData);
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      // You might want to show an error message to the user here
      alert('Error saving profile. Please try again.');
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      contact: {
        phone1: user?.contact?.phone1 || '',
        phone2: user?.contact?.phone2 || '',
        address: user?.contact?.address || '',
      },
      experience: user?.experience || 0,
      status: user?.status || 'active'
    });
    setIsEditing(false);
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      'admin': 'Admin',
      'manager': 'Manager',
      'teacher': 'Teacher',
      'student': 'Student',
      'principal': 'Principal',
      'staff pedagogique': 'Pedagogical Staff',
      'staff': 'Staff'
    };
    return roleNames[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      'admin': 'bg-red-50 text-red-700 border-red-200',
      'manager': 'bg-blue-50 text-blue-700 border-blue-200',
      'teacher': 'bg-purple-50 text-purple-700 border-purple-200',
      'student': 'bg-green-50 text-green-700 border-green-200',
      'principal': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'staff pedagogique': 'bg-orange-50 text-orange-700 border-orange-200',
      'staff': 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colors[role] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-green-50 text-green-700 border-green-200',
      'on_leave': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'retired': 'bg-gray-50 text-gray-700 border-gray-200',
      'employed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'freelance': 'bg-amber-50 text-amber-700 border-amber-200',
    };
    return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const renderTeacherSpecificFields = () => {
    if (user?.role !== 'teacher') return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
            {isEditing ? (
              <input
                type="number"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="text-gray-900">{user?.experience || 0} years</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            {isEditing ? (
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="retired">Retired</option>
                <option value="employed">Employed</option>
                <option value="freelance">Freelance</option>
              </select>
            ) : (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(user?.status)}`}>
                {user?.status || 'Active'}
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Activities</label>
          {Array.isArray(user?.activities) && user.activities.length ? (
            <div className="space-y-2">
              {user.activities.map((act, idx) => (
                <div key={idx} className="text-sm text-gray-800">
                  <span className="font-semibold mr-1">{(act.type || '').replace(/([A-Z])/g,' $1').replace(/^\w/, c=>c.toUpperCase())}:</span>
                  <span>{(act.items||[]).length} item{(act.items||[]).length!==1?'s':''}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No activities configured.</p>
          )}
        </div>
      </div>
    );
  };

  const renderAdminSpecificFields = () => {
    if (user?.role !== 'admin') return null;

    return (
      <div className="space-y-6">
        <UnifiedCard className="bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-2 mb-3">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">Administrative Access</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-blue-800">Full System Access</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-blue-800">User Management</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-blue-800">System Configuration</span>
            </div>
          </div>
        </UnifiedCard>
      </div>
    );
  };

  const renderManagerSpecificFields = () => {
    if (user?.role !== 'manager') return null;

    return (
      <div className="space-y-6">
        <UnifiedCard className="bg-indigo-50 border-indigo-200">
          <div className="flex items-center space-x-2 mb-3">
            <Users className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-indigo-900">Management Access</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-indigo-800">Staff Management</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-indigo-800">Class Management</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-indigo-800">Reports Access</span>
            </div>
          </div>
        </UnifiedCard>
      </div>
    );
  };

  const renderStats = () => {
    const stats = {
      admin: [
        { label: 'Total Users', value: '1,234', icon: Users, color: 'text-blue-600' },
        { label: 'Active Schools', value: '45', icon: MapPin, color: 'text-green-600' },
        { label: 'System Uptime', value: '99.9%', icon: Activity, color: 'text-purple-600' },
        { label: 'Last Login', value: '2 hours ago', icon: Clock, color: 'text-orange-600' }
      ],
      manager: [
        { label: 'Total Staff', value: '89', icon: Users, color: 'text-blue-600' },
        { label: 'Active Classes', value: '23', icon: BookOpen, color: 'text-green-600' },
        { label: 'Pending Tasks', value: '12', icon: AlertCircle, color: 'text-yellow-600' },
        { label: 'Last Login', value: '1 hour ago', icon: Clock, color: 'text-orange-600' }
      ],
      teacher: [
        { label: 'Total Games', value: '34', icon: BookOpen, color: 'text-blue-600' },
        { label: 'Active Students', value: '156', icon: Users, color: 'text-green-600' },
        { label: 'Avg. Rating', value: '4.8/5', icon: Star, color: 'text-yellow-600' },
        { label: 'Live Sessions', value: '8', icon: Activity, color: 'text-purple-600' }
      ]
    };

    const userStats = stats[user?.role] || [];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {userStats.map((stat, index) => (
          <UnifiedCard key={index} padding="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          </UnifiedCard>
        ))}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading profile...</p>
      </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => {
              const role = user?.role;
              if (role === 'admin') navigate('/admin/dashboard');
              else if (role === 'manager') navigate('/manager/dashboard');
              else if (role === 'teacher') navigate('/teacher/dashboard');
              else navigate('/');
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
        </div>

        {/* Header */}
        <UnifiedCard className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
                {isEditing && (
                  <button className="absolute -bottom-1 -right-1 bg-white border border-gray-300 rounded-full p-1 hover:bg-gray-50 transition-colors">
                    <Camera className="w-4 h-4 text-gray-600" />
                  </button>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="border-b-2 border-blue-500 focus:outline-none bg-transparent"
                    />
                  ) : (
                    user.name
                  )}
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                    {getRoleDisplayName(user.role)}
                  </span>
                  {user?.school && (
                    <span className="text-sm text-gray-600">• {user.school.name}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                                     <button
                     onClick={handleSave}
                     className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                   >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </button>
                                       <button
                       onClick={handleCancel}
                       className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                     >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                </>
              ) : (
                                 <button
                   onClick={() => setIsEditing(true)}
                   className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                 >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            {renderStats()}
          </div>
        </UnifiedCard>

        {/* Profile Details */}
        <UnifiedCard>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email Address
                  </label>
                  {isEditing ? (
                                         <input
                       type="email"
                       name="email"
                       value={formData.email}
                       onChange={handleInputChange}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     />
                  ) : (
                    <p className="text-gray-900">{user.email}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Phone Number
                  </label>
                  {isEditing ? (
                                         <input
                       type="tel"
                       name="phone"
                       value={formData.phone}
                       onChange={handleInputChange}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     />
                  ) : (
                    <p className="text-gray-900">{user.phone || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Role-specific Information */}
            {renderTeacherSpecificFields()}
            {renderAdminSpecificFields()}
            {renderManagerSpecificFields()}

            {/* Account Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Member Since
                  </label>
                  <p className="text-gray-900">
                    {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Activity className="w-4 h-4 inline mr-2" />
                    Last Updated
                  </label>
                  <p className="text-gray-900">
                    {new Date(user.updatedAt || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </UnifiedCard>
      </div>
    </div>
  );
};

export default Profile;
