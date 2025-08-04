// ManagerDeleteButton.jsx
import React, { useState } from 'react';
import axios from 'axios';

const ManagerDeleteButton = ({ schoolId, managerId, onDeleted }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this manager?')) return;
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`/api/schools/${schoolId}/managers/${managerId}`);
      if (onDeleted) onDeleted(managerId);
    } catch (err) {
      setError('Failed to delete manager.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleDelete} disabled={loading} className="bg-red-500 text-white px-4 py-2 rounded">
      {loading ? 'Deleting...' : 'Delete Manager'}
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </button>
  );
};

export default ManagerDeleteButton;
