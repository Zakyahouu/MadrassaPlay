// StudentAssignForm.jsx
import React, { useState } from 'react';
import axios from 'axios';

const StudentAssignForm = ({ classId, onAssigned }) => {
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Update class with new student
      const response = await axios.put(`/api/classes/${classId}`, {
        $push: { students: studentId }
      });
      if (onAssigned) onAssigned(response.data);
      setStudentId('');
    } catch (err) {
      setError('Failed to assign student.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="p-4 bg-white rounded shadow mb-4" onSubmit={handleSubmit}>
      <h4 className="font-bold mb-2">Assign Student to Class</h4>
      <input value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="Student ID" className="mb-2 p-2 border w-full" required />
      <button type="submit" disabled={loading} className="bg-green-500 text-white px-4 py-2 rounded">{loading ? 'Assigning...' : 'Assign Student'}</button>
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </form>
  );
};

export default StudentAssignForm;
