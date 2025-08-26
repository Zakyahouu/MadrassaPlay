import React, { useState } from 'react';
import { 
  X, 
  ArrowLeft, 
  ArrowRight, 
  Building, 
  Settings, 
  Upload, 
  UserPlus,
  CheckCircle,
  Calendar,
  AlertTriangle
} from 'lucide-react';

const SchoolCreationWizard = ({ onClose, onSchoolCreated }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: School Information
    name: '',
    contact: {
      email: '',
      phone: '',
      address: ''
    },
    
    // Step 2: Status Configuration
    status: 'trial',
    customTrialDays: 30,
    
    // Step 3: Document Upload (optional)
    skipDocuments: false,
    
    // Step 4: Manager Creation (optional)
    skipManager: false,
    managerData: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      address: '',
      phone1: '',
      phone2: ''
    }
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [createdSchoolId, setCreatedSchoolId] = useState(null);

  const steps = [
    { number: 1, title: 'School Information', icon: Building },
    { number: 2, title: 'Status Configuration', icon: Settings },
    { number: 3, title: 'Document Upload', icon: Upload },
    { number: 4, title: 'Create Manager', icon: UserPlus }
  ];

  const getToken = () => JSON.parse(localStorage.getItem('user'))?.token;

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'School name is required';
        if (formData.contact.email && !/\S+@\S+\.\S+/.test(formData.contact.email)) {
          newErrors.email = 'Valid email is required';
        }
        if (formData.contact.phone && !/^[\d\s\+\-\(\)]+$/.test(formData.contact.phone)) {
          newErrors.phone = 'Valid phone number is required';
        }
        break;
      case 2:
        if (formData.status === 'trial' && (!formData.customTrialDays || formData.customTrialDays < 1)) {
          newErrors.customTrialDays = 'Trial days must be at least 1';
        }
        break;
      case 4:
        if (!formData.skipManager) {
          if (!formData.managerData.firstName.trim()) {
            newErrors.managerFirstName = 'First name is required';
          }
          if (!formData.managerData.lastName.trim()) {
            newErrors.managerLastName = 'Last name is required';
          }
          if (!formData.managerData.email.trim()) {
            newErrors.managerEmail = 'Email is required';
          } else if (!/\S+@\S+\.\S+/.test(formData.managerData.email)) {
            newErrors.managerEmail = 'Valid email is required';
          }
          if (!formData.managerData.password || formData.managerData.password.length < 6) {
            newErrors.managerPassword = 'Password must be at least 6 characters';
          }
          if (!formData.managerData.address.trim()) {
            newErrors.managerAddress = 'Address is required';
          }
          if (!formData.managerData.phone1.trim()) {
            newErrors.managerPhone1 = 'Phone number is required';
          }
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateManagerData = () => {
    const errors = {};
    
    if (!formData.skipManager) {
      if (!formData.managerData.firstName.trim()) {
        errors.managerFirstName = 'First name is required';
      }
      if (!formData.managerData.lastName.trim()) {
        errors.managerLastName = 'Last name is required';
      }
      if (!formData.managerData.email.trim()) {
        errors.managerEmail = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.managerData.email)) {
        errors.managerEmail = 'Please enter a valid email';
      }
      if (!formData.managerData.password.trim()) {
        errors.managerPassword = 'Password is required';
      } else if (formData.managerData.password.length < 6) {
        errors.managerPassword = 'Password must be at least 6 characters';
      }
      if (!formData.managerData.address.trim()) {
        errors.managerAddress = 'Address is required';
      }
      if (!formData.managerData.phone1.trim()) {
        errors.managerPhone1 = 'Phone number is required';
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;
    
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear errors for this field
    const errorKey = field.replace('.', '');
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: undefined
      }));
    }
  };

  const createSchool = async () => {
    setLoading(true);
    try {
      const schoolPayload = {
        name: formData.name,
        contact: formData.contact,
        status: formData.status
      };

      // Add trial configuration if status is trial
      if (formData.status === 'trial') {
        const trialExpiresAt = new Date();
        trialExpiresAt.setDate(trialExpiresAt.getDate() + formData.customTrialDays);
        schoolPayload.trialExpiresAt = trialExpiresAt.toISOString();
      }

      const response = await fetch('/api/schools', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(schoolPayload)
      });

      const data = await response.json();
      if (response.ok && data && data._id) {
        setCreatedSchoolId(data._id);
        return data;
      } else {
        throw new Error(data.message || 'Failed to create school');
      }
    } catch (error) {
      console.error('Error creating school:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createManager = async (schoolId) => {
    if (formData.skipManager) return null;

    try {
      const managerPayload = {
        firstName: formData.managerData.firstName,
        lastName: formData.managerData.lastName,
        email: formData.managerData.email,
        password: formData.managerData.password,
        address: formData.managerData.address,
        phone1: formData.managerData.phone1,
        phone2: formData.managerData.phone2,
        role: 'manager',
        school: schoolId
      };

      console.log('Creating manager with payload:', { ...managerPayload, password: '[HIDDEN]' });

      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(managerPayload)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `Failed to create manager: ${response.status}`);
      }
      
      if (data && data._id) {
        // Add manager to school's managers array
        const updateResponse = await fetch(`/api/schools/${schoolId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            managers: [data._id]
          })
        });

        if (!updateResponse.ok) {
          console.warn('Manager created but failed to add to school managers array');
        }
        
        return data;
      } else {
        throw new Error('Manager creation returned invalid data');
      }
    } catch (error) {
      console.error('Error creating manager:', error);
      throw error;
    }
  };

  const handleFinish = async () => {
    if (currentStep === 4 && !validateStep(4)) return;

    setLoading(true);
    try {
      // Validate all data before creating anything
      if (!formData.skipManager) {
        const managerValidation = validateManagerData();
        if (!managerValidation.isValid) {
          setErrors(managerValidation.errors);
          setLoading(false);
          return;
        }
      }

      // Step 1: Create the school
      const school = await createSchool();
      setCreatedSchoolId(school._id);
      
      // Step 2: Create manager if not skipped
      if (!formData.skipManager) {
        try {
        await createManager(school._id);
        } catch (managerError) {
          // If manager creation fails, delete the school to prevent orphaned data
          console.error('Manager creation failed, rolling back school creation:', managerError);
          await fetch(`/api/schools/${school._id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${getToken()}`,
              'Content-Type': 'application/json'
            }
          });
          throw managerError;
        }
      }
      
      // Step 3: Handle document upload if not skipped
      if (!formData.skipDocuments) {
        // Note: Document upload will be handled post-creation
        // The user will be redirected to the document management interface
      }

      // Refresh the school list and close
      onSchoolCreated();
      onClose();
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Building className="mx-auto mb-4 text-blue-600" size={48} />
              <h3 className="text-xl font-semibold text-gray-800">School Information</h3>
              <p className="text-gray-600">Enter basic information about the school</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter school name"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.contact.email}
                  onChange={(e) => handleInputChange('contact.email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="school@example.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.contact.phone}
                  onChange={(e) => handleInputChange('contact.phone', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+1 234 567 8900"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={formData.contact.address}
                onChange={(e) => handleInputChange('contact.address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Full address"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Settings className="mx-auto mb-4 text-blue-600" size={48} />
              <h3 className="text-xl font-semibold text-gray-800">Status Configuration</h3>
              <p className="text-gray-600">Configure the school's initial status and trial period</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Initial Status <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="trial"
                    checked={formData.status === 'trial'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <Calendar className="mr-2 text-yellow-600" size={20} />
                      <span className="font-medium">Trial Period</span>
                    </div>
                    <p className="text-sm text-gray-600 ml-7">Start with a trial period</p>
                  </div>
                </label>

                <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={formData.status === 'active'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <CheckCircle className="mr-2 text-green-600" size={20} />
                      <span className="font-medium">Active</span>
                    </div>
                    <p className="text-sm text-gray-600 ml-7">Immediately active with full access</p>
                  </div>
                </label>

                <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="inactive"
                    checked={formData.status === 'inactive'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <AlertTriangle className="mr-2 text-red-600" size={20} />
                      <span className="font-medium">Inactive</span>
                    </div>
                    <p className="text-sm text-gray-600 ml-7">Create but keep inactive until ready</p>
                  </div>
                </label>
              </div>
            </div>

            {formData.status === 'trial' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trial Duration (Days) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={formData.customTrialDays}
                  onChange={(e) => handleInputChange('customTrialDays', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.customTrialDays ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.customTrialDays && <p className="text-red-500 text-sm mt-1">{errors.customTrialDays}</p>}
                <p className="text-sm text-gray-600 mt-1">
                  Trial will expire on: {new Date(Date.now() + (formData.customTrialDays || 30) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Upload className="mx-auto mb-4 text-blue-600" size={48} />
              <h3 className="text-xl font-semibold text-gray-800">Document Upload</h3>
              <p className="text-gray-600">Upload school documents (optional)</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <AlertTriangle className="text-yellow-600 mr-3 mt-0.5" size={20} />
                <div>
                  <h4 className="font-medium text-yellow-800">Optional Step</h4>
                  <p className="text-yellow-700 text-sm">
                    You can skip this step and upload documents later through the school management interface.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.skipDocuments}
                  onChange={(e) => handleInputChange('skipDocuments', e.target.checked)}
                  className="mr-3"
                />
                <span className="text-sm font-medium text-gray-700">
                  Skip document upload (I'll upload documents later)
                </span>
              </label>
            </div>

            {!formData.skipDocuments && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-700 text-sm">
                      <strong>Note:</strong> Document upload will be available immediately after creating the school. 
                      For now, you can prepare your documents and upload them once the school is created.
                    </p>
                  </div>
                  
                  <div className="mt-4 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                    <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                    <p className="text-gray-600 text-sm">
                      Documents will be uploaded after school creation
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB each)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <UserPlus className="mx-auto mb-4 text-blue-600" size={48} />
              <h3 className="text-xl font-semibold text-gray-800">Create Manager & Finalize</h3>
              <p className="text-gray-600">Create a manager account for this school and finalize creation</p>
            </div>

            {/* Summary Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-blue-800 mb-2">School Summary</h4>
              <div className="text-blue-700 text-sm space-y-1">
                <p><strong>Name:</strong> {formData.name}</p>
                <p><strong>Status:</strong> {formData.status} {formData.status === 'trial' && `(${formData.customTrialDays} days)`}</p>
                <p><strong>Email:</strong> {formData.contact.email || 'Not provided'}</p>
                <p><strong>Documents:</strong> {formData.skipDocuments ? 'Will be uploaded later' : 'Will be uploaded after creation'}</p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <CheckCircle className="text-green-600 mr-3 mt-0.5" size={20} />
                <div>
                  <h4 className="font-medium text-green-800">Ready to Create</h4>
                  <p className="text-green-700 text-sm">
                    Clicking "Create School" will create the school with all the information provided.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="skipManager"
                checked={formData.skipManager}
                onChange={(e) => handleInputChange('skipManager', e.target.checked)}
                className="mr-3"
              />
              <label htmlFor="skipManager" className="text-sm font-medium text-gray-700">
                Skip manager creation for now
              </label>
            </div>

            {!formData.skipManager && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-800">Manager Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.managerData.firstName}
                      onChange={(e) => handleInputChange('managerData.firstName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.managerFirstName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="John"
                    />
                    {errors.managerFirstName && <p className="text-red-500 text-sm mt-1">{errors.managerFirstName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.managerData.lastName}
                      onChange={(e) => handleInputChange('managerData.lastName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.managerLastName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Doe"
                    />
                    {errors.managerLastName && <p className="text-red-500 text-sm mt-1">{errors.managerLastName}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.managerData.email}
                    onChange={(e) => handleInputChange('managerData.email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.managerEmail ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="manager@school.com"
                  />
                  {errors.managerEmail && <p className="text-red-500 text-sm mt-1">{errors.managerEmail}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.managerData.password}
                    onChange={(e) => handleInputChange('managerData.password', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.managerPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Minimum 6 characters"
                  />
                  {errors.managerPassword && <p className="text-red-500 text-sm mt-1">{errors.managerPassword}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.managerData.address}
                    onChange={(e) => handleInputChange('managerData.address', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.managerAddress ? 'border-red-500' : 'border-gray-300'
                    }`}
                    rows="3"
                    placeholder="Full address"
                  />
                  {errors.managerAddress && <p className="text-red-500 text-sm mt-1">{errors.managerAddress}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.managerData.phone1}
                      onChange={(e) => handleInputChange('managerData.phone1', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.managerPhone1 ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="+1 234 567 8900"
                    />
                    {errors.managerPhone1 && <p className="text-red-500 text-sm mt-1">{errors.managerPhone1}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secondary Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.managerData.phone2}
                      onChange={(e) => handleInputChange('managerData.phone2', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+1 234 567 8901 (optional)"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Create New School</h2>
            <p className="text-blue-100">Step {currentStep} of 4</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-700 p-2 rounded"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${currentStep >= step.number 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-300 text-gray-600'
                    }
                  `}>
                    {currentStep > step.number ? (
                      <CheckCircle size={16} />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    currentStep >= step.number ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-240px)] overflow-y-auto">
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{errors.general}</p>
            </div>
          )}
          
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className={`
              inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium
              ${currentStep === 1 
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                : 'text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }
            `}
          >
            <ArrowLeft className="mr-2" size={16} />
            Previous
          </button>

          <div className="flex space-x-3">
            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Next
                <ArrowRight className="ml-2" size={16} />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={loading}
                className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading ? 'Creating School...' : 'Create School'}
                <CheckCircle className="ml-2" size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolCreationWizard;
