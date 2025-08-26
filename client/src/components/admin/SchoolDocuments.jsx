import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  File, 
  Download, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  AlertCircle,
  CheckCircle,
  FileText
} from 'lucide-react';

// Helper function to get token
const getToken = () => JSON.parse(localStorage.getItem('user'))?.token;

const SchoolDocuments = ({ schoolId, schoolName, onClose }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingDoc, setEditingDoc] = useState(null);
  const [newDocName, setNewDocName] = useState('');

  // Upload form state
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentName, setDocumentName] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, [schoolId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch(`/api/school-documents/${schoolId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setDocuments(data.data);
      } else {
        setError(data.message || 'Failed to fetch documents');
      }
    } catch (err) {
      setError('Error fetching documents');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are allowed');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setError('');
      
      // Auto-suggest document name from filename
      if (!documentName) {
        const name = file.name.replace('.pdf', '').replace(/[_-]/g, ' ');
        setDocumentName(name);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentName.trim()) {
      setError('Please select a file and enter a document name');
      return;
    }

    if (documents.length >= 5) {
      setError('Maximum 5 documents allowed per school');
      return;
    }

    try {
      setUploading(true);
      setError('');
      
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('name', documentName.trim());

      const token = getToken();
      const response = await fetch(`/api/school-documents/${schoolId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Document uploaded successfully!');
        setSelectedFile(null);
        setDocumentName('');
        document.getElementById('file-input').value = '';
        fetchDocuments();
      } else {
        setError(data.message || 'Failed to upload document');
      }
    } catch (err) {
      setError('Error uploading document');
      console.error('Error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleEditName = (doc) => {
    setEditingDoc(doc._id);
    setNewDocName(doc.name);
  };

  const handleSaveName = async (docId) => {
    if (!newDocName.trim()) {
      setError('Document name cannot be empty');
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`/api/school-documents/name/${docId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newDocName.trim() })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Document name updated successfully!');
        setEditingDoc(null);
        setNewDocName('');
        fetchDocuments();
      } else {
        setError(data.message || 'Failed to update document name');
      }
    } catch (err) {
      setError('Error updating document name');
      console.error('Error:', err);
    }
  };

  const handleDownload = async (docId, originalName) => {
    try {
      const token = getToken();
      const response = await fetch(`/api/school-documents/download/${docId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = originalName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to download document');
      }
    } catch (err) {
      setError('Error downloading document');
      console.error('Error:', err);
    }
  };

  const handleDelete = async (docId, docName) => {
    if (!window.confirm(`Are you sure you want to delete "${docName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`/api/school-documents/${docId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Document deleted successfully!');
        fetchDocuments();
      } else {
        setError(data.message || 'Failed to delete document');
      }
    } catch (err) {
      setError('Error deleting document');
      console.error('Error:', err);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">School Documents</h2>
            <p className="text-blue-100">{schoolName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-700 p-2 rounded"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="text-red-500 mr-2" size={20} />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <CheckCircle className="text-green-500 mr-2" size={20} />
              <span className="text-green-700">{success}</span>
            </div>
          )}

          {/* Upload Section */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Upload className="mr-2" size={20} />
              Upload New Document
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select PDF File
                </label>
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum file size: 10MB. Only PDF files are allowed.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Name
                </label>
                <input
                  type="text"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="Enter a descriptive name for this document"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Documents: {documents.length}/5
                </div>
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || !documentName.trim() || uploading || documents.length >= 5}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={16} className="mr-2" />
                      Upload Document
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Documents List */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FileText className="mr-2" size={20} />
              Uploaded Documents
            </h3>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <File size={48} className="mx-auto mb-4 text-gray-400" />
                <p>No documents uploaded yet</p>
                <p className="text-sm">Upload your first document above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {editingDoc === doc._id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={newDocName}
                              onChange={(e) => setNewDocName(e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                              onClick={() => handleSaveName(doc._id)}
                              className="p-1 text-green-600 hover:bg-green-100 rounded"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={() => setEditingDoc(null)}
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div>
                            <h4 className="font-medium text-gray-900">{doc.name}</h4>
                            <p className="text-sm text-gray-500">
                              Original: {doc.originalName} • {formatFileSize(doc.fileSize)}
                            </p>
                            <p className="text-xs text-gray-400">
                              Uploaded {formatDate(doc.uploadedAt)} by {doc.uploadedBy?.firstName} {doc.uploadedBy?.lastName}
                            </p>
                          </div>
                        )}
                      </div>

                      {editingDoc !== doc._id && (
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleEditName(doc)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                            title="Edit name"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDownload(doc._id, doc.originalName)}
                            className="p-2 text-green-600 hover:bg-green-100 rounded"
                            title="Download"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(doc._id, doc.name)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolDocuments;
