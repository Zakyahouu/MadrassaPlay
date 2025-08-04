// ClassDeleteButton.jsx
import React, { useState } from 'react';
import axios from 'axios';

const ClassDeleteButton = ({ classId, onDeleted }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`/api/classes/${classId}`);
      if (onDeleted) onDeleted(classId);
    } catch (err) {
      setError('Failed to delete class.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-2">
      <button onClick={handleDelete} disabled={loading} className="bg-red-500 text-white px-4 py-2 rounded">
        {loading ? 'Deleting...' : 'Delete Class'}
      </button>
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </div>
  );
};

export default ClassDeleteButton;
