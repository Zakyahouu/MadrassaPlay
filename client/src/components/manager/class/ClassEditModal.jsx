import React, { useEffect, useState } from 'react';
import { X, Loader, AlertTriangle, Calendar } from 'lucide-react';
import axios from 'axios';

const getAuthToken = () => {
  const userInfoString = localStorage.getItem('user');
  if (!userInfoString) return null;
  try {
    const userInfo = JSON.parse(userInfoString);
    return userInfo?.token || null;
  } catch (error) {
    return null;
  }
};

const ClassEditModal = ({ isOpen, classId, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({
    name: '',
    teacherId: '',
    roomId: '',
    capacity: 1,
    status: 'active',
    description: '',
    paymentModel: 'per_cycle',
    sessionPrice: '',
    cycleSize: '',
    cyclePrice: '',
    absenceRule: false,
    enrollmentPeriod: { startDate: '', endDate: '' },
    schedules: [{ dayOfWeek: 'monday', startTime: '09:00', endTime: '10:00' }]
  });

  useEffect(() => {
    const load = async () => {
      if (!isOpen || !classId) return;
      setLoading(true);
      setError('');
      try {
        const token = getAuthToken();
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [cls, teach, rms] = await Promise.all([
          axios.get(`/api/classes/${classId}`, config),
          axios.get('/api/classes/available-teachers', config),
          axios.get('/api/classes/available-rooms', config)
        ]);

        const data = cls.data || {};
        const teacherId = typeof data.teacherId === 'object' ? data.teacherId?._id : data.teacherId || '';
        const roomId = typeof data.roomId === 'object' ? data.roomId?._id : data.roomId || '';
        const schedules = Array.isArray(data.schedules) && data.schedules.length > 0
          ? data.schedules.map(s => ({ dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime }))
          : [{ dayOfWeek: 'monday', startTime: '09:00', endTime: '10:00' }];

        // Derive payment fields from new or legacy
        const paymentModel = data.paymentModel || (data.paymentCycle ? 'per_cycle' : 'per_session');
        const cycleSize = data.cycleSize || data.paymentCycle || '';
        const cyclePrice = data.cyclePrice || data.price || '';
        const sessionPrice = data.sessionPrice || '';

        const startDate = data.enrollmentPeriod?.startDate ? new Date(data.enrollmentPeriod.startDate).toISOString().slice(0,10) : '';
        const endDate = data.enrollmentPeriod?.endDate ? new Date(data.enrollmentPeriod.endDate).toISOString().slice(0,10) : '';

        setTeachers(Array.isArray(teach.data) ? teach.data : []);
        setRooms(Array.isArray(rms.data) ? rms.data : []);
        setForm({
          name: data.name || '',
          teacherId,
          roomId,
          capacity: data.capacity || 1,
          status: data.status || 'active',
          description: data.description || '',
          paymentModel,
          sessionPrice: sessionPrice || '',
          cycleSize: cycleSize || '',
          cyclePrice: cyclePrice || '',
          absenceRule: !!data.absenceRule,
          enrollmentPeriod: { startDate, endDate },
          schedules
        });
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load class');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen, classId]);

  if (!isOpen) return null;

  const updateSchedule = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      schedules: prev.schedules.map((s, i) => i === index ? { ...s, [field]: value } : s)
    }));
  };

  const addSchedule = () => {
    setForm(prev => ({
      ...prev,
      schedules: [...prev.schedules, { dayOfWeek: 'monday', startTime: '09:00', endTime: '10:00' }]
    }));
  };

  const removeSchedule = (index) => {
    setForm(prev => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = getAuthToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const payload = {
        name: form.name,
        teacherId: form.teacherId,
        roomId: form.roomId,
        capacity: Number(form.capacity),
        status: form.status,
        description: form.description,
        paymentModel: form.paymentModel,
        sessionPrice: form.paymentModel === 'per_session' ? Number(form.sessionPrice || 0) : undefined,
        cycleSize: form.paymentModel === 'per_cycle' ? Number(form.cycleSize || 0) : undefined,
        cyclePrice: form.paymentModel === 'per_cycle' ? Number(form.cyclePrice || 0) : undefined,
        absenceRule: !!form.absenceRule,
        enrollmentPeriod: {
          startDate: form.enrollmentPeriod.startDate ? new Date(form.enrollmentPeriod.startDate).toISOString() : undefined,
          endDate: form.enrollmentPeriod.endDate ? new Date(form.enrollmentPeriod.endDate).toISOString() : undefined,
        },
        schedules: form.schedules.map(s => ({ dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime }))
      };
      // Remove undefined keys to avoid overwriting with undefined
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
      if (payload.paymentModel === 'per_session') {
        if (payload.cycleSize === undefined) delete payload.cycleSize;
        if (payload.cyclePrice === undefined) delete payload.cyclePrice;
      } else if (payload.paymentModel === 'per_cycle') {
        if (payload.sessionPrice === undefined) delete payload.sessionPrice;
      }

      const { data } = await axios.put(`/api/classes/${classId}`, payload, config);
      onSuccess?.(data);
      onClose?.();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to update class');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-xl">
        <div className="flex items-center justify-between p-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Edit Class</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                value={form.name}
                onChange={(e)=>setForm(prev=>({ ...prev, name: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e)=>setForm(prev=>({ ...prev, status: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
              <select
                value={form.teacherId}
                onChange={(e)=>setForm(prev=>({ ...prev, teacherId: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">Select teacher…</option>
                {teachers.map(t => (
                  <option key={t._id} value={t._id}>{t.firstName} {t.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
              <select
                value={form.roomId}
                onChange={(e)=>setForm(prev=>({ ...prev, roomId: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">Select room…</option>
                {rooms.map(r => (
                  <option key={r._id} value={r._id}>{r.name} (Capacity {r.capacity})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e)=>setForm(prev=>({ ...prev, capacity: Number(e.target.value) }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Start</label>
              <input
                type="date"
                value={form.enrollmentPeriod.startDate}
                onChange={(e)=>setForm(prev=>({ ...prev, enrollmentPeriod: { ...prev.enrollmentPeriod, startDate: e.target.value } }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment End</label>
              <input
                type="date"
                value={form.enrollmentPeriod.endDate}
                onChange={(e)=>setForm(prev=>({ ...prev, enrollmentPeriod: { ...prev.enrollmentPeriod, endDate: e.target.value } }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Model</label>
            <select
              value={form.paymentModel}
              onChange={(e)=>setForm(prev=>({ ...prev, paymentModel: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="per_session">Per session</option>
              <option value="per_cycle">Per cycle</option>
            </select>
            {form.paymentModel === 'per_session' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session Price (DZ)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.sessionPrice}
                    onChange={(e)=>setForm(prev=>({ ...prev, sessionPrice: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cycle Size (sessions)</label>
                  <input
                    type="number"
                    min={1}
                    value={form.cycleSize}
                    onChange={(e)=>setForm(prev=>({ ...prev, cycleSize: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cycle Price (DZ)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.cyclePrice}
                    onChange={(e)=>setForm(prev=>({ ...prev, cyclePrice: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Schedules</label>
            <div className="space-y-3">
              {form.schedules.map((s, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Day</label>
                    <select
                      value={s.dayOfWeek}
                      onChange={(e)=>updateSchedule(idx, 'dayOfWeek', e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-md"
                    >
                      <option value="monday">Monday</option>
                      <option value="tuesday">Tuesday</option>
                      <option value="wednesday">Wednesday</option>
                      <option value="thursday">Thursday</option>
                      <option value="friday">Friday</option>
                      <option value="saturday">Saturday</option>
                      <option value="sunday">Sunday</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Start</label>
                    <input type="time" value={s.startTime} onChange={(e)=>updateSchedule(idx, 'startTime', e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">End</label>
                    <input type="time" value={s.endTime} onChange={(e)=>updateSchedule(idx, 'endTime', e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-md" />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => removeSchedule(idx)} className="px-3 py-2 border rounded-md hover:bg-gray-50">Remove</button>
                    {idx === form.schedules.length - 1 && (
                      <button type="button" onClick={addSchedule} className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Add</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input id="absenceRule" type="checkbox" className="h-4 w-4" checked={!!form.absenceRule} onChange={(e)=>setForm(prev=>({ ...prev, absenceRule: e.target.checked }))} />
            <label htmlFor="absenceRule" className="text-sm text-gray-700">Absence affects payment</label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e)=>setForm(prev=>({ ...prev, description: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Optional"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
              {loading ? (<><Loader className="w-4 h-4 inline animate-spin mr-2"/>Saving...</>) : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClassEditModal;



