import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, Users, AlertTriangle } from 'lucide-react';
import AttendanceRoster from './AttendanceRoster';

const AttendanceTab = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await axios.get('/api/classes');
        setClasses(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load classes');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="flex flex-col md:flex-row gap-3 md:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              disabled={loading}
            >
              <option value="">Select a class…</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <input
                type="date"
                className="border rounded px-3 py-2"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-600">
          <Users className="w-4 h-4" /> Loading classes…
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      ) : !selectedClassId ? (
        <div className="text-sm text-gray-500">Select a class to view and manage attendance.</div>
      ) : (
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <AttendanceRoster classId={selectedClassId} date={date} />
        </div>
      )}
    </div>
  );
};

export default AttendanceTab;
