import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

const SchoolManager = () => {
  const [schools, setSchools] = useState([]);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [editingSchool, setEditingSchool] = useState(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { user } = useContext(AuthContext);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Fetch schools when component mounts
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await axios.get('/api/schools');
        setSchools(response.data);
      } catch (err) {
        setError('Failed to fetch schools. You may not have permission.');
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, []);

  // Filter schools based on search term
  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateSchool = async (e) => {
    e.preventDefault();
    if (!newSchoolName.trim()) {
      setError('School name cannot be empty');
      return;
    }

    // Check for duplicate names
    if (schools.some(school => school.name.toLowerCase() === newSchoolName.trim().toLowerCase())) {
      setError('A school with this name already exists');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const response = await axios.post('/api/schools', { name: newSchoolName.trim() });
      setSchools([...schools, response.data]);
      setNewSchoolName('');
      setSuccess('School created successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create school.');
    } finally {
      setCreating(false);
    }
  };

  const handleEditStart = (school) => {
    setEditingSchool(school._id);
    setEditName(school.name);
    setError(null);
  };

  const handleEditCancel = () => {
    setEditingSchool(null);
    setEditName('');
  };

  const handleEditSave = async (schoolId) => {
    if (!editName.trim()) {
      setError('School name cannot be empty');
      return;
    }

    // Check for duplicate names (excluding current school)
    if (schools.some(school => 
      school._id !== schoolId && 
      school.name.toLowerCase() === editName.trim().toLowerCase()
    )) {
      setError('A school with this name already exists');
      return;
    }

    setUpdating(schoolId);
    setError(null);

    try {
      const response = await axios.put(`/api/schools/${schoolId}`, { name: editName.trim() });
      setSchools(schools.map(school => 
        school._id === schoolId ? response.data : school
      ));
      setEditingSchool(null);
      setEditName('');
      setSuccess('School updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update school.');
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (schoolId, schoolName) => {
    if (!window.confirm(`Are you sure you want to delete "${schoolName}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(schoolId);
    setError(null);

    try {
      await axios.delete(`/api/schools/${schoolId}`);
      setSchools(schools.filter(school => school._id !== schoolId));
      setSuccess('School deleted successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete school.');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow mt-8">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading schools...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow mt-8">
      <h3 className="text-xl font-bold mb-6">Manage Schools</h3>
      
      {/* Create new school form */}
      <form onSubmit={handleCreateSchool} className="mb-6">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={newSchoolName}
            onChange={(e) => setNewSchoolName(e.target.value)}
            placeholder="Enter new school name"
            className="flex-grow p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            disabled={creating}
          />
          <button
            type="submit"
            disabled={creating || !newSchoolName.trim()}
            className="px-6 py-3 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 min-w-[120px] flex items-center justify-center"
          >
            {creating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              'Create School'
            )}
          </button>
        </div>
      </form>

      {/* Status messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Search bar */}
      {schools.length > 0 && (
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search schools..."
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>
      )}

      {/* Schools list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900">
            Schools ({filteredSchools.length})
          </h4>
        </div>

        {filteredSchools.length > 0 ? (
          <div className="space-y-3">
            {filteredSchools.map((school) => (
              <div
                key={school._id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200"
              >
                {editingSchool === school._id ? (
                  <div className="flex items-center space-x-3 flex-grow">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleEditSave(school._id);
                        }
                        if (e.key === 'Escape') {
                          handleEditCancel();
                        }
                      }}
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditSave(school._id)}
                        disabled={updating === school._id}
                        className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:bg-gray-400 transition-colors duration-200"
                      >
                        {updating === school._id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          'Save'
                        )}
                      </button>
                      <button
                        onClick={handleEditCancel}
                        disabled={updating === school._id}
                        className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 disabled:bg-gray-100 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                      <span className="text-gray-900 font-medium">{school.name}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditStart(school)}
                        className="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors duration-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(school._id, school.name)}
                        disabled={deleting === school._id}
                        className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded disabled:text-gray-400 transition-colors duration-200"
                      >
                        {deleting === school._id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          'Delete'
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : searchTerm ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-lg mb-2">🔍</div>
            <p className="text-gray-500">No schools found matching "{searchTerm}"</p>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-lg mb-2">🏫</div>
            <p className="text-gray-500">No schools have been created yet.</p>
            <p className="text-gray-400 text-sm mt-1">Create your first school using the form above.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolManager;