import React, { useState } from 'react';
import axios from 'axios';

const CreateSchoolModal = ({ onClose, onSuccess }) => {
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
      email: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/schools', formData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create school');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Create New School</h2>
        
        {error && <div className="text-red-500 mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Address Fields */}
          <div className="space-y-2">
            <h3 className="font-medium">Address</h3>
            {Object.keys(formData.address).map(field => (
              <div key={field}>
                <label className="block text-sm capitalize">{field}</label>
                <input
                  type="text"
                  value={formData.address[field]}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: {
                      ...formData.address,
                      [field]: e.target.value
                    }
                  })}
                  className="w-full p-2 border rounded"
                />
              </div>
            ))}
          </div>

          {/* Contact Fields */}
          <div className="space-y-2">
            <h3 className="font-medium">Contact</h3>
            {Object.keys(formData.contact).map(field => (
              <div key={field}>
                <label className="block text-sm capitalize">{field}</label>
                <input
                  type={field === 'email' ? 'email' : 'text'}
                  value={formData.contact[field]}
                  onChange={(e) => setFormData({
                    ...formData,
                    contact: {
                      ...formData.contact,
                      [field]: e.target.value
                    }
                  })}
                  className="w-full p-2 border rounded"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading ? 'Creating...' : 'Create School'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSchoolModal;
