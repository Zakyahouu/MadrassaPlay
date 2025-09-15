// client/src/pages/ViewResults.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const ViewResults = () => {
  const { user } = useContext(AuthContext);
  const { gameCreationId } = useParams();
  const [results, setResults] = useState([]);
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
  const fetchResults = async () => {
      try {
    const params = {};
    if (classId) params.classId = classId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await axios.get(`/api/results/${gameCreationId}`, { params });
        setResults(response.data);
      } catch (err) {
        setError('Failed to load game results.');
      } finally {
        setLoading(false);
      }
    };

  fetchResults();
  }, [gameCreationId, classId, startDate, endDate]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get('/api/classes/teacher');
        if (!mounted) return;
        setClasses(res.data || []);
      } catch (_) {}
    })();
    return () => { mounted = false; };
  }, []);

  const getDashboardPath = () => {
    switch (user.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'teacher':
        return '/teacher/dashboard';
      default:
        return '/';
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading Results...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <Link to={getDashboardPath()} className="text-indigo-600 hover:underline">
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold mt-2">Game Results</h1>
      </header>

      <div className="bg-white p-6 rounded-lg shadow">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <select value={classId} onChange={(e)=>setClassId(e.target.value)} className="px-3 py-2 border rounded bg-white">
            <option value="">All classes</option>
            {classes.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border rounded"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border rounded"
          />
        </div>
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
                  <td className="p-4">
                    <Link to={`/teacher/result/${result._id}`} className="text-indigo-600 hover:underline">
                      {result.student.name}
                    </Link>
                  </td>
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
