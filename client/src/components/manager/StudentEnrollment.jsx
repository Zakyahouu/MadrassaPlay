import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StudentEnrollment = ({ schoolId, classId }) => {
  const [students, setStudents] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStudents();
    fetchEnrolledStudents();
  }, [classId]);

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`/api/schools/${schoolId}/users?role=student`);
      setStudents(response.data);
    } catch (err) {
      setError('Failed to fetch students');
    }
  };

  const fetchEnrolledStudents = async () => {
    try {
      const response = await axios.get(`/api/schools/${schoolId}/classes/${classId}/students`);
      setEnrolledStudents(response.data);
    } catch (err) {
      setError('Failed to fetch enrolled students');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (studentId) => {
    try {
      await axios.post(`/api/schools/${schoolId}/classes/${classId}/enroll`, {
        studentIds: [studentId]
      });
      fetchEnrolledStudents();
    } catch (err) {
      setError('Failed to enroll student');
    }
  };

  const handleUnenroll = async (studentId) => {
    try {
      await axios.post(`/api/schools/${schoolId}/classes/${classId}/unenroll`, {
        studentIds: [studentId]
      });
      fetchEnrolledStudents();
    } catch (err) {
      setError('Failed to unenroll student');
    }
  };

  if (loading) return <div>Loading students...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Student Enrollment</h3>
      {error && <div className="text-red-500">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2">Available Students</h4>
          <div className="border rounded-lg divide-y">
            {students
              .filter(student => !enrolledStudents.find(es => es._id === student._id))
              .map(student => (
                <div key={student._id} className="p-2 flex justify-between items-center">
                  <span>{student.name}</span>
                  <button
                    onClick={() => handleEnroll(student._id)}
                    className="text-green-600 hover:text-green-800"
                  >
                    Enroll
                  </button>
                </div>
              ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Enrolled Students</h4>
          <div className="border rounded-lg divide-y">
            {enrolledStudents.map(student => (
              <div key={student._id} className="p-2 flex justify-between items-center">
                <span>{student.name}</span>
                <button
                  onClick={() => handleUnenroll(student._id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentEnrollment;
