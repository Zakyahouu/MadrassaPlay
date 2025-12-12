// client/src/components/manager/builder/editors/ContactEditor.jsx

import React from 'react';

const ContactEditor = ({ data, onChange }) => {
  const contactData = data || {
    email: '',
    phone: '',
    address: '',
    hours: ''
  };

  const handleChange = (field, value) => {
    onChange({ ...contactData, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact Information</h3>
        <p className="text-sm text-gray-600">Update your school's contact details</p>
      </div>

      <div className="bg-white border rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={contactData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="info@school.com"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            value={contactData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <textarea
            value={contactData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="123 Main Street, City, Country"
            rows={3}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Operating Hours
          </label>
          <input
            type="text"
            value={contactData.hours}
            onChange={(e) => handleChange('hours', e.target.value)}
            placeholder="Mon-Fri: 9:00 AM - 5:00 PM"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> These details will be displayed in the Contact section of your landing page.
          Students can also submit inquiries through the contact form.
        </p>
      </div>
    </div>
  );
};

export default ContactEditor;
