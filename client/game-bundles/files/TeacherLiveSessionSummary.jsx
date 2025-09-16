import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const ms = (n) => `${Math.floor(n/60000)}:${String(Math.floor((n%60000)/1000)).padStart(2,'0')}.${String(Math.floor((n%1000)/10)).padStart(2,'0')}`;

const TeacherLiveSessionSummary = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [ranks, setRanks] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await axios.get(`/api/live-sessions/${id}/summary`);
        if (!mounted) return;
        setSession(data.session);
        setRanks(data.ranks || []);
      } catch (e) {
        if (!mounted) return;
        setError('Failed to load summary');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Session Summary</h1>
          <Link to="/teacher/dashboard?tab=live-sessions" className="text-indigo-600 hover:underline">Back</Link>
        </div>
        {loading ? (
          <div className="text-gray-500">Loading…</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-500">Code</div>
              <div className="font-mono text-lg">{session?.code}</div>
              <div className="text-sm text-gray-500 mt-2">Status</div>
              <div className="capitalize">{session?.status}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 font-semibold border-b border-gray-100">Leaderboard</div>
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Student</th>
                    <th className="px-4 py-2 text-left">Score</th>
                    <th className="px-4 py-2 text-left">Time</th>
                    <th className="px-4 py-2 text-left">Wrong</th>
                  </tr>
                </thead>
                <tbody>
                  {ranks.map((r, i) => (
                    <tr key={`${r.studentId}-${i}`} className="border-t border-gray-100">
                      <td className="px-4 py-2">{i+1}</td>
                      <td className="px-4 py-2">{[r.firstName, r.lastName].filter(Boolean).join(' ') || r.studentId}</td>
                      <td className="px-4 py-2">{r.score}</td>
                      <td className="px-4 py-2 font-mono">{ms(r.effectiveTimeMs || 0)}</td>
                      <td className="px-4 py-2">{r.wrong || 0}</td>
                    </tr>
                  ))}
                  {ranks.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-gray-500">No participants.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherLiveSessionSummary;
