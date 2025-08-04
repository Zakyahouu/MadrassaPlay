// ClassList.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ClassList = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axios.get('/api/classes');
        setClasses(response.data);
      } catch (err) {
        setError('Failed to fetch classes.');
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  if (loading) return <div>Loading classes...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <h3 className="text-xl font-bold mb-4">Classes</h3>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2">Name</th>
            <th className="py-2">Teacher</th>
            <th className="py-2">Schedule</th>
            <th className="py-2">Subject</th>
            <th className="py-2">Level</th>
            <th className="py-2">Payment Rule</th>
            <th className="py-2">Students</th>
          </tr>
        </thead>
        <tbody>
          {classes.length > 0 ? (
            classes.map(cls => (
              <tr key={cls._id}>
                <td className="py-2">{cls.name}</td>
                <td className="py-2">{cls.teacher?.name}</td>
                <td className="py-2">{cls.schedule.map(s => `${s.day} ${s.time}`).join(', ')}</td>
                <td className="py-2">{cls.subject}</td>
                <td className="py-2">{cls.level}</td>
                <td className="py-2">Every {cls.paymentRule} sessions</td>
                <td className="py-2">{cls.students.length}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="py-2 text-center">No classes found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ClassList;
