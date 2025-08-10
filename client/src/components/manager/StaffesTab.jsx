import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, Edit, Trash2, Eye, EyeOff, X, Loader, Star, Shield, 
  User, Crown, GraduationCap, Users, Calendar, Phone, Mail,
  Award,Key, TrendingUp
} from 'lucide-react';
import emailjs from '@emailjs/browser';
// EmailJS configuration - replace with your actual keys
const EMAILJS_SERVICE_ID = 'service_r87sxue';
const EMAILJS_TEMPLATE_ID = 'template_7hjpaew'; 
const EMAILJS_PUBLIC_KEY = '6u5gChfWdyuVn3SGE';

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);
const API_BASE_URL = '/api/staff';

// Get current user info from localStorage
const getCurrentUser = () => {
  try {
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
    return userInfo;
  } catch {
    return {};
  }
};

const getAuthToken = () => {
  const userInfo = getCurrentUser();
  return userInfo?.token || null;
};

const StaffTab = () => {
  const [staff, setStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ type: '', data: null });
  const [formData, setFormData] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const currentUser = getCurrentUser();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdStaffData, setCreatedStaffData] = useState(null);
  const [createdPassword, setCreatedPassword] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const roleIcons = {
    admin: <Crown className="w-4 h-4" />,
    principal: <Shield className="w-4 h-4" />,
    manager: <Users className="w-4 h-4" />,
    teacher: <GraduationCap className="w-4 h-4" />
  };

  const roleColors = {
    admin: 'bg-purple-100 text-purple-800 border-purple-200',
    pedagogique: 'bg-blue-100 text-blue-800 border-blue-200',
    manager: 'bg-green-100 text-green-800 border-green-200',
    staff: 'bg-orange-100 text-orange-800 border-orange-200'
  };
const generatePassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  setFormData({ ...formData, password });
};
  const availableRoles = useMemo(() => {
    const roles = new Set(staff.map(member => member.role));
    return Array.from(roles);
  }, [staff]);

  // Fetch staff data
  useEffect(() => {
    const fetchStaff = async () => {
      setIsLoading(true);
      setError(null);
      
      const token = getAuthToken();
      if (!token) {
        setError("Authentication required");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(API_BASE_URL, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch staff');
        
        const data = await response.json();
        setStaff(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStaff();
  }, []);

  const handleSave = async () => {
  const token = getAuthToken();
  const config = { 
    headers: { 
      'Content-Type': 'application/json', 
      Authorization: `Bearer ${token}` 
    } 
  };

  try {
    const url = modalContent.type === 'edit' 
      ? `${API_BASE_URL}/${modalContent.data._id}` 
      : API_BASE_URL;
    
    const method = modalContent.type === 'edit' ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      ...config,
      body: JSON.stringify(formData)
    });

    if (!response.ok) throw new Error('Save failed');
    
    const responseData = await response.json();
    
    if (modalContent.type === 'edit') {
      setStaff(staff.map(s => s._id === responseData.staff._id ? responseData.staff : s));
      closeModal();
    } else {
      // For new staff creation
      setStaff([...staff, responseData.staff]);
      setCreatedStaffData(responseData.staff);
      setCreatedPassword(formData.password);
      setShowSuccessModal(true);
    }
    
  } catch (err) {
    alert(err.message);
  }
};

  const handleDelete = async () => {
    const token = getAuthToken();
    
    try {
      const response = await fetch(`${API_BASE_URL}/${modalContent.data._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Delete failed');
      
      setStaff(staff.filter(s => s._id !== modalContent.data._id));
      closeModal();
    } catch (err) {
      alert(err.message);
    }
  };

  const openModal = (type, staffMember = null) => {
    setModalContent({ type, data: staffMember });
    setFormData(staffMember ? {
      name: staffMember.name,
      email: staffMember.email,
      role: staffMember.role,
      subject: staffMember.subject || '',
      department: staffMember.department || '',
      phone: staffMember.phone || '',
      experience: staffMember.experience || 0
    } : {
      name: '', email: '', password: '', role: 'teacher',
      subject: '', department: '', phone: '', experience: 0
    });
    setIsModalOpen(true);
  };
const sendCredentialsEmail = async () => {
  setIsSendingEmail(true);
  
  try {
    const templateParams = {
      to_email: createdStaffData.email,
      to_name: createdStaffData.name,
      staff_name: createdStaffData.name,
      staff_email: createdStaffData.email,
      staff_password: createdPassword,
      staff_role: createdStaffData.role,
      staff_subject: createdStaffData.subject || 'Not assigned',
      staff_department: createdStaffData.department || 'Not assigned',
      staff_phone: createdStaffData.phone || 'Not provided',
      login_url: window.location.origin + '/login',
      school_name: 'Our School',
      creation_date: new Date(createdStaffData.createdAt).toLocaleDateString()
    };

    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );
    
    alert('✅ Credentials sent to email successfully!');
  } catch (err) {
    console.error('Email send failed:', err);
    alert('❌ Failed to send email: ' + err.message);
  } finally {
    setIsSendingEmail(false);
  }
};
const closeModal = () => {
  setIsModalOpen(false);
  setShowSuccessModal(false);
  setCreatedStaffData(null);
  setCreatedPassword('');
};
  const filteredStaff = useMemo(() => {
    return staff.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (member.subject || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = selectedRole === 'all' || member.role === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [staff, searchTerm, selectedRole]);

  // Check if current user is in the staff list
  const isCurrentUser = (member) => member._id === currentUser._id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading staff members...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <div className="text-red-600 font-medium mb-2">Error Loading Staff</div>
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      {/* Header with modern glass effect */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-white/20 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="flex-1 max-w-2xl">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Search by name, email, or subject..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="pl-12 pr-4 py-3 border border-gray-200 rounded-xl w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <select 
                value={selectedRole} 
                onChange={(e) => setSelectedRole(e.target.value)} 
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-36"
              >
                <option value="all">All Roles</option>
                {availableRoles.map(role => (
                  <option key={role} value={role} className="capitalize">{role}</option>
                ))}
              </select>
            </div>
          </div>
          
          <button 
            onClick={() => openModal('add')} 
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Add Staff
          </button>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((member) => (
          <div 
            key={member._id} 
            className={`bg-white rounded-2xl p-6 border-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
              isCurrentUser(member) 
                ? 'border-blue-300 bg-blue-50/50 ring-2 ring-blue-200' 
                : 'border-gray-100 hover:border-gray-200'
            }`}
          >
            {/* Current User Badge */}
            {isCurrentUser(member) && (
              <div className="flex items-center gap-2 mb-4 text-blue-700 text-sm font-medium">
                <User className="w-4 h-4" />
                You (Read Only)
              </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-lg mb-1">{member.name}</h3>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${roleColors[member.role] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                  {roleIcons[member.role]}
                  <span className="capitalize">{member.role}</span>
                </div>
              </div>
              
              {/* Rating */}
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-medium text-gray-600">
                  {member.rating || 0}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="truncate">{member.email}</span>
              </div>
              
              {member.phone && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{member.phone}</span>
                </div>
              )}

              {member.subject && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <GraduationCap className="w-4 h-4 text-gray-400" />
                  <span>{member.subject}</span>
                  {member.department && <span className="text-gray-400">• {member.department}</span>}
                </div>
              )}

              {member.experience && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span>{member.experience} years experience</span>
                </div>
              )}

              {member.level && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Award className="w-4 h-4 text-gray-400" />
                  <span>Level {member.level} • {member.xp} XP</span>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>Joined {new Date(member.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
              <button 
                onClick={() => openModal('view', member)} 
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
              >
                <Eye className="w-4 h-4" />
                View
              </button>
              
              {!isCurrentUser(member) && (
                <>
                  <button 
                    onClick={() => openModal('edit', member)} 
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  
                  <button 
                    onClick={() => openModal('delete', member)} 
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 capitalize">
                {modalContent.type} Staff Member
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {modalContent.type === 'view' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Name</label>
                        <p className="text-lg font-semibold text-gray-900">{modalContent.data.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-gray-900">{modalContent.data.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Role</label>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${roleColors[modalContent.data.role] || 'bg-gray-100 text-gray-800'}`}>
                          {roleIcons[modalContent.data.role]}
                          <span className="capitalize">{modalContent.data.role}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {modalContent.data.subject && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Subject</label>
                          <p className="text-gray-900">{modalContent.data.subject}</p>
                        </div>
                      )}
                      {modalContent.data.department && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Department</label>
                          <p className="text-gray-900">{modalContent.data.department}</p>
                        </div>
                      )}
                      {modalContent.data.phone && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Phone</label>
                          <p className="text-gray-900">{modalContent.data.phone}</p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-gray-500">Experience</label>
                        <p className="text-gray-900">{modalContent.data.experience || 0} years</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          modalContent.data.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {modalContent.data.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4 border-t">
                    <button onClick={closeModal} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                      Close
                    </button>
                  </div>
                </div>
              )}
              
              {(modalContent.type === 'add' || modalContent.type === 'edit') && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      required 
                      value={formData.name || ''} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                      placeholder="Full Name" 
                      className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    />
                    <input 
                      required 
                      type="email" 
                      value={formData.email || ''} 
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                      placeholder="Email" 
                      className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    />
                  </div>
                  
{modalContent.type === 'add' && (
  <div className="space-y-2">
    <div className="flex gap-2">
      <button
        type="button"
        onClick={generatePassword}
        className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
      >
        <Key className="w-4 h-4" />
        Generate
      </button>
    </div>
    <div className="relative">
      <input 
        required 
        type={showPassword ? "text" : "password"}
        value={formData.password || ''} 
        onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
        placeholder="Password" 
        className="w-full p-3 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  </div>
)}
                  
                  <select 
                    required 
                    value={formData.role || ''} 
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })} 
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Select a Role --</option>
                    <option value="staff pedagogique">staff pedagogique</option>
                    <option value="staff ">staff </option>
                    <option value="manager">Manager</option>
                  </select>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      value={formData.subject || ''} 
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })} 
                      placeholder="Subject" 
                      className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    />
                    <input 
                      value={formData.department || ''} 
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })} 
                      placeholder="Department" 
                      className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      value={formData.phone || ''} 
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                      placeholder="Phone Number" 
                      className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    />
                    <input 
                      type="number" 
                      value={formData.experience || ''} 
                      onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })} 
                      placeholder="Years of Experience" 
                      className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    />
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <button 
                      type="button" 
                      onClick={closeModal} 
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSave}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {modalContent.type === 'edit' ? 'Update' : 'Create'}
                    </button>
                  </div>
                </div>
              )}
              
              {modalContent.type === 'delete' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trash2 className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Staff Member</h3>
                    <p className="text-gray-600">
                      Are you sure you want to delete <strong>{modalContent.data.name}</strong>? 
                      This action cannot be undone.
                    </p>
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button 
                      onClick={closeModal} 
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleDelete} 
                      className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Success Modal */}
{showSuccessModal && createdStaffData && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-green-200">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-green-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-green-900">Staff Created Successfully!</h2>
            <p className="text-green-700">New staff member has been added to your system</p>
          </div>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Login Credentials */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Login Credentials
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">Email:</span>
              <span className="font-mono bg-white px-2 py-1 rounded border">{createdStaffData.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">Password:</span>
              <span className="font-mono bg-white px-2 py-1 rounded border">{createdPassword}</span>
            </div>
          </div>
        </div>

        {/* Personal & Professional Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-600">Name:</span> <span className="font-medium">{createdStaffData.name}</span></div>
              <div><span className="text-gray-600">Phone:</span> <span className="font-medium">{createdStaffData.phone || 'Not provided'}</span></div>
              <div><span className="text-gray-600">Role:</span> 
                <span className={`ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${roleColors[createdStaffData.role] || 'bg-gray-100 text-gray-800'}`}>
                  {roleIcons[createdStaffData.role]}
                  {createdStaffData.role}
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 border-b pb-2">Professional Information</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-600">Subject:</span> <span className="font-medium">{createdStaffData.subject || 'Not assigned'}</span></div>
              <div><span className="text-gray-600">Department:</span> <span className="font-medium">{createdStaffData.department || 'Not assigned'}</span></div>
              <div><span className="text-gray-600">Experience:</span> <span className="font-medium">{createdStaffData.experience || 0} years</span></div>
              <div><span className="text-gray-600">Status:</span> 
                <span className="ml-2 inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {createdStaffData.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-semibold text-gray-900 mb-3">System Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-600">Staff ID:</span> <span className="font-mono">{createdStaffData._id}</span></div>
            <div><span className="text-gray-600">Created:</span> <span>{new Date(createdStaffData.createdAt).toLocaleString()}</span></div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <button 
            onClick={sendCredentialsEmail}
            disabled={isSendingEmail}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSendingEmail ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            {isSendingEmail ? 'Sending...' : 'Send Credentials via Email'}
          </button>
          <button 
            onClick={closeModal}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default StaffTab;