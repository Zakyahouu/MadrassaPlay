import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const SchoolList = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await axios.get('/api/schools');
        setSchools(response.data);
      } catch (err) {
        setError('Failed to fetch schools');
      } finally {
        setLoading(false);
      }
    };
    fetchSchools();
  }, []);

  if (loading) return <div>Loading schools...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {schools.map(school => (
        <div key={school._id} className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold mb-2">{school.name}</h3>
          <p className="text-gray-600 mb-4">
            Principal: {school.principal ? school.principal.name : 'Not Assigned'}
          </p>
          <div className="space-y-2">
            <Link 
              to={`/admin/schools/${school._id}`}
              className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Manage School
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SchoolList;
