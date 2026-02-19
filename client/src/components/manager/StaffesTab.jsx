import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, Edit, Trash2, Eye, EyeOff, X, Loader, Star, Shield,
  User, Crown, GraduationCap, Users, Calendar, Phone, Mail,
  Award, Key, TrendingUp, ChevronDown
} from 'lucide-react';
import emailjs from '@emailjs/browser';
import { useLanguage } from '../../context/LanguageContext';
// EmailJS configuration - replace with your actual keys
const EMAILJS_SERVICE_ID = 'service_r87sxue';
const EMAILJS_TEMPLATE_ID = 'template_7hjpaew';
const EMAILJS_PUBLIC_KEY = '6u5gChfWdyuVn3SGE';

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);
const API_BASE_URL = '/api/staff';

// Get current user info from localStorage
const getCurrentUser = () => {
  const { t } = useLanguage();
  try {
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
    return userInfo;
  } catch {
    return {};
  }
};

const getAuthToken = () => {
  const { t } = useLanguage();
  const userInfo = getCurrentUser();
  return userInfo?.token || null;
};

const StaffTab = () => {
  const { t } = useLanguage();
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
    const { t } = useLanguage();
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
    const { t } = useLanguage();
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
    const { t } = useLanguage();
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
      <div className="card-base p-6">
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
                  className="pl-12 pr-4 py-3 border border-border-light rounded-lg w-full focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-4 py-3 border border-border-light rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary min-w-36"
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
            className="btn-primary flex items-center gap-2"
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
            className={`card-base p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${isCurrentUser(member)
              ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
              : 'hover:border-border-light'
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
                <h3 className="font-semibold text-text-main-light text-lg mb-1">{member.name}</h3>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${roleColors[member.role] || 'bg-slate-100 text-slate-800 border-slate-200'}`}>
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
                <Eye className="w-4 h-4" />{t.view}</button>

              {!isCurrentUser(member) && (
                <>
                  <button
                    onClick={() => openModal('edit', member)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Edit className="w-4 h-4" />{t.edit}</button>

                  <button
                    onClick={() => openModal('delete', member)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />{t.delete}</button>
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
                        <label className="text-sm font-medium text-gray-500">{t.name}</label>
                        <p className="text-lg font-semibold text-gray-900">{modalContent.data.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">{t.email}</label>
                        <p className="text-gray-900">{modalContent.data.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">{t.role}</label>
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
                          <label className="text-sm font-medium text-gray-500">{t.phone}</label>
                          <p className="text-gray-900">{modalContent.data.phone}</p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-gray-500">Experience</label>
                        <p className="text-gray-900">{modalContent.data.experience || 0} years</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">{t.status}</label>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${modalContent.data.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                          {modalContent.data.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <button onClick={closeModal} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">{t.close}</button>
                  </div>
                </div>
              )}

              {(modalContent.type === 'add' || modalContent.type === 'edit') && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.firstName || 'FIRST NAME'} *</label>
                      <input
                        required
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter full name"
                        className="w-full py-2 border-b border-gray-200 focus:border-primary focus:outline-none transition-colors placeholder:text-gray-300"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.email || 'EMAIL'} *</label>
                      <input
                        required
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Enter email address"
                        className="w-full py-2 border-b border-gray-200 focus:border-primary focus:outline-none transition-colors placeholder:text-gray-300"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.role || 'ROLE'} *</label>
                      <select
                        required
                        value={formData.role || ''}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full py-2 border-b border-gray-200 focus:border-primary focus:outline-none bg-transparent transition-colors"
                      >
                        <option value="">Select a role</option>
                        <option value="staff pedagogique">Staff Pedagogique</option>
                        <option value="staff">Staff</option>
                        <option value="manager">Manager</option>
                        <option value="teacher">Teacher</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.password || 'PASSWORD'} *</label>
                      <div className="relative">
                        <input
                          required
                          type={showPassword ? "text" : "password"}
                          value={formData.password || ''}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="••••••••••••"
                          className="w-full py-2 border-b border-gray-200 focus:border-primary focus:outline-none transition-colors placeholder:text-gray-300"
                        />
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          {modalContent.type === 'add' && (
                            <button
                              type="button"
                              onClick={generatePassword}
                              className="text-[10px] font-bold text-primary hover:underline uppercase"
                            >
                              {t.generate || 'Generate'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2 py-4 border-b border-gray-100 mb-2">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">Activities (last step)</h4>
                          <p className="text-xs text-gray-400 italic">No activities selected yet.</p>
                        </div>
                        <button type="button" className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                          <Plus className="w-3.5 h-3.5 text-primary" />
                          Choose activities
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">YEARS OF EXPERIENCE *</label>
                      <div className="relative">
                        <select
                          value={formData.experience || ''}
                          onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                          className="w-full py-2 border-b border-gray-200 focus:border-primary focus:outline-none bg-transparent appearance-none"
                        >
                          <option value="">Select experience</option>
                          <option value="1">1 Year</option>
                          <option value="2">2 Years</option>
                          <option value="3">3 Years</option>
                          <option value="5">5+ Years</option>
                          <option value="10">10+ Years</option>
                        </select>
                        <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.phone || 'PRIMARY PHONE'} *</label>
                      <input
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                        className="w-full py-2 border-b border-gray-200 focus:border-primary focus:outline-none transition-colors placeholder:text-gray-300"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end items-center gap-6 pt-8 mt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {t.cancel || 'Cancel'}
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold text-sm shadow-md hover:shadow-lg active:scale-95"
                    >
                      {modalContent.type === 'edit' ? (t.update || 'Update Employee') : (t.createEmployee || 'Create Employee')}
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
                    >{t.cancel}</button>
                    <button
                      onClick={handleDelete}
                      className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >{t.delete}</button>
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