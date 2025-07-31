import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import CreateSchoolModal from './CreateSchoolModal';
import CreateManagerModal from './CreateManagerModal';

const SchoolPlatformManager = () => {
  const [schools, setSchools] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [showManagerModal, setShowManagerModal] = useState(false);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const response = await axios.get('/api/schools');
      setSchools(response.data);
    } catch (err) {
      console.error('Failed to fetch schools:', err);
    }
  };

  const handleCreateManager = (school) => {
    setSelectedSchool(school);
    setShowManagerModal(true);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Schools</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create New School
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schools.map(school => (
          <div key={school._id} className="border rounded-lg p-4">
            <h3 className="font-medium">{school.name}</h3>
            <p className="text-sm text-gray-600">
              Status: {school.status || 'Active'}
            </p>
            <div className="mt-2 space-y-2">
              <button
                onClick={() => handleCreateManager(school)}
                className="w-full text-blue-600 hover:text-blue-800"
              >
                Create Manager
              </button>
              <Link 
                to={`/admin/schools/${school._id}/details`}
                className="block w-full text-center px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <CreateSchoolModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchSchools();
          }}
        />
      )}

      {showManagerModal && selectedSchool && (
        <CreateManagerModal
          schoolId={selectedSchool._id}
          onClose={() => setShowManagerModal(false)}
          onSuccess={() => {
            setShowManagerModal(false);
            fetchSchools();
          }}
        />
      )}
    </div>
  );
};

export default SchoolPlatformManager;
