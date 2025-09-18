import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

const ManagerSchoolPanel = () => {
  const { user } = useContext(AuthContext);
  const [school, setSchool] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user.school) {
      setError('Manager is not linked to any school. Please contact admin.');
      setLoading(false);
      return;
    }
    const fetchSchoolData = async () => {
      try {
        const schoolRes = await axios.get(`/api/schools/${user.school}`);
        setSchool(schoolRes.data);
        const teachersRes = await axios.get('/api/teachers');
        setTeachers(teachersRes.data);
        const studentsRes = await axios.get('/api/students');
        setStudents(studentsRes.data);
      } catch (err) {
        setError('Failed to fetch school data.');
      } finally {
        setLoading(false);
      }
    };
    fetchSchoolData();
  }, [user.school]);

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    const name = e.target.teacherName.value;
    const email = e.target.teacherEmail.value;
    try {
      await axios.post('/api/teachers', { name, email, school: user.school });
      e.target.reset();
      const res = await axios.get('/api/teachers');
      setTeachers(res.data);
    } catch (err) {
      alert('Failed to add teacher');
    }
  };

  const handleRemoveTeacher = async (teacherId) => {
    if (!window.confirm('Remove this teacher?')) return;
    try {
      await axios.delete(`/api/teachers/${teacherId}`);
      setTeachers(teachers.filter(t => t._id !== teacherId));
    } catch (err) {
      alert('Failed to remove teacher');
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    const name = e.target.studentName.value;
    const email = e.target.studentEmail.value;
    try {
      await axios.post('/api/students', { name, email, school: user.school });
      e.target.reset();
      const res = await axios.get('/api/students');
      setStudents(res.data);
    } catch (err) {
      alert('Failed to add student');
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm('Remove this student?')) return;
    try {
      await axios.delete(`/api/students/${studentId}`);
      setStudents(students.filter(s => s._id !== studentId));
    } catch (err) {
      alert('Failed to remove student');
    }
  };

  if (loading) return <div>Loading school info...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-6 mt-8 bg-gray-50 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Skill Snap Info & Staff Management</h2>
      {school && (
        <div className="mb-6">
          <div><strong>Name:</strong> {school.name}</div>
          <div><strong>Address:</strong> {school.address}</div>
          {/* Add edit button/modal here if needed */}
        </div>
      )}
      <div className="mb-6">
        <h3 className="font-bold mb-2">Teachers</h3>
        <ul>
          {teachers.map(t => (
            <li key={t._id} className="flex items-center justify-between">
              <span>{t.name} ({t.email})</span>
              <button className="ml-2 text-red-500" onClick={() => handleRemoveTeacher(t._id)}>Remove</button>
            </li>
          ))}
        </ul>
        <form className="mt-2 flex gap-2" onSubmit={handleAddTeacher}>
          <input type="text" name="teacherName" placeholder="Teacher Name" className="p-2 border" required />
          <input type="email" name="teacherEmail" placeholder="Teacher Email" className="p-2 border" required />
          <button type="submit" className="bg-blue-500 text-white px-2 py-1 rounded">Add</button>
        </form>
      </div>
      <div>
        <h3 className="font-bold mb-2">Students</h3>
        <ul>
          {students.map(s => (
            <li key={s._id} className="flex items-center justify-between">
              <span>{s.name} ({s.email})</span>
              <button className="ml-2 text-red-500" onClick={() => handleRemoveStudent(s._id)}>Remove</button>
            </li>
          ))}
        </ul>
        <form className="mt-2 flex gap-2" onSubmit={handleAddStudent}>
          <input type="text" name="studentName" placeholder="Student Name" className="p-2 border" required />
          <input type="email" name="studentEmail" placeholder="Student Email" className="p-2 border" required />
          <button type="submit" className="bg-blue-500 text-white px-2 py-1 rounded">Add</button>
        </form>
      </div>
    </div>
  );
};

export default ManagerSchoolPanel;