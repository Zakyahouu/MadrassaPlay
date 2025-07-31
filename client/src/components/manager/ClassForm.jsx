import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ClassForm = ({ schoolId, classData, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: classData?.name || '',
    subject: classData?.subject || '',
    gradeLevel: classData?.gradeLevel || { system: '', level: '' },
    teacher: classData?.teacher?._id || '',
    schedule: classData?.schedule || []
  });
  const [teachers, setTeachers] = useState([]);
  const [gradeSystems, setGradeSystems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTeachers();
    fetchGradeSystems();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await axios.get(`/api/schools/${schoolId}/users?role=teacher`);
      setTeachers(response.data);
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
    }
  };

  const fetchGradeSystems = async () => {
    try {
      const response = await axios.get(`/api/schools/${schoolId}/grades`);
      setGradeSystems(response.data);
    } catch (err) {
      console.error('Failed to fetch grade systems:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (classData) {
        await axios.put(`/api/schools/${schoolId}/classes/${classData._id}`, formData);
      } else {
        await axios.post(`/api/schools/${schoolId}/classes`, formData);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save class');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4">
          {classData ? 'Edit Class' : 'Create New Class'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-red-500">{error}</div>}

          <div>
            <label className="block text-sm font-medium mb-1">Class Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Grade Level</label>
            <select
              value={formData.gradeLevel.system}
              onChange={(e) => setFormData({
                ...formData,
                gradeLevel: { ...formData.gradeLevel, system: e.target.value }
              })}
              className="w-full p-2 border rounded mb-2"
              required
            >
              <option value="">Select Grade System</option>
              {gradeSystems.map(system => (
                <option key={system._id} value={system._id}>
                  {system.type} - {system.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Teacher</label>
            <select
              value={formData.teacher}
              onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select Teacher</option>
              {teachers.map(teacher => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading ? 'Saving...' : 'Save Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClassForm;
