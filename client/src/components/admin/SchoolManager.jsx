// client/src/components/admin/SchoolManager.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

const SchoolManager = () => {
  const [schools, setSchools] = useState([]);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user } = useContext(AuthContext);

  // useEffect hook to fetch schools when the component mounts
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        // The token is now automatically included in the headers by our AuthContext
        const response = await axios.get('/api/schools');
        setSchools(response.data);
      } catch (err) {
        setError('Failed to fetch schools. You may not have permission.');
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, []); // The empty array ensures this effect runs only once

  const handleCreateSchool = async (e) => {
    e.preventDefault();
    if (!newSchoolName.trim()) return; // Don't create empty names

    try {
      const response = await axios.post('/api/schools', { name: newSchoolName });
      // Add the new school to our list without needing to refetch everything
      setSchools([...schools, response.data]);
      setNewSchoolName(''); // Clear the input field
      setError(null); // Clear any previous errors
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create school.');
    }
  };

  if (loading) {
    return <div>Loading schools...</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow mt-8">
      <h3 className="text-xl font-bold mb-4">Manage Schools</h3>
      
      {/* Form to create a new school */}
      <form onSubmit={handleCreateSchool} className="flex items-center space-x-2 mb-6">
        <input
          type="text"
          value={newSchoolName}
          onChange={(e) => setNewSchoolName(e.target.value)}
          placeholder="New school name"
          className="flex-grow p-2 border rounded-md"
        />
        <button
          type="submit"
          className="px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
        >
          Create School
        </button>
      </form>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* List of existing schools */}
      <div className="space-y-2">
        <h4 className="font-semibold">Existing Schools:</h4>
        {schools.length > 0 ? (
          <ul className="list-disc list-inside">
            {schools.map((school) => (
              <li key={school._id} className="text-gray-700">{school.name}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No schools have been created yet.</p>
        )}
      </div>
    </div>
  );
};

export default SchoolManager;
