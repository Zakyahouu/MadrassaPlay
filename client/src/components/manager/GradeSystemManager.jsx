import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GradeSystemForm from './GradeSystemForm';

const GradeSystemManager = ({ schoolId }) => {
  const [gradeSystems, setGradeSystems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSystem, setSelectedSystem] = useState(null);

  useEffect(() => {
    if (schoolId && typeof schoolId === 'string') {
      fetchGradeSystems();
    }
  }, [schoolId]);

  const fetchGradeSystems = async () => {
    try {
      // Ensure schoolId is a string before making the request
      const response = await axios.get(`/api/schools/${schoolId}/grades`);
      setGradeSystems(response.data);
    } catch (err) {
      setError('Failed to fetch grade systems');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSystem = (system) => {
    setSelectedSystem(system);
    setShowForm(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Grade Systems</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Grade System
        </button>
      </div>

      {loading ? (
        <p>Loading grade systems...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="space-y-4">
          {gradeSystems.map(system => (
            <div key={system._id} className="border rounded p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{system.type.toUpperCase()}</h3>
                  <p className="text-sm text-gray-600">
                    {system.levels.length} levels configured
                  </p>
                </div>
                <button
                  onClick={() => handleEditSystem(system)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
              </div>
              <div className="mt-2">
                {system.levels.map((level, index) => (
                  <span 
                    key={index}
                    className="inline-block bg-gray-100 rounded px-2 py-1 text-sm mr-2 mb-2"
                  >
                    {level.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <GradeSystemForm
          schoolId={schoolId}
          system={selectedSystem}
          onClose={() => {
            setShowForm(false);
            setSelectedSystem(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setSelectedSystem(null);
            fetchGradeSystems();
          }}
        />
      )}
    </div>
  );
};

export default GradeSystemManager;
