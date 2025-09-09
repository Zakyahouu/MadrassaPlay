// client/src/components/student/MyAssignments.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Import the Link component

const MyAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await axios.get('/api/assignments/my-assignments');
        setAssignments(response.data);
      } catch (err) {
        setError('Failed to fetch your assignments.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  if (loading) {
    return <div className="text-center p-4">Loading assignments...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-xl font-bold mb-4">My Assignments</h3>
      <div className="space-y-4">
        {assignments.length > 0 ? (
          assignments.map((assignment) => (
            <div key={assignment._id} className="p-4 border rounded-md bg-blue-50">
              <h4 className="font-semibold text-lg text-blue-800">{assignment.title}</h4>
              {assignment.description && (
                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{assignment.description}</p>
              )}
              <p className="text-sm text-gray-600">
                {assignment.startDate ? `Starts: ${new Date(assignment.startDate).toLocaleDateString()} • ` : ''}
                Due: {new Date(assignment.endDate).toLocaleDateString()}
              </p>
              <div className="mt-4">
                {/* Link to the student play route; pass assignmentId via state for result attribution */}
                {assignment.gameCreations && assignment.gameCreations.length > 0 ? (
                  <Link 
                    to={`/student/play-game/${assignment.gameCreations[0]}`}
                    state={{ assignmentId: assignment._id }}
                  >
                    <button className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">
                      Start Assignment
                    </button>
                  </Link>
                ) : (
                  <button className="px-4 py-2 font-semibold text-white bg-gray-400 rounded-md cursor-not-allowed" disabled>
                    No Game Assigned
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No active assignments. Great job!</p>
        )}
      </div>
    </div>
  );
};

export default MyAssignments;
