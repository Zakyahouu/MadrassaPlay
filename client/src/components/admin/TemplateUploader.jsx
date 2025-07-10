// client/src/components/admin/TemplateUploader.jsx
import React, { useState } from 'react';
import axios from 'axios';

const TemplateUploader = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleFileChange = (e) => {
    // Get the first file from the file input
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccessMessage(null);

    // FormData is a special object used to send files in an HTTP request.
    const formData = new FormData();
    // We append the file to the FormData object. The key 'templateFile' must
    // match the key we specified in our multer middleware on the backend.
    formData.append('templateFile', file);

    try {
      const response = await axios.post('/api/templates/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setSuccessMessage(response.data.message);
      // We can call a function passed down from the parent to refresh the list
      if (onUploadSuccess) {
        onUploadSuccess(response.data.template);
      }
      setFile(null); // Clear the file input

    } catch (err) {
      setError(err.response?.data?.message || 'File upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border-t pt-6 mt-6">
      <h4 className="font-semibold text-lg mb-2">Upload New Template Bundle (.zip)</h4>
      <form onSubmit={handleUpload} className="flex items-center space-x-4">
        <input
          type="file"
          accept=".zip"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-indigo-50 file:text-indigo-700
            hover:file:bg-indigo-100"
        />
        <button
          type="submit"
          disabled={uploading || !file}
          className="px-4 py-2 font-bold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {successMessage && <p className="text-green-500 mt-2">{successMessage}</p>}
    </div>
  );
};

export default TemplateUploader;
