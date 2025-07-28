// client/src/components/admin/TemplateUploader.jsx
import React, { useState } from 'react';
import axios from 'axios';

const TemplateUploader = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a .zip file to upload.');
      return;
    }

    setError('');
    setSuccess('');
    setUploading(true);

    const formData = new FormData();
    // --- THIS IS THE FIX ---
    // The field name 'templateBundle' must match what the backend multer middleware expects.
    formData.append('templateBundle', selectedFile);

    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await axios.post('/api/templates/upload', formData, config);
      setSuccess(`Template "${data.name}" uploaded successfully!`);
      setSelectedFile(null);
      onUploadSuccess(data); // Notify parent component of the new template
    } catch (err) {
      setError(err.response?.data?.message || 'File upload failed');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Upload New Template Bundle</h3>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            {error && <div className="text-red-500 mb-4">{error}</div>}
            {success && <div className="text-green-500 mb-4">{success}</div>}
            <div className="flex items-center space-x-4">
                <input 
                    type="file" 
                    onChange={handleFileChange} 
                    accept=".zip"
                    className="block w-full text-sm text-gray-500
                               file:mr-4 file:py-2 file:px-4
                               file:rounded-full file:border-0
                               file:text-sm file:font-semibold
                               file:bg-indigo-50 file:text-indigo-700
                               hover:file:bg-indigo-100"
                />
                <button 
                    onClick={handleUpload} 
                    disabled={uploading || !selectedFile}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400"
                >
                    {uploading ? 'Uploading...' : 'Upload'}
                </button>
            </div>
            {selectedFile && <p className="text-sm text-gray-500 mt-2">Selected: {selectedFile.name}</p>}
        </div>
    </div>
  );
};

export default TemplateUploader;
