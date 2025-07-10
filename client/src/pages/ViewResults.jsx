// client/src/pages/ViewResults.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const ViewResults = () => {
  const { gameCreationId } = useParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await axios.get(`/api/results/${gameCreationId}`);
        setResults(response.data);
      } catch (err) {
        setError('Failed to load game results.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [gameCreationId]);

  if (loading) {
    return <div className="text-center p-8">Loading Results...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <Link to="/teacher/dashboard" className="text-indigo-600 hover:underline">
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold mt-2">Game Results</h1>
      </header>

      <div className="bg-white p-6 rounded-lg shadow">
        {results.length > 0 ? (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="p-4 font-semibold">Student Name</th>
                <th className="p-4 font-semibold">Score</th>
                <th className="p-4 font-semibold">Submitted On</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result._id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="p-4">{result.student.name}</td>
                  <td className="p-4">{result.score} / {result.totalPossibleScore}</td>
                  <td className="p-4">{new Date(result.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 text-center">No results have been submitted for this game yet.</p>
        )}
      </div>
    </div>
  );
};

export default ViewResults;
