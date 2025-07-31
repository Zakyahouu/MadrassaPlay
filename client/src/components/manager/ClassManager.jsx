import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ClassForm from './ClassForm';
import StudentEnrollment from './StudentEnrollment';

const ClassManager = ({ schoolId }) => {
  const [classes, setClasses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClassForEnrollment, setSelectedClassForEnrollment] = useState(null);

  useEffect(() => {
    if (schoolId && typeof schoolId === 'string') {
      fetchClasses();
    }
  }, [schoolId]);

  const fetchClasses = async () => {
    try {
      // Ensure schoolId is a string before making the request
      const response = await axios.get(`/api/schools/${schoolId}/classes`);
      setClasses(response.data);
    } catch (err) {
      setError('Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (classData) => {
    setSelectedClass(classData);
    setShowForm(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Classes</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create Class
        </button>
      </div>

      {loading ? (
        <p>Loading classes...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.map(classItem => (
            <div key={classItem._id} className="border rounded p-4">
              <div className="flex justify-between">
                <h3 className="font-medium">{classItem.name}</h3>
                <button
                  onClick={() => handleEdit(classItem)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Subject: {classItem.subject}
              </p>
              <p className="text-sm text-gray-600">
                Grade: {classItem.gradeLevel.level}
              </p>
              <p className="text-sm text-gray-600">
                Teacher: {classItem.teacher?.name || 'Not assigned'}
              </p>
              <button
                onClick={() => setSelectedClassForEnrollment(classItem)}
                className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Manage Students
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ClassForm
          schoolId={schoolId}
          classData={selectedClass}
          onClose={() => {
            setShowForm(false);
            setSelectedClass(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setSelectedClass(null);
            fetchClasses();
          }}
        />
      )}

      {selectedClassForEnrollment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Manage Students - {selectedClassForEnrollment.name}
              </h2>
              <button
                onClick={() => setSelectedClassForEnrollment(null)}
                className="text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
            <StudentEnrollment
              schoolId={schoolId}
              classId={selectedClassForEnrollment._id}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManager;
