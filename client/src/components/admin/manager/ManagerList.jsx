// ManagerList.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ManagerList = ({ schoolId, onSelect }) => {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedManagerId, setSelectedManagerId] = useState(null);

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const response = await axios.get(`/api/schools/${schoolId}`);
        setManagers(response.data.managers || []);
      } catch (err) {
        setError('Failed to fetch managers.');
      } finally {
        setLoading(false);
      }
    };
    fetchManagers();
  }, [schoolId]);

  if (loading) return <div>Loading managers...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-4">
      <h4 className="font-bold mb-2">Managers</h4>
      <ul>
        {managers.length > 0 ? (
          managers.map(manager => (
            <li key={manager._id} className={`flex items-center justify-between mb-2 p-2 rounded ${selectedManagerId === manager._id ? 'bg-indigo-100' : ''}`}>
              <span>{manager.name} ({manager.email})</span>
              <button
                className={`px-2 py-1 rounded ${selectedManagerId === manager._id ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => {
                  setSelectedManagerId(manager._id);
                  if (onSelect) onSelect(manager);
                }}
              >{selectedManagerId === manager._id ? 'Selected' : 'Select'}</button>
            </li>
          ))
        ) : (
          <li>No managers found for this school.</li>
        )}
      </ul>
    </div>
  );
};

export default ManagerList;
